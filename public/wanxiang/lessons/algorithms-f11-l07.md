# 算理研习：越过比较之墙

本单元追问一个精确问题：**什么时候 `Ω(n log n)` 是排序无法避开的代价，什么时候它只是某个受限模型的代价？**

## 首次术语

| 术语 | 中文解释 | 符号／合同 | 常见错误 |
|---|---|---|---|
| **比较模型（comparison model）** | 输入项被视为黑箱，只能通过 `<`, `>`, `<=` 等比较获得次序信息 | 代价 = 比较次数 | 把 `Ω(n log n)` 当成每一种排序模型都必须遵守的定律 |
| **决策树（decision tree）** | 固定输入规模下，枚举算法所有比较结果与输出的二叉树 | 内部节点 = 决策；叶子 = 完成的输出 | 计数节点，而不是根到叶的深度 |
| **下界（lower bound）** | 在指定模型中，任何算法都必须为某些输入付出的最低渐近代价 | `Ω(f(n))` | 把最坏情况下界读成每一个输入的代价 |
| **键宇宙（key universe）** | 键可能来自的全集 | 常记为 `U` | 混淆键宇宙大小与记录数量 |
| **值域宽度（range width）** | 实际可用整数区间所占的槽位数 | `r = hi - lo + 1` | 使用 `hi` 而不是包含两端的宽度 |
| **计数排序（counting sort）** | 把整数键映射到计数或桶，再按键序输出 | `Θ(n+r)` 时间 | 隐去巨大的 `r` 却声称代价为 `Θ(n)` |
| **稳定（stable）** | 相等键的记录保持原相对顺序 | 等键次序是不变量 | 用没有标签的整数测试稳定性 |
| **基数（radix）** | 表示整数时使用的进位制底数 | base `b >= 2` | 混淆 base `b` 与值域宽度 `r` |
| **数位（digit）** | 一个 base-`b` 表示位置上的值 | `0..b-1` | 未声明字长随机存取机（word-RAM）假设就认为提取数位没有代价 |
| **最低有效位基数排序（LSD radix sort）** | 从最低位到最高位依次稳定排序 | `d` 趟稳定排序 | 使用不稳定的数位排序器 |

本单元始终使用以下约定：

- `n` 是记录数量；
- `r` 是整数值域宽度；
- `b` 是 radix/base；
- `d` 是已处理的 base-`b` 数位数量；
- 在这种记法有用时，`K` 是非负键的不含上界。

将这些符号分开，可以避免最常见的虚假“线性时间”声明。

## 核心讲解

### 观察 A——没有标签的分支记录

封住记录的内部表示。对一次执行，只记录形如 `does A precede B?` 的问题所产生的“是／否”答案序列。先不说定理名称，画出得到的分支记录，并暂时保留这些问题：

- 每个叶子必须区分什么；
- 哪一种路径长度与该结论相关；
- 该结论依赖哪一种被允许的观察。
### 1. 下界是对“允许获取哪些信息”的声明

假设记录是不透明对象。排序算法可以提出如下问题：

```text
Is key(A[i]) < key(A[j])?
```

算法可以根据答案分支，但不能检查键的某一个比特、把键当作地址，也不能假设键位于某个很小的整数区间。这就是 comparison model，其代价是比较次数。

这个模型是有意限缩的。窄模型的好处是，一个证明就能约束模型中的每一种算法，包括尚未发明的算法；代价则是，这个定理对使用更丰富操作的算法不作任何说明。

### 2. 任何确定性 comparison 算法都会导出一棵决策树

固定输入规模 `n`。第一次比较时，对于不同键，算法会得到两种结果之一。每种结果都会通向另一次比较或一个完成的答案。反复进行这种构造，就会得到一棵二叉树：

```text
                         compare A[p] < A[q]?
                         /                  \
                       yes                  no
                      /                      \
              another comparison       another comparison
                  /      \                  /      \
              ...        ...              ...      ...
             leaf       leaf             leaf     leaf
```

各部分的含义是精确的：

