# 机枢讲席·过程（procedure）与栈（stack） I：归途

> 过程调用（procedure call）知道去处，返回（return）必须记住归途（A Call Knows Where It Goes; a Return Must Remember）

## 正课（Lecture）

<a id="1-three-different-things-called-function-in-casual-speech"></a>

### 1. 口语里常被统称为“函数（function）”的三个不同概念

<!-- wanxiang:block machine-e1-entry-and-return:start -->

请使用精确术语：

- **procedure** 是一段有固定入口（entry）、可被不同调用点（call site）重复使用的具名代码。它可以声明形参（parameter），并在一次 call 中接收实参（argument）；procedure 内部还可以使用局部作用域（local scope）中的名称。
- **procedure call** 请求该 procedure 使用本次 call 的具体 arguments 运行。
- **激活（activation）** 是一次从 entry 到 return 的 dynamic execution；同一个 procedure 可以同时或先后产生多次 activations。
- function 常用于会产生返回值（return value）的情形，但其控制流（control flow）机制与 procedure 相同。

在给 `r6` 指派任何职责之前，先检查这份不完整的执行轨迹（trace）：

```asm
north_call_site:
    gpc $6, r6
    j bell
    [ blank N ]

south_call_site:
    gpc $6, r6
    j bell
    [ blank S ]

bell:
    # work
    j (r6)
```

此时只记录可直接观察到的事实：两个不同的 call site 都会写入 `r6`，两条直接跳转（direct jump）都指向同一个 `bell` entry，两个空位尚未被赋予含义。填写空位之前，先分别预测 north call 与 south call 完成后应从哪条 instruction 继续执行。发出 procedure call 的一方称为调用者（caller），被请求运行的 procedure 称为被调用者（callee）。

<!-- wanxiang:block machine-e1-entry-and-return:end -->

<a id="2-the-caller-creates-the-return-address"></a>

### 2. 返回地址（return address）由 caller 创建

<!-- wanxiang:block machine-e1-caller-continuation:start -->

**return address** 指一次 call 完成后，caller 中下一条应执行 instruction 的 address。它是本次 call 的动态属性，而不是 callee 定义的静态属性。

`bell` 的 entry 是一个静态 code address。由 `north` 发起的 activation 必须在 `NORTH_AFTER` 继续；由 `south` 发起的 activation 必须在 `SOUTH_AFTER` 继续。

直接调用（direct call）的 call-site instruction 编码中含有固定的 callee entry，因此在汇编或链接时就能确定 destination。目标若不是固定 label，而是保存在 register 或 memory 中的 runtime value，就需要间接跳转（indirect jump）。这里的 call 可以是 direct call，但 return 必须使用 indirect jump，因为不同 call site 会创建不同的续行地址（continuation address）。

只有 caller 知道当前活动的是哪个 call site，因此当前续行地址（active continuation）由 caller 创建。callee 知道自己的静态 entry code，却无法只凭这一定义推出 active continuation；该状态必须由 caller 创建并传入，这里使用的是 `r6`。

本节先规定寄存器（register）`r6` 保存 active continuation；instruction length 以字节（byte）表示：

```asm
north:
    gpc $6, r6       # r6 = address after the 6-byte direct jump
    j bell           # direct call target is static
north_after:
    # caller continues

bell:
    # callee body
    j (r6)           # indirect jump to dynamic return address
```

`gpc` 的精确语义如下：

```text
gpc $o, rd     -> r[d] = PC_after_fetch + o
```

在这套教学用指令集架构（instruction-set architecture, ISA）中，`gpc` 表示取得程序计数器（get program counter）：把取指后 PC（post-fetch PC）加上 constant offset，再写入 destination register。它保存续行值（continuation value），本身并不 transfer control。

`gpc` 本身占 2 bytes。这里紧随其后的是一条 6-byte 的绝对跳转（absolute jump）instruction `j bell`，所以 `PC_after_fetch + 6` 指向该 jump 后的第一条 instruction。return 使用 `j (r6)`，因为目标地址（target address）保存在 register 中。

control flow 时间线：

```text
north:gpc -> north:j bell -> bell body -> j (r6) -> north_after
```

<!-- wanxiang:block machine-e1-caller-continuation:end -->

<a id="3-why-one-return-address-register-is-not-enough"></a>

### 3. 为什么一个 return-address register 不够用

<!-- wanxiang:block machine-e1-nested-overwrite:start -->

现在考虑一次嵌套调用（nested call）：

```text
main calls outer: r6 = MAIN_AFTER
outer calls inner: r6 = OUTER_AFTER
inner returns:     jumps to OUTER_AFTER
outer returns:     needs MAIN_AFTER, but r6 was overwritten
```

状态图（state diagram）：

```text
time     active code     r6
t0       main            MAIN_AFTER
t1       outer           MAIN_AFTER
t2       outer->inner    OUTER_AFTER
t3       inner returns   OUTER_AFTER
t4       outer needs ?   MAIN_AFTER must have been saved elsewhere
```

问题不在于 `gpc` 算错了，而在于生命周期（lifetime）：`outer` 必须让自己的传入返回地址（incoming return address）跨过另一次 call 继续存活。因此，每次 activation 的 state 都需要保存在 memory 中；后续 stack 内容会给出具体 location。

<!-- wanxiang:block machine-e1-nested-overwrite:end -->

<!-- wanxiang:block machine-e1-address-vs-value:start -->
<a id="4-return-address-is-not-return-value"></a>

### 4. return address 不是 return value

考虑下面这个 function：

```c
int add_one(int x) {
    return x + 1;
}
```

callee 会交出两种不同的信息：

- **return address**：control flow 要去往的位置；按本节规则，它通过 `r6` 或保存它的栈槽（stack slot）传递；
- **return value**：function 产生的数据；按本节规则放在 `r0` 中。

在某些 programs 中，两者的 values 都可能恰好是 addresses，但 roles 仍然不同。function 可以 return 一个 `int` value，而 control flow 仍然通过 code address return。
<!-- wanxiang:block machine-e1-address-vs-value:end -->

## 复习闭环（Review Loop）

不要重读上面的演算示例（worked examples），直接完成：

1. 画出两个 callers 指向同一个 procedure entry，并标出两个不同的 continuation addresses。
2. 已知 `gpc` 后方 jump instruction 的 byte length，计算应保存的 return address。
3. 追踪一次 nested call，直到传入的 `r6` 被覆盖，再准确指出仍需要旧值的是哪次 activation。
