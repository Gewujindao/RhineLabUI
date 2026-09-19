# 机枢讲席·静态流向 IV：岔路复原

> 条件语句（conditional statement）与汇编复原（assembly reconstruction）

## 正课 / Lecture

<!-- wanxiang:block machine-d4-layout-observation:start -->

先只追踪一条 conditional branch 对 PC 的两种结果，不猜测更高层的 C：

```text
branch address       = A
PC_after_fetch       = B
target label address = T

condition true  -> next PC = T
condition false -> next PC = B
```

从当前 branch 到下一条 instruction 的一种具体执行路线，首次称为执行路径（path）。condition 为 false 的 path 就是 fall-through。先把两种 next-PC 结果写清楚，再讨论 compiler 的指令布局（instruction layout）：then body 或 else body 哪一个放在相邻 address。

<!-- wanxiang:block machine-d4-layout-observation:end -->

<!-- wanxiang:block machine-d4-ifmap-observation:start -->

这段 C 要求 `then_body` 与 `else_body` 恰好执行其中一个。先用已经学过的 branch／label 写出一份可执行 layout：

```text
if condition goto then_path

else_path:
    else_body
    goto end_if

then_path:
    then_body

end_if:
```

condition 为 true 时 PC 去 `then_path`；false 时 fall-through 到 `else_path`。else body 结束后的 unconditional branch 防止它继续执行 then body；两条 path 最后都到达 `end_if`，这个共同 address 首次命名为汇合点（join point）。

<!-- wanxiang:block machine-d4-ifmap-observation:end -->

<a id="1-an-if-is-a-controlled-choice-of-next-pc"></a>

### 1. `if` 通过 condition 选择下一次 PC

<!-- wanxiang:block machine-d4-branch-layout:start -->

从下面的 C code 开始：

```c
if (a > b) {
    max = a;
} else {
    max = b;
}
```

goto 形式：

```text
t = a - b
if t > 0 goto then_path

else_path:
    max_local = b
    goto end_if

then_path:
    max_local = a

end_if:
    max = max_local
```

为什么 branch 到 `then_path`，而不是 `else_path`？两种 layout 都有效。compiler 会选择能减少 branch，或让预期的 path 沿 fall-through 连续执行的 layout。

机枢讲席使用的 assembly：

```asm
ld $a, r0
ld (r0), r0          # r0 = a
ld $b, r1
ld (r1), r1          # r1 = b

mov r1, r2
not r2
inc r2               # r2 = -b
add r0, r2           # r2 = a - b
bgt r2, then_path

else_path:
    mov r1, r3       # max_local = b
    br end_if

then_path:
    mov r0, r3       # max_local = a

end_if:
    ld $max, r0
    st r3, (r0)
```

先看两条 instructions 的具体效果：`not` 翻转 `r2` 的每一位，`inc` 再加一。这种“逐位翻转后加一”的二进制补码取负（two's-complement negation）得到 `-b`；随后，`add r0, r2` 得到 `a-b`。

这个符号测试有一条关键边界：machine 为每个 signed integer 提供固定数量的 bits，这个数量称为**字长（word width）**。只有当有符号减法（signed subtraction）`a-b` 能用该 word width 表示时，它的结果符号才代表有符号比较（signed comparison）`a > b`。例如，在固定 word width 下，`INT_MAX - (-1)` 过大，会发生有符号溢出（signed overflow）；即使 `a > b`，assembly 层回绕后的 bits 也可能看起来是负数。C standard 不承诺这种 operation 会产生什么结果，这称为未定义行为（undefined behavior）；在 machine level，回绕后的 bits 同样无法保持原本想表达的大小顺序。

因此，只有 input range 能够证明 subtraction 不会 overflow 时，这段 instruction sequence 才有效，例如两个 values 已知都落在足够小的有界区间内。否则，应使用 ISA 或 compiler 提供的、能够显式处理 overflow 的 comparison sequence，或在相减前先根据 operand 的符号推理。绝不能只凭 overflow 后差值的符号推断一般的 signed ordering。

开始 trace 前，先检查指令语法（instruction grammar）：`not rd` 是一元形式（unary form），因此它读取、翻转并写回同一个 destination register `rd`。如果某个 sequence 使用 two-register `not`，继续之前先把该 instruction 改写为合法的 unary form；不要套用另一套 ISA 的语义。

<!-- wanxiang:block machine-d4-branch-layout:end -->

<a id="2-short-circuit-is-control-flow-not-only-boolean-arithmetic"></a>

### 2. 短路求值（short-circuit evaluation）决定右侧 instruction 是否会执行

<!-- wanxiang:block machine-d4-short-circuit-observation:start -->

