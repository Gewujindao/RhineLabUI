# 算理研习 · 堆顶之令：优先队列（Priority Queue）、二叉堆（Binary Heap）与堆排序（Heap Sort）

本单元把行为契约与实现该契约的表示分开。Priority Queue 说明客户端可以请求哪些操作；Binary Heap 解释一种实现如何高效完成这些操作；Heap Sort 再复用同一个不变量，把反复取出最大值转化为原地排序算法。

## 首次术语

**ADT** 规定可观察行为：存放哪些值、提供哪些操作，以及每项操作返回什么或改变什么。它不规定数组、树或指针布局。

**优先队列（Priority Queue）** 是一种 ADT，其中的元素带有键（key）或优先级（priority）。**最大优先队列（Max-Priority Queue）** 会暴露 key 最大的元素。

**Binary Heap** 是一种数组表示，可以把它看作 Nearly Complete Binary Tree。这里的“Heap”不是编程语言运行时使用的动态内存区。

**Nearly Complete Binary Tree** 除了最后一层可能未满之外，其余各层均已填满；最后一层从左到右填充。这种固定形状使下标能够代替子节点指针。

**Max-Heap Invariant** 要求每个父节点的 key 不小于其已有子节点的 key。它约束的是边，不约束兄弟节点，也不要求整个数组有序。

**有效堆长度（Heap Size）** 是当前被视为 Heap 的数组前缀。执行 Heap Sort 时，物理数组长度保持不变，而 Active Heap 会不断缩小。

**堆化修复（Heapify）** 是一种局部修复。在本单元中，`max_heapify` 假设两个子树已经分别是 Max Heap，而它们父节点上的值可能过小。

**稳定排序（Stable Sort）** 会保留 key 相同的记录在输入中的相对次序。普通的原地 Heap Sort 不稳定。

原始资料使用一下标为 1 的数组：`parent(i)=floor(i/2)`、`left(i)=2i`、`right(i)=2i+1`。下方可执行代码则有意采用 Python 的零下标数组：

```text
parent(i) = (i - 1) // 2, for i > 0
left(i)   = 2*i + 1
right(i)  = 2*i + 2
```

更换下标约定会改变公式，但不会改变树本身或 Invariant。

## 核心讲解

### 1. 从 Priority Queue 契约开始

Max-Priority Queue 存放与 key 配对的元素，并支持：

| 操作 | 契约 | Binary Max-Heap 成本 |
|---|---|---:|
| `maximum()` | 返回但不移除一个 key 最大的元素 | `Theta(1)` |
| `insert(x, key)` | 加入一个带 key 的新元素 | `O(log n)` |
| `extract_max()` | 返回并移除一个 key 最大的元素 | `O(log n)` |
| `increase_key(handle, key)` | 用不小于当前值的新值替换 key | `O(log n)` |

ADT 不承诺所有元素在全局上有序，也不会自行规定相同 key 如何打破平局。Binary Heap 是一种可行实现，因为它的 Invariant 把一个最大值放在根部，同时允许更新后进行局部修复。

`increase_key` 的变化方向属于前置条件。提高 key 只可能破坏它与父节点之间的边，因此该值向上移动；任意降低 key 则可能需要向下修复。生产环境中的应用程序接口（API）可以同时支持这两种操作，但那是对契约的扩展，不是忽略变化方向的许可。

### 观察账本：同一份存储状态，两种视图

第一次选择前，公开板面只展示以下状态：

```text
A = [20, 9, 18, 12, 7, 16]
heap_size = 6

             0:20
          /        \
       1:9          2:18
      /   \         /
   3:12   4:7    5:16
```

零下标的连接关系清晰可见，并且根节点确实是当前状态中的最大值。还有三个字段尚未填写：

```text
必查位置： ______
比较规则： ______
判定：     ______
```

请分别记录这幅图真正证明了什么，以及它只是碰巧呈现了什么。在选定审计规则之前，不要填写判定字段。

### 2. 一个数组，两种视图

给定

```text
A = [19, 14, 17, 8, 11, 6, 13, 2, 5, 7]
```

它的零下标树形视图为：

```text
                         0:19
                    /            \
                 1:14            2:17
                /    \           /    \
             3:8     4:11      5:6    6:13
             / \      /
          7:2  8:5  9:7
```

