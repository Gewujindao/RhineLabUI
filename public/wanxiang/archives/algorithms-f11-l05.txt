# 算理研习 · 有序航道：二叉搜索树（Binary Search Trees）、后继（Successor）与秩（Rank）

本单元从一个调度问题出发：它所要求的操作，无法由堆（Heap）或有序数组（Sorted array）完整满足。解决方案是 BST：一种基于指针的树；它的排序不变量（Ordering invariant）使每次比较都能排除一整棵子树。同一套路径逻辑可以支持搜索（Search）、插入（Insertion）、最小值（Minimum）、Successor 与 Rank。操作成本为 `O(h)`，其中 `h` 是树的实际高度（Height），不能自动写成 `O(log n)`。

## 首次术语

**二叉搜索树（Binary Search Tree, BST）** 是一种节点携带键、子树遵守 Ordering invariant 的二叉树。

**BST 不变量（BST invariant）** 规定：在本单元的唯一结构节点策略下，一个节点左子树中的每个键都小于该节点的键，右子树中的每个键都大于该节点的键。重复值以计数形式存放在同一个节点中。

**表示不变量（Representation invariant, RI）** 是每次更新后都必须保持为真的谓词。查询可以依赖它；调试用 Validator 可以用比正常操作更慢的方法检查它。

**高度（Height）** 是最长根到叶路径上的边数。本单元用 `h` 表示操作成本。

**后继（Successor）** 是键值严格大于当前节点且最小的节点。原讲义称之为 `next-larger`。

**子树移接（Transplant）** 是在旧根节点的父链接处，用另一棵有根子树替换原子树。它改变的是连接关系，而不是键序；删除时还必须另行接回剩余子节点并修复 Parent links。

**中序遍历（Inorder traversal）** 按左子树、节点、右子树的顺序访问。在 BST invariant 下，它会按非递减顺序输出键。

**增广（Augmentation）** 在每个节点中保存派生信息，使新查询可以跳过整棵子树。这里每个节点保存自己的 Subtree size。

**子树大小（Subtree size）** 是节点子树中已存值的数量，包含该节点自身的 Multiplicity。空子树的 Size 为零。

**秩（Rank）** 在本单元中定义为 `rank(t) = number of stored values <= t`。它是一个计数，不是节点深度，也不是节点的局部位置。

代码采用确定性的重复值策略：每个不同键只占一个结构节点，并带有整数 `count`。这样既能保持左侧键严格更小、右侧键严格更大，也能为 Rank 与 Sorting 保留重复值。

## 核心讲解

### 1. 跑道合同暴露缺失的操作

设想一条跑道，未来降落时刻保存在集合 `R` 中。对时刻 `t` 的请求只有在以下条件都满足时才会被接受：

- `t` 不在过去；
- 没有任何已预约时刻与它相距不足 `k` 分钟；
- 插入后仍保持未来时刻的顺序；
- 当现实时间到达某个预约时刻时，可以移除最早的预约。

原例允许距离恰好等于 `k`，因此冲突条件为 `abs(t-r) < k`。

为什么常见结构无法满足整个合同？

| 表示 | 擅长的操作 | 无法满足的操作 |
|---|---|---|
| Unsorted list | Append 成本低 | 查找附近预约需要 `Theta(n)` |
| Sorted array | Binary search 可在 `O(log n)` 内找到邻居 | 为插入而移动元素需要 `Theta(n)` |
| Min heap | 取最早时刻和插入都很高效 | Predecessor/Successor 式的邻近检查可能需要 `Theta(n)` |
| Hash set | 精确 Membership 的期望成本低 | 任意距离的邻居搜索缺少顺序 |
| 按时刻索引的 Direct array | 很适合较小的整数时刻全集 | 无法处理任意精度或极大的全集 |

缺失的能力，是在保留搜索顺序的同时快速插入。BST 会给出一条通往插入位置的比较路径；沿着同一路径，调度器可以拒绝任何与 `t` 距离小于 `k` 的已访问时刻。

表示的选择应由操作需求推出。在陈述 Invariant 与依赖 Height 的成本之前，“使用树”并不构成证明。

### 观察账本：四次比较、两个空格

教学页只展示原始链接与已观察到的搜索：

```text
target = 52

49.right = 79
79.left  = 64
64.left  = 50
50.right = empty

52 > 49  -> right
52 < 79  -> left
52 < 64  -> left
52 > 50  -> empty
```

