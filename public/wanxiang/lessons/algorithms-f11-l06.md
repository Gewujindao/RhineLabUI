# 算理研习 · 平衡之尺：AVL 树（AVL Tree）、旋转（Rotation）与 AVL 排序（AVL Sort）

二叉搜索树（Binary Search Tree, BST）只有在高度（Height）受到控制时才会保持快速。本课把“维持平衡”从一幅示意图落实为表示不变量（Representation invariant）、对数高度证明和局部修复算法（Local repair algorithm）。

## 首次术语

**平衡搜索树（Balanced search tree）** 维护一条额外不变量，在保持搜索顺序（Search order）的同时把高度限制在对数级。

节点的 **Height** 是从该节点向下到叶节点的最长路径所含边数。本课采用：

```text
height(empty) = -1
height(leaf)  = 0
height(node)  = 1 + max(height(left), height(right))
```

**Balance factor** 定义为：

```text
BF(node) = height(node.left) - height(node.right)
```

当 `BF` 为 `-1`、`0` 或 `+1` 之一时，AVL 节点处于平衡状态。

**AVL tree** 是每个节点都满足 AVL 平衡界的 BST。这个名称来自设计者 Adelson-Velsky 与 Landis；此处真正需要掌握的算法内容是不变量，而不是名称本身。

**数据结构增广（Augmentation）** 把派生元数据存进每个节点；本课存储的是 Height，使操作能够在局部更新或查询它。

**Rotation** 是常数规模的指针变换：它改变局部高度，同时保持键的中序序列（In-order sequence）。

**ADT** 规定操作及其含义；**数据结构（Data structure, DS）** 实现这些操作。同一种 ADT 可以有多种合法结构，并呈现不同的成本特征。

## 核心讲解

### 观察账本：两次成功搜索

采用贯穿本课的约定 `height(empty)=-1`、`height(leaf)=0` 与 `BF=height(left)-height(right)`。同样七个互不相同的键形成了两种树形：

```text
shape A                    shape B
        40                 10
      /    \                 \
    20      60                20
   /  \    /  \                \
 10   30  50   70               30 -> 40 -> 50 -> 60 -> 70

search 70: 40 -> 60 -> 70, found
search 70: 10 -> 20 -> 30 -> 40 -> 50 -> 60 -> 70, found
```

```text
shape A path length: ______
shape B path length: ______
cost claim justified by this evidence: ______
```

这一页只记录树形、约定与观察到的路径，尚未说明还需要哪项证明，才能把观察提升为最坏情况保证。

### 1. 平衡为什么决定速度

对于高度为 `h` 的普通 BST：

| 操作 | 经过的路径 | 成本 |
|---|---|---:|
| `find(k)` | 每次比较后选择一个子节点 | `O(h)` |
| `insert(k)` | Search path 加上一条新链接 | `O(h)` |
| `minimum()` | 反复沿 Left links 前进 | `O(h)` |
| `successor(x)` | 求右子树 Minimum，或沿 Parent links 向上走 | `O(h)` |
| `delete(k)` | Search 加局部拼接或 Successor path | `O(h)` |

一棵含 `n` 个节点的树，其高度可能处于 `Theta(log n)` 到 `Theta(n)` 之间的任何量级。

```text
balanced shape             insertion-order path

        8                           2
      /   \                          \
     4    12                          4
    / \   / \                          \
   2  6 10 14                           6
                                         \
                                          8
```

操作代码可以完全相同；真正改变保证的是所维护的树形。

### 2. AVL 不要求完美平衡

AVL 平衡是一条局部条件：

```text
abs(height(left) - height(right)) <= 1
```

它不要求两棵子树大小相等、不要求完全树（Complete tree），也不要求达到理论上的最小高度。一个节点的一侧子树可以比另一侧高一层。

每个节点存储：

```text
key
left reference
right reference
parent reference (optional but useful here)
height
```

子链接改变后，重新计算：

```text
node.height = 1 + max(height(node.left), height(node.right))
```

更新顺序很重要。如果一次 Rotation 让节点 `x` 成为 `y` 的子节点，就必须先更新 `x`、再更新 `y`，因为 `y.height` 依赖 `x` 的新高度。