对于下标 `4`，父节点是 `1`，左孩子应为 `9`，右孩子应为 `10`。由于 `len(A)=10`，下标 `10` 并不存在。

当 `n >= 2` 时，最后一个内部节点是 `(n-2)//2`；之后的每个下标都是叶节点。叶节点已经是 Heap，因为它自己的子树中没有父子边。Heap 的高度为 `Theta(log n)`，因为每个完整层级都会让可用位置数近似翻倍。

必须逐边检查 Invariant。根为最大值只是 Invariant 的推论，并不是充分的检验。例如：

```text
[20, 9, 18, 12, 7, 16]
```

虽然最大值位于根部，却不是 Max Heap：从 `9` 指向子节点 `12` 的边违反了 Invariant。

### 观察账本：这次局部调用满足前置条件吗？

板面给出两个候选调用，但暂不提供结论：

```text
candidate A
A = [5, 16, 12, 9, 7, 10, 8, 3, 2]
i = 0, heap_size = 9

candidate B
A = [20, 9, 18, 12]
i = 0, heap_size = 4
```

对于每个候选，在追踪任何交换之前先填写以下字段：

```text
左区域状态：   ______
右区域状态：   ______
首次比较集合： ______
下一有效下标： ______
允许调用？     ______
```

数组只是证据，并不保证同一个局部过程对两个候选都有效。

### 3. `max_heapify`：带有严格前置条件的修复

假设下标 `i` 可能违反 Max-Heap Invariant，但以其已有子节点为根的两棵子树已经分别是 Max Heap。把父节点候选值与两个子树根进行比较：

1. 如果父节点最大，则该子树中的每条边都有效；停止。
2. 否则，把父节点与较大的子节点交换。
3. 新的根节点此时不小于两个子树根。
4. 只有被下移的较小值可能制造新的违规，而且违规只可能出现在被选中的子树内。
5. 下移一层并重复。

追踪以下合法调用：

```text
start: [5, 16, 12, 9, 7, 10, 8, 3, 2]
```

两棵子树都已经是 Heap。在下标 `0` 处比较 `(5,16,12)`，并与 `16` 交换：

```text
[16, 5, 12, 9, 7, 10, 8, 3, 2]
```

在下标 `1` 处比较 `(5,9,7)`，并与 `9` 交换：

```text
[16, 9, 12, 5, 7, 10, 8, 3, 2]
```

在下标 `3` 处，`5` 不小于值为 `3` 和 `2` 的子节点，因此修复停止。

路径长度至多等于子树高度，所以成本为 `O(log n)`。正确性可以按子树高度归纳：叶节点显然成立；较大的子节点移到根后，所有根边均有效，而剩余的更小高度子问题满足同一个前置条件。

一种常见错误是在某棵子树尚未成堆时调用 Heapify。这个过程不是全局违规检测器；如果根节点已经不小于两个直接子节点，即便更深处还藏着错误的边，它也会立即停止。

### 观察账本：哪些节点能下移多远？

对于 `n=15` 的 Nearly Complete Binary Tree，板面给出以下数量—距离表：

| 距离叶层的下移预算 | 位置数上限 | 工作小计 |
|---:|---:|---:|
| 0 | 8 | ______ |
| 1 | 4 | ______ |
| 2 | 2 | ______ |
| 3 | 1 | ______ |

板面还留下了三个候选起始区域：

```text
仅根节点
从最后一个内部位置到根节点
物理数组中的每个位置
```

请选择起始区域和计费规则，再补全各项小计。板面并未给出最终的渐近总成本。

### 4. 自底向上构建 Max Heap

任意数组的根节点并不满足 Heapify 的前置条件。自底向上构建会逐步创造该条件：

```text
for i from the last internal node down to 0:
    max_heapify(A, i)
```

处理 `i` 时，每个子节点都有更大的下标，并且已经处理完毕或本来就是叶节点。因此两棵子树都已成堆。

对以下练习数组执行自底向上的过程：

```text
[3, 11, 6, 8, 2, 9, 5]
```

内部节点下标依次为 `2, 1, 0`。

| 修复位置 | 结果 |
|---|---|
| `i=2` | `[3,11,9,8,2,6,5]` |
| `i=1` | `[3,11,9,8,2,6,5]` |
| `i=0` | `[11,8,9,3,2,6,5]` |

#### 为什么紧界是线性的

