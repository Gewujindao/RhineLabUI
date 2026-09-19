# 算理研习·峰线初探

> 算法思维（algorithmic thinking）从分开三个问题开始：必须找到什么、方法为什么正确，以及它的成本怎样增长。

## 前置诊断

继续阅读前，请在不借助计算工具的情况下回答：

1. 若数组长度为 `n`，`Theta(n)` 比单独的 `O(n)` 多说明了什么？
2. 为什么反复把一个正整数减半只会产生 `Theta(log n)` 个阶段？
3. 在有限网格中，只向*严格更大*数值移动的路径能否再次访问同一格？
4. 除了“我试过的例子都成立”，一份证明还必须建立什么？

若第 2 题不确定，请回想：减半 `k` 次后，剩余规模约为 `n / 2^k`；降到一个元素要求 `k` 约为 `log2(n)`。若第 4 题不确定，请在全课中始终分开两项义务：

- **终止性（termination）**：方法最终会返回；
- **部分正确性（partial correctness）**：只要方法返回，返回位置就满足 specification。

两者合在一起，才能为非空输入建立完全正确性（total correctness）。

## 首次术语

- **算法（algorithm）**：把合法输入映射到所需输出的有限、无歧义过程。程序是 algorithm 的一种实现，不是 algorithm 本身的定义。
- **specification**：问题对合法输入与所需输出之间关系的精确声明。
- **peak**：数值不小于所有相关相邻位置数值的位置；允许相等。
- **边界约定（boundary convention）**：边界位置只与实际存在的邻位比较。可以想象缺失邻位的值为负无穷，但代码无需设置哨兵。
- **正交邻位（cardinal neighbor）**：二维网格中北、南、西、东四个方向实际存在的邻位；不包括对角线。
- **divide and conquer**：选择更小的子问题、求解它，并用子问题的解解决原问题。仅仅缩小规模还不够；选中的子问题必须*安全*。
- **recurrence**：用更小输入的成本表示当前输入成本的等式，例如 `T(n) = T(n/2) + Theta(1)`。
- **不变量（invariant）**：在迭代或递归调用之间保持的性质。本课的重要 invariant 是：“保留区域至少含有原输入的一个 peak。”
- **correctness**：每次合法执行都满足 specification 的主张，需要 invariant、归纳、反证或其他完整论证支持。
- **partial correctness**：只要方法返回，返回结果就满足 specification。
- **total correctness**：partial correctness 与 termination 同时成立。
- **安全区间不变量（safe-interval invariant）**：一维搜索中同时记录“保留区间仍含原数组的 peak”以及切口两侧边界条件的完整 invariant。
- **安全列区间不变量（safe-column invariant）**：二维按列递归中，候选列区间仍含原网格的 peak，且每个继承切口都由候选边界列的 maximum 严格大于相邻已丢弃列的 maximum 来守住。
- **安全半边（safe half）**：由严格更大的邻位见证、能够继续保留原输入某个 peak 的那一侧子问题。
- **state trace**：按执行顺序记录区间、中点、比较方向与下一状态的证据链。
- **贪心上升（greedy ascent）**：反复移动到任意严格更大的相邻位置，直到不存在这种邻位。
- **global maximum**：在明确指定的区域中，不小于其他所有数值的值。“global”始终相对于命名区域，例如某一列。
- **证明义务（proof obligation）**：一份证明必须分别结算的命题，例如 termination、返回条件与递归子问题的安全性。

通用记号：

- `n`：一维数组长度；
- `r`：网格行数；
- `c`：网格列数；
- `A[i]`：一维下标 `i` 处的值；
- `G[i][j]`：第 `i` 行、第 `j` 列的值；
- `T(n)` 或 `T(r,c)`：在声明的成本模型下的最坏运行时间。

## 核心讲解

### 一、先明确问题，再选择过程

<!-- wanxiang:block algorithms-l01-peak-specification-observation:start -->

开场卡片只显示位置和读数，没有任何一张被标记为所需结果。

```text
下标              0   1   2   3   4
读数              2   5   3   8   1

所需输出          ____________________
邻位规则          ____________________
并列处理          ____________________
```

选择搜索过程前，先填完这三个空格。

<!-- wanxiang:block algorithms-l01-peak-specification-observation:end -->

<!-- wanxiang:block algorithms-l01-peak-specification:start -->

