# 机枢讲席·动态流向 IV：编号之门

> `switch` 语句（switch statement）与跳转表（jump table）的时间／空间权衡

## 正课 / Lecture

<!-- wanxiang:block machine-f4-strategy-observation:start -->

### 1. 观察（Observation）：源代码 `switch` 与两种候选布局

从源程序开始，暂不选择具体实现。

```c
switch (mode) {
    case 8:  result = 40; break;
    case 9:  result = 41; break;
    case 11: result = 43; break;
    default: result = 99; break;
}
```

只记录可见前提：

| 项目 | 可见值 |
|---|---:|
| 最低标签（lowest label） | `8` |
| 最高标签（highest label） | `11` |
| 范围宽度（range width） | `4` |
| 已表示的 cases | `3` |
| 范围内的 gaps | `1` |

候选 A：

```text
if mode == 8 goto case8
if mode == 9 goto case9
if mode == 11 goto case11
goto default
```

候选 B：

```text
check 8 <= mode <= 11
index = mode - 8
target = table[index]
pc = target
```

预测之前，先把以下字段留空：比较工作量、表空间、更宽范围带来的影响，以及选择任一候选的理由。

<!-- wanxiang:block machine-f4-strategy-observation:end -->

<a id="1-source-semantics-before-optimization"></a>
<a id="2-two-implementation-strategies"></a>
<!-- wanxiang:block machine-f4-strategy-calibration:start -->

### 2. 校准（Calibration）：源语义、密度与代价

`switch` 的**控制表达式（controlling expression）**必须具有**整数类型（integer type）**或**枚举类型（enumeration type）**，并接受**整数提升（integer promotion）**。**Case 标签（case label）**是转换到该提升后 controlling type 的整数常量表达式；两个 labels 若转换后的值相等，就属于禁止出现的重复 label。

- **默认分支（default）**处理没有匹配 case 的 value。
- **跳出语句（break）**把 PC 转到 `switch` 之后的**公共续接点（common continuation）**。
- **贯穿执行（fall-through）**表示当前 case body 没有 `break`、`return` 或 jump 时，execution 继续进入下一个 case body。

**分支链（branch chain）**按顺序比较各个 case value。它几乎不占 table memory，通常适合数量少且彼此相距很远的 labels；但比较工作量会随 case 数量及其位置增长。

Jump table 使用**归一化（normalization）**后的 case value 选择一个**代码地址单元（code-address cell）**。通过**范围守卫（range guard）**后，dispatch 工作量基本不受已表示 case 数量影响；但覆盖范围内的每个 value 都要预留一个 cell，包括 gaps。

把**密度（density）**非正式地定义为：

```text
represented case count / [low, high] range width
```

因此，决策既要考虑 range width 和 density，也要考虑比较工作量、table space、**目标体系结构（target architecture）**与**性能剖析（profiling）**。不存在适用于所有 compilers 的统一阈值。

| Labels | Range width | Cases | Likely strategy | Reason |
|---|---:|---:|---|---|
| `1,2,3,4,5` | 5 | 5 | jump table | dense contiguous range |
| `-20,0,42,9001` | 9022 | 4 | branch chain | huge sparse table |
| `-215..-204`，含一个 gap | 12 | 11 | jump table | still dense after normalization |

<!-- wanxiang:block machine-f4-strategy-calibration:end -->

<!-- wanxiang:block machine-f4-guard-gap-observation:start -->

### 3. 观察（Observation）：boundary inputs 与尚未填写的 table

对于 labels `8`、`9` 与 `11`，candidate table 覆盖 four entries，其中的 target cells 尚未填写。

| raw input | lower-bound check | upper-bound check | normalized index | table cell | target |
|---:|---|---|---:|---|---|
| `7` |  |  |  |  |  |
| `10` |  |  |  |  |  |
| `12` |  |  |  |  |  |

Candidate orders：

```text
A. load a table cell -> check lower bound -> check upper bound
B. check lower bound -> check upper bound -> normalize -> load a table cell
C. check upper bound -> check lower bound -> normalize -> load a table cell
```

Candidate cells：

```text
table[0] = ?
table[1] = ?
table[2] = ?
table[3] = ?
```

预测之前，先不判断 B 与 C 是否具有不同 dependency，也不判断 index `2` 的 gap 中保存什么。

<!-- wanxiang:block machine-f4-guard-gap-observation:end -->

<a id="3-normalize-and-guard-before-indexing"></a>
<!-- wanxiang:block machine-f4-guard-gap-calibration:start -->

### 4. 校准（Calibration）：两个 range guards 共同支配 normalization 与 table access

对于 labels 8 到 11：

