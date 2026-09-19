# 机枢讲席·静态流向 II：距离刻度

> next PC 怎样用 post-fetch PC 表示目标距离

## 正课 / Lecture

### 0. 先观察，再选择距离规则

<!-- wanxiang:block machine-d2-observation-basis:start -->

D1 已经得到一个具体需求：某条 instruction 必须能够把 next PC 改成另一个 address。这样的 instruction 首次称为**分支（branch）**。先不决定这条 branch 怎样保存距离，只记录 fetch 前后可见的 state：branch instruction 的 address、post-fetch PC 与分支目标（branch target）的 label address。

```text
branch instruction address = 0x1000
fetch width               = 2 bytes
PC after fetch            = 0x1002
branch target address    = 0x1008
```

把 branch instruction address、post-fetch PC 与 branch target address 分栏记录。这份观察只说明哪些 state 发生了变化，尚未决定编码时应比较哪两个 address。

<!-- wanxiang:block machine-d2-observation-basis:end -->

<a id="1-absolute-destination-versus-relative-distance"></a>

### 1. 直接保存 target，还是保存相对距离

<!-- wanxiang:block machine-d2-relative-basis:start -->

**指令集体系结构（instruction-set architecture, ISA）**规定 instruction、register 与 state 变化规则，也就规定了每条 instruction 的含义。**汇编（assembly）**可以用 label 表示 address；**汇编器（assembler）**负责把 assembly text 转换为机器码（machine code），并把 label 解析成 address 或编码中的数值。

**绝对跳转（absolute jump）**存储或构造 target address 本身：

```text
pc <- target
```

它可以在不依赖当前 PC 的情况下到达 target，但完整 address 字段较宽。改变 PC 的 instructions 很常见，而且通常只移动一小段距离，例如跳到 `if` 的末尾或 loop 的开头。

**PC 相对分支（PC-relative branch）**则存储从 post-fetch PC 出发的有符号 PC 相对偏移（signed PC-relative offset）：

```text
target = PC_after_fetch + encoded_offset * 2
```

为什么要乘以 2？这个 ISA 中每条 instruction 的 address 都是偶数。以 2 bytes 为一个编码单位，可以在编码字段同样宽时把可达 byte range 扩大一倍。

为什么 offset 必须有符号？向前退出需要正 offset，向后形成 loop 需要负 offset。

为什么 assembly 里仍然可以写 `br loop`？这段算术由 assembler 负责。程序员写出 label，assembler 再用 encoded offset 替换它。

这个以 2 bytes 为单位的 signed encoded value 称为**分支位移（branch displacement）**。务必分清以下三种量：

```text
label address and PC            -> byte addresses
label - PC_after_fetch          -> byte displacement
encoded branch displacement p   -> signed distance measured in 2-byte units
```

#### 图示：一条前向 branch

```text
address       contents
0x1000        br target       (2 bytes)
0x1002        ...             <- PC_after_fetch
0x1004        ...
0x1006        ...
0x1008 target ...

byte distance = 0x1008 - 0x1002 = 6
encoded p     = 6 / 2 = 3
```

现在假设 branch instruction 与 target instruction 的 address 都增加同一个 byte distance `delta`。post-fetch PC 也增加 `delta`，所以 `target - PC_after_fetch` 不变，encoded `p` 也不变。也就是说，只要 source instruction 与 target instruction 移动相同的 byte distance，这条 branch 的 machine code bytes 就不必改变。

把 code 放到一组新的 address 叫作**重定位（relocation）**；上面这种不依赖具体 absolute address、只依赖两条 instructions 相对距离的性质称为**位置无关性（position independence）**。

<!-- wanxiang:block machine-d2-relative-basis:end -->

<a id="2-four-control-transfer-forms"></a>

### 2. 四种改变 PC 的 instruction

<!-- wanxiang:block machine-d2-branch-forms:start -->

不检查 condition、一定改写 PC 的 branch 称为**无条件分支（unconditional branch）**；只有 condition 成立时才改写 PC 的 branch 称为**条件分支（conditional branch）**。这个 ISA 的四种形式如下：

| Assembly | 对 state 的变化 | 含义 |
|---|---|---|
| `br label` | `pc <- label`，通过 PC-relative offset | 始终 branch |
| `beq rc, label` | if `r[c] == 0`, `pc <- label` | register 等于零时 branch |
| `bgt rc, label` | if `r[c] > 0`, `pc <- label` | register 中的 signed value 为正时 branch |
| `j label` | `pc <- absolute label address` | absolute jump |

conditional branch 会把一个 register 与零比较。它们不会直接编码 `i < 10` 或 `a == b`；code 必须先把差值或其他要与零比较的 value 算入 register。