对于非空一维数组，下标 `i` 在满足下式时是 peak：

```text
(i == 0     or A[i] >= A[i - 1])
and
(i == n - 1 or A[i] >= A[i + 1])
```

任务要求返回*任意* peak，不要求最大值，也不要求位置唯一。在 `[3, 8, 8, 2]` 中，由于允许并列，中间两个位置都是 peak；在 `[9, 6, 1]` 中，下标 `0` 是边界 peak。

非空有限一维数组总有 peak。global maximum 一定是其中一个，但计算 global maximum 做了超过任务所需的工作。

对于非空矩形二维网格，当 `(i,j)` 的值不小于实际存在的北、南、西、东 cardinal neighbor 时，它就是 peak；对角线不计。任务同样只要求任意一个 peak。

这份 specification 排除了三种常见偷换：

- peak 不必是 global maximum；
- 行最大值未必是二维 peak；
- 一个值即使大于对角邻位，仍可能小于某个 cardinal neighbor。

<!-- wanxiang:block algorithms-l01-peak-specification:end -->

### 二、直接的一维扫描

一种合法方法从左边界出发，只要右侧下一个值严格更大就向右移动；第一次遇到向右不能增大数值的位置便停止。

对 `[2, 5, 9, 9, 4]`，检查过程可以是：

```text
下标:   0   1   2   3   4
数值:   2   5   9   9   4
路径:   ->  ->  停止
```

下标 `2` 已是 peak，因为 `9 >= 5` 且 `9 >= 9`。在严格递增数组上，该方法可能检查全部 `n` 个值，因此最坏成本为 `Theta(n)`。

correctness 理由是局部的，却是完整的：每次都移动到严格更大的右邻位；停止表示右邻位不存在或并不更大，而最后一次移动保证左邻位不更大。在下标 `0`，左侧条件自然成立。

### 三、安全地把一维搜索减半

<!-- wanxiang:block algorithms-l01-safe-half-observation:start -->

当前卡片列为：

```text
下标              0   1   2   3   4
读数              1   7   5   4   2
中间下标          2
左 / 中 / 右读数: 7 / 5 / 4

保留区间          ____________________
切分后的保证      ____________________
```

读数只是观察结果；保证一栏特意留空。

<!-- wanxiang:block algorithms-l01-safe-half-observation:end -->

<!-- wanxiang:block algorithms-l01-safe-half:start -->

设当前 safe interval 为 `[lo, hi]`，中间下标为 `m`。始终保持下面这组 safe-interval invariant：

- `[lo, hi]` 至少含有原数组的一个 peak；
- 若 `lo > 0`，则 `A[lo] >= A[lo-1]`；
- 若 `hi < n-1`，则 `A[hi] >= A[hi+1]`。

完整数组满足这组 invariant，因为它含有 global maximum，且没有区间外邻位。

1. 若实际存在的左邻位严格大于 `A[m]`，保留左半边；
2. 否则，若实际存在的右邻位严格大于 `A[m]`，保留右半边；
3. 否则，`m` 就是 peak。

关键问题不是“数组是否已经减半”，而是“为什么选中的半边必定含有 peak”。

以 `A[m-1] > A[m]` 为例，保留区间为 `[lo, m-1]`。证明按以下 proof obligation 展开。

- **见证存在。** 取保留区间中的一个 maximum；它就是候选见证。
- **内部位置。** 若该 maximum 位于区间内部，它按最大性不小于左右两个邻位。
- **原区间左边界。** 若它位于 `lo`，最大性保证它不小于向内邻位，继承的边界条件保证它不小于区间外邻位；当 `lo=0` 时，外侧条件自然成立。
- **新切口边界。** 若它位于 `m-1`，最大性保证它不小于向内邻位，而 `A[m-1] > A[m]` 保证它严格大于被排除的右邻位。

因此，保留的左半边含有原数组的 peak。它在 `lo` 处继承原外边界条件，严格比较又在 `m-1` 处建立新的切口条件。右侧情形完全对称。由此，每次递归调用保持完整的 safe-interval invariant，而不只是把区间变小。

每一步只做常数次比较，并最多保留约一半候选：

```text
T(n) = T(ceil(n / 2)) + Theta(1)
     = Theta(log n)
```

输出未必与线性扫描返回同一个 peak。correctness 要求的是*一个合法 peak*，而不是指定下标。

<!-- wanxiang:block algorithms-l01-safe-half:end -->

