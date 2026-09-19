# 机枢讲席·静态流向 III：Loop 铸形

> 从 `for` loop 到 branch

## 正课

<!-- wanxiang:block machine-d3-loop-order-observation:start -->

在接受任何排序之前，板书先展示五张彼此没有连接的卡片：

`body` · `init` · `back edge` · `test` · `step`

第一次预测时，看不到任何箭头或连接标签。

<!-- wanxiang:block machine-d3-loop-order-observation:end -->

<a id="1-the-canonical-loop-skeleton"></a>

### 1. 规范循环骨架（canonical loop skeleton）

<!-- wanxiang:block machine-d3-loop-skeleton:start -->

先从一般的 C 形式开始：

```c
for (init; continue_condition; step) {
    body;
}
```

先机械地翻译，再考虑能否在保持 execution 结果不变的前提下让 code 更短或更快：

```text
init
loop:
    if not continue_condition goto end_loop
    body
    step
    goto loop
end_loop:
```

从底部返回 `loop` 的 **back edge** 让 next PC 回到 loop test。每条从 init 进入 body 的正常 path 都先经过 test；每次正常 iteration 也都会先执行 test。

不要只记住 `i < n` 这一种例子。同一套 skeleton 也能处理省略字段、复合 step 和向下计数的 loop。`for (;;)` 省略的 condition 等同于 true；此时必须由 body 内部的 branch 退出 loop。

<!-- wanxiang:block machine-d3-loop-skeleton:end -->

<a id="2-turning-i--10-into-a-zero-test-without-lying"></a>

### 2. 如实地把 `i < 10` 改写为零值测试（zero test）

<!-- wanxiang:block machine-d3-zero-test-proof:start -->

machine 提供的是相对零判断的 `beq` 和 `bgt`，而不是直接判断“小于十”的 instruction。对于下面这个特定 loop：

```c
for (i = 0; i < 10; i++) {
    sum += a[i];
}
```

因为 `i` 从 0 开始，并且每次恰好增加 1，所以到达 `i == 10` 与结束 loop 等价。我们可以计算：

```text
t = i - 10
if t == 0 goto end_loop
```

要让这个改写成立，必须证明下面四个事实；这组必须满足的事实称为**证明义务（proof obligation）**：

- 初始 `i` 小于 10；
- 每次 step 都恰好加 1；
- body 不会意外修改 `i`；
- 整数运算（integer arithmetic）不会跳过 10。

缺少这些事实时，用相等判断替换一般的 `<` 判断可能是错的。例如，从 12 开始递增就永远不会到达 10。

这是一个**不变量（invariant）**论证：该事实在每次 execution 到达 code 中同一个位置时都成立；这个位置称为程序点（program point）。这不是一种语法技巧。

<!-- wanxiang:block machine-d3-zero-test-proof:end -->

<a id="3-register-allocation-and-delayed-stores"></a>

### 3. 寄存器分配（register allocation）与延迟写回（delayed store）

一个 value 如果之后还会被 instruction 读取，就不能提前被覆盖；这种 value 称为**活跃值（live value）**。register allocation 为 live value 选择 machine register，决定 `i_local`、`sum_local` 等 value 在 loop 期间存放在哪里。compiler 证明保留在 register 中的 value 不会过期后，delayed store 可以先在 register 中更新 value，等到必须对 memory 可见时再写回，从而避免反复访问 memory。

<!-- wanxiang:block machine-d3-c-goto-assembly:start -->

来看这个完整例子：

```c
int sum = 0;
int i;
int a[5] = {3, 1, 4, 1, 5};

void accumulate(void) {
    for (i = 0; i < 5; i++) {
        sum += a[i];
    }
}
```

下面的寄存器映射（register map）记录每个 register 在 loop 中的稳定角色：

| Register | loop 中的含义 |
|---|---|
| `r0` | `i_local` |
| `r1` | base address `&a[0]` |
| `r2` | `sum_local` |
| `r3` | test temporary, then current `a[i_local]` |
| `r4` | 常数（constant）`-5` |

机枢讲席使用的 assembly：

```asm
ld $a, r1             # r1 = &a[0]
ld $sum, r2           # r2 = &sum
ld (r2), r2           # r2 = sum_local
ld $0, r0             # r0 = i_local = 0
ld $-5, r4            # r4 = -5

loop:
    mov r0, r3        # r3 = i_local
    add r4, r3        # r3 = i_local - 5
    beq r3, end_loop  # exit when i_local == 5
    ld (r1, r0, 4), r3
    add r3, r2        # sum_local += a[i_local]
    inc r0
    br loop

end_loop:
    ld $sum, r1
    st r2, (r1)       # publish final sum
    ld $i, r1
    st r0, (r1)       # publish final i
```

这里有三个关键决定：

1. **indexed addressing** 用 `base + index × scale` 形成有效地址（effective address），因此 `ld (r1, r0, 4), r3` 对应 `m[r1 + r0*4]`；每个 `int` 占 4 bytes。
2. `sum` 和 `i` 在 loop 期间一直保存在 register 中。compiler 只在确有需要时才把它们写回 memory。
3. 只有当 compiler 能够证明 body 中没有隐藏 operation 要求 memory 副本更早变化时，这种缓存才合法。

这里不使用 `r5`：本 ISA 明确保留 `r5`，本例不能把它当作 loop temporary register；它的具体用途留到下一整课再从 memory address 的变化开始解释。temporary register 应选择旧 value 之后不会再被任何 instruction 读取的 register；这样的旧 value 称为**失效（dead）**。此处可以安全复用 `r3`：执行 `beq` 之后，test value 已经 dead，而当前数组元素（array element）尚未加载。

<!-- wanxiang:block machine-d3-c-goto-assembly:end -->

#### memory/state trace

<!-- wanxiang:block machine-d3-state-trace:start -->

初始数据：

```text
&a[0] = 0x2000

m[0x2000] = 3
m[0x2004] = 1
m[0x2008] = 4
m[0x200c] = 1
m[0x2010] = 5
```

trace 前两次 iterations：

| 到达 test 的时刻 | `r0` | `r3 = r0-5` 中的 test 值 | 加载后替换 `r3` 的值 | 新的 `r2` |
|---:|---:|---:|---:|---:|
| 第一次 | 0 | -5 | 3 | 3 |
| 第二次 | 1 | -4 | 1 | 4 |
| 退出 | 5 | 0 | 未加载 | 14 |

<!-- wanxiang:block machine-d3-state-trace:end -->

<a id="4-reading-a-loop-backward"></a>

### 4. 逆向读取 loop

拿到 assembly 时，不要只看 label 就猜测对应的 C：

1. 把每条 instruction 执行前后的 state change 写成 equation；这种记录称为状态方程（state equation）。
2. 为持久的 register 角色命名。
3. 标出每个 branch target，以及 branch not taken 时使用的 fall-through address。
4. 识别 init、test、body、step 和 back edge。
5. 只有在结构得到证明后才能化简。

这套过程还会在后续课程中再次使用。

## 复习闭环

不要重读已经讲解过的例题，直接完成下面三项：

1. 把一个新的 `for` loop 展开为 `init / test / body / step / back edge / exit`。
2. 说明在把 `< bound` 判断改成边界相等判断之前，必须成立的 invariant。
3. 翻译 loop 前先画出 register map，并论证每一次 delayed store 为什么成立。