- 一个内部节点就是一次二选一决策；
- 一条从根到叶的路径就是一次执行；
- 路径深度就是该次执行的比较次数；
- 一个叶子就是一个输出；
- 树高就是最坏情况下的比较次数。

高度为 `h` 的二叉树最多有 `2^h` 个叶子。因此，如果一个问题至少有 `L` 个可区分的答案，每棵这样的决策树都必须满足：

```text
2^h >= L
h >= ceil(log2 L)
```

这个证明把关于程序的问题，转换成了一个分支比特究竟能区分多少状态的问题。

### 3. 搜索需要对数深度

在 `n` 个已预处理的有序项中搜索，至少有 `n` 个可能的成功位置。决策树为每个位置至少需要一个可区分的叶子，所以：

```text
2^h >= n
h >= ceil(log2 n)
h = Ω(log n)
```

这就是二分搜索（binary search）与平衡树搜索（balanced-tree search）在这个决策模型中渐近最优的原因。这个结论并没有说预处理没有代价，也没有说散列（hashing）不可能；后者使用了超出次序比较的信息。

### 4. Comparison sorting 需要 `Ω(n log n)`

假设 `n` 个键互不相同。对某种键值赋值而言，输入的每一种排列都可能成为排序后的次序。正确算法必须区分全部 `n!` 种可能，因此它的树至少需要 `n!` 个叶子：

```text
2^h >= n!
h >= log2(n!)
```

要得到渐近结果，我们不需要斯特林公式（Stirling's formula）。在乘积

```text
n! = 1 * 2 * ... * (n/2) * ... * n
```

中，最后 `n/2` 个因子每个都不小于 `n/2`。因此：

```text
n! >= (n/2)^(n/2)

log2(n!)
  >= (n/2) log2(n/2)
  = (n/2)(log2 n - 1)
  = Ω(n log n)
```

因此，每一种确定性 comparison sort 都存在一个需要 `Ω(n log n)` 次比较的最坏输入。归并排序（merge sort）、堆排序（heap sort）与平衡树排序（balanced-tree sort）都在渐近意义上匹配这个下界。

重复键不会使这个一般下界失效。全部合法输入的集合中包含键互不相同的子集，仅这个子集就迫使算法区分 `n!` 种可能次序。“只有常数个不同键”的专门承诺则是另一个问题；该承诺暴露了额外结构，因而可能允许不同的界。

### 观察 B——记录、值域与负载

将带标签的输入 `[(2,A),(0,B),(2,C),(1,D),(0,E)]` 与第二批记录并排放置；第二批中带标签的记录数相同，但最小与最大标识符相差近一万亿。工作表只给出两组端点、记录原始次序和固定内存上限。先列出为两批数据选择步骤前必须审计的条件；此时不要执行步骤，也不要说出算法名称。
### 5. Counting sort 为什么不与下界定理矛盾

现在改变合同。每个键都是包含两端的区间 `[lo, hi]` 中的整数，在所采用的字长随机存取机模型（word-RAM model）中，整数算术与数组访问均花费常数时间。令：

```text
r = hi - lo + 1
index(key) = key - lo
```

算法可以把 `index(key)` 用作数组位置。仅这一次操作暴露的信息，就比两两比较所得的相对结果更多。我们已经离开 comparison model，因此该模型的下界不再适用。

这不是毫无代价的胜利。更丰富的操作引入了新的代价参数 `r`。如果 `n=100`，但键跨越的宽度为 `10^12`，那么分配或扫描 `r` 个计数器会比 comparison sort 更糟。

### 6. 面向记录的稳定 counting sort

对记录而言，“计数并重复输出整数值”还不够：负载必须与它的键一同移动。稳定实现分为四个阶段：

1. 计数每个键对应多少条记录。
2. 将计数转换为每个键在输出中的起始下标。
3. 从左到右扫描输入。
4. 把每条完整记录放到它的键所对应的下一个空位置。

对于以下带标签记录：

```text
[(2,"A"), (0,"B"), (2,"C"), (1,"D"), (0,"E")]
```

状态依次为：

