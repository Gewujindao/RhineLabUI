# 算理研习·归并成序

> sorting 不只是重新排列数值。完整解法还要保留每个项目、建立顺序、说明如何维持该顺序，并核算所做工作。

本单元从 state invariant 出发构造两种 algorithm，再根据它们实际执行的工作推导 cost。

## 首次术语

- **sorting**：把序列变成按 key 非递减的次序，同时精确保留原有项目。
- **permutation**：与输入具有相同项目及其重数的重新排列。对于 record，必须保留 record 本身，而不只是保留 key。
- **key**：用于 comparison 的字段。两条不同记录可以具有相等的 key。
- **stable sort**：当 record 的 key 相等时，仍保留这些 record 原有相对次序的 sorting。
- **insertion sort**：把下一项插入正确位置，逐步扩张一个有序前缀。
- **loop invariant**：在每次相关 loop 迭代前后都为真的断言。证明通常包含 initialization、maintenance 和 termination 三部分。
- **merge**：通常通过比较两边第一项尚未消费的元素，把两个已有序序列合成一个已排序 permutation。
- **merge sort**：递归地排序两半，再把它们 merge。
- **recurrence**：把一个问题的 cost 与更小实例联系起来的等式，例如 `T(n)=2T(n/2)+cn`。
- **recursion tree**：逐层展开 recurrence；每个节点代表一个子问题及其非递归工作。
- **comparison**：确定 key 次序的操作。
- **movement**：通过复制、平移或交换项目来改变其位置。comparison 与 movement 的计数不必以相同速度增长。

记号：

- `n`：输入项目总数；
- `j`：下一项插入 sorted prefix 时的索引；
- `L` 与 `R`：已排序的左右序列；
- `i` 与 `k`：`L` 与 `R` 中第一项尚未消费的位置；
- `T(n)`：长度为 `n` 的输入在最坏情况下的运行时间。

## 核心讲解

### 1. sorting contract

对于输入 record `A[0:n]`，正确的升序 sorting 返回 `B[0:n]`，且满足：

1. **有序：** 对每一对有效相邻项，都有 `key(B[t]) <= key(B[t+1])`。
2. **保持：** `B` 是 `A` 的 permutation。

stability 还增加第三项条件：

3. **相等 key 的次序：** 如果 record `x` 先于 record `y` 出现在 `A` 中，且两者 key 相等，那么 `x` 也先于 `y` 出现在 `B` 中。

给 record 加上标签，就能直接观察 stability：

```text
输入:   (4,a) (2,b) (4,c) (3,d)
稳定:   (2,b) (3,d) (4,a) (4,c)
破坏:   (2,b) (3,d) (4,c) (4,a)
```

两个输出的 key 序列相同，只有第一个保留了两条 key 为 4 的 record 的原始次序。

sorting 很有用，因为有序表示会让后续任务更容易：二分查找、重复项分组、中位数选择、最近邻检查、双指针扫描和确定性显示。因此，一次 sorting 的 cost 可以由之后的多次查询摊回。

### 课堂观察 A：三轮牌面

先只读状态，不命名结论：

```text
start:  (5,a) | (2,b) (5,c) (3,d)
round1: (2,b) (5,a) | (5,c) (3,d)
round2: (2,b) (5,a) (5,c) | (3,d)
```

待判：

- 每轮开始时，哪一段已经处理，哪一段仍待处理？
- 已处理区域必须保留原输入中的哪些带标签记录？
- 新来的 `(5,c)` 与已有 `(5,a)` 同键时，应落在它的哪一侧？

本页只保存牌面与待判栏，不给出 invariant、证明或成本结论。

### 2. insertion sort：扩张已认证前缀

在迭代 `j` 开始时，位置 `0..j-1` 构成原输入前 `j` 项的有序 permutation。这就是 **sorted-prefix invariant**。

要插入 `A[j]`：

1. 把它保存为 `current`；
2. 从 sorted prefix 向左扫描；
3. 把 key 严格大于 `current` 的每一项右移一格；
4. 把 `current` 放入空出的位置。

按 key 追踪下列 record：

```text
输入                          sorted prefix
(5,a) (2,b) (5,c) (3,d)

j=1, 插入 (2,b)
(2,b) (5,a) | (5,c) (3,d)    length 2

j=2, 插入 (5,c)
(2,b) (5,a) (5,c) | (3,d)    length 3

j=3, 插入 (3,d)
(2,b) (3,d) (5,a) (5,c)      length 4
```

