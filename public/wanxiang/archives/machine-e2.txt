# 机枢讲席·procedure 与 stack II：每一次 call 都有自己的房间

> 激活帧（activation frame）与运行时栈（runtime stack）

## 正课（Lecture）

<a id="1-one-definition-many-simultaneous-activations"></a>

### 1. 一份 definition，同时存在多次 activation

<!-- wanxiang:block machine-e2-activation-lifetime:start -->

先看一段递归（recursion）：

```c
void countdown(int n) {
    if (n == 0) return;
    countdown(n - 1);
    print_int(n);
}
```

当 `countdown(3)` 到达最深层 call 时，同时存在四次 activation：`n=3`、`n=2`、`n=1`、`n=0`。如果只用一个名为 `n` 的静态内存单元（static memory cell），它们就会互相覆盖。

即使 code 里看不到自调用（self-call），也可能参与间接递归（indirect recursion）：`alpha` call `beta`，随后 `beta` 又 call `alpha`。因此，编译器（compiler）不能因为 source 里没有明显 recursion，就假定 local variables 使用 static storage。

还需要区分以下概念：

- **scope**：source-level name 可以被引用的范围；
- **lifetime**：属于该次 activation 的 storage 存在的时间；
- **activation frame**，也称栈帧（stack frame）：保存某一次 call state 的一段 memory。

典型 stack frame 会保存：

```text
saved registers
local variables
saved return address, when needed
arguments
```

字段（field）的精确顺序由 compiler 及其应用二进制接口（application binary interface, ABI）共同约定；ABI 规定 binary code 如何传递 arguments、使用 registers、组织 stack 并互相 call。此处只能得出“每次 activation 需要自己的 storage”，尚不能提前决定后续 fields 应如何定位。

<!-- wanxiang:block machine-e2-activation-lifetime:end -->

<a id="2-why-a-stack-not-malloc-for-every-call"></a>

### 2. 为什么使用 stack，而不是每次 call 都执行 `malloc`

<!-- wanxiang:block machine-e2-lifo-stack:start -->

activation 的 lifetime 遵循一个特殊次序：最近进入的 active procedure 必须先 return，caller 才能结束。因此，分配（allocation）与释放（deallocation）的顺序相反，也就是后进先出（last in, first out, LIFO）。

这让分配器（allocator）可以非常简单：

- 预留一段连续的栈区（stack region）；
- 用 `r5` 保存栈指针（stack pointer）；
- 从 `r5` 减去栈帧大小（frame size）完成 allocation；
- 给 `r5` 加回 frame size 完成 deallocation。

整个过程不需要通用空闲链表搜索（free-list search）。本节规定栈顶（stack top）向低 address 移动。

内存区域（memory region）示意图：

```text
lower addresses
    +-----------------------+
    | free stack capacity   | <- further allocation moves into this side
    +-----------------------+
    | current frame         | <- r5, stack top/base of current frame
    +-----------------------+
    | caller frame          |
    +-----------------------+
    | older frames          | <- initial/older side of the reserved region
    +-----------------------+
higher addresses
```

stack top 指最近进入的 activation，而不是数值最大的 address。

具体移动过程：

```text
before allocation: r5 = 0x8000
allocate 12 bytes: r5 = 0x8000 - 0x0c = 0x7ff4
free 12 bytes:     r5 = 0x7ff4 + 0x0c = 0x8000
```

半开区间（half-open interval）`[0x7ff4, 0x8000)` 包含左端 address `0x7ff4`，不包含右端 address `0x8000`；它是新取得的 12-byte frame 部分。低于 `0x7ff4` 的 address 仍然 free；`0x8000` 及以上属于 caller 或更早的 runtime state。

<!-- wanxiang:block machine-e2-lifo-stack:end -->

<a id="3-a-frame-behaves-like-a-struct"></a>

### 3. frame 的定位方式就像结构体（struct）

<!-- wanxiang:block machine-e2-frame-layout:start -->

示例源码：

```c
void mix(int a0, int a1) {
    int local0 = a0;
    int local1 = a1;
    helper();
}
```

下面是本讲选定的一种布局（layout）；callee 已经为自己的 local region 完成 allocation：

```text
lower address
r5 + 0x00 : local0
r5 + 0x04 : local1
r5 + 0x08 : saved return address
r5 + 0x0c : a0
r5 + 0x10 : a1
higher address
```

基址（base address）`r5` 是 dynamic，因为每次 activation 位于不同的 stack address。偏移（offset）是 static，因为 compiler 已经固定 layout。

访问示例：

```asm
ld 12(r5), r0        # r0 = a0
st r0, 0(r5)         # local0 = a0
ld 16(r5), r0        # r0 = a1
st r0, 4(r5)         # local1 = a1
```

抽象内存形式：

```text
r0 <- m[r5 + 12]
m[r5 + 0] <- r0
```

这正是 struct 使用的 base-plus-offset reasoning；区别只在于 frame base 会随 activation 改变。

<!-- wanxiang:block machine-e2-frame-layout:end -->

<a id="4-lifetime-consequences"></a>

### 4. lifetime 带来的后果

<!-- wanxiang:block machine-e2-lifetime-observation:start -->

在读取任何结论之前，先检查三份记录：

```c
int *save_address(void) {
    int local;
    return &local;
}
```

```c
int read_scratch(void) {
    int scratch;
    return scratch;
}
```

```c
void sized_frame(int n) {
    int a[n];
    int tail;
    tail = 0;
}
```

逐份确认哪一次 activation 拥有这段 storage、它的 lifetime，以及 visible code 是否已经确定 location 或 value；在此之前，不要给 report 签字。

<!-- wanxiang:block machine-e2-lifetime-observation:end -->

<!-- wanxiang:block machine-e2-lifetime-consequences:start -->

再看三份简短的 C 审计：

```c
void leak(void) {
    int *p = malloc(40);
    /* p is lost without free: heap allocation leaks */
}
```

```c
void change_copy(int x) {
    x += 42;
    /* only this activation's argument copy changes */
}
```

```c
int *bad_address(void) {
    int local;
    return &local;
    /* invalid after return: local's lifetime ends with the frame */
}
```

未初始化的 local variable 不保证为零。复用的 stack bytes 可能残留 old value，但依赖某个特定 old value 属于未定义行为（undefined behavior）。

对于变长数组（variable-length array, VLA），也就是 length 在 runtime 才确定的自动存储期局部 array（automatic local array）：

```c
void f(int n) {
    int a[n];
    int b;
    b = 0;
}
```

compiler 在为 `a[n]` 完成 allocation 后，可能需要动态偏移或第二个稳定基址（dynamic offset or a second stable base）才能定位后续 object。“frame size 通常是 static”存在例外，不能把常见性质写成普遍定律。

<!-- wanxiang:block machine-e2-lifetime-consequences:end -->

## 复习闭环（Review Loop）

不要重读上面的演算示例（worked examples），直接完成：

1. 画出一张向 low address 增长的 stack，并把 free capacity 放在正确的 address 一侧。
2. 从一个具体 `r5` 出发，allocate 一个 frame，用 offsets 定位三个 members，再恢复原始 `r5`。
3. 分别解释为什么 return `&local` 会失效，以及为什么丢失 heap pointer 会造成 memory leak。