### 表示不变量

对于每个节点：

1. 存储的搜索键遵循同一个严格全序：所有 Left keys 更小，所有 Right keys 更大；
2. 重复的用户键要么用 `(user_key, stable_id)` 之类的唯一复合键表示，要么放入有明确说明的节点内桶；把相等键一律放在单侧的规则无法安全经受 Rotation；
3. 每个子节点的 Parent reference 都回指当前节点；
4. 存储的 Height 等于由子节点推导出的高度；
5. `abs(BF(node)) <= 1`.

只有正确的 Search order、却没有正确的 Height metadata，并不能构成合法 AVL tree：后续修复决策会依赖错误证据。

### 3. 为什么 AVL 高度是对数级

令 `N(h)` 表示高度为 `h` 的 AVL tree 所能拥有的最少节点数。

要让高度为 `h` 的 AVL tree 尽可能小：

- 一棵子树必须具有高度 `h-1`；
- 另一棵子树不能低于 `h-2`；
- 再加上 Root。

因此：

```text
N(h) = 1 + N(h-1) + N(h-2)
N(-1) = 0
N(0)  = 1
```

前几个值为：

| `h` | `N(h)` |
|---:|---:|
| -1 | 0 |
| 0 | 1 |
| 1 | 2 |
| 2 | 4 |
| 3 | 7 |
| 4 | 12 |
| 5 | 20 |

为了得到一个简单界：

```text
N(h) > 2 * N(h-2)
```

反复代入可得关于 `h` 的指数增长：

```text
N(h) > 2^(h/2)
```

当 `h >= 1` 时，两边取对数：

```text
h < 2 log2 N(h)
```

因此，含 `n` 个节点的树满足 `h = O(log n)`。每一种基于路径的 BST 操作都获得最坏情况 `O(log n)` 保证。

这条证明具有清晰的因果链：

```text
local balance bound
      |
      v
minimum-node recurrence
      |
      v
node count grows exponentially with height
      |
      v
height grows logarithmically with node count
      |
      v
path operations are logarithmic
```


### 观察账本：两幅尚未核验的局部图

这一页展示了一次局部改写，但暂不提供审计结论：

```text
before                         candidate after
        x                              y
       / \                            / \
      A   y                          x   C
         / \                        / \
        B   C                      A   B

in-order before: ______
in-order after:  ______
parent links to repair: ______
height update order: ______
```

标记 `A`、`B` 与 `C` 代表未受影响的子树。只有核对完所有空栏，才能接受候选图。

### 4. 旋转保存的不是“样子”，而是顺序

### 左旋（Left rotation）

旋转前：

```text
        x
       / \
      A   y
         / \
        B   C
```

执行 `left_rotate(x)` 后：

```text
        y
       / \
      x   C
     / \
    A   B
```

旋转前后的 In-order sequence 均为：

```text
A, x, B, y, C
```

因此 BST order 得以保持，只有常数个 Root 与 Link 发生变化：

1. 把 `y` 连接到 `x` 原来的 Parent；
2. 把 Subtree `B` 从 `y.left` 移到 `x.right`；
3. 让 `x` 成为 `y` 的 Left child；
4. 修复 Parent references；
5. 先更新 `x` 的 Height，再更新 `y` 的 Height。

右旋（Right rotation）与之对称。


### 观察账本：一次插入与一份空白修复轨迹

按普通 BST order 依次插入互不相同的键 `[50,20,70,10,30,25]`。刚插入 `25` 时：

```text
        50
       /  \
     20    70
    /  \
   10  30
       /
      25

first unbalanced ancestor: ______
case: ______
ordered rotations: ______
local root after repair: ______
in-order audit: ______
```

这一页只给出插入顺序和未经修复的树形，尚未命名失衡情形，也未规定 Rotation。


### 四种失衡情形

采用 `BF = left height - right height`：