该条件只移动 *严格大于* 的 key。已有的 `(5,a)` 不会越过 `(5,c)`，因此保留了 stability。

正确性来自三项 invariant 义务：

- **initialization：** 第一次真正插入之前，单项前缀已经有序，并且恰好包含原来的那一项。
- **maintenance：** 右移前缀中较大的项目仍会保持它们的次序；把 `current` 放到所有小于或等于它的前缀项目之后，会得到一个有序前缀，其中恰好包含旧前缀加上 `current`。
- **termination：** 当 `j=n` 时，已认证前缀就是整个数组。因此完整输出已有序，并且是输入的 permutation。

### 3. insertion cost 与二分查找陷阱

在最坏情况下，例如 key 逆序时，迭代 `j` 的项目要越过前面的 `j` 项：

```text
comparison 与 movement：
1 + 2 + 3 + ... + (n-1) = n(n-1)/2 = Theta(n^2)
```

在最好情况下，输入已经有序，每次迭代只进行一次失败的 while 条件检查且不发生平移，因此该实现耗时 `Theta(n)`。

二分查找能更快找到插入位置吗？可以：

- 寻找位置的 comparison 降为每次迭代 `Theta(log j)`，总计 `Theta(n log n)`；
- 在普通数组中，移动连续后缀仍耗费 `Theta(j)`，最坏情况下总计 `Theta(n^2)`。

因此，binary insertion 可以减少 comparison，却不会改变最坏情况下的渐近 movement cost。声称某项 cost 时，必须说明所计数的资源。

一条轨迹把分账看清楚。前缀 `[2,3,5,7]`，插入 `4`：

```text
二分定位：与 3 比较（大于）→ 与 5 比较（小于）→ 落点 2，共 2 次 comparison
平移：把 [5,7] 右移一格，2 次 movement
```

二分只决定落点，后缀平移照旧；comparison 从 `Theta(j)` 降到 `Theta(log j)`，movement 仍是最坏 `Theta(j)`。

stability 也约束二分查找的边界：新的相等 key record 必须插在已有相等 key record *之后*。若找到第一个相等位置并插在它之前，就会颠倒相等 key 的次序。

具体地：前缀 `[(2,b),(5,a)]`，插入 `(5,c)`。二分若停在第一个等于 5 的位置（下标 1），直接插在前面会得到 `(5,c)` 先于 `(5,a)`；稳定的做法是从那个位置继续向右越过所有 key 等于 5 的项，落在 `(5,a)` 之后。二分给出区间下界，stability 给出区间内的落点规则。

### 课堂观察 B：两条未消费前沿

两边输入已分别核对为有序：

```text
L = [(2,a), (6,b), (9,c)]
R = [(1,d), (6,e), (8,f)]
```

两根指针都只指向本侧第一条未消费记录。推进到 `(6,b)` 与 `(6,e)` 相遇时，先不要写规则：

- 哪一侧先进入输出，才能保留原序列中的同键先后？
- 若一侧先耗尽，另一侧余段应如何处理？
- 怎样核对每条带标签记录只进入输出一次？

本页不揭示 tie rule、耗尽规则或总成本。

### 4. merge：两个已排序输入，一条单调前沿

merge 有一项严格的 precondition：两个输入序列都已经有序。令 `i` 与 `k` 分别指向两边第一项尚未消费的元素。

每一步都有：

- `L[i]` 是 `L` 中剩余项目的最小者；
- `R[k]` 是 `R` 中剩余项目的最小者；
- 因而两个头部中较小的一个，就是全体剩余项目的最小者。

把该项追加到输出，并且只推进它一侧的指针。当一侧耗尽时，追加另一侧的剩余后缀。

merge invariant 是：

```text
输出有序；
输出恰好包含已消费的项目；
每个输出项目都 <= 每个尚未消费的项目。
```

稳定的 tie rule：

```text
if key(R[k]) < key(L[i]):
    take R[k]
else:
    take L[i]   # left wins equality
```

左半部分在原序列中更早出现。相等时取左侧，就能跨越拆分点保留该次序。

这条 tie rule 与词频表的 merge scan（两份已排序表按同一 key 序做两下标扫描）共享同一前提：只要相等时固定取一侧，扫描结果就只由 key 序决定，不依赖实现细节。

示例：