两个中性账本格仍未填写：

```text
record A: ______
record B: ______
audit result: ______
```

页面只记录比较与链接，不说明哪条审计规则充分，也不预先给出 Runtime 结论。

### 2. Range invariant 让一次比较排除整棵子树

观察下列树：

```text
                    52
                  /    \
                31      76
               /  \    /  \
             18   44  63   90
                  / \
                39  47
```

在节点 `52` 处，左子树的每个键都小于 `52`，右子树的每个键都大于它。这条规则会在每个节点递归成立。

查找 `47` 时：

```text
47 < 52 -> go left
47 > 31 -> go right
47 > 44 -> go right
47 = 47 -> found
```

每一层只会访问一个节点。失败的 Search 在缺失的 Child 处结束，同时也确定了插入位置。

插入 `41` 时，沿以下路径前进：

```text
41 < 52 -> left
41 > 31 -> right
41 < 44 -> left
41 > 39 -> empty right child
```

把 `41` 接在该处。此前的每次 Ancestor comparison 都已经证明，新键落在这个位置允许的范围内。正确的 Insert 必须保持 Parent links、Child links、Ordering bounds 与所有 Augmentation。

裸迭代 Search 与 Insert 需要 `O(h)` 时间和 `O(1)` 辅助空间；这是当前证据能够严格支持的结论。下方为了维护 Size 的参考 Augmented insert 会显式保存一条 `path`，因此该实现的辅助空间为 `O(h)`。没有 Balance 时，`h` 可能等于 `n-1`。

### 观察账本：尚未标记的候选集合

目标节点及其可见链接如下：

```text
49
  \
   79
  /
 64
 /
50
```

板面没有标记任何候选项：

```text
candidate slots: [79] [64] [50] [none]
selected slot:   ______
```

页面既未高亮路径，也未给出选择规则。

### 3. Minimum 与 Successor 依靠结构，而不是完整遍历

#### Minimum

如果一个节点有 Left child，那么该左子树中的每个键都更小。因此，非空子树的 Minimum 就是它最左侧的节点。一路向左最多经过 `h` 条边。

#### Successor 情形 1：存在右子树

如果节点 `x` 有右子树，其中每个键都大于 `x.key`。这些键中最小的一个，就是该右子树的 Minimum。

在上面的树中，`31` 的 Successor 是 `39`，而不是它的 Parent `52`，因为 `39` 是 `31` 右子树中最左侧的键。

#### Successor 情形 2：不存在右子树

当当前节点是 Right child 时持续向上走。这些 Ancestors 都小于或等于路径上的键，不可能成为 Successor。第一次从某个 Ancestor 的 Left child 到达它时停下；这个 Ancestor 就是第一个更大的键。

以节点 `47` 为例：

```text
47 is right child of 44 -> climb
44 is right child of 31 -> climb
31 is left child of 52  -> successor is 52
```

如果一路越过 Root，说明该节点就是 Maximum，没有 Successor。两种情形都需要 `O(h)` 时间。

必须区分节点与数值。Successor 操作利用已知节点的 Parent/Child 关系；如果 API 只接收键，就必须先找到对应节点，总成本仍为 `O(h) + O(h) = O(h)`。

### 观察账本：一个节点、三条未决链接

双子节点情形已经摆出，但没有操作顺序：

```text
          z=50
         /    \
       30      75
              /
            y=60
                \
                 65

y.right = 65
```

页面只提供三个中性链接字段：

```text
link: ______
link: ______
link: ______
```

页面没有给字段编号，也没有标出第一步或最终结构。

### 4. Deletion 是受控 Transplant，而不是数值交换

Deletion 完成后必须满足 Dictionary contract：目标键已经消失（或它的 Multiplicity 已减少），其余每个键仍可搜索，Parent/Child links 相互一致，所有 Augmented sizes 都是最新值。令 `z` 为待移除的结构节点。在本单元的重复值策略下，如果 `z.count > 1`，只需减少计数并向上修复 Size，无须改动指针。只有当 `z.count == 1` 时，才开始结构删除。

#### 情形 1：`z` 是 Leaf

把 `z.parent` 指向 `z` 的链接替换为 `None`。没有 Descendant 被移动，其他节点仍处在完全相同的 Ancestor ranges 内，因此 Ordering invariant 得以保持。

```text
      40                 40
     /  \               /
   20    60    ->      20
```