用 `n` 个节点乘以一次 Heapify 最坏的 `O(log n)` 成本，可以得到正确但宽松的 `O(n log n)` 上界。这个算法假装每个节点都从根部出发。在 Nearly Complete Binary Tree 中，大多数节点其实靠近叶层：

- 大约 `n/2` 个叶节点高度为 `0`；
- 高度为 `1` 的节点至多约有 `n/4` 个；
- 高度为 `2` 的节点至多约有 `n/8` 个；
- 一般来说，高度为 `h` 的节点至多有 `ceil(n / 2^(h+1))` 个。

如果一个高度为 `h` 的节点成本至多为 `c*h`，那么

```text
total <= c * sum_{h>=0} ceil(n / 2^(h+1)) * h
      = O(n) * sum_{h>=0} h / 2^h
      = O(n).
```

实际的高度求和会在 `floor(log2 n)` 处停止。把 `ceil(n / 2^(h+1))` 换成其中的分数项，就得到上面的几何加权和；累积的取整余项至多为 `O(log^2 n)`，它同样属于 `O(n)`。这个无限加权级数收敛到常数。循环还会对 `Theta(n)` 个内部位置执行常数工作，因此标准的自底向上过程是 `Theta(n)`。

其因果原因来自结构本身：节点可能下移的距离越长，具备这种距离的节点数就以指数速度减少。

### 观察账本：一次取出，边界待定

有效数组（Active Array）的初始状态为：

```text
[17, 11, 13, 4, 8, 6]
physical_length = 6
active_size_before = 6
```

交换下标 `0` 与 `5` 后，板面显示：

```text
[6, 11, 13, 4, 8, 17]

交换后有效长度 = ______
受保护下标     = ______
下一修复下标   = ______
允许修复范围   = ______
```

物理数组的长度没有改变。请先判断逻辑边界和下一步动作应如何变化，再填写账本。

### 5. Heap Sort：把极值结构转化为有序序列

构建 Max Heap 后，根节点就是当前 Active Heap 中的最大值。把它与最后一个有效位置交换，缩小 Heap，再修复新的根节点：

```text
build_max_heap(A)
for end from n-1 down to 1:
    swap A[0], A[end]
    max_heapify(A, 0, end)
```

每轮循环开始时：

- `A[0:end+1]` 是 Max Heap；
- `A[end+1:n]` 按非递减顺序排列；
- 后缀中的每个值都不小于 Active Heap 中的每个值。

交换会把当前最大值放到 `end`，也就是它的最终位置。缩小 `heap_size` 会保护这个值。此时只有新根可能违反 Heap Invariant，而两棵子树仍然是 Heap，所以 `max_heapify` 恰好获得了所需的前置条件。

构建成本是 `Theta(n)`。之后执行 `n-1` 次取出，每次成本为 `O(log n)`，因此 Heap Sort 的最坏情况时间为 `Theta(n log n)`。原地数组形式除了可变输入和循环变量外，只使用 `O(1)` 辅助空间。本课的 `heap_sort(values)` 实现会先把 iterable 复制到一个新 list，避免改变调用者的输入；因此该实现整体使用 `Theta(n)` 额外空间。

Heap Sort 不稳定。即使两条记录的 key 相等，从根到末尾的交换也可能让其中一条越过另一条，从而改变它们原有的相对次序。

### 6. 边界与失败情况

- 空数组和单元素数组已经是 Heap，也已经有序。
- 允许重复 key，因为 Invariant 使用 `>=`，而不是 `>`。
- Heap 不是二叉搜索树（Binary Search Tree）：左孩子不必小于右孩子，查找任意 key 仍可能需要 `Theta(n)`。
- 对空 Queue 调用 `maximum()` 时，必须有文档化的失败策略。
- Heap Sort 必须把当前 `heap_size` 传给 Heapify。若在整个物理数组上修复，已经归位的最大值可能被重新拉回 Heap。
- 自底向上构建是线性的；逐个插入同样的 `n` 个值通常为 `O(n log n)`。两种方式都能得到合法 Heap，但它们是不同的构建过程。

### 7. EXT 边界

稳定的平局策略、惰性删除、任意 key 降低、带下标的 handle、冷却调度与 top-`k` 流式处理，都是 Priority Queue 的实用扩展。

## 完整因果链