```text
raw counts      [2, 1, 2]
start positions [0, 2, 3]

read (2,A) -> output[3], next[2] becomes 4
read (0,B) -> output[0], next[0] becomes 1
read (2,C) -> output[4], next[2] becomes 5
read (1,D) -> output[2], next[1] becomes 3
read (0,E) -> output[1], next[0] becomes 2

output [(0,B), (0,E), (1,D), (2,A), (2,C)]
```

`B` 仍在 `E` 之前，`A` 仍在 `C` 之前。从左到右放入单调递增的位置，证明了稳定性。

代价记账必须同时写出两个参数：

- 创建计数并做前缀转换：`Θ(r)`；
- 读取并放置记录：`Θ(n)`；
- 总时间：`Θ(n+r)`；
- 辅助存储：输出与计数器共需 `Θ(n+r)`。

如果当地约定不把输出存储算入辅助空间，则辅助工作存储为 `Θ(r)`；但本单元会显式记录输出缓冲区，因为这个稳定实现确实需要它。

### 观察 C——什么必须在下一趟数位排序中保留？

使用带标签的两位数记录 `21A,20B,11C,10D`。工作表给出空的个位列、空的十位列，以及两个没有标签的分趟箭头。执行任何一趟之前，先选择分趟次序，说明每个箭头必须保留什么证据，并列出所有需要记账的代价参数。
### 7. LSD radix sort 由稳定的数位排序组合而成

设非负键使用 base `b` 表示。如果键小于 `K`，数位数量为：

```text
d = ceil(log_b K)
```

键为零时按常规方式特别处理。LSD radix sort 按以下次序处理：

```text
least significant digit -> next digit -> ... -> most significant digit
```

经过 `j` 趟后，使用以下不变量：

> 记录已按其最低 `j` 个 base-`b` 数位构成的数值稳定排序。

归纳基础是一趟稳定的数位排序。在归纳步中，下一趟稳定排序按数位 `j` 对记录分组，同时在新数位相等的每个组内，保留已经建立的低 `j` 位次序。因此，结果会按最低 `j+1` 位排好序。处理完全部 `d` 个位置后，这些数位就构成了完整键。

即使一趟不稳定排序正确地按当前数位分组，它仍会破坏归纳。例如，个位趟已经建立 `20 < 21`；如果十位趟把十位相等的记录反转，就可能输出 `21,20`。

使用稳定 counting sort 作为数位排序器时：

```text
one pass:  Θ(n+b)
d passes:  Θ(d(n+b))
          = Θ((n+b) log_b K)
space:     Θ(n+b)
```

若 `K <= n^c`（其中 `c` 为常数）且明确选择 `b=n`，则 `d <= ceil(c)=O(1)`；每趟代价为 `Θ(n)`，在 word-RAM 假设下总时间为 `Θ(n)`。在同一 `K <= n^c` 前提下，一般 `b=Theta(n)` 只能推出 `d=O(1)`，不能声称 `d<=ceil(c)`；每趟 `Theta(n+b)=Theta(n)`，故总时间仍为 `Theta(n)`。Base 的选择是时间与空间的权衡：更大的 `b` 可能减少趟数，却会扩大计数数组。

### 观察 D——三种数据合同

比较三种输入，不要声称存在一个普遍胜者：

1. 任意长度的字符串，没有有界整数编码合同；
2. 位于已审计狭区间内的整数键；
3. 固定字长的多位整数键，并明确给出数位提取模型。

对每种输入，在选择排序方法之前，都必须给出时间、空间、稳定性与表示方面的理由。
### 8. 模型边界与工程边界并不相同

渐近意义上的许可，不会自动变成实践建议：

- **理论许可：**整数数位／地址操作使算法离开 comparison model。
- **渐近条件：**counting sort 需要 `r=O(n)`，而线性 radix 上界需要 `d=O(1)` 且 `b=O(n)`。
- **工程条件：**计数器与输出数组能装入内存，且常数因子可接受。

三项都必须说明。如果没有给出字长、键上界、base、数位数量与内存声明，“radix sort 是线性的”就不是完整分析。

## 完整因果链

### 因果链 A——从 comparison 到排序下界