### 四、二维 greedy ascent

从任意格出发，移动到任意严格更大的 cardinal neighbor。数值沿途严格上升，因此有限网格不可能重复访问同一格。路径必然停止；停止处不存在更大的 cardinal neighbor，所以该格是二维 peak。

该方法是正确的，但最坏情况下可能访问 `Theta(r*c)` 个格。correctness 与效率是两项不同判断。

### 五、一个诱人的二维扩展为什么失败

<!-- wanxiang:block algorithms-l01-two-dimensional-failure-observation:start -->

先执行这套两阶段过程，不预先写下结论：

```text
             中列
                |
        c0  c1  c2  c3  c4
r0      10   3   8   4   2
r1      11   1   7   0   1
r2       0   0   6   0   0

中列标记          (r0,c2) = 8
横向停止          (r0,c0) = 10
南侧邻位          (r1,c0) = 11

横向移动后保持的条件: ____________________
需要重新核对的条件:   ____________________
```

<!-- wanxiang:block algorithms-l01-two-dimensional-failure-observation:end -->

<!-- wanxiang:block algorithms-l01-two-dimensional-failure:start -->

一个诱人的过程是：

1. 选择中列；
2. 在该列中找到一个纵向一维 peak；
3. 再在该行中找到一个横向一维 peak。

最后的横向搜索遗忘了纵向条件。考虑下面这个原创反例：

```text
             中列
                |
        c0  c1  c2  c3  c4
r0      10   3   8   4   2
r1      11   1   7   0   1
r2       0   0   6   0   0
```

在中列中，位于 `(r0,c2)` 的 `8` 是该列的边界 peak。行搜索可以向左移动并返回 `(r0,c0)` 的 `10`，但 `10` 不是二维 peak，因为它南侧的邻位是 `11`。

这个反例点明了缺失的 invariant：横向移动保持了行内 peak 条件，却没有保持对纵向邻位的支配关系。

<!-- wanxiang:block algorithms-l01-two-dimensional-failure:end -->

### 六、正确的中列方法

<!-- wanxiang:block algorithms-l01-two-dimensional-cost-observation:start -->

对当前 `r` 行、`c` 列的矩形，把工作账本暂时留空：

```text
所选中列检查的格数:       ____________________
下一片区域保留的列数:     ____________________
本层计入的工作量:         ____________________
recurrence:               ____________________
```

观察页上的四项账目都保持空白。

<!-- wanxiang:block algorithms-l01-two-dimensional-cost-observation:end -->

<!-- wanxiang:block algorithms-l01-middle-column:start -->

设原网格共有 `c` 列，当前候选列的闭区间为 `[lo, hi]`，并记第 `j` 列的 global maximum 为 `M(j)`。递归全程保持下面的 safe-column invariant：

- `[lo, hi]` 至少含有原网格的一个 peak；
- 若 `lo > 0`，则 `M(lo) > M(lo-1)`；
- 若 `hi < c-1`，则 `M(hi) > M(hi+1)`。

初始的全列区间含有整个网格的 global maximum，且没有已丢弃的外侧列，因此满足该 invariant。在 `[lo, hi]` 上执行：

1. 选择中列 `j`；
2. 扫描全部 `r` 行，在第 `j` 列找出 global maximum，设其位于第 `i` 行；
3. 将 `G[i][j]` 与实际存在的西、东邻位比较；
4. 若两个横向邻位都不严格更大，返回 `(i,j)`；
5. 否则，递归进入严格更大横向邻位所在的半边。

第 4 步能够返回，需要结算三项 proof obligation：

1. **纵向证书。** 所选格是该列的 global maximum，因此不小于北、南邻位。
2. **横向检查。** 返回前的显式比较又保证它不小于西、东邻位。
3. **返回条件。** 四个方向所需的比较全部成立，所以所选格是二维 peak。

第 5 步的安全性则按下面的原事实展开。假设西邻位更大，新区间为 `[lo, j-1]`：

1. **建立新切口。** 刚比较过的西邻位位于第 `j-1` 列，且严格大于 `M(j)`，因此 `M(j-1) > M(j)`。这正是新右切口所需的边界条件。
2. **继承旧切口。** 新区间保留了原来的左边界 `lo`，因此 `lo` 一侧已有的切口条件原样继承。
3. **取区域 maximum。** 在新区间的全部格中取一个 global maximum。它不小于区域内的所有邻位；若它位于 `j-1`，新切口条件保证它也大于第 `j` 列的东邻位；若它位于 `lo`，继承条件保证它也大于已丢弃的西邻位。
4. **保持 invariant。** 该区域 maximum 是原网格的 peak，新老两个切口条件也都成立，所以新区间仍满足完整的 safe-column invariant。东侧情形完全对称。