```text
客户端反复需要 key 最大的元素
  -> 规定一个 priority-queue ADT
  -> 选择 nearly complete tree，使形状由数组下标编码
  -> 在每条边上施加 parent >= child
  -> 根节点必定是最大值
  -> 替换根节点后，只可能有一条向下路径失效
  -> max_heapify 在 O(log n) 内修复该路径
  -> 从下到上处理内部节点，使每次调用都满足其前置条件
  -> 具有很小高度的节点数量呈指数增长
  -> build_max_heap 是 Theta(n)
  -> 反复把当前有效最大值移入受保护后缀
  -> heap sort 正确且运行时间为 Theta(n log n)
```

任何一个前提被破坏，结论都会随之改变。非完全的指针树无法继续使用直接下标公式；无序的子树会让 Heapify 证明失效；不缩小 Active Heap 则会破坏 Sorted-Suffix Invariant。

## 图示与状态追踪

### 图 A：同一个 Heap 的数组视图与树形视图

```text
数组下标：   0   1   2   3   4   5   6
值：        15  10  13   4   8   9   7

                  0:15
                /      \
             1:10      2:13
             /  \      /  \
           3:4  4:8  5:9  6:7
```

替代文本：一个含七个值的零下标数组形成三层树结构；每个父节点的值都不小于两个子节点的值。

### 图 B：Heapify 的合法搜索区域

```text
                  疑似失效的根
                  /        \
            有效左侧          有效右侧
              heap             heap

比较三个根
      |
      +-- 根最大 -> 停止
      |
      +-- 子节点最大 -> 交换，只沿该子节点所在路径继续
```

替代文本：Heapify 在每一层都可以检查两个子树根，但只会进入接收下移值的那一棵子树。

### 追踪 C：一次 Heap Sort 取出

```text
交换前：有效区=[18,12,15,4,9,7,10]  后缀=[]
交换：  有效区=[10,12,15,4,9,7]     后缀=[18]
修复后：有效区=[15,12,10,4,9,7]     后缀=[18]
```

后缀在物理上紧邻 Heap，但在逻辑上已经被排除在 Heap 之外。

## 可执行代码

**语言与环境：** Python 3.11 或更高版本；只使用标准库。
**输入：** Heap 操作接收可变的 `list[int]`；`heap_sort` 接收任意整数 iterable，并返回一个新 list。
**输出：** Heap 基本操作会原地修改 list；`heap_sort` 返回按非递减顺序排列的值。
**边界情况：** 空输入、单个值、重复值、负数。
**失败情况：** `i` 或 `heap_size` 无效，或者在两棵子树尚未成堆时调用 `max_heapify`，都会违反函数契约。

```python
from __future__ import annotations

from collections.abc import Iterable


def max_heapify(a: list[int], i: int, heap_size: int) -> None:
    """Repair subtree i; both child subtrees must already be max heaps."""
    if not 0 <= heap_size <= len(a):
        raise ValueError("heap_size must be inside the physical array")
    if not 0 <= i < heap_size:
        raise IndexError("i must identify an active heap element")

    while True:
        left = 2 * i + 1
        right = left + 1
        largest = i

        if left < heap_size and a[left] > a[largest]:
            largest = left
        if right < heap_size and a[right] > a[largest]:
            largest = right
        if largest == i:
            return

        a[i], a[largest] = a[largest], a[i]
        i = largest


def build_max_heap(a: list[int]) -> None:
    for i in range((len(a) - 2) // 2, -1, -1):
        max_heapify(a, i, len(a))


def heap_sort(values: Iterable[int]) -> list[int]:
    a = list(values)
    build_max_heap(a)
    for end in range(len(a) - 1, 0, -1):
        a[0], a[end] = a[end], a[0]
        max_heapify(a, 0, end)
    return a


def is_max_heap(a: list[int], heap_size: int | None = None) -> bool:
    size = len(a) if heap_size is None else heap_size
    if not 0 <= size <= len(a):
        return False
    for child in range(1, size):
        parent = (child - 1) // 2
        if a[parent] < a[child]:
            return False
    return True


if __name__ == "__main__":
    assert heap_sort([]) == []
    assert heap_sort([7]) == [7]
    assert heap_sort([4, -1, 4, 2, 0]) == [-1, 0, 2, 4, 4]

    sample = [3, 11, 6, 8, 2, 9, 5]
    build_max_heap(sample)
    assert is_max_heap(sample)

    broken = [5, 16, 12, 9, 7, 10, 8, 3, 2]
    max_heapify(broken, 0, len(broken))
    assert broken == [16, 9, 12, 5, 7, 10, 8, 3, 2]
```