short-circuit evaluation 的规则是：先计算左侧 operand；如果左侧已经决定整个 `&&` 或 `||` 的结果，就不计算右侧 operand。这是 C 的次序保证，不是 compiler 可以选择是否遵守的规则。

先看另一个 expression：

```c
p != NULL && p->value > 0
```

左侧先排除 `p == NULL`，右侧才允许 dereference `p->value`；这种先检查 pointer 再访问 object 的写法称为空值保护（null guard）。当 `p == NULL` 时，左侧已经让整个 `&&` 为 false，PC 必须跳过读取 `p->value` 的 instruction。只有 `p != NULL` 时，execution 才能到达右侧 dereference。

运行前，记录 source expression、candidate input 和两条候选 path：

```text
source condition: p != NULL && p->value > 0
candidate input:  p = NULL
revision A: test p first, then choose false_path or read_path
revision B: enter read_path before the null guard succeeds
```

这些信息已经足够判断哪条 path 保留 short-circuit evaluation，但尚未替下面的 `a == 0 && b > 0` 题选择具体 assembly。

<!-- wanxiang:block machine-d4-short-circuit-observation:end -->

<!-- wanxiang:block machine-1d-classroom-q6:start -->
Which of the following corresponds to this C code:

```text
if (a == 0 && b > 0) c = 1;
else c = 0;

ld $a, r0
ld (r0), r0 # r0 = a
ld $b, r1
ld (r1), r1 # r1 = b
ld $c, r2 # r2 = &c
ld $0, r3 # r3 = 0
ld $1, r4 # r4 = 1
```

```text
A.
beq r0, L0
bgt r1, L0
st r3, (r2)
L0: st r4, (r2)

B.
beq r0, L0
bgt r1, L0
st r4, (r2)
br L1
L0: st r3, (r2)
L1:

C.
beq r0, L0
br L1
L0: bgt r1, L2
L1: st r3, (r2)
br L3
L2: st r4, (r2)
L3:

D.
beq r0, L0
br L1
L0: bgt r1, L2
L1: st r4, (r2)
br L3
L2: st r3, (r2)
L3:

E.
beq r0, L0
bgt r1, L0
st r3, (r2)
br L1
L0: st r4, (r2)
L1:
```
<!-- wanxiang:block machine-1d-classroom-q6:end -->

<!-- wanxiang:block machine-d4-short-circuit:start -->

对于：

```c
if (a == 0 && b > 0) {
    c = 1;
} else {
    c = 0;
}
```

正确的 short-circuit 结构：

```text
if a != 0 goto false_path
if b <= 0 goto false_path
c = 1
goto end_if

false_path:
c = 0

end_if:
```

只有第一个 condition 允许时，才会计算第二个 condition。若两侧都只是读取 integer values，这看起来可能与两侧都计算等价；但右侧如果除了产生 value 还会修改 state，这种可观察变化称为副作用（side effect）。当右侧存在 side effect 或可能不安全时，short-circuit evaluation 的次序就很重要。

安全的 control flow 是：

```text
p == NULL ? ---- yes ----> false_path
     |
     no
     v
read p->value safely
```

<!-- wanxiang:block machine-d4-short-circuit:end -->

<a id="3-basic-blocks-make-assembly-readable"></a>

### 3. 先按 next-PC path 划分 assembly

先只看 PC。假设 PC 从一段连续 instructions 的第一条开始：在到达这段末尾之前，每一次 next PC 都只能是相邻 instruction 的 address；同时，外部 branch／jump 也不能把 PC 直接设到这段中间。满足这两个条件的连续 instructions 首次称为**基本块（basic block）**。进入 block 后：

1. block 中间没有会改写 PC 的 branch／jump；若有，它必须结束当前 block；
2. 没有任何 branch target 指向 block 中间；被指向的 instruction 必须成为另一个 block 的第一条 instruction；
3. block 的最后一条 instruction 可以 branch、jump、halt，也可以顺序进入下一个 block。

这里只从已经学过的 PC 提一个具体问题：**PC 可以从哪些 address 开始执行这一段 instructions？** 这样的首地址叫作基本块入口（block entry）。

<!-- wanxiang:block machine-d4-cfg-observation:start -->

下面会出现一段完整 assembly。第一遍只按 PC 规则标出七个 block entry，不先猜 C：

```text
initialization
test
load-and-test       # beq not taken 后的相邻 instruction
non-positive        # bgt not taken 后的相邻 instruction
positive            # bgt target
step                # br target
done                # beq target
```

这些名字只描述 entry 的位置。等完整 assembly 出现后，再从每个 entry 收集相邻 instructions，直到下一个 entry 或第一条 branch／halt。