扫描一整列的成本为 `Theta(r)`，剩余列数减半：

```text
T(r,c) = T(r, ceil(c / 2)) + Theta(r)
       = Theta(r log c)
```

对 `n` 乘 `n` 的方阵，该式为 `Theta(n log n)`。recurrence 必须明确写出输入维度；对任意矩形只写 `Theta(n log n)` 会隐藏方阵假设。

<!-- wanxiang:block algorithms-l01-middle-column:end -->

### 七、结论的适用边界

- 方法要求输入是有限、非空的矩形网格。
- 数值只需具有一致的比较关系，不要求互不相同。
- 并列不会强迫递归；若没有邻位*严格*更大，当前格已经是 peak。
- `Theta(r log c)` 假设索引一个格和比较两个值的成本均为 `Theta(1)`。
- *整个*网格的 global maximum 当然也是 peak，但寻找它需要 `Theta(r*c)`。
- 若把中列 global maximum 换成任意一维列 peak，就会丢失证明使用的纵向保证。

## 完整因果链

### 一维因果链

```text
非空有限区间
  -> 检查中间元素
  -> 严格更大的邻位指出安全半边
  -> 保留区域的 maximum 不会在切口处落败
  -> 区间规模约减半
  -> 最终返回一个 peak
  -> T(n) = T(n/2) + Theta(1) = Theta(log n)
```

### 二维因果链

```text
非空矩形网格
  -> 扫描中列并取得该列的 global maximum
  -> 纵向邻位已经不更大
  -> 没有更大的横向邻位就得到二维 peak
  -> 否则，更大的横向邻位为安全半边提供见证
  -> 保留列数约减半
  -> T(r,c) = T(r,c/2) + Theta(r) = Theta(r log c)
```

### 失败因果链

```text
只找到纵向一维 peak
  -> 沿所在行移动
  -> 横向前进会换到另一列
  -> 纵向支配关系不再已知
  -> 返回的行内 peak 可能小于北邻位或南邻位
  -> 一个反例即可否定普遍 correctness
```

## 图示与状态追踪

### 追踪 A：一维 divide and conquer

使用 `A = [4, 7, 3, 6, 11, 8, 2]`。

```text
safe interval [0..6], m=3, A[m]=6
左值=3，右值=11
右值更大 -> 保留 [4..6]

safe interval [4..6], m=5, A[m]=8
左值=11，右值=2
左值更大 -> 保留 [4..4]

safe interval [4..4], m=4, A[m]=11
实际存在的两个邻位都更小 -> 返回下标 4
```

每一行都要同时记录两个事实：

1. 保留区间变小；
2. 保留区间仍含有原数组的 peak。

第一个事实证明进展，第二个事实证明安全性。

### 追踪 B：正确的二维递归

```text
          c0  c1 |c2| c3  c4
r0         2   5 | 7|  6   1
r1         4   8 | 9| 12   3
r2         6  10 |11| 13   9
r3         1   3 | 4|  2   0
```

- 中列 `c2` 的 global maximum 是 `(r2,c2)` 处的 `11`。
- 它的东邻位是 `13`，因此保留 `c3..c4`。
- 在保留区域中，下一次选择的列能够检查到 `13`。
- `13` 不小于实际存在的北、南、西、东邻位，所以它是二维 peak。

选中 `13` 并不是因为它是整个网格的 global maximum，而是因为边界比较证明了右半边安全。

### Proof obligation 对照表

| 策略 | 是否 termination？ | 返回格是否满足 specification？ | 最坏成本 |
|---|---|---|---|
| 一维从左向右上升 | 是：下标递增 | 是：停止条件核对剩余邻位 | `Theta(n)` |
| 一维中点切分 | 是：区间减半 | 是：safe-interval invariant | `Theta(log n)` |
| 二维 greedy ascent | 是：数值在有限网格中严格上升 | 是：不存在更大的 cardinal neighbor | `Theta(r*c)` |
| 先列后行的捷径 | 通常会 | 否：可能丢失纵向条件 | 对 correctness 已无意义 |
| 二维中列 global maximum 切分 | 是：列数减半 | 是：列 maximum 加安全半边 invariant | `Theta(r log c)` |