正常情况下，终端不会输出文本，退出状态为 `0`；这些断言（assertion）就是可复现证据。一个有用的失败演示是 `max_heapify([20, 9, 18, 12], 0, 4)`：由于前置条件不成立，它会直接返回，而不会修复隐藏的 `9 < 12` 边。

## 阶段检查

### 练习 A——表示

对于长度为 `12` 的零下标数组，请给出下标 `10` 的父节点、下标 `3` 的两个候选子节点，以及叶节点的下标范围。

### 练习 B——契约审计

请解释：尽管根节点最大，为什么 `max_heapify([30, 14, 25, 9, 18], 0, 5)` 仍不能保证修复整个数组。

### 练习 C——加权工作量

假设至多有 `n/8` 个节点能够下移两层，至多有 `n/16` 个节点能够下移三层。请写出它们在忽略共同常数因子后的合计贡献。为什么这种分布不会给每个节点都累积 `log n` 的工作量？

### 练习 D——冻结后缀

从 Active Max Heap `[17, 11, 13, 4, 8, 6]` 开始，只执行一次 Heap Sort 取出和根修复。请分别写出有效前缀与受保护后缀。

## 综合练习

### 综合练习——事件前沿

一个模拟器会反复插入带整数时间戳的事件，并移除时间最早的事件。当前实现把事件存放在无序 list 中，每次移除都扫描整个 list。

1. 说明所需的 ADT，并判断本课的 Max-Heap 方向是否需要改变。
2. 定义 Invariant，以及成本分析中使用的输入规模。
3. 比较更换表示前后的一次插入与一次移除。
4. 解释为什么“根节点是极值”不足以证明整个结构都是合法 Heap。
5. 给出一个涉及相同时间戳的边界测试。

## 完整答案与评分点

### 练习 A 答案——4 分

- `parent(10)=4`——1 分。
- 下标 `3` 的子节点是 `7` 和 `8`——1 分。
- 叶节点下标为 `6..11`——1 分。
- 解释：下标 `6` 是第一个左孩子下标 `13` 已超出数组范围的位置——1 分。

### 练习 B 答案——4 分

左子树无效，因为 `18 > 14`。根部 Heapify 只比较 `30`、`14` 和 `25`；看到 `30` 最大后就会停止。

### 练习 C 答案——4 分

贡献为

```text
(n/8)*2 + (n/16)*3 = 7n/16
```

这里忽略了每层共同的常数成本。可长距离下移的节点数会以指数速度减少，因此该表达式化简为 `Theta(n)`。

### 练习 D 答案——6 分

把根节点与最后一个有效值交换：

```text
active=[6,11,13,4,8]  suffix=[17]
```

把 `6` 与较大的子节点 `13` 交换，修复根节点：

```text
active=[13,11,6,4,8]  suffix=[17]
```

## 常见错误与修复路径

| 错误 | 失败原因 | 修复方法 |
|---|---|---|
| “Heap 就是已排序数组。” | Invariant 只约束父子边。 | 画出一个数组并未排序的合法 Heap。 |
| 混用一下标与零下标公式 | 正确的树会被映射到错误下标。 | 每次追踪前先写明下标约定。 |
| 在 `largest == i` 时交换 | 把停止条件写反了。 | 把分支读作“若不存在更大值，则返回”。 |
| 对任意子树调用 Heapify | 更深处隐藏的违规可能存活。 | 先核验两棵子树，或先自底向上构建。 |
| 用 `n * log n` 证明构建成本 | 这只是宽松上界。 | 按节点高度分组并求加权工作量之和。 |
| 排序时在整个数组上 Heapify | 已归位的最大值可能重新进入 Heap。 | 传入不断缩小的 `heap_size`。 |
| 把 Heap Sort 称为稳定排序 | 远距离交换可能颠倒同 key 记录。 | 在反例中追踪记录身份，而不只追踪 key。 |
| 把 `increase_key` 当作任意更新 | 变化方向决定修复路径。 | 陈述 `new_key >= old_key`，或使用另一项操作。 |