<!-- wanxiang:block machine-d4-cfg-observation:end -->

<!-- wanxiang:block machine-d4-cfg-reconstruction:start -->

在本课的 assembly 片段中，按下面三条规则寻找 block entry：

1. 整段待分析 assembly 的第一条 instruction 是第一个 block entry，因为 execution 从这里开始；
2. 某个 label 被 branch／jump 用作 target 时，该 label 所在的 instruction 是另一个 block entry，因为 PC 可以直接被改写到这里；
3. conditional branch 紧邻的下一条 instruction 是 fall-through block 的 entry，因为 condition 为 false 时 PC 会从这里继续。

unconditional `br` 后面的相邻 instruction 不会由这条 `br` 顺序到达；只有当它还满足第 1 条，或另有 branch／jump 把 PC 设到那里时，它才会成为 block entry。普通 `ld`、`add` 或 `inc` 不会只因为它是某一种 instruction 就开启 basic block。

在继续划分前，回看已经建立的 instruction grammar：本 ISA 的 `not rd` 是 unary form，读取并写回同一个 destination register。不要从另一套 ISA 虚构 two-register `not`，也不要从不合法的 assembly 推断语义。

现在来看一段完全符合上述 instruction grammar 的 assembly：

```asm
.pos 0x1000
ld $0, r0             # i_local = 0
ld $0, r1             # count_local = 0
ld $-4, r2            # negative bound = -4
ld $values, r3        # base = &values[0]

test:
    mov r0, r4
    add r2, r4        # r4 = i_local - 4
    beq r4, done
    ld (r3, r0, 4), r4
    bgt r4, positive
    br step

positive:
    inc r1

step:
    inc r0
    br test

done:
    ld $count, r0
    st r1, (r0)
    halt

.pos 0x2000
values:
    .long -2
    .long 7
    .long 0
    .long 5
count:
    .long 0
```

memory 内容：

```text
m[0x2000] = -2
m[0x2004] =  7
m[0x2008] =  0
m[0x200c] =  5
```

把每个 basic block 画成一个方框，再为每一种可能的 next-PC 选择画一条箭头。方框称为**节点（node）**，箭头称为**转移边（edge）**；整张图称为**控制流图（control-flow graph, CFG）**。五步复原法如下：

1. 注释每条 instruction 直接造成的 state 效果。
2. 为稳定的 register 角色赋予语义名称。
3. 分出 initialization、`test`、load-and-test、non-positive、`positive`、`step`、`done` 七个 basic block。
4. 根据 `beq`、`bgt`、`br` 和 fall-through 画出 edge。
5. 化简为结构化 C（structured C）中的 `if/else` 或 loop。

CFG 展示所有可能的 next-PC edge 和 path 骨架。它不会枚举无界的 loop path 集合，而且其中可能包含 instruction grammar 允许、但之后会被更强的 invariant 证明为不可行的 path：

```text
initialization
      |
      v
    test -- i == 4 ----------------------------> done
      |
      | i != 4  (fall-through)
      v
load-and-test -- value > 0 --------------------> positive
      |                                             |
      | value <= 0 (fall-through)                  | fall-through
      v                                             v
non-positive -- unconditional br ---------------> step
                                                    |
                                                    | unconditional br
                                                    v
                                                   test
```

复原得到的 C：

```c
int count = 0;
int values[4] = {-2, 7, 0, 5};

for (int i = 0; i < 4; i++) {
    if (values[i] > 0) {
        count++;
    }
}
```

`count` 最终是 2。这个结论应在 assembly reconstruction 之后得出，而不是提前猜定。C code 给出需要保持的结果；实际 assembly 决定 CFG；一次 machine trace 只能检查它所选择的那条 path。要证明整段 assembly，需要分别检查每个 branch taken／branch not taken choice，以及 loop 何时重复、何时退出，不能只依赖一个成功样例。

<!-- wanxiang:block machine-d4-cfg-reconstruction:end -->

<a id="4-close-with-a-translation-checklist"></a>

### 4. 用翻译检查清单收束

```text
C -> assembly:
condition meaning -> overflow boundary -> zero-relative temporary -> branch layout -> fall-through -> join point

assembly -> C:
state comments -> register roles -> basic block -> edge -> structured C
```

## 复习闭环 / Review Loop

不要重读已经演算过的例题，直接完成以下任务：

1. 把一个 `if/else` 翻译为 label，并标出 fall-through 与 join point。
2. 给出一个能让差值式 signed comparison 保持安全的具体 input range，再给出一个 overflow 反例。
3. 把一段未见 assembly 切分为 basic block，先根据其 CFG 复原 structured C，再计算最终值。