删除 Leaf `60` 会改变一条 Parent link，以及从 `40` 向上的路径上的 Size。

#### 情形 2：`z` 恰有一个 Child

把唯一的 Child Transplant 到 `z` 的位置。如果 `z` 是 Left child，它幸存子树中的每个键原本就在同一个 Upper bound 内；右侧情形完全对称。因此，Child 的内部顺序仍然有效，但它的 `parent` 字段现在必须指向 `z.parent`。

```text
      40                 40
     /                  /
   20          ->      30
     \
      30
```

这说明仅仅删除对象并不够：接入的 Child 与原来的 Parent 必须对新链接达成一致。

#### 情形 3：`z` 有两个 Children

任何一个 Child 都不能直接占据 `z` 的位置，否则会有部分键落到错误的一侧。选择

```text
y = minimum(z.right)
```

于是 `y` 就是 `z` 的 Successor。因为 `y` 是右子树中最左侧的节点，所以它没有 Left child；正是这个缺失的 Left child，使得移除 `y` 最多只需一次单子节点 Transplant。

这里有两个子情形：

1. **`y.parent is z`：** Successor 就是直接 Right child。用 `y` Transplant `z`，再把 `z.left` 接成 `y.left`；原有的 `y.right` 保持不动。
2. **`y.parent is not z`：** 先用 `y.right` Transplant `y`，补上 Successor 旧位置的空洞；再用 `y` Transplant `z`，把旧 `z.right` 接成 `y.right`，把旧 `z.left` 接成 `y.left`。

非直接子节点情形如下：

```text
          50 z                       60 y
        /      \                   /      \
      30        80       ->      30        80
               / \                         / \
            60 y  90                     70  90
              \
               70
```

为什么这能保持顺序？`z.left` 中的每个键都小于 `z`，因此也小于它的 Successor `y`。`z.right` 中剩余的每个键都不小于 `y`；在结构键唯一的策略下，它们会严格大于 `y`。先从旧位置移除 `y`，可以避免同一个节点出现两次。

该操作会沿一条 Search path 前进；在双子节点情形下，还会沿右子树中的最左路径前进。每条路径长度最多为 `h`，因此 Deletion 成本为 `O(h)`。这仍然**不能**推出 `O(log n)`：倾斜树可能满足 `h = n - 1`。

使用 Subtree-size augmentation 时，要刷新每一条发生结构变化的 Ancestor path 上的所有节点。在非直接 Successor 情形下，这既包括从 `y` 的旧 Parent 向上的路径，也包括 `y` 位于新位置后的路径。根据两个 Children 与 Multiplicity 重算已存 Size，每个访问节点只需 `O(1)`，所以总成本仍为 `O(h)`。

### 5. Inorder traversal 与 BST sort

BST invariant 可以推出：

```text
all(left subtree) < node.key < all(right subtree)
```

根据归纳法，左子树的 Inorder traversal 已经有序，随后应输出当前节点的键，再接上有序的右子树输出。按照已存 `count` 重复输出一个键，就会得到非递减序列。

BST-sort 过程先插入全部 `n` 个输入值，再执行 Inorder traversal：

```text
build BST by repeated insert
emit inorder
```

Traversal 为 `Theta(n)`。如果插入过程中树的 Height 由 `h` 约束，构造成本就是 `O(nh)`；如果 `h=O(log n)`，构造成本就是 `O(n log n)`。但普通 BST 并不承诺这一点。

插入已经有序且互不相同的值：

```text
10 -> 20 -> 30 -> 40 -> 50
```

每个节点都只有 Right child。Height 为 `n-1`，各次插入路径长度为 `0,1,2,...,n-1`，总和是 `Theta(n^2)`。Inorder traversal 仍会产生正确的有序输出，但构造成本是二次的。

这正是下一单元要引入 Balance invariant 的原因。仅有正确顺序，并不能控制 Height。

### 观察账本：原始树与查询目标

板面给出本次判断所需的完整原始树：

```text
                       50
                    /      \
                  28        72
                 /  \      /  \
               16    41   61   85
                    /  \
                   35  46

query target: rank(46)
```

工作区被刻意留空：

```text
work field: ______
work field: ______
work field: ______
```

页面上没有辅助节点标签、累计值、结果或查询过程。

### 6. 为 Rank 增广树

假设每个节点都保存：

```text
size(node) = size(node.left) + node.count + size(node.right)
size(None) = 0
```