| 失衡节点 `z` | 重子节点 | 情形 | 修复 |
|---|---|---|---|
| `BF(z)=+2` | Left child 满足 `BF>=0` | LL | 对 `z` 右旋 |
| `BF(z)=+2` | Left child 满足 `BF<0` | LR | 先对 Left child 左旋，再对 `z` 右旋 |
| `BF(z)=-2` | Right child 满足 `BF<=0` | RR | 对 `z` 左旋 |
| `BF(z)=-2` | Right child 满足 `BF>0` | RL | 先对 Right child 右旋，再对 `z` 左旋 |

对于 Insertion，这些标签描述从失衡节点走向新插入节点的方向，而不是 Rotation 的方向名称。对于删除（Deletion），应根据重子节点及其 Balance factor 分类；当重子节点的 `BF=0` 时，归入外侧单旋那一行。

### 5. 插入：先像 BST，再恢复高度与平衡关系

AVL Insertion 的步骤是：

1. 与普通 BST 完全相同地插入新键；
2. 从新插入节点开始向 Root 回溯；
3. 重新计算每个访问节点的 Height；
4. 若节点失衡，根据子树高度选择 Rotation case；
5. 把旋转后的局部 Root 重新连接到未受影响的 Parent；
6. 继续向上，审计所有 Stored heights 与后续可能出现的失衡。

### 完整追踪：`[50, 20, 70, 10, 30, 25]`

插入 25 后：

```text
        50
       /  \
     20    70
    /  \
   10  30
       /
      25
```

在节点 50 处：

- Left subtree 比 Right subtree 高两层；
- Left child 20 右侧更重；
- 因而这是 LR case。

先在 20 处左旋：

```text
        50
       /  \
     30    70
    /
   20
  /  \
 10  25
```

再在 50 处右旋：

```text
        30
       /  \
     20    50
    / \     \
   10 25     70
```

In-order sequence 仍为：

```text
10, 20, 25, 30, 50, 70
```

双旋改变的是树形，而不是排序顺序。


### 观察账本：一条留有空白审计栏的删除路径

从 AVL tree 中移除一个 Leaf。本页只记录它原来的 Ancestor chain：

```text
removed leaf -> parent p -> ancestor a -> root r

node    old left/right heights    new height    new BF    action
p       ______                    ______        ______    ______
a       ______                    ______        ______    ______
r       ______                    ______        ______    ______
```

被移除的节点已经不属于该结构；任何一行都没有被预先标成停止点。

### 6. 删除与重复修复

Deletion 先执行普通 BST 删除或 Successor swap。移除节点可能降低一棵 Subtree 的 Height；这种降低可能使某个 Ancestor 失衡，而修复一个 Ancestor 后，高度下降仍可能继续向上传播。

因此，稳健的 Deletion 实现会向 Root 回溯，按需更新 Height 并重新平衡。在 AVL tree 中，Deletion 与 Insertion 具有同样的 `O(log n)` 路径界，但边界情形更多。

本课的可执行代码完整实现 Insertion，并把 Deletion 明确列为扩展边界。不能仅仅因为已经实现 Rotations，就声称支持 Deletion。


### 观察账本：两份操作合同

```text
contract A                         contract B
insert                             insert
find_min                           delete_named_key
delete_min                         predecessor
                                   successor

candidate structure: ______        candidate structure: ______
required invariant: ______         required invariant: ______
costs that decide the choice: ____ costs that decide the choice: ____
```

这一页只列出所需操作，不给候选结构排序，也不替任何一份合同填写选择。


### 7. ADT 决定结构选择

### 优先队列（Priority queue）工作负载

所需操作：

```text
insert
find minimum
delete minimum
```

二叉堆（Binary heap）支持：

- `insert`: `O(log n)`
- Min heap 中的 `find minimum`：`Theta(1)`
- `delete minimum`: `O(log n)`

AVL tree 支持：

- `insert`: `O(log n)`
- `find minimum`：沿 Left links 行走时为 `O(log n)`；若正确增广 Minimum pointer，则为 `Theta(1)`；
- `delete minimum`: `O(log n)`

两者都能实现这项 ADT；Heap 的结构更简单，而且天然支持常数时间的极值查询。

### 前驱（Predecessor）与后继工作负载

所需操作：

```text
insert
delete a named key
predecessor
successor
```