```text
L = [(2,a), (6,b), (9,c)]
R = [(1,d), (6,e), (8,f)]

头部        选择         输出
2a / 1d     1d           [1d]
2a / 6e     2a           [1d,2a]
6b / 6e     6b           [1d,2a,6b]    相等时左侧优先
9c / 6e     6e           [1d,2a,6b,6e]
9c / 8f     8f           [1d,2a,6b,6e,8f]
R 耗尽      追加 9c      [1d,2a,6b,6e,8f,9c]
```

每根指针都只向前移动。两个列表合计发生 `len(L)+len(R)` 次消费，因此 merge 耗时 `Theta(len(L)+len(R))`，并使用线性输出空间。

### 5. merge 为什么正确

假设 `L` 与 `R` 满足输入已排序的 precondition。

- **initialization：** 输出为空，所以它有序，并且恰好包含零项已消费项目。
- **maintenance：** 每个头部都是本侧剩余序列中的最小者。选择较小头部，就是选择全体剩余项目中的最小者。追加它不会破坏输出次序，而只推进一根指针会保持项目计数。
- **termination：** 每一步消费一个项目，因此有限输入必会结束。追加未触碰的有序后缀仍会保持次序。每个原始项目恰好出现一次。

该证明也解释了为何不能对未排序输入调用 `merge`：此时无法保证头部仍是各自余段的最小者。

### 课堂观察 C：递归树待填账

先看一个 `n=8` 的二次幂样本：

| 深度 | 节点数 | 每个节点的输入规模 | 本层合并总工作 |
|---:|---:|---:|---:|
| `0` | `1` | `8` | `?` |
| `1` | `2` | `4` | `?` |
| `2` | `4` | `2` | `?` |
| `3` | `8` | `1` | base |

待判：

- 节点数翻倍、节点规模减半后，每个内层的总工作怎样变化？
- 长度为零或一时，递归应怎样停止？
- `n` 不是二次幂时，两半的规模应怎样写？

本页不填写 level sum、recurrence 答案或最终渐近阶。

### 6. merge sort：由合同组合得到正确性

长度为零或一的序列原样返回。否则：

1. 在接近中点的位置拆分；
2. 递归排序左半部分；
3. 递归排序右半部分；
4. merge 两个已排序结果。

正确性采用对 `n` 的 induction。

- **base：** 零项或单项序列已经有序，并且得到保持。
- **inductive hypothesis：** 递归调用能正确、稳定地排序每个更小的序列。
- **inductive step：** 两个递归结果分别是各自半段的有序 permutation。merge contract 返回两者并集的有序 permutation。稳定的递归调用加上相等时左侧优先的 merge，会为完整输入保留相等 key 的次序。

注意这里的依赖关系：不能仅凭 merge sort 拆分了输入就证明它正确；证明同时依赖递归合同 *和* merge contract。

### 7. 从代码得到 recurrence

为简化分析，先假设 `n` 是 2 的幂：

- 两次递归调用各接收 `n/2` 个项目；
- 拆分的簿记工作依赖具体表示，可能是常数，也可能是线性；
- merge 全部 `n` 个项目耗费 `Theta(n)`。

因此：

```text
T(1) = Theta(1)
T(n) = 2T(n/2) + Theta(n), n > 1
```

当两半不等长时，用 floor 与 ceiling 替代 `n/2`，但不会改变渐近结果。

每一项都能在代码里找到来源：

| 代码位置 | 对 recurrence 的贡献 |
|---|---|
| 两次递归调用 `merge_sort(items[:middle])`、`merge_sort(items[middle:])` | `2T(n/2)` |
| 拆分与切片的簿记 | 表示相关：切片复制是线性的，索引区间版本可降到常数 |
| `merge` 的完整循环 | `Theta(n)` |

recurrence 不是记忆出来的：递归调用次数决定 `2T(n/2)`，merge 循环决定 `Theta(n)`，簿记项随表示选择变化。

### 8. 用 recursion tree 求解

在深度 `i`：

- 子问题数：`2^i`；
- 每个子问题的规模：`n/2^i`；
- 每个节点的 merge 工作：`c*n/2^i`；
- 本层总工作：`2^i * c*n/2^i = cn`。

到达规模为一的叶子之前，树有 `log2 n` 个内部层；叶子贡献 `Theta(n)`：

```text
Theta(n) work/level * Theta(log n) levels + Theta(n) leaves
  = Theta(n log n)
```

这种 level sum 方法也能解释相近的 recurrence：