对于下列每个 Count 都为一的树：

```text
                       50 [size=9]
                    /               \
             28 [size=5]          72 [size=3]
              /       \             /      \
       16 [1]       41 [3]       61 [1]   85 [1]
                     /   \
                  35 [1] 46 [1]
```

计算 `rank(46)`：

1. 在 `50` 处，`46 < 50`；向左，不增加计数。
2. 在 `28` 处，`46 > 28`；增加 `size(left)+count = 1+1 = 2`，再向右。
3. 在 `41` 处，增加 `size(left)+count = 1+1 = 2`；累计 Rank 为 `4`，再向右。
4. 在 `46` 处，增加 `0+1`；结果为 `5`。

当 `t < node.key` 时，当前节点与右子树都过大，因此向左；当 `t >= node.key` 时，左子树与当前节点中的每个值都不大于 `t`，所以在 `O(1)` 内把它们计入，再向右。查询只访问一条路径，成本为 `O(h)`。

Insertion 必须更新发生变化的 Root-to-leaf path 上的 Size。不在该路径上的节点，其子树与此前完全相同。沿路径返回 Root 时重算

```text
node.size = size(left) + node.count + size(right)
```

总共需要 `O(h)`。

Augmentation 不是免费的魔法。它引入了新的 Invariant，也就引入了新的更新义务。Validator 应同时检查 Ordering ranges、Parent links、Multiplicity 与 Stored size。

### 7. 把 Range counting 作为派生查询

对于整数键，闭区间计数可以写成：

```text
count_in_range(low, high) = rank(high) - rank(low - 1)
```

对于没有 Predecessor operation 的任意有序值，同时定义 `rank_le(x)` 与 `rank_lt(x)`，并使用：

```text
count_in_range(low, high) = rank_le(high) - rank_lt(low)
```

每次 Rank query 都是 `O(h)`，因此常数次查询仍为 `O(h)`。这是对已存 Subtree sizes 的迁移应用，而不是再次遍历所有符合条件的键。

### 8. 扩展边界包含什么

Balancing 仍在本单元范围之外。后续的 Balanced tree 必须在 Rotation 过程中修复 Height 或 Balance metadata，以及 Subtree sizes。Deletion 已经进入本课连续的 Dictionary 叙事，但在普通 BST 中完成删除，并不能证明 Height 已经受到约束。

## 完整因果链

```text
Runway requests need ordered neighbors plus insertion
  -> sorted arrays find positions quickly but shift linearly
  -> heaps expose one extreme but not nearby keys
  -> impose a recursive left-smaller/right-larger BST invariant
  -> one comparison excludes an entire subtree
  -> find, insert, minimum, and successor follow at most one path
  -> their cost is O(h)
  -> delete reduces to leaf, one-child, or successor-transplant surgery
  -> every changed link and augmented ancestor path must be repaired
  -> inorder traversal is sorted because left < node < right at every node
  -> subtree sizes let rank skip a whole left subtree in O(1)
  -> rank also follows one path and costs O(h)
  -> sorted insertion can make h=Theta(n)
  -> an unbalanced BST is correct but may be slow
  -> balancing is required before replacing h by log n
```

这条边界十分重要。如果 Ordering invariant 被破坏，Search 可能排除实际包含目标的子树；如果 Size 已经过期，普通 Find 看似正确，Rank 却可能出错；如果 Height 没有边界，对数性能就只是一厢情愿。

## 图示与状态追踪

### 图 A：Search ranges

```text
                       [40, +inf)
                           64
                         /    \
                 [40,64)      (64,+inf)
                    48             81
                  /   \
            [40,48)   (48,64)
               43        57
```

替代文字：每次下降都会收窄允许的键区间；新 Leaf 必须接在所有 Ancestor comparisons 共同确定的区间内。

### 图 B：由 Ancestry 求 Successor

```text
            70
           /
         42
           \
            58
              \
               63

successor(63):
63 is a right child -> climb to 58
58 is a right child -> climb to 42
42 is a left child  -> stop at 70
```

替代文字：没有右子树时，沿 Right-child links 向上走，直到路径第一次从左侧进入某个 Parent。

### 追踪 C：Rank 跳过整棵子树

```text
rank(46)

50: go left, add 0
28: go right, add size(16)+1 = 2
41: go right, add size(35)+1 = 2
46: include node, add 1
total = 5
```