AVL tree 直接维护全序，并以最坏情况 `O(log n)` 支持全部四种操作。Heap 没有维护足够的顺序信息，无法高效找到 Predecessor 或 Successor；查询可能需要 `Theta(n)`。

正确的问题不是“哪种结构更快”，而是“哪条 Invariant 能支持这组操作”。

### 8. AVL 排序

一种排序方法是：

1. 把全部 `n` 条记录插入 AVL tree；
2. 执行中序遍历（In-order traversal）。

成本为：

```text
n insertions * O(log n) = O(n log n)
in-order traversal       = Theta(n)
total                    = O(n log n)
```

这种方法在概念上很有用，因为 Tree invariant 能解释为什么 Traversal 有序；但它并不会自动成为实践中最好的比较排序，因为节点分配与指针开销同样重要。重复的用户键需要 `(value, original_index)` 之类的严格复合键，或稳定的节点内桶；只有保留原始顺序的策略才能声称输出稳定。

## 完整因果链

```text
ordinary BST operations cost O(h)
             |
             v
AVL requires every local height difference to be at most 1
             |
             v
the sparsest height-h tree still follows a Fibonacci-like recurrence
             |
             v
node count grows exponentially with h, so h = O(log n)
             |
             v
rotations repair a local violation without changing in-order order
             |
             v
search and update paths have worst-case logarithmic length
```

证明与修复承担不同职责：递推式证明全局高度界，Rotations 在局部更新后维持这个界；Stored heights 把二者连接起来，让每次修复决策都建立在可审计证据上。

## 图示与状态追踪

观察插入 `35` 之前的这棵合法树：

```text
        40
       /  \
     20    60
       \
        30
```

按普通 BST 规则插入后，节点 `20` 形成 RR 重侧：

```text
        40
       /  \
     20    60
       \
        30
          \
           35
```

在 `20` 处执行 Left rotation，即可恢复 Local invariant：

```text
        40
       /  \
     30    60
    /  \
   20  35
```

In-order sequence 仍为 `20, 30, 35, 40, 60`。先更新下沉节点 `20`，再更新上升节点 `30`，随后从 `40` 继续审计。

## 可执行代码

环境：Python 3.11+；仅使用标准库。
范围：唯一整数键、Insertion、Search 与 Invariant audit。

