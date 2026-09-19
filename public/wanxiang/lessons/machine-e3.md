# 机枢讲席·procedure 与 stack III：双方的契约

> 调用约定（calling convention）的四个组成部分

## 正课（Lecture）

<!-- wanxiang:block machine-e3-convention-observation:start -->

### 0. 划分责任表前，先保留未归属证据

划分所有者（owner）之前，先让四张 action cards 保持未归属：

- 预留并填写实参区（actual-argument area）；
- 预留私有局部变量（private locals）与保存状态（saved state）；
- 恢复 callee 拥有的 saved state；
- return 后释放 argument area。

call expression 在 boundary 一侧暴露实际值（actual values），而独立编译（separate compilation）的 procedure body 可以把私有栈帧布局（private frame layout）留在 boundary 另一侧。打开 responsibility table 之前，先根据这两个 visible facts 预测所有权划分（ownership split）。

<!-- wanxiang:block machine-e3-convention-observation:end -->

<!-- wanxiang:block machine-e3-convention-ownership:start -->

<a id="1-calling-convention-is-an-interoperability-contract"></a>

### 1. Calling convention 是互操作契约

calling convention 回答 source syntax 隐藏的问题：

- arguments 放在哪里？
- 哪个 register 承载 return value？
- 谁保存 return address？
- 谁 allocate 并 free frame 的各个部分？
- 哪些 registers 必须跨越 call 保持不变？

两个 separately compiled procedures 只有遵守同一 convention，才能互相 call。

本节定义：

- **序言（prologue）**：在 call 前，或刚进入 callee 后执行的 setup code；
- **尾声（epilogue）**：在 return 前，或 control 刚回到 caller 后执行的 cleanup code。

本课程的 convention 把一次 call 划分为四项 responsibility：

| 阶段（phase） | owner | 必须完成的工作 |
|---|---|---|
| caller prologue | caller | allocate argument area；store actual arguments |
| callee prologue | callee | allocate locals/saved state；必要时 save incoming return address |
| callee epilogue | callee | restore saved return address；free callee-owned portion；return |
| caller epilogue | caller | free argument area；continue execution |

caller 通常不能 allocate 全部 callee locals，因为它不必知道 callee 的 private frame size。callee 也不能填写 actual arguments，因为这些 values 属于 caller expression。责任划分服从信息所有权（information ownership）。

<!-- wanxiang:block machine-e3-convention-ownership:end -->

<!-- wanxiang:block machine-e3-full-call-balance:start -->

<a id="2-full-call-example"></a>

### 2. 完整 call 示例（full-call example）

源代码层意图（source-level intent）：

```c
void caller(void) {
    worker(7, 9);
}

void worker(int left, int right) {
    int first = left;
    int second = right;
    helper();
}
```

假设 `caller` 因为还要 call `worker`，所以必须保留自己的 incoming return address。它自有的 local frame portion 是一个字（word），并为 `worker` allocate 两个 argument words。

caller 一侧：

```asm
caller:
    deca r5            # allocate caller's saved-return slot (4 bytes)
    st r6, 0(r5)       # save return address to caller's caller

    ld $-8, r0
    add r0, r5         # allocate worker's two arguments
    ld $7, r0
    st r0, 0(r5)       # left = 7
    ld $9, r0
    st r0, 4(r5)       # right = 9

    gpc $6, r6
    j worker

caller_after_worker:
    ld $8, r0
    add r0, r5         # free worker's arguments

    ld 0(r5), r6       # restore caller's incoming return address
    inca r5            # free caller's saved-return slot
    j 0(r6)
```

callee 一侧：

```asm
worker:
    ld $-12, r0
    add r0, r5         # allocate first, second, saved return address
    st r6, 8(r5)

    ld 12(r5), r0      # left is above callee-owned 12 bytes
    st r0, 0(r5)       # first = left
    ld 16(r5), r0
    st r0, 4(r5)       # second = right

    gpc $6, r6
    j helper

worker_after_helper:
    ld 8(r5), r6
    ld $12, r0
    add r0, r5         # free callee-owned portion only
    j 0(r6)
```

不要声称 `caller_after_worker` 存在神奇的标签绑定（label binding）；在这个 layout 中，它只是 `gpc $6, r6` 计算出的 address 所使用的 name。

#### `worker` procedure body 中的栈映射（stack map）

令 `S` 表示 `caller` 开始自己的分配之前，`r5` 的值。

```text
lower addresses

S-24  worker first             <- r5 in worker
S-20  worker second
S-16  worker saved return addr
S-12  argument left = 7
S-08  argument right = 9
S-04  caller saved return addr
S     caller's caller frame ...

higher addresses
```

核对 ownership：

- `worker` frees 12 bytes，使 `r5` 从 `S-24` 回到 `S-12`；
- `caller` frees 8 bytes 的 argument area，使 `r5` 回到 `S-4`；
- `caller` frees 自有的 4-byte slot，最终恢复 `r5 = S`。

这组算术关系就是栈平衡（stack balance）的证明。

<!-- wanxiang:block machine-e3-full-call-balance:end -->

<!-- wanxiang:block machine-e3-return-offset:start -->

<a id="3-why-gpc-6-versus-gpc-2"></a>

### 3. 为什么使用 `gpc $6` 或 `gpc $2`

在 direct jump `j worker` 之前，该 jump 占 6 bytes，因此捕获 return address 时使用 `$6`。

在 2-byte 的 indirect jump `j (r1)` 之前，捕获时使用 `$2`：

```asm
gpc $2, r6
j (r1)
```

这个 offset 既不是“call depth”，也不是“argument count”；它越过的是紧随其后的那一条具体 jump instruction。

<!-- wanxiang:block machine-e3-return-offset:end -->

<!-- wanxiang:block machine-e3-startup:start -->

### 4. 创建第一个 stack frame

程序开始执行时，隐藏的运行时启动代码（runtime startup）会先预留 stack region、初始化 `r5`，再 call 第一个 source-level procedure；这个 entry 通常标为 `start`、`entrypoint` 或 `crt0`。

```asm
start:
    ld $stack_bottom, r5
    inca r5
    gpc $6, r6
    j main
    halt

.pos 0x3000
stack_top:
    .long 0
    .long 0
    # reserved words continue
stack_bottom:
    .long 0
```

这些 labels 描述 source convention 中的 reserved region。关键概念是：`main` 不会自行创造 initial stack pointer；它由 runtime startup 建立。

隐藏的 runtime startup 还提供 `main` 之后所需的终止路径（termination path）。因此，source-level `main` 只是更大运行时控制流链（runtime control-flow chain）中的普通 callee，并不是 memory 里的第一条 machine instruction。

<!-- wanxiang:block machine-e3-startup:end -->

## 复习闭环（Review Loop）

不重读上面的 worked example，完成以下任务：

1. 把 argument setup、local allocation、return-address restoration 与 argument cleanup 分配给正确的 owner 和 phase。
2. 从 initial state `r5 = S` 重建 symbolic stack map，并写出每一次 subtraction 与 addition。
3. 解释为什么 `gpc $6` 和 `gpc $2` 取决于后续 jump 的 byte length，而不是 call depth。