替代文字：每次向右，都证明当前节点及其整棵左子树位于 Rank threshold 之内。

### 图 D：退化反例

```text
insert 5, 9, 12, 18

5
 \
  9
   \
   12
     \
     18

h = 3 for n = 4
```

替代文字：有序插入会形成指针链，因此正确的 BST 也可能具有线性 Height。

## 可执行代码

**语言与环境：** Python 3.11 或更高版本；只使用标准库。
**输入：** 整数键；重复键会增加节点内部的 Multiplicity。
**输出：** `find` 与 `successor` 返回节点或 `None`；`rank` 返回计数；`bst_sort` 返回新的非递减列表。
**正常情形：** 混合插入顺序、成功与失败的 Find、两种 Successor 情形，以及落在已存值之间的 Rank。
**边界情形：** 空树、单键、重复值、Minimum/Maximum 与有序插入。
**失败情形：** `insert`、`delete` 与 `rank` 会主动对非整数键抛出 `TypeError`；`find` 假定调用者传入可与已存键比较的值，并不主动执行同样的类型检查；来自另一棵树的节点不在已记录的 Successor contract 内。

```python
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterator


@dataclass
class Node:
    key: int
    count: int = 1
    size: int = 1
    left: Node | None = None
    right: Node | None = None
    parent: Node | None = None


def subtree_size(node: Node | None) -> int:
    return 0 if node is None else node.size


def refresh(node: Node) -> None:
    node.size = subtree_size(node.left) + node.count + subtree_size(node.right)


class BST:
    def __init__(self) -> None:
        self.root: Node | None = None

    def insert(self, key: int) -> Node:
        if not isinstance(key, int):
            raise TypeError("keys must be integers")
        if self.root is None:
            self.root = Node(key)
            return self.root

        node = self.root
        path: list[Node] = []
        while True:
            path.append(node)
            if key == node.key:
                node.count += 1
                break
            if key < node.key:
                if node.left is None:
                    node.left = Node(key, parent=node)
                    node = node.left
                    break
                node = node.left
            else:
                if node.right is None:
                    node.right = Node(key, parent=node)
                    node = node.right
                    break
                node = node.right

        for ancestor in reversed(path):
            refresh(ancestor)
        return node

    def find(self, key: int) -> Node | None:
        node = self.root
        while node is not None:
            if key == node.key:
                return node
            node = node.left if key < node.key else node.right
        return None

    @staticmethod
    def minimum(node: Node | None) -> Node | None:
        if node is None:
            return None
        while node.left is not None:
            node = node.left
        return node

    def successor(self, node: Node) -> Node | None:
        if node.right is not None:
            return self.minimum(node.right)
        current = node
        while current.parent is not None and current is current.parent.right:
            current = current.parent
        return current.parent

    def _transplant(self, old: Node, new: Node | None) -> None:
        """Replace the subtree rooted at old with the subtree rooted at new."""
        if old.parent is None:
            self.root = new
        elif old is old.parent.left:
            old.parent.left = new
        else:
            old.parent.right = new
        if new is not None:
            new.parent = old.parent

    @staticmethod
    def _refresh_upward(node: Node | None) -> None:
        while node is not None:
            refresh(node)
            node = node.parent

    def delete(self, key: int) -> bool:
        """Delete one occurrence of key; return whether the key existed."""
        if not isinstance(key, int):
            raise TypeError("keys must be integers")
        target = self.find(key)
        if target is None:
            return False

        if target.count > 1:
            target.count -= 1
            self._refresh_upward(target)
            return True

        if target.left is None:
            repair_from = target.parent if target.parent is not None else target.right
            self._transplant(target, target.right)
            self._refresh_upward(repair_from)
        elif target.right is None:
            repair_from = target.parent if target.parent is not None else target.left
            self._transplant(target, target.left)
            self._refresh_upward(repair_from)
        else:
            replacement = self.minimum(target.right)
            assert replacement is not None
            if replacement.parent is target:
                self._transplant(target, replacement)
                replacement.left = target.left
                replacement.left.parent = replacement
                self._refresh_upward(replacement)
            else:
                old_parent = replacement.parent
                self._transplant(replacement, replacement.right)
                replacement.right = target.right
                replacement.right.parent = replacement
                self._transplant(target, replacement)
                replacement.left = target.left
                replacement.left.parent = replacement
                self._refresh_upward(old_parent)

        target.left = None
        target.right = None
        target.parent = None
        return True

    def rank(self, key: int) -> int:
        """Return the number of stored values <= key."""
        if not isinstance(key, int):
            raise TypeError("keys must be integers")
        result = 0
        node = self.root
        while node is not None:
            if key < node.key:
                node = node.left
            else:
                result += subtree_size(node.left) + node.count
                node = node.right
        return result

    def inorder(self) -> Iterator[int]:
        stack: list[Node] = []
        node = self.root
        while stack or node is not None:
            while node is not None:
                stack.append(node)
                node = node.left
            node = stack.pop()
            for _ in range(node.count):
                yield node.key
            node = node.right

    def validate(self) -> None:
        def audit(
            node: Node | None,
            low: int | None,
            high: int | None,
            parent: Node | None,
        ) -> int:
            if node is None:
                return 0
            if node.parent is not parent:
                raise AssertionError("parent link is inconsistent")
            if low is not None and node.key <= low:
                raise AssertionError("key violates lower BST bound")
            if high is not None and node.key >= high:
                raise AssertionError("key violates upper BST bound")
            if node.count < 1:
                raise AssertionError("multiplicity must be positive")
            left = audit(node.left, low, node.key, node)
            right = audit(node.right, node.key, high, node)
            expected = left + node.count + right
            if node.size != expected:
                raise AssertionError("stored subtree size is stale")
            return expected

        audit(self.root, None, None, None)


def bst_sort(values: list[int]) -> list[int]:
    tree = BST()
    for value in values:
        tree.insert(value)
    tree.validate()
    return list(tree.inorder())


if __name__ == "__main__":
    tree = BST()
    for value in [50, 28, 72, 16, 41, 61, 85, 35, 46, 41]:
        tree.insert(value)
    tree.validate()

    assert tree.find(35) is not None
    assert tree.find(99) is None
    assert tree.rank(46) == 6
    assert tree.rank(40) == 3
    assert tree.successor(tree.find(46)).key == 50
    assert tree.successor(tree.find(85)) is None
    assert list(tree.inorder()) == [16, 28, 35, 41, 41, 46, 50, 61, 72, 85]

    assert tree.delete(16) is True          # leaf
    assert tree.delete(41) is True          # decrement duplicate count
    assert tree.delete(41) is True          # two-child, direct successor
    assert tree.delete(28) is True          # one-child structural case
    assert tree.delete(50) is True          # two-child, non-direct successor
    assert tree.delete(999) is False
    tree.validate()
    assert list(tree.inorder()) == [35, 46, 61, 72, 85]
    assert tree.rank(61) == 3

    assert bst_sort([]) == []
    assert bst_sort([4, -2, 4, 1]) == [-2, 1, 4, 4]
```