- `2T(n/2)+Theta(1)` 为 leaf-heavy，总计 `Theta(n)`；
- `2T(n/2)+Theta(n)` 在各层均摊 `Theta(n)` 工作，总计 `Theta(n log n)`；
- `2T(n/2)+Theta(n^2)` 为 root-heavy，因为各层总工作构成递减几何级数，总计 `Theta(n^2)`。

recursion tree 是核算工具。正确性仍需要单独的 algorithm 证明。

同一个核算方法用在两种相近 recurrence 上，结论完全不同。取 `n=8`：

| 深度 | `2T(n/2)+Theta(1)` 本层工作 | `2T(n/2)+Theta(n^2)` 本层工作 |
|---:|---:|---:|
| 0 | 1 | 64 |
| 1 | 2 | 32 |
| 2 | 4 | 16 |
| 叶子（8 个） | 8 | 8 |
| 合计 | 15 = Theta(n) | 120 = Theta(n^2) |

leaf-heavy 的层和按 `2^i` 增长（等比公比 2），根层那点常数工作占不到主导；root-heavy 的层和按 `n²/2^i` 收缩（公比 1/2），总和被根层的 `Theta(n²)` 主导。两种树的形状相同，层内工作不同，结论就不同。

### 课堂观察 D：覆盖与同键交换

先保留两条失败证据：

```text
Aliasing attempt：
写入输出 -> 覆盖一条左侧尚未消费的 record

带标签输出：
A = [(2,a), (2,c), (5,b)]
B = [(2,c), (2,a), (5,b)]
```

待判：

- 若输出与未消费输入共用同一片区域，哪条记录会先失去？
- 两个输出的键序列相同，带标签记录的行为是否也相同？
- 完整工程报告除时间外，还要给哪些空间与行为栏？

本页不写辅助空间数量级，也不宣布哪份输出满足稳定性。

### 9. 空间、表示与工程边界

下面的实现会返回新列表。merge 在顶层需要 `Theta(n)` 的 auxiliary output storage，递归调用还会增加 `Theta(log n)` 的栈深度。Python 切片也会复制子列表；这不会改变 `Theta(n log n)` 的时间阶，却会产生额外分配。采用索引区间的实现可以避免切片，同时保留相同的 comparison 结构。

insertion sort 会 in place 修改一个列表，只使用 `Theta(1)` 的辅助项目存储，但 movement 次数可能是二次的。对于小输入或接近有序的输入，这种简单性可能很有价值。渐近意义上的优势不代表某种方法会在每个具体规模上都胜出。

两种 merge sort 实现的内存行为可以对照：切片版每层都复制子列表，产生额外分配但不改变 `Theta(n log n)` 的时间阶；索引区间版只传区间边界，避免这些复制。insertion sort 的原地性则来自"只保存 current、把前缀元素直接右移一格"——辅助项目存储只有一个，所以是 `Theta(1)`。空间与时间一样，先确认表示，再谈阶。

## 完整因果链

### insertion 因果链

```text
单项前缀有序
  -> 保存下一条 record
  -> 只右移前缀中严格更大的 record
  -> 插入空出的位置
  -> sorted-prefix permutation invariant 扩张一项
  -> termination 时完整数组有序且稳定
  -> 最坏情况下平移总数为 Theta(n^2)
```

### merge 因果链

```text
两个输入都有序
  -> 每个头部都是本侧余段的最小者
  -> 较小头部是全体余项的最小者
  -> 追加它并推进一根指针
  -> output invariant 得到保持
  -> 每个项目恰好消费一次
  -> merge 正确、在相等时左侧优先则稳定，并且是线性的
```

### merge-sort 因果链

```text
拆成更小的两半
  -> 递归合同排序每一半
  -> merge contract 排序两者并集
  -> induction 证明完整正确性
  -> 两次半规模调用加一次线性 merge
  -> T(n)=2T(n/2)+Theta(n)
  -> Theta(log n) 层中每层均为 Theta(n)
  -> Theta(n log n)
```

## 图示与状态追踪

### insertion 状态表

追踪 key `[7, 3, 5, 3, 8]`，把两个相等的 3 分别标为 `3a` 与 `3b`。

| 迭代 | 保存项 | 平移 | 已认证前缀 |
|---:|---|---|---|
| 开始 | - | - | `[7]` |
| `j=1` | `3a` | `7 -> right` | `[3a,7]` |
| `j=2` | `5` | `7 -> right` | `[3a,5,7]` |
| `j=3` | `3b` | `7,5 -> right`；不得越过 `3a` | `[3a,3b,5,7]` |
| `j=4` | `8` | 无 | `[3a,3b,5,7,8]` |