```python
from dataclasses import dataclass
from typing import Optional


@dataclass
class Node:
    key: int
    left: Optional["Node"] = None
    right: Optional["Node"] = None
    parent: Optional["Node"] = None
    height: int = 0


def height(node: Optional[Node]) -> int:
    return -1 if node is None else node.height


def update_height(node: Node) -> None:
    node.height = 1 + max(height(node.left), height(node.right))


def balance_factor(node: Node) -> int:
    return height(node.left) - height(node.right)


class AVL:
    def __init__(self) -> None:
        self.root: Optional[Node] = None

    def find(self, key: int) -> Optional[Node]:
        current = self.root
        while current is not None and current.key != key:
            current = current.left if key < current.key else current.right
        return current

    def insert(self, key: int) -> Node:
        if self.root is None:
            self.root = Node(key)
            return self.root

        current = self.root
        while True:
            if key == current.key:
                raise ValueError("this teaching implementation requires unique keys")
            if key < current.key:
                if current.left is None:
                    current.left = Node(key, parent=current)
                    inserted = current.left
                    break
                current = current.left
            else:
                if current.right is None:
                    current.right = Node(key, parent=current)
                    inserted = current.right
                    break
                current = current.right

        self._rebalance_upward(inserted)
        return inserted

    def _replace_parent_link(self, old: Node, new: Node) -> None:
        new.parent = old.parent
        if old.parent is None:
            self.root = new
        elif old.parent.left is old:
            old.parent.left = new
        else:
            old.parent.right = new

    def _left_rotate(self, x: Node) -> Node:
        y = x.right
        if y is None:
            raise ValueError("left rotation requires a right child")
        self._replace_parent_link(x, y)
        x.right = y.left
        if x.right is not None:
            x.right.parent = x
        y.left = x
        x.parent = y
        update_height(x)
        update_height(y)
        return y

    def _right_rotate(self, z: Node) -> Node:
        y = z.left
        if y is None:
            raise ValueError("right rotation requires a left child")
        self._replace_parent_link(z, y)
        z.left = y.right
        if z.left is not None:
            z.left.parent = z
        y.right = z
        z.parent = y
        update_height(z)
        update_height(y)
        return y

    def _rebalance_upward(self, node: Optional[Node]) -> None:
        current = node
        while current is not None:
            update_height(current)
            bf = balance_factor(current)
            old_parent = current.parent

            if bf > 1:
                assert current.left is not None
                if balance_factor(current.left) < 0:
                    self._left_rotate(current.left)
                new_root = self._right_rotate(current)
                current = new_root.parent
            elif bf < -1:
                assert current.right is not None
                if balance_factor(current.right) > 0:
                    self._right_rotate(current.right)
                new_root = self._left_rotate(current)
                current = new_root.parent
            else:
                current = old_parent

    def inorder(self) -> list[int]:
        result: list[int] = []

        def visit(node: Optional[Node]) -> None:
            if node is None:
                return
            visit(node.left)
            result.append(node.key)
            visit(node.right)

        visit(self.root)
        return result

    def assert_valid(self) -> None:
        def audit(
            node: Optional[Node],
            low: Optional[int],
            high: Optional[int],
            parent: Optional[Node],
        ) -> int:
            if node is None:
                return -1
            assert node.parent is parent
            assert low is None or low < node.key
            assert high is None or node.key < high
            left_height = audit(node.left, low, node.key, node)
            right_height = audit(node.right, node.key, high, node)
            assert node.height == 1 + max(left_height, right_height)
            assert abs(left_height - right_height) <= 1
            return node.height

        audit(self.root, None, None, None)


tree = AVL()
for value in [50, 20, 70, 10, 30, 25]:
    tree.insert(value)
    tree.assert_valid()

assert tree.inorder() == [10, 20, 25, 30, 50, 70]
assert tree.root is not None and tree.root.key == 30
assert tree.find(25) is not None
```

Invariant audit 是教学设计的一部分。它在每次 Insertion 后核验顺序、Parent links、派生 Height 与 Balance，而不是只检查最终打印出的树形。

## 阶段检查

以下题目只用于练习：

1. 在 Root 为 `40`、Children 为 `20` 和 `60`，且 `10` 与 `30` 是 `20` 的 Children、`70` 是 `60` 的 Right child 的树中，计算每个 Stored height 与 Balance factor。
2. 根据 Minimum-node recurrence 推导 `N(7)`，并说明结果的含义。
3. 插入 `[60, 30, 80, 20, 40, 35]`；找出第一个失衡的 Ancestor，并写出有序的两次 Rotations。
4. 对节点 `z` 执行 Right rotation；其 Left child 为 `y`，中间 Subtree 为 `B=y.right`。列出所有发生变化的 Parent/Child links，以及 Height update order。
5. 针对只需要 `insert`、`find_min` 与 `delete_min` 的 Priority-queue workload，比较 AVL tree 与 Min heap。

## 综合练习

### 情形 A：预约索引

预约记录在线到达。所需查询包括精确查找、Predecessor、Successor 与范围遍历。请提出一种 AVL 表示，说明重复时间的处理策略，并追踪一次 Double rotation。

### 情形 B：缓存最小值

为 AVL tree 增广一个直接指向 Minimum 的 Pointer。解释哪些 Insertions、Deletions 与 Rotations 会改变这个 Pointer；在不改变其他对数保证的前提下，说明新的 `find_min` 成本。

### 情形 C：失败审计

某个实现在正确节点上执行了 Rotation，却先更新新 Root 的 Height，再更新下沉的 Child。请构造一次后续 Insertion，使过时的 Height metadata 导致错误的 Case selection。

## 完整答案与评分点

### 练习 1 答案——6 分

- Leaves `10`、`30` 与 `70`：Height `0`，Balance factor `0`。
- 节点 `20`：Height `1`，Balance factor `0`。
- 节点 `60`：Height `1`，Balance factor `-1`。
- 根节点 `40`：Height `2`，Balance factor `0`。