## 可执行代码

语言与环境：

- Python 3.11 或更高版本；
- 不使用第三方包；
- 输入中的值可以相互比较；
- `peak_1d` 返回整数下标；
- `peak_2d` 返回 `(行, 列)` 二元组；
- 空输入或非矩形输入抛出 `ValueError`。

```python
from collections.abc import Sequence
from typing import TypeVar

T = TypeVar("T")


def peak_1d(values: Sequence[T]) -> int:
    """Return the index of any 1D peak in a nonempty sequence."""
    if not values:
        raise ValueError("peak_1d requires a nonempty sequence")

    lo, hi = 0, len(values) - 1
    while lo <= hi:
        mid = (lo + hi) // 2

        left_is_larger = mid > 0 and values[mid - 1] > values[mid]
        right_is_larger = (
            mid + 1 < len(values) and values[mid + 1] > values[mid]
        )

        if left_is_larger:
            hi = mid - 1
        elif right_is_larger:
            lo = mid + 1
        else:
            return mid

    raise AssertionError("the safe-interval invariant was broken")


def peak_2d(grid: Sequence[Sequence[T]]) -> tuple[int, int]:
    """Return coordinates of any cardinal-neighbor peak."""
    if not grid or not grid[0]:
        raise ValueError("peak_2d requires a nonempty grid")

    width = len(grid[0])
    if any(len(row) != width for row in grid):
        raise ValueError("peak_2d requires a rectangular grid")

    lo, hi = 0, width - 1
    while lo <= hi:
        col = (lo + hi) // 2
        row = max(range(len(grid)), key=lambda r: grid[r][col])
        current = grid[row][col]

        west_is_larger = col > 0 and grid[row][col - 1] > current
        east_is_larger = col + 1 < width and grid[row][col + 1] > current

        if west_is_larger:
            hi = col - 1
        elif east_is_larger:
            lo = col + 1
        else:
            return row, col

    raise AssertionError("the safe-column invariant was broken")


def is_peak_1d(values: Sequence[T], i: int) -> bool:
    return (
        (i == 0 or values[i] >= values[i - 1])
        and (i + 1 == len(values) or values[i] >= values[i + 1])
    )


def is_peak_2d(grid: Sequence[Sequence[T]], i: int, j: int) -> bool:
    value = grid[i][j]
    neighbors = []
    if i > 0:
        neighbors.append(grid[i - 1][j])
    if i + 1 < len(grid):
        neighbors.append(grid[i + 1][j])
    if j > 0:
        neighbors.append(grid[i][j - 1])
    if j + 1 < len(grid[0]):
        neighbors.append(grid[i][j + 1])
    return all(value >= neighbor for neighbor in neighbors)


if __name__ == "__main__":
    normal_1d = [4, 7, 3, 6, 11, 8, 2]
    boundary_1d = [9, 4, 1]
    tied_1d = [3, 8, 8, 2]

    for case in (normal_1d, boundary_1d, tied_1d):
        answer = peak_1d(case)
        assert is_peak_1d(case, answer)

    normal_2d = [
        [2, 5, 7, 6, 1],
        [4, 8, 9, 12, 3],
        [6, 10, 11, 13, 9],
        [1, 3, 4, 2, 0],
    ]
    plateau_2d = [
        [5, 5],
        [5, 5],
    ]

    for case in (normal_2d, plateau_2d):
        row, col = peak_2d(case)
        assert is_peak_2d(case, row, col)

    try:
        peak_2d([[1, 2], [3]])
    except ValueError:
        pass
    else:
        raise AssertionError("ragged input should fail")

    print("all peak-finding checks passed")
```

在 `peak_1d` 中，`lo` 与 `hi` 始终围出 safe interval；在 `peak_2d` 中，它们围出满足 safe-column invariant 的列区间。代码中的更新必须保持对应 invariant，验证器则按 specification 检查结果，而不是锁定某一个预期下标。

一般情形：若输入有多个 peak，返回位置可以不同，但验证器必须接受每个合法 peak。边界情形：递减数组返回首个下标。并列情形：无需做严格移动。失败情形：非矩形网格超出已经声明的输入合同。

## 阶段检查