这张表记录的不只是数值，还显露了稳定的 tie 决策。

### 双指针 merge 状态

```text
L:  2a  5b  7c
    i^
R:  2d  4e  9f
    k^

相等 key -> 从 L 取 2a
L:  2a  5b  7c       输出: 2a
        i^
R:  2d  4e  9f
    k^

依次取 2d、4e、5b、7c；追加 9f
输出: 2a 2d 4e 5b 7c 9f
```

### 八个项目的 recursion tree

```text
深度 0:           n=8                         merge 总工作 ~ 8
                 /   \
深度 1:        n=4   n=4                      merge 总工作 ~ 8
              / \     / \
深度 2:     n=2 n=2 n=2 n=2                  merge 总工作 ~ 8
            /\  /\  /\  /\
深度 3:    八个 n=1 叶子                      base 总工作  ~ 8
```

三个 merge 层的 cost 都与八个项目成正比。叶子再增加一个线性量，因此忽略常数因子后，总量与 `8*log2(8)` 成正比。

### 证明义务对照

| 方法 | 必须保持的状态 | 最坏时间 | 稳定条件 |
|---|---|---:|---|
| insertion sort | sorted-prefix permutation | `Theta(n^2)` | 只平移严格更大的 key |
| binary insertion | 同一 invariant | `Theta(n^2)` movement、`Theta(n log n)` comparison | 插在已有相等项之后 |
| merge | 已消费项目的输出有序；头部是前沿最小者 | `Theta(p+q)` | key 相等时选择左侧 |
| merge sort | 递归两半满足 sort contract；merge 组合两者 | `Theta(n log n)` | 递归 stability 加稳定 merge |

## 可执行代码

语言与环境：

- Python 3.11 或更高版本；
- 不使用第三方包；
- 输入是有限列表或序列；
- `key(item)` 返回可以相互比较次序的 key；
- insertion sort 修改原列表并返回同一个列表；
- merge sort 返回新列表；
- 空输入与重复 key 都是有效输入。

```python
from collections.abc import Callable, Sequence
from typing import TypeVar

T = TypeVar("T")
K = TypeVar("K")


def insertion_sort(items: list[T], key: Callable[[T], K]) -> list[T]:
    """Stably sort items in place and return the same list."""
    for j in range(1, len(items)):
        current = items[j]
        current_key = key(current)
        i = j - 1

        while i >= 0 and key(items[i]) > current_key:
            items[i + 1] = items[i]
            i -= 1

        items[i + 1] = current
    return items


def merge(
    left: Sequence[T],
    right: Sequence[T],
    key: Callable[[T], K],
) -> list[T]:
    """Stably merge two sequences already sorted by key."""
    output: list[T] = []
    i = 0
    j = 0

    while i < len(left) and j < len(right):
        # Take right only when its key is strictly smaller.
        # Equality falls through to left, preserving stable order.
        if key(right[j]) < key(left[i]):
            output.append(right[j])
            j += 1
        else:
            output.append(left[i])
            i += 1

    output.extend(left[i:])
    output.extend(right[j:])
    return output


def merge_sort(items: Sequence[T], key: Callable[[T], K]) -> list[T]:
    """Return a new stable list sorted by key."""
    if len(items) <= 1:
        return list(items)

    middle = len(items) // 2
    left = merge_sort(items[:middle], key)
    right = merge_sort(items[middle:], key)
    return merge(left, right, key)


if __name__ == "__main__":
    records = [
        (5, "first-five"),
        (2, "two"),
        (5, "second-five"),
        (3, "three"),
    ]
    expected = [
        (2, "two"),
        (3, "three"),
        (5, "first-five"),
        (5, "second-five"),
    ]

    insertion_input = records.copy()
    returned = insertion_sort(insertion_input, key=lambda item: item[0])
    assert returned is insertion_input
    assert insertion_input == expected

    assert merge_sort(records, key=lambda item: item[0]) == expected
    assert merge_sort([], key=lambda item: item) == []
    assert merge_sort([(1, "only")], key=lambda item: item[0]) == [(1, "only")]

    left = [(2, "left-a"), (2, "left-b"), (7, "left-c")]
    right = [(2, "right-a"), (5, "right-b")]
    assert merge(left, right, key=lambda item: item[0]) == [
        (2, "left-a"),
        (2, "left-b"),
        (2, "right-a"),
        (5, "right-b"),
        (7, "left-c"),
    ]

    try:
        merge([3, 1], [2, 4], key=lambda item: item)
    except Exception:
        raise AssertionError("merge does not diagnose an unsorted precondition")
    else:
        # This call is intentionally outside the contract. A validator should
        # check the precondition before using merge in an exposed API.
        pass

    print("all stable sorting checks passed")
```