```text
mode < 8  -> default
mode > 11 -> default
index = mode - 8
index 0   -> case 8
index 1   -> case 9
index 2   -> gap -> default
index 3   -> case 11
```

Lower guard 与 upper guard 都只依赖已加载的 controlling value。任一 guard 都可以先执行，但 normalization 和 table access 之前，**两者**都必须成功：

```text
load mode
  ├─ lower guard ─┐
  └─ upper guard ─┴─> normalize -> scale -> load cell -> indirect jump
```

因此，`7` 与 `12` 都会在不 read table 的情况下到达 `default`。输入 `10` 位于 range 内，所以会产生 index `2`；该 cell 必须显式保存 `default` address，而不能留下 uninitialized gap。

这种减法形态的教学 sequence 假定 signed intermediate 可表示。production compiler 即使面对 fixed-width extremes，也必须保持 `low <= mode <= high` 的 semantics；它不能相信已经发生 signed overflow 的 subtraction result sign。

Goto 风格的作者模型：

```c
static const void *table[4] = {
    &&case8, &&case9, &&default_case, &&case11
};

if (mode < 8 || mode > 11) goto default_case;
goto *table[mode - 8];
```

这是使用 label addresses、用于解释 compiler shape 的 C，而不是 portable application C。

<!-- wanxiang:block machine-f4-guard-gap-calibration:end -->

<!-- wanxiang:block machine-f4-indexed-jump-observation:start -->

### 5. 观察（Observation）：effective address、cell value 与 PC

Machine state 如下：

```text
r1 = address(jump_table)
r0 = 1
scale = 4 bytes
m[jump_table + 4] = address(case9)
```

Instruction 如下：

```asm
j *(r1, r0, 4)
```

阅读 calibration 之前，先填写 trace：

| 字段 | 值 |
|---|---|
| effective address `r1+r0*4` |  |
| value stored in `m[r1+r0*4]` |  |
| next PC |  |
| target after case body |  |

把 effective address、该 address 中保存的 value 和 next instruction address 分别放在不同列中。

<!-- wanxiang:block machine-f4-indexed-jump-observation:end -->

<!-- wanxiang:block machine-f4-indexed-jump-calibration:start -->

### 6. 校准（Calibration）：带索引间接跳转（indexed indirect jump）只读取一个 cell

其语义效果是：

```text
effective_address = r1 + r0*4
target = m[effective_address]
pc = target
```

这是一次只 load 一个 table cell 的 indexed indirect jump。scaled expression 定位 table cell；cell 中保存的 code address 会成为 PC。它不是 F2 中 object→class table→method slot 的 two-level lookup。

<a id="4-complete-machine-lecture-assembly"></a>

完整的 Assembly：

```asm
dispatch:
    ld $mode, r0
    ld 0(r0), r0          # r0 = mode

    ld $-7, r1
    add r0, r1            # r1 = mode - 7
    bgt r1, low_ok        # mode > 7, therefore mode >= 8
    br default_case

low_ok:
    ld $-11, r1
    add r0, r1            # r1 = mode - 11
    bgt r1, default_case  # mode > 11

    ld $-8, r1
    add r1, r0            # r0 = mode - 8
    ld $jump_table, r1
    j *(r1, r0, 4)        # pc <- m[r1 + r0*4]

case8:
    ld $40, r1
    br done
case9:
    ld $41, r1
    br done
case11:
    ld $43, r1
    br done
default_case:
    ld $99, r1

done:
    ld $result, r0
    st r1, 0(r0)
    j 0(r6)

jump_table:
    .long case8
    .long case9
    .long default_case
    .long case11
```

追踪 `mode = 10`：

```text
lower guard passes
upper guard passes
index = 10 - 8 = 2
target = m[jump_table + 2*4] = address(default_case)
result = 99
```

每个 case body 都使用 `br done`，从而保留 source `break`，而不是继续 fall through。

Range guards 只能证明 indexed load 来自 constructed range 内的 table cell；它不能单独证明该 cell 保存的 target address 有效。另一个 precondition 必须保证 jump table 正确构造且未被修改。

<!-- wanxiang:block machine-f4-indexed-jump-calibration:end -->

## 复习闭环 / Review Loop

不重读已校准页面，完成以下复盘：

1. 追踪一个包含一次有意 fall-through 的 `switch`，并指出 common continuation。
2. 同时依据 dispatch work 与 table space，对比一组 dense labels 和一组 sparse labels。
3. 构造一张含一个 gap 且带 range guards 的 jump table，再计算 `index -> table address -> loaded code address -> final case`。
4. 解释 range guards 能保证什么，以及为什么还必须单独保证 table-cell target address 有效。