condition 成立、PC 被改写，称为**分支被采用（branch taken）**；condition 不成立、PC 保持 post-fetch PC 并执行相邻 instruction，称为**分支未被采用（branch not taken）**。后一条不跳转的顺序 path 称为**顺序路径（fall-through）**：

```text
instruction: beq r2, empty

                r2 == 0  ---- yes ----> pc = address(empty)
PC_after_fetch ----------- no ---------> pc stays sequential
```

<!-- wanxiang:block machine-d2-branch-forms:end -->

<!-- wanxiang:block machine-1d-classroom-q2:start -->
Convert the bgt instruction to machine code:

```text
.pos 0x10
    bgt r0, L1
.pos 0x20
L1: halt
```

```text
A. 0xa0 0x10
B. 0xa0 0x08
C. 0xa0 0x0e
D. 0xa0 0x07
E. 0xa0 0x20
```
<!-- wanxiang:block machine-1d-classroom-q2:end -->

<!-- wanxiang:block machine-1d-classroom-q3:start -->
Convert the br instruction to its machine code.
(note: each instruction here is 2 bytes)

```text
loop: mov r0, r5
      add r4, r5
      beq r5, end_loop
      inc r0
      br loop
```

```text
A. 0x80 0xf5
B. 0x80 0xf8
C. 0x80 0xfc
D. 0x80 0xfb
E. 0x80 0xf6
```
<!-- wanxiang:block machine-1d-classroom-q3:end -->

<!-- wanxiang:block machine-1d-classroom-q4:start -->
What does the following
instruction do?

```text
0xa0 0x00
```

```text
A. infinite loop
B. sets PC to zero
C. sets PC to beginning of program
D. nothing
E. something else
```
<!-- wanxiang:block machine-1d-classroom-q4:end -->

<!-- wanxiang:block machine-1d-classroom-q5:start -->
What is the value of r0 after this code executes?

```text
      ld $1, r0
      ld $4, r1
loop: beq r1, end
      shl $1, r0
      dec r1
      br loop
end:  halt
```

```text
A. It never terminates
B. 4
C. 8
D. 16
E. 32
```
<!-- wanxiang:block machine-1d-classroom-q5:end -->

<a id="3-encoding-a-backward-branch"></a>

### 3. 编码一条向后 branch

<!-- wanxiang:block machine-d2-signed-offset:start -->

这个 ISA 用一个 **8 位字段（8-bit field）**保存 branch displacement `p`。例如：

```text
0x0030: br loop
... 
0x0026: loop: inc r0
```

这条 branch 占两个 bytes，因此：

```text
PC_after_fetch = 0x0032
byte distance  = 0x0026 - 0x0032 = -12
p              = -12 / 2 = -6
8-bit p        = 0xfa
machine bytes  = 0x80 0xfa
```

负数通过**二进制补码（two's complement）**存储；它是固定宽度的有符号整数（signed integer）编码方式。对于这个 8-bit field：

```text
representable p range = -128 ... 127
encode -6             = 256 - 6 = 250 = 0xfa
decode 0xfa           = 250 - 256 = -6
```

因此，这条 branch 能覆盖从 `-256` 到 `+254` 的 byte displacement，步长为 2 bytes。只有当 byte displacement 为偶数，而且算出的 `p` 落在 signed 8-bit range 内时，target 才可编码。任一检查失败，assembler 都必须改用其他能到达 target 的 instruction sequence，不能静默截断该值。

自检：

1. target 在后方 -> `p` 为负数。
2. target 与 post-fetch PC 都是偶数 -> byte distance 也是偶数。
3. decode result：`0x0032 + (-6)*2 = 0x0026`。

与直接相信第一次减法相比，这次反向检查（reverse check）更快也更稳妥。

<a id="4-zero-displacement-is-not-an-infinite-loop"></a>

### 4. Zero displacement 不等于无限循环（infinite loop）

如果 `p = 0`，branch target 就是 `PC_after_fetch` 本身，也就是下一条 sequential instruction。因此，zero displacement 的 conditional branch 不会向后移动。无论条件为真还是为假，execution 都会从同一个 address 继续。

infinite loop 必须跳回 branch instruction 自己的 address。由于 PC 已经推进，这需要一个负 offset。

当 `p = 0` 时，“zero”表示距 post-fetch PC 的距离为零，而不是 absolute address 为零。

<!-- wanxiang:block machine-d2-signed-offset:end -->

## 复习闭环 / Review Loop

不回看完整示例，完成以下任务：

1. 写出从 branch address 与 target address 推到 signed `p` 的四行计算。
2. 解释为什么在 8-bit field 中，`0xfa` 表示 `-6`，而不是 decimal 250。
3. 各 decode 一条前向与后向 branch，一直反算到 exact label address。