最后一次调用展示了一条合同边界：`merge` 不负责排序未排序输入，也不要求抛出错误。生产 API 可以增加只在调试时启用的有序性检查，但该检查本身耗费线性时间。

## 阶段检查

1. insertion sort 处理完 `[(6,a),(2,b),(6,c),(4,d),(1,e)]` 的前四条 record 后，已认证前缀是什么？
2. 为什么把 insertion sort 的 while 条件从 `>` 改成 `>=` 会威胁 stability？
3. 对 `[(1,a),(4,b),(4,c)]` 与 `[(2,d),(4,e)]` 做 stable merge。写出输出的前四条 record。
4. 对 `T(n)=2T(n/2)+3n`，深度二的非递归总工作是多少？
5. 对输入 `[3,1,3]`，给出一个有序但不是 permutation 的输出，再给出一个是 permutation 但无序的输出。

每个答案都要指出相关合同：prefix invariant、tie rule、frontier invariant、level sum 或 sorting specification。

## 综合练习

你收到一组事件 record `(priority, arrival_id, payload)`。它们必须按 `priority` 升序排序，priority 相等的事件必须保持递增的到达次序。

提交：

1. 一份至少包含六条 record 的稳定 insertion-sort trace，其中有两组不同的相等 priority；
2. 一份 stable merge trace，拆分点两侧都出现相等 priority 的 record；
3. 一段证明，说明 merge 输出有序且保留每一条 record；
4. 一段证明，说明当递归调用与 merge 都稳定时，merge sort 也稳定；
5. recurrence、recursion-tree level sum 与最终最坏情况界；
6. 针对空输入、单条 record、已有序、逆序和重复 priority 输入的测试；
7. 一段说明 insertion sort 在什么情况下仍是合理工程选择的文字。

证明中不得把 arrival ID 当作隐藏的第二排序 key。stability 必须来自 algorithm 的 tie 处理，而不是来自修改题目要求的 key。

## 完整答案与评分点

### 阶段检查答案

1. 前四条 record 变为 `[(2,b),(4,d),(6,a),(6,c)]`。两条 key 为 6 的 record 保留了原始次序。
2. 使用 `>=` 时，已有的相等 key record 会被右移，使新插入的相等 key record 得以移动到它之前。
3. 前四条 record 是 `[(1,a),(2,d),(4,b),(4,c)]`。左侧两条 key 为 4 的 record 都先于 `(4,e)`。
4. 深度二有四个规模为 `n/4` 的子问题；每个贡献 `3n/4`，因此 level 总量是 `4*(3n/4)=3n`。
5. `[1,3]` 有序但少了一个 3；`[3,3,1]` 是 permutation，但不是非递减的。

## 常见错误与修复路径

1. **错误：只证明输出有序。**
   修复：另行证明输出是 permutation。追踪已消费项目，或使用 prefix invariant。

2. **错误：把 stability 理解成“重复项仍然存在”。**
   修复：给相等 key record 加标签，再检查它们的相对次序。

3. **错误：在 insertion sort 中平移相等 key。**
   修复：只有前面的 key 严格更大时才平移。

4. **错误：merge 的 key 相等时选择右半部分。**
   修复：相等时取左侧，因为拆分前左侧 record 出现得更早。

5. **错误：对未排序输入调用 merge。**
   修复：使用双指针证明之前，先声明并核验 precondition。

6. **错误：声称 binary insertion 总体是 `Theta(n log n)`。**
   修复：分别报告 comparison 与 movement；数组后缀平移仍是二次的。

7. **错误：凭记忆写 recurrence。**
   修复：直接根据代码计算递归调用次数、调用规模和非递归工作。

8. **错误：在每一层都把 `Theta(n)` 乘以节点数。**
   修复：节点规模会缩小。在深度 `i`，应把 `2^i` 个节点乘以每个节点 `Theta(n/2^i)` 的工作。

9. **错误：把 recursion tree 当作正确性证明。**
   修复：树用于确定 cost；invariant 与 induction 用于确定行为。

10. **错误：只用没有标签的相等 key record 测试一个精确输出。**
    修复：分别核验有序性、multiset 保持与带标签的 stability。