正常运行时不输出文字，退出状态为 `0`。这些断言展示了顺序、Parent paths、Multiplicity、追踪中全部三种结构删除、Rank 与 Augmentation。该实现有意省略 Balancing；声称它具有对数 Height，会超出已测试合同。

## 阶段检查

### 练习 A——选择表示

Sorted dynamic array 可以在 `O(log n)` 内找到 `t` 两侧的预约。解释为什么这仍无法满足 `O(log n)` 的插入目标。

### 练习 B——Search 与 Insertion path

对按 `[55, 32, 77, 19, 43, 68, 91]` 顺序插入得到的树，追踪对 `47` 的失败 Search，并指出插入 `47` 时应挂在哪个 Parent 下。

### 练习 C——Successor

在同一棵树中，求出 `43`、`68` 与 `91` 的 Successors，并说明每次适用哪一种 Successor 情形。

### 练习 D——Rank

插入 `[48, 26, 70, 15, 37, 59, 82, 31, 42]`，每个节点只含一个值。利用累计的 Subtree sizes 计算 `rank(42)`。

### 练习 E——退化

画出 `[2,4,6,8,10]` 生成的树。给出 `h`、查找缺失键 `11` 的成本，以及重复插入的总工作量级。

### 练习 F——通过 Successor transplant 删除

从键 `[50,30,80,20,40,60,90,70]` 开始，删除 `50`。指出 Successor，判断它属于直接 Child 还是非直接 Child 情形，按顺序列出 Transplanted links，并给出最终 Inorder traversal。

## 综合练习

### 综合练习——天文台预约索引

一座天文台保存互不重复的未来预约时刻，并支持以下操作：