```text
Premise:
  records are opaque and the algorithm learns order only through binary comparisons
      |
      v
Mechanism:
  every execution is a root-to-leaf path in a binary decision tree
      |
      v
Intermediate state:
  n distinct records admit n! possible sorted permutations
      |
      v
Capacity constraint:
  a height-h binary tree has at most 2^h leaves
      |
      v
Result:
  2^h >= n!, so h >= log2(n!) = Ω(n log n)
      |
      v
Boundary:
  integer indexing or digit inspection is not comparison-only information
```

### 因果链 B——从有界键到稳定 counting sort

```text
Premise:
  every integer key lies in [lo, hi], width r = hi-lo+1
      |
      v
Mechanism:
  key-lo selects one of r counters in O(1) word-RAM time
      |
      v
Intermediate state:
  counts become disjoint starting positions in the output
      |
      v
Stability mechanism:
  scan input left-to-right and advance each key's next position
      |
      v
Result:
  all records are ordered, and equal-key input order is preserved
      |
      v
Cost / boundary:
  Θ(n+r) time and Θ(n+r) storage; unsuitable when r is enormous
```

### 因果链 C——从稳定分趟到完整 radix 次序

```text
Premise:
  keys have d base-b digits and each digit can be extracted in O(1)
      |
      v
Mechanism:
  stably sort by digits from least significant to most significant
      |
      v
Intermediate invariant:
  after j passes, records are sorted by their lowest j digits
      |
      v
Induction:
  stability preserves those j-digit ties while grouping digit j
      |
      v
Result:
  after d passes, records are sorted by the complete key
      |
      v
Cost / boundary:
  Θ(d(n+b)); an unstable pass or unbounded digit cost breaks the claim
```

## 图示与状态追踪

### 一棵小型决策树

三个可能的搜索成功位置，已经需要至少三个叶子：

```text
                         probe middle?
                      /                \
              target is left?       target is right?
                /       \              /       \
             A[0]      A[1]          A[2]    outside range

leaf count = 4
minimum binary height = 2
```

图中标签只是示意；下界论证使用的是叶子容量，而不是这个特定搜索程序。

### Counting sort 状态表

对于 `[(3,"K"), (1,"L"), (3,"M"), (0,"N"), (1,"P")]`：

| 阶段 | 状态 |
|---|---|
| 键 `0..3` 的计数 | `[1, 2, 0, 2]` |
| 起始位置 | `[0, 1, 3, 3]` |
| 放置 `(3,K)` | `[_, _, _, K, _]` |
| 放置 `(1,L)` | `[_, L, _, K, _]` |
| 放置 `(3,M)` | `[_, L, _, K, M]` |
| 放置 `(0,N)` | `[N, L, _, K, M]` |
| 放置 `(1,P)` | `[N, L, P, K, M]` |

### 三趟稳定十进制排序

使用这组独立练习输入：

```text
input:      329, 457, 657, 839, 436, 720, 355
ones:       720, 355, 436, 457, 657, 329, 839
tens:       720, 329, 436, 839, 355, 457, 657
hundreds:   329, 355, 436, 457, 657, 720, 839
```

在十位趟中，`457` 仍在 `657` 之前，因为它们的十位都是 `5`，而个位次序已经确立。这就是可见形式的不变量。

## 可执行代码

**语言与环境：**Python 3.11 或更高版本；只使用标准库。

**输入合同：**

- `stable_counting_sort` 接受记录与整数键函数；可选提供包含两端的 `lo` 与 `hi`；
- `lsd_radix_sort_records` 接受键为非负整数且 `base >= 2` 的记录。

**输出合同：**返回一个新的稳定有序列表；不改动输入次序。