### 练习 2 答案——5 分

从表格继续计算：

```text
N(6) = 1 + N(5) + N(4) = 1 + 20 + 12 = 33
N(7) = 1 + N(6) + N(5) = 1 + 33 + 20 = 54
```

因此，即使是最稀疏的高度 7 AVL tree，也需要 54 个节点。

### 练习 3 答案——5 分

插入 `35` 后，节点 `60` 是第一个失衡的 Ancestor；它的 Left child `30` 右侧更重。这是 LR case：先在 `30` 处左旋，再在 `60` 处右旋，并保持 In-order order。

### 练习 4 答案——6 分

令 `p` 为 `z` 原来的 Parent。把 `y` 连接到 `p`（或让 `y` 成为 Root），把 `B` 移到 `z.left`；设置 `B.parent=z`（当 `B` 存在时）；再让 `z` 成为 `y` 的 Right child，并设置 `z.parent=y`。必须先重算 `z.height`，再重算 `y.height`。

### 练习 5 答案——5 分

两种结构都提供对数时间的 Insertion 与 Minimum deletion。Min heap 的 `find_min` 不需要额外 Augmentation 即为 `Theta(1)`，而普通 AVL tree 要沿 Left links 行走 `O(log n)`。对于这组操作，除非后续还需要有序查询，否则应优先选择 Heap。

### 综合练习答案

- **情形 A：** 把预约时间作为 Search key，并选择有明确说明的重复策略，例如 `(time, appointment_id)`。Exact lookup、Predecessor、Successor 与每个 Range endpoint 都需要 `O(log n)`；报告 `k` 条预约再加 `Theta(k)`。完整 Trace 必须展示一次 Double rotation，并保持 In-order order。
- **情形 B：** 只有新键更小时，Insertion 才改变缓存的 Minimum；只有指向的 Minimum 被移除时，Deletion 才改变它；Rotations 本身会保持最左键。在 Update path 上维护该 Pointer。`find_min` 变为 `Theta(1)`，Updates 仍为 `O(log n)`。
- **情形 C：** 从 Root `40`、Left subtree `20 ->right 30` 与 Right leaf `60` 开始，插入 `35`。在 `20` 处执行所需 Left rotation 后，上升节点 `30` 的 Height 应为 `1`。如果先更新 `30`，它会读到过时的 Height `2`，该值来自 `20`，并可能被记录成 Height `3`；Ancestor `40` 随后会错误地显得 Left-heavy。正确修复顺序是先更新下沉节点 `20`，再更新上升节点 `30`，最后更新 Ancestor `40`。

对于前面的 LR 完整追踪，完整答案应覆盖：

1. 认定节点 50 是图中第一个失衡的 Ancestor；
2. 认定它的 Left child 右侧更重；
3. 先在 20 处左旋，再在 50 处右旋；
4. 保持 In-order key sequence；
5. 先重算 Child height，再重算 Parent height。

只说“Double rotation”，却不给出 Link 与 Invariant 推理，答案并不完整。

## 常见错误与修复路径

- **“BST 就意味着对数时间。”** 修复：先把成本界写成 `O(h)`，再证明关于 `h` 的性质。
- **“AVL 意味着两棵子树大小相同。”** 修复：比较 Height，而不是节点数。
- **“Rotation 会改变排序顺序。”** 修复：写出 Subtrees 的 In-order sequence `A, x, B, y, C`。
- **“LL 就是向左旋。”** 修复：Case 名称描述的是重路径；修复要在失衡节点沿相反方向旋转。
- **“Pointers 正确就说明 AVL tree 合法。”** 修复：审计 Stored heights 与每一个 Balance factor。
- **“先更新新的 Root。”** 修复：新 Root 依赖下沉的 Child，因此要先更新 Child。
- **“一次成功的 Insert 就证明 Delete 正确。”** 修复：Deletion 可能让 Height decrease 穿过多个 Ancestors，必须独立实现。
- **“Heap 与 AVL 都是对数级，所以可以互换。”** 修复：比较它们支持的 Queries 与 Invariants。