1. 对 `[2, 8, 5, 11, 4, 3]`，按照允许并列的定义列出所有 peak。
2. 用一句话解释为什么“区间变小了”本身不是 correctness 证明。
3. 一个中列候选是所在列的 maximum，且西、东邻位都不更大。哪四项比较能够证明它是二维 peak？
4. 对 `T(r,c) = T(r,c/2) + 5r`，当 `c=32` 时共有多少层非递归工作？
5. 修改“先列后行”的失败反例，使错误返回值落在右边界而非左边界。

计算运行时间前，先写出安全区域 invariant。若无法说明递归选择后仍有哪些事实成立，请返回对应追踪。

## 综合练习

审计下面这套用于非空 `r` 行、`c` 列网格的策略：

```text
选择中间行。
取得该行的 global maximum。
若北邻位或南邻位更大，保留对应的半边行。
否则返回所选格。
```

提交：

1. 含边界处理的精确伪代码；
2. 一次完整追踪，网格至少四行五列；
3. 一份 termination 论证；
4. 一份 correctness 论证，并明确命名安全的保留区域；
5. 以 `r` 和 `c` 表示的 recurrence 与最坏界；
6. 用一句话比较按行切分与按列切分的版本。

不得声称所选行 maximum 就是整个网格的 maximum。证明只能使用 algorithm 实际计算出的事实。

## 完整答案与评分点

### 阶段检查答案

1. 在 `[2, 8, 5, 11, 4, 3]` 中，下标 `1` 和 `3` 是 peak；它们都不小于实际存在的直接邻位。
2. 区间变小证明了走向 termination 的进展，却没有证明丢弃部分确实不再需要。correctness 还需要安全区域 invariant。
3. 列 maximum 提供对北、南邻位的支配，显式横向检查提供对西、东邻位的支配；缺失的边界邻位无需比较。
4. 列数依次为 `32,16,8,4,2,1`。若基本情形（base case）也扫描唯一一列，共有六层 `Theta(r)` 工作。
5. 答案不唯一。合法构造必须让行搜索停在右边界某个值上，并让其北邻位或南邻位严格更大；同时，起始中列格仍须是纵向一维 peak。

### 综合练习评分

按行切分的综合练习满分 10 分：

| 评分项 | 分值 | 满分证据 |
|---|---:|---|
| 过程 | 2 | 选择中间行 maximum，检查纵向邻位，把行数减半，并处理边界 |
| 追踪 | 2 | 展示所选行、maximum、比较、保留半边与合法返回的 peak |
| Correctness | 3 | 分开 termination 与安全性，并解释为什么更大的纵向邻位能见证保留区域含有 peak |
| 成本 | 2 | 推导 `T(r,c)=T(r/2,c)+Theta(c)=Theta(c log r)` |
| 边界／对照 | 1 | 处理并列与单行输入，并比较按行切分和按列切分 |

只给最终坐标而没有论证，最多得 2 分。若过程使用任意行内 peak 而不是行 global maximum，即使样例追踪成功，也失去 correctness 分。

## 常见错误与修复路径

1. **错误：要求严格支配。**
   修复：定义使用 `>=`。平台区可能含有多个 peak；递归只朝*严格*更大的邻位移动。

2. **错误：在二维情形中检查对角线。**
   修复：测试候选前先写出邻域。本单元只使用北、南、西、东 cardinal neighbor。

3. **错误：把 peak 等同于 global maximum。**
   修复：global maximum 是充分条件，却不是必要条件。algorithm 可以返回任意局部合法的 peak。

4. **错误：还没证明半边安全，就说“divide and conquer 很快”。**
   修复：先陈述保留区域 invariant，再推导 recurrence。

5. **错误：用列内 peak 替换中列 global maximum。**
   修复：标出证明中需要全列纵向支配的确切位置。若 algorithm 没有计算这个事实，就应构造反例。

6. **错误：对每种网格都写 `Theta(n log n)`。**
   修复：明确写出两个维度。按列切分的成本是 `Theta(r log c)`；只有对 `n` 乘 `n` 的网格才化为 `Theta(n log n)`。

7. **错误：greedy ascent 遇到相等值时仍做非严格移动。**
   修复：遇到并列就停止，或另设 visited 规则。严格上升天然给出 termination。

8. **错误：只测试一个预期下标。**
   修复：验证 peak 性质。输入可能有多个正确输出。
