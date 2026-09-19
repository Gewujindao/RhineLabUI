# 机枢讲席·静态流向 I：下一条指令（next instruction）

> next instruction 是一种状态（state）

## 正课（Lecture）

### 0. 观察：演示机的初始状态（initial state）

<!-- wanxiang:block machine-d1-fetch-observation:start -->

演示机仍处于停机状态（stopped state）。面板上只显示以下 initial settings；其中有寄存器（register）、内存（memory）与输出（output）三个 visible windows：

```text
stop lever                         = up
paper-tape mark under the read head = 0x100
current tape-cell width             = 4 bytes
register / memory / output windows  = visible; change record blank
```

<!-- wanxiang:block machine-d1-fetch-observation:end -->

<a id="1-what-actually-runs"></a>

### 1. 机器实际执行什么（What actually runs）

<!-- wanxiang:block machine-d1-pc-timeline:start -->

源文件（source file）按行排布，但机器并不执行“整页内容”。它执行一条 instruction、改变 state，再选择 next instruction。由此形成的序列称为**控制流（control flow）**，也就是程序实际执行的 instruction order。

对一次具体执行（execution）而言，再复杂的程序（program）也可以写成一段线性历史（linear history）：先执行地址（address）A 处的 instruction，再执行 B、C，依此类推。真正需要追问的不是这段 history 是否 linear，而是什么 mechanism 选择了 next address。

关键 register 是**程序计数器（program counter, PC）**；它保存 next instruction 的 address。

首先要追踪的状态转换（state transition）是**取指（instruction fetch, fetch）**：中央处理器（central processing unit, CPU）按 PC 指定的 address 读取 next machine instruction。在教学 model 中，fetch 读取 instruction，并在该 instruction 执行前按它的字节（byte）length 推进 PC。解码（decode）确定操作（operation）与操作数（operand）；执行阶段（execute stage）再根据 decoded operation 改变 register、memory 或 PC。

```text
Before fetch                     After fetch / before execute

PC = 0x1000                     fetched instruction at 0x1000
                                 PC = 0x1002 if it was 2 bytes
                                 PC = 0x1006 if it was 6 bytes
```

在普通的顺序执行（sequential execution）中，PC 会在 fetch stage 更新。这个**取指后 PC（post-fetch PC）**细节随后会决定：若一条 instruction 改写 PC，下一次 fetch 究竟看到哪一个 address。

下面的紧凑状态表把这一过程写清楚：

| 步骤 | pre-fetch PC | instruction size | post-fetch PC | 无跳转（jump）时的 next PC |
|---:|---:|---:|---:|---:|
| 0 | `0x1000` | 2 | `0x1002` | `0x1002` |
| 1 | `0x1002` | 6 | `0x1008` | `0x1008` |
| 2 | `0x1008` | 2 | `0x100a` | `0x100a` |

**概念边界：** PC 表示 next instruction 的 address，不一定是 current instruction 旁边印出的 address。

<!-- wanxiang:block machine-d1-pc-timeline:end -->

<a id="2-why-a-loop-creates-a-new-requirement"></a>

### 2. 循环（loop）为何提出新的要求

<!-- wanxiang:block machine-d1-loop-requirement:start -->

先看一个有限数组（array）求和：

```c
int sum = 0;
int a[] = {2, 4, 6, 8, 10};

for (int i = 0; i < 5; i++) {
    sum += a[i];
}
```

如果 length 始终已知，编译器（compiler）*可以*使用**循环展开（loop unrolling）**，把每次迭代（iteration）复制成一段顺序代码（sequential code）：

```c
sum += a[0];
sum += a[1];
sum += a[2];
sum += a[3];
sum += a[4];
```

它的取舍如下：

- 对这个固定的迭代次数（trip count），它消除了 loop-control PC replacement。
- 它会增大代码体积（code size）。
- 对运行时（runtime）值（value）`n`，除非为所有 possible values 生成 code 或保留 control flow，否则它通常无法处理。
- 即使 trip count 固定，value 很大时，complete loop unrolling 也可能并不理想。

现在把一个 general loop 的循环体（loop body）写进带标号（label）的 `goto`-style 伪代码（pseudo-code）：

```text
i = 0
loop:
    if not (i < n) goto end_loop
    sum = sum + a[i]
    i = i + 1
    goto loop
end_loop:
```

这个 loop 需要对普通 sequential control flow 做两处改变：

1. 条件退出（conditional exit）；
2. 无条件后向转移（unconditional backward transfer），也就是回边（back edge）。

因此，machine 必须能够替换 PC，而不能只接受 fetch 产生的 sequential PC。

<!-- wanxiang:block machine-d1-loop-requirement:end -->

<a id="3-index-and-pointer-are-two-views-of-one-traversal"></a>

### 3. 下标（index）与指针（pointer）是同一遍历的两种视角

<!-- wanxiang:block machine-d1-pointer-traversal:start -->

index form：

```c
void int_copy(const int *src, int *dst, int n) {
    for (int i = 0; i < n; i++) {
        dst[i] = src[i];
    }
}
```

pointer form：

```c
void int_copy(const int *src, int *dst, int n) {
    while (n > 0) {
        *dst = *src;
        dst++;
        src++;
        n--;
    }
}
```

接着谨慎说明 C 的优先级（precedence）：

```c
*dst++ = *src++;
```

后缀递增（postfix increment, postfix `++`）的 binding precedence 高于一元解引用（unary dereference, unary `*`），因此这条语句（statement）会解析为：

```c
*(dst++) = *(src++);
```

这里复制的是 old address 处的 value。pointer 按所指 type 缩放 increment，这套规则称为指针算术（pointer arithmetic）；随后两个 pointers 都进行一次指针步进（pointer step），各前进一个 `int`。它们前进的是 `sizeof(int)` bytes，而不是一个 byte。

不要随意用 array name 替换 pointer variable。在下面的 expression 中，`a` 是数组指示符（array designator），不是 modifiable pointer variable：

```c
int a[5];
// *a++ is invalid: a is an array designator here, not a modifiable pointer variable.
```

这个区别随后很重要：machine 的索引寻址（indexed addressing）会根据基址（base address）与 scaled index 做地址计算（address computation），而指针遍历（pointer traversal）会更新 base address 本身。

只有满足已声明的前置条件（precondition）时，这两个 loops 才等价：`src` 与 `dst` 必须指向足够多的有效对象（valid objects），而且二者重叠（overlap）时不能让所选的 forward copy order 产生可观察错误（observable error）。指针记法（pointer notation）缩短了 address computation，但不会消除内存安全（memory safety）义务。

<!-- wanxiang:block machine-d1-pointer-traversal:end -->

<a id="4-close-the-model"></a>

### 4. 收束模型（Close the model）

由于 fetch 会推进 PC，sequential execution 是 default。只有当某条 instruction 能够替换 default PC，并且有时会依据 condition 这样做时，loop 才可能成立。index 与 pointer syntax 改变了 address computation，但二者仍然都需要一个控制决策（control decision）：continue 还是 exit。

请用自己的话复述：

```text
PC 保存 next instruction 的 address。
general loop 需要 conditional exit 和 backward transfer。
```

## 复习闭环（Review Loop）

不重新阅读已经演示过的例子，完成以下复盘：

1. 使用 `pre-fetch PC -> post-fetch PC` 对三条不同 instruction size 的 instructions 做状态追踪（trace）。
2. 把一个 fixed-bound index loop 改写成 pointer traversal，并说明每个 pointer step 前进多少 bytes。
3. 解释为什么即使 loop body 本身是 sequential code，runtime `n` 仍然需要 control decision。