- 如果相邻预约都不在本次请求指定的间隔内，就插入一个时刻；
- 查找某个已存时刻之后的下一次预约；
- 取消预约，同时不破坏后续 Search；
- 报告不晚于某个 Cutoff 的预约数量；
- 每天一次，按顺序导出全部预约。

设计 Unbalanced-BST 版本：

1. 陈述 RI 与节点字段；
2. 展示 Insertion 与邻居核验的 Comparison path；
3. 给出 Successor、Deletion 与 Rank 过程；
4. 追踪一次双子节点 Deletion，并点名每条被修复的 Parent 或 Size link；
5. 用 `h` 推导每个操作的成本；
6. 构造一个违反对数界声称的输入顺序；
7. 说明下一单元必须增加什么，同时不得假装它已经实现。

## 完整答案与评分点

### 练习 A 答案——3 分

Binary search 计入的是比较，而不是移动。找到位置后，连续的 Dynamic array 仍可能移动后方 `Theta(n)` 个元素，因此 Insertion bound 为 `Theta(n)`。

### 练习 B 答案——4 分

路径为 `55 -> 32 -> 43 -> None`：`47 < 55`、`47 > 32`、`47 > 43`。把 `47` 插成 `43` 的 Right child。

### 练习 C 答案——6 分

- `43` 的 Successor 是 `55`：没有右子树，向上走，直到路径第一次从 Left child 进入 Parent；
- `68` 的 Successor 是 `77`：同样属于 Ancestry 情形；
- `91` 的 Successor 是 `None`：它是 Maximum，向上会越过 Root。

### 练习 D 答案——5 分

不大于 `42` 的有序键为 `15,26,31,37,42`，所以 Rank 为 `5`。一种有效的路径计算如下：

```text
48: go left, add 0
26: go right, add size(15)+1 = 2
37: go right, add size(31)+1 = 2
42: add 1
```

### 练习 E 答案——4 分

这棵树是一条含五个节点的右链，`h=4`。查找 `11` 会访问全部五个节点，因此成本为 `Theta(n)`。重复 Insertion 的路径长度之和为 `0+1+2+3+4`，一般化后得到 `Theta(n^2)`。三部分依次得 1、1、2 分。

### 练习 F 答案——6 分

`50` 的 Successor 是 `60`，它是右子树中最左侧的节点。它不是直接 Child，因为它的 Parent 是 `80`。先用它的 Right child `70` Transplant `60`；再用 `60` Transplant `50`；最后把 `30` 接成 `60.left`，把 `80` 接成 `60.right`。Inorder 结果为 `[20,30,40,60,70,80,90]`。

## 常见错误与修复路径

| 错误 | 失败原因 | 修复方式 |
|---|---|---|
| 把每个 BST 操作都称为 `O(log n)` | 普通 BST 没有 Height bound。 | 先写 `O(h)`，再构造有序插入反例。 |
| 只检查 Parent-child order | Grandchild 可能违反 Ancestor range。 | 递归验证 Lower/Upper bounds。 |
| 把 Heap 当成有序邻居索引 | Heap order 只暴露一个极值，不暴露 Predecessor/Successor。 | 让结构与所需查询匹配。 |
| 求 Successor 时停在第一个 Parent | Right-child ancestry 中包含更小的键。 | 持续向上，直到路径第一次从左侧进入 Parent。 |
| 把 Successor key 复制到 `z` 后就停止 | Payload identity、重复值策略、Parent links 或 Augmentation 可能失去一致性。 | Transplant Successor node，并修复每条受影响的链接。 |
| 尚未补上旧洞就移动深层 Successor | Successor 可能出现两次，或遗失自己的 Right child。 | 先用 `y.right` Transplant `y`，再把 `y` 移到 `z` 的位置。 |
| 在每个节点中直接保存 Rank | 其他位置更新后，节点的全局 Rank 会变化。 | 改为保存可组合的 Subtree size。 |
| 只更新新插入 Leaf 的 Size | 每个 Ancestor 的子树都增加了一个值。 | 向上刷新整条变化路径。 |
| BST sort 时丢弃重复值 | 无声地用 Set semantics 替换了 Multiset input。 | 保存 Count，或定义稳定的 Record policy。 |
| 把原始 Python 2 代码直接当作现代证据 | 语法、合同与部分辅助行为不同。 | 使用经过测试的 Python 3 改写，并记录变化。 |