```python
from __future__ import annotations

from collections.abc import Callable, Iterable
from typing import TypeVar

T = TypeVar("T")


def stable_counting_sort(
    records: Iterable[T],
    key: Callable[[T], int],
    *,
    lo: int | None = None,
    hi: int | None = None,
) -> list[T]:
    items = list(records)
    if not items:
        return []

    keys = [key(item) for item in items]
    if any(type(value) is not int for value in keys):
        raise TypeError("counting-sort keys must be integers")

    actual_lo = min(keys)
    actual_hi = max(keys)
    lo = actual_lo if lo is None else lo
    hi = actual_hi if hi is None else hi

    if lo > hi:
        raise ValueError("lo must not exceed hi")
    if actual_lo < lo or actual_hi > hi:
        raise ValueError("a key lies outside the declared interval")

    width = hi - lo + 1
    counts = [0] * width
    for value in keys:
        counts[value - lo] += 1

    next_position = [0] * width
    running_total = 0
    for index, count in enumerate(counts):
        next_position[index] = running_total
        running_total += count

    # Every slot is overwritten exactly once. items[0] is only a typed placeholder.
    output = [items[0]] * len(items)
    for item, value in zip(items, keys):
        bucket = value - lo
        output[next_position[bucket]] = item
        next_position[bucket] += 1
    return output


def lsd_radix_sort_records(
    records: Iterable[T],
    key: Callable[[T], int],
    *,
    base: int = 10,
) -> list[T]:
    if type(base) is not int or base < 2:
        raise ValueError("base must be an integer at least 2")

    result = list(records)
    if not result:
        return []

    keys = [key(item) for item in result]
    if any(type(value) is not int for value in keys):
        raise TypeError("radix-sort keys must be integers")
    if any(value < 0 for value in keys):
        raise ValueError("this implementation requires nonnegative keys")

    maximum = max(keys)
    place = 1
    while maximum // place > 0:
        counts = [0] * base
        for item in result:
            digit = (key(item) // place) % base
            counts[digit] += 1

        next_position = [0] * base
        running_total = 0
        for digit, count in enumerate(counts):
            next_position[digit] = running_total
            running_total += count

        output = [result[0]] * len(result)
        for item in result:  # left-to-right makes this digit pass stable
            digit = (key(item) // place) % base
            output[next_position[digit]] = item
            next_position[digit] += 1

        result = output
        place *= base

    return result


if __name__ == "__main__":
    tagged = [(2, "A"), (0, "B"), (2, "C"), (1, "D"), (0, "E")]
    assert stable_counting_sort(tagged, key=lambda pair: pair[0]) == [
        (0, "B"),
        (0, "E"),
        (1, "D"),
        (2, "A"),
        (2, "C"),
    ]

    values = [329, 457, 657, 839, 436, 720, 355]
    assert lsd_radix_sort_records(values, key=lambda value: value) == sorted(values)
    assert lsd_radix_sort_records([], key=lambda value: value) == []
    assert lsd_radix_sort_records([0, 0], key=lambda value: value) == [0, 0]

    same_key = [(12, "first"), (12, "second"), (2, "other")]
    assert lsd_radix_sort_records(same_key, key=lambda pair: pair[0]) == [
        (2, "other"),
        (12, "first"),
        (12, "second"),
    ]

    try:
        lsd_radix_sort_records([-1, 2], key=lambda value: value)
    except ValueError:
        pass
    else:
        raise AssertionError("negative-key failure case was not rejected")
```

**正常情况：**混合的有界整数键产生稳定有序列表。

**边界情况：**在相关合同覆盖时，空输入、全零键、重复等键，以及 counting sort 中为负的 `lo` 都是合法的。

**失败情况：**非整数键、超出已声明区间的键、`base < 2` 或为负的 radix 键都会被明确拒绝。巨大的已声明值域或 base 仍可能耗尽内存；那是算法选择失败，而不是静默的正确性失败。

## 阶段检查

1. **叶子容量。**一个 comparison sorter 接收六条互不相同的记录。仅从叶子计数可以推出的最小决策树高度是多少？
2. **稳定放置。**对 `[(3,"K"), (1,"L"), (3,"M"), (0,"N"), (1,"P")]` 追踪 counting sort。哪两对记录可以证明稳定性？
3. **Radix 不变量。**对 `[314, 159, 265, 358]` 追踪稳定十进制 LSD 分趟。十位趟后，已经保证了什么性质？
4. **边界诊断。**对于键位于 `-10^9` 与 `10^9` 之间的 `n=500` 条记录，请解释为什么即使每个键都是整数，也不应使用直接计数数组。

不要只用最终次序或渐近符号取代解释。每个回答都必须说明相关模型或不变量。

## 综合练习

### 引导式设计备忘录

某档案库包含 `80,000` 条记录。每条记录都有一个位于 `[-31, 32]` 的状态键，状态相同的记录必须保持到达次序。内存预算允许使用一个输出数组和数百个计数器。

请提交：

1. 所选的排序方法；
2. 键变换；
3. 一个小型带标签示例的中间计数器／位置状态；
4. 稳定性论证；
5. 用 `n` 与值域宽度表示的时间和空间；
6. 为什么这不与 comparison 下界矛盾的解释。

## 完整答案与评分点

### 引导练习答案

1. 六条互不相同的记录需要 `6! = 720` 个叶子。由于 `2^9=512 < 720 <= 1024=2^10`，高度至少为 `10`。
2. 键 `0..3` 的计数为 `[1,2,0,2]`；起始位置为 `[0,1,3,3]`；输出为 `[(0,"N"),(1,"L"),(1,"P"),(3,"K"),(3,"M")]`。`L` 位于 `P` 之前、`K` 位于 `M` 之前，证明了稳定性。
3. 各趟结果为：

   ```text
   input: 314, 159, 265, 358
   ones:  314, 265, 358, 159
   tens:  314, 358, 159, 265
   hundreds: 159, 265, 314, 358
   ```

   十位趟后，记录已按最低两个十进制数位排好序。稳定性使每个十位相等的组都保留个位次序。
4. 包含两端的宽度约为二十亿，因此 `Θ(n+r)` 时间和 `Θ(r)` 个计数器都由 `r` 主导；仅知道键是整数还不够。

### 引导式设计备忘录答案

- 选择稳定 counting sort。
- 将键 `x` 映射到下标 `x-(-31)=x+31`。
- 包含两端的值域宽度为 `32-(-31)+1=64`。
- 将 64 个计数转换为起始位置，然后从左到右扫描到达记录；连续的等键记录依到达次序占据连续的输出位置。
- 时间为 `Θ(n+64)=Θ(n)`，计入输出后，显式辅助存储为 `Θ(n+64)=Θ(n)`。
- 该方法通过数组下标读取整数结构，因此它位于纯 comparison 模型之外，并通过值域宽度项为这种能力付出代价。

## 常见错误与修复路径

| 错误 | 失败原因 | 修复 |
|---|---|---|
| “所有排序都是 `Ω(n log n)`。” | 缺少模型。 | 说“确定性 comparison sorting 在最坏情况下”，再检查算法是否读取键结构。 |
| “排序有 `n` 个叶子。” | 叶子必须区分完整排列，而不是单个元素。 | 使用 `n!` 种不同键次序。 |
| “Counting sort 是 `Θ(n)`。” | 隐去了值域扫描与计数器。 | 定义 `r=hi-lo+1`，并写出 `Θ(n+r)`。 |
| 输出重复键，而不是记录 | 负载与等键次序都会丢失。 | 移动完整记录，并使用起始位置。 |
| 从 LSD 开始处理 radix 数位，却使用不稳定分趟 | 后续分趟可能破坏低位次序。 | 标记当前数位相等的记录，并验证它们之前的次序被保留。 |
| 为减少 `d` 而选择巨大 base | `Θ(b)` 计数数组可能主导代价或分配失败。 | 同时分析 `d(n+b)` 与内存。 |
| 声称数位提取永远是 `O(1)` | 任意大的整数可能跨越多个机器字。 | 声明字长／键大小假设，或计入比特复杂度。 |
| 把期望、最坏情况和均摊当作同义词 | 它们回答的是不同问题。 | 本单元使用确定性最坏情况 comparison 下界；后续 hashing 单元会单独引入期望代价。 |

修复次序：

```text
name the model
  -> define every input-size parameter
  -> expose an intermediate state
  -> state the invariant
  -> derive time and space
  -> test a boundary that could falsify the claim
```
