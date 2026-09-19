# 算理研习·综合审议：从约束到算法

This synthesis does not introduce a ninth lecture. It asks you to combine the tools already established in the first eight lectures and justify a choice under explicit constraints.

## 首次术语

**Algorithm portfolio（算法工具组合）** is the set of representations and procedures you can choose from, together with the operations and assumptions each one supports.

**Decision evidence（选择证据）** is the observable reason for a design choice: required operations, input domain, update pattern, correctness invariant, and measured or derived cost.

**Adversarial case（对抗样例）** is an input chosen to attack an assumption or worst-case boundary. It is not merely a large random input.

**Workload（工作负载）** is a distribution or sequence of operations, not just the size of one stored collection. A structure that is good for one query can be poor for a different mixture.

**Amortization（摊还）** and **expectation（期望）** are different promises. An amortized bound spreads cost across an operation sequence without requiring randomness; an expected bound averages over a stated random choice or distribution. Never exchange these words casually.

## 核心讲解

### 开放桌观察 A：先看委托，再做设计

开放桌上只摆着委托页：

| 可见字段 | 已给信息 |
|---|---|
| operations | 词元计数更新（token-count update）；精确查找（exact lookup）；文档相似度（document similarity）；top-`k` 报告 |
| report card A | 输入结束后报告一次 |
| report card B | 每次更新后都报告 |
| still blank | 操作频率；输入假设；基本成本单位；所选表示 |

这张页既没有选择数据结构，也没有把任何一张报告卡标成批处理（batch）或在线（online）。这些结论必须由学习者自行论证。

### 1. 从合同出发，而不是从偏爱的数据结构出发

假设一个系统接收文档词元（document token），并且必须反复完成：

1. 更新一个 token 的计数；
2. 计算它与另一份文档的相似度分数；
3. 报告出现频率最高的 `k` 个 token。

“使用堆（heap）”还不是一份设计。heap 支持反复访问极值（extreme value），却不能单独提供对待改计数 token 的直接查找。“使用散列表（hash table）”同样不完整：链地址字典（chained dictionary）能在散列假设下支持 expected 查找与更新，但不会让全部 key 始终保持优先级顺序（priority order）。

一套可论证的 portfolio 是：

- 用 chained dictionary 维护 token 到计数的更新；
- 用向量运算（vector arithmetic）计算相似度分数；
- 对只执行一次的 top-`k` 报告使用大小为 `k` 的最小堆（min-heap）；如果报告与任意更新交错发生，则改用更复杂的索引优先级结构（indexed priority structure）。

相似度计算必须让两份文档使用同一个分词器（tokenizer）与词表（vocabulary）。点积（dot product）和两个范数（norm）都必须来自这个共享特征空间（feature space）；零向量（zero vector）还需要明确的处理策略，否则余弦相似度（cosine similarity）会发生除零。

选择由所需 operations 推出，而不是让一种结构在所有类别里争夺唯一胜者。

### 2. 区分 batch 与 online

**batch** 算法读取一个集合，并在有限次遍历后产出结果。归并排序（merge sort）就是 batch 过程。面对任意字符串 key，应写成 `O(n log n)` 次 key 比较，不能把比较次数直接当成总时间；key 归一化（key normalization）以及比较器（comparator）执行的字符级工作必须另行计价。

**online** 结构必须在多次更新之间保留有用状态。AVL 树（AVL tree）在每次插入后维护顺序与高度 invariant；heap 在每次修复后维护极值 invariant；chained dictionary 在每次更新后维护桶归属关系（bucket membership）。

这一区别会改变成本问题：

```text
batch:       build once + answer from final result
online:      update cost × number of updates + query cost × number of queries
```

如果最终只报告一次，执行一次排序往往优于持续维护复杂结构。当数据生命周期内不断到达前驱（predecessor）、后继（successor）或类似秩（rank）的有序查询时，维护 AVL tree 才有充分理由。

### 开放桌观察 B：证明之前的状态快照

学习者选择证明策略（proof strategy）之前，只能看到两条轨迹：

```text
count trace:  empty map -> one token consumed -> shorter unresolved suffix
top-k trace:  empty candidate set -> one candidate consumed -> shorter unresolved suffix
```

委托声明 `k>=1`。权重相同的候选项使用全序比较键（total comparison key）`(weight, token)`，因此平局不会悄然改变候选项身份。四个证明栏仍然空白；观察页既没有为它们命名，也没有替学习者填完。

### 3. 让不变量（invariant）匹配查询

只有当 invariant 能把所需 operation 化为局部或结构化步骤时，它才有价值。

| 表示（representation） | 维护的事实 | 自然支持的证据 |
|---|---|---|
| 最大堆（max-heap） | 每个父 key 都不小于其子 key | 根处最大值；沿单一路径修复 |
| 二叉搜索树（Binary Search Tree, BST） | 左侧 key 在节点之前，右侧 key 在节点之后 | 搜索路径、最小值、successor |
| AVL tree | BST 顺序加上有界平衡 | 高度为对数时的有序 operations |
| 稳定计数/基数趟（stable counting/radix pass） | 输出顺序同时遵守 key 桶和此前的同 key 顺序 | 在 key domain 假设下进行非比较排序（non-comparison sorting） |
| 链地址散列表（chained hash table） | 每个 key 都归入其散列与压缩函数选定的桶 | 在已声明散列模型下获得 expected 短查找链 |

不要声称 heap“已经排序”。它暴露的顺序足以定位极值，却不足以高效回答 predecessor。也不要在没有声明负载因子（load factor）和散列假设时，把 hash table 称为“常数时间”。

对于 top-`k`，必须要求 `k>=1`，并使用确定性的 total comparison key。以 `(weight, token)` 为 key 时，即使权重相同，大小为 `k` 的 min-heap 根仍是已保留候选项中的最小者，因此替换过程与最终保留集合都可以复现。

### 4. 先搭证明骨架，再计算运行时间（runtime）

一份紧凑的正确性论证应明确：

1. **初始化（Initialization）**：为什么第一步之前 invariant 成立。
2. **维护（Maintenance）**：为什么一次 operation 能保持或恢复 invariant。
3. **进展（Progress）**：为什么未解决区域或到 termination 的距离会减小。
4. **终止（Termination）**：为什么最终 invariant 能推出所需结果。

对于分治峰值查找（divide-and-conquer peak finding），Progress 是搜索区域严格缩小；对于插入排序（insertion sort），Progress 是已排序前缀变长；对于 merge sort，Progress 是每次 merge 中至少一个输入头前进；对于 `max_heapify`，Progress 是潜在违规沿一条根到叶路径向下移动。

runtime 分析应放在这套骨架之后，因为 Progress 度量会说明哪些工作重复，以及最多重复多少次。

### 开放桌观察 C：尚未定价的表达式与限定词

板书给出同一个表达式，但没有说明它采用哪一种实现：

```python-fragment
if token in collection:
    ...
```

候选标签写着 `list`、`balanced tree` 和 `chained dictionary`，但每个成本栏都还是空白。第二行列出期望（expected）、摊还（amortized）与比较下界（comparison lower bound），却没有填写各自量化的对象。最后一张卡只给出 `n` 条记录和大小为 `r` 的整数 key domain，并没有声明排序成本。

### 5. 按实际模型定价

同一个源代码表达式采用不同底层 operation 时，成本也会不同。

```python-fragment
if token in collection:
    ...
```

- 在 Python `list` 中，成员检查（membership）可能扫描 `Theta(n)` 个元素；
- 在平衡搜索树（balanced search tree）抽象中，查找为 `Theta(log n)`；
- 在简单均匀散列（simple uniform hashing）下，chained dictionary 的失败查找 expected `Theta(1 + alpha)`；固定成功目标可以安全地写成 expected `O(1 + alpha)`，若要写出同阶 `Theta`，还需要额外的目标位置假设；
- 在刻意构造碰撞的 hash table 中，同一次查找可能退化为 `Theta(n)`。

这里 `alpha=n/m` 是存有 `n` 个 key、拥有 `m` 个桶时的 load factor。expectation 针对固定 key 与 operation 序列，对已声明的散列函数选择取平均，而不是对未说明的未来 workload 取平均。

因此，在定义 `collection`、它的大小与 membership 成本之前，“这个循环是线性的”没有明确含义。

expected bound 对已声明的随机选择或输入分布取平均；amortized bound 把成本分摊到一串 operations 上，并不要求随机性。两个限定词回答不同问题，不能因为它们可能化成相同的渐近表达式就互换。

### 6. 把下界视为受模型限定的结论

`Omega(n log n)` 排序下界适用于必须区分全部排列的比较决策树（comparison decision tree）。计数排序（counting sort）直接使用大小为 `r` 的整数 domain 中的 key value，对 `n` 条记录支付 `Theta(n+r)` 时间以及桶空间。基数排序（radix sort）同样会使用数位结构，并要求每一趟都稳定。它们没有推翻该定理，而是在定理模型之外运行，并为 key domain、数位、稳定性与内存要求付出代价。

由此得到一个可复用的决策问题：

> 该算法使用了哪些下界模型所禁止的信息？

如果答案是“没有”，那么所谓的渐近改进就值得怀疑。

### 开放桌观察 D：尚未取值的失败轴

最后一张作答前卡片只公开四个变量：

| 轴 | 可见字段 |
|---|---|
| 散列结构 | 链长 |
| 保留前沿 | 比值 `k/u` |
| 相似度表示 | tokenizer 版本 |
| 局部 heap 修复 | 子树状态 |

没有任何取值被标成对抗值（adversarial value），卡片也没有说明测试应攻击哪一条前提。

### 7. 攻击假设，而不是堆叠样本数

有效反例（counterexample）应从保证的边界出发设计：

- 强迫许多已存 key 落入同一条链，攻击 expected 短链前提，并暴露 `Theta(n)` 查找；
- 让 `k` 接近不同候选项数量 `u`，消除大小为 `k` 的 heap 所具有的小前沿优势；
- 使用不同版本的 tokenizer 或 vocabulary，说明两个数值向量未必处于同一个 feature space；
- 破坏“两个子树都已经是 heap”这一前置条件，说明一次根修复无法修好任意坏边。

重复成功样本只能增加支持，并没有尝试证伪（falsify）结论。即使随机样本很大，也可能恰好漏掉使某条前提失效的结构。

### 开放桌观察 E：先看请求，不替方案填空

匿名预约训练账页只公开以下合同：

| 可见栏 | 已给信息 |
|---|---|
| required operations | exact lookup；predecessor；最终排序；top-`k` |
| version A | 全部录入后只导出一次 |
| version B | 每次插入后都可能收到查询 |
| still blank | representation；维护时机；同步边界；成本模型 |

这张页只够区分操作和到达时机。它没有宣布某一种结构能包办全部请求，也没有替学习者决定 batch、online 或组合方案。

## 完整因果链

### 公共校准一：从请求走到可检验结论

设有一个服务，要把一篇新到文档与固定档案库比较，并返回两者共有词中最具特征性的十个。

### 前提

- token 是字符串；
- 一篇文档包含 `n` 个 token 和 `u` 个不同 token；
- 档案库包含 `u_a` 个不同 token；令 `q=min(u,u_a)` 表示较小字典的扫描量，令 `s` 表示实际找到的共有 key 数；
- hash table 操作采用明确说明的散列族假设（hash-family assumption）；
- `k=10` 相对于 `u` 很小；
- 必须得到精确的频数统计。

### 机制

1. 对新到文档进行分词（tokenize）。
2. 更新 token-count dictionary。每个 token 对应一次 lookup/update。
3. 用较小的 distinct-key set 探查档案库字典，实体化点积所需的 `s` 个共有条目。
4. 计算向量模长，并把点积归一化为夹角或余弦分数。
5. 扫描共有条目，同时维护一个大小为 `k` 的最小堆（min-heap）。

### 关键中间状态

处理 token stream 的任意前缀后，字典中某个词的值等于该词在此前缀中的出现次数。这就是计数不变量（counting invariant）。

处理共有条目的任意前缀后，heap 包含迄今见过的 `k` 个最大权重；若已见条目不足 `k` 个，则包含全部已见条目。根节点是当前保留候选中最小的一个，因此更优候选可以在局部替换它。

### 结果

由前缀不变量可知计数向量是精确的；由 heap invariant 以及对扫描过程的归纳可知 top-`k` 集合也是精确的。相似度计算使用同一组计数，因此报告来自一个一致状态，而不是来自彼此不一致的副本。

### 代价

假设通过动态扩容等策略维持 `alpha=O(1)`，并且对固定的 key 与 operation sequence，期望取自随机选择的 hash function。那么 `n` 次计数更新耗时为 expected `O(n)`；读取全部 `n` 个输入 token 又给出 `Omega(n)`，所以计数阶段为 expected `Theta(n)`。对档案库的 `q` 次探查为 expected `O(q(1+alpha))`。一旦实体化出 `s` 个共有条目，扫描它们的确定性代价就是 `Theta(s)`。每次保留堆修复耗时 `O(log k)`，因此 top-`k` 阶段为 `O(s log k)`。当 `k` 是固定小常数时，这一阶段关于 `s` 呈线性，但诚实的符号结果仍应保留 `k`。

### 边界与反例

若所有 key 都发生碰撞，最坏情形下，新到文档的更新可能耗时 `Theta(nu)`，档案库探查可能耗时 `Theta(q u_a)`；当 `n` 与 `u` 同时增长时，前者是二次代价。若 `k` 接近 `s`，对全部共有条目排序可能更简单，并且渐近代价相当。若档案库与新到文档采用了不同的 tokenization，即使代码仍能运行，数学向量也不再描述同一个特征空间。


### 开放桌观察 F：尚未定价的参数栏

第二张账页给出权重序列 `[8,3,11,5,9]`、不同键数 `u`、计数更新数 `n` 与本例 `k=3`。以下栏位仍未签字：

| 待填栏 | 当前状态 |
|---|---|
| hash randomness | 未声明期望取自什么随机对象 |
| load control | 未声明 `alpha=n/m` 是否受控或何时扩容 |
| collision boundary | 未写全碰撞时的最坏情形 |
| top-`k` parameter | 未说明 `k` 是固定常数还是随 `u` 增长 |

页面不把 expected 写成 worst-case，也不把本例的 `k=3` 自动推广成所有输入上的常数。

## 图示与状态追踪

### 公共校准二：从模型参数走到状态轨迹

### 决策流水线

```text
required outputs（所需输出）
      |
      v
operation mix（操作组合） -----> online or batch?
      |                    |
      v                    v
input domain（输入域） ------> candidate representations（候选表示）
      |                    |
      +-------> invariant and proof（不变量与证明）
                           |
                           v
                  model-qualified cost（受模型限定的代价）
                           |
                           v
                  adversarial boundary test（对抗边界测试）
```

### 一条 top-`k` 轨迹

对权重 `[8, 3, 11, 5, 9]` 和 `k=3`，维护一个保存候选项的 min-heap：

| 已见值 | 保留的多重集 | 根节点含义 |
|---:|---|---|
| 8 | `{8}` | 当前保留项中最小的是 8 |
| 3 | `{3,8}` | 当前保留项中最小的是 3 |
| 11 | `{3,8,11}` | heap 已满；3 是替换阈值 |
| 5 | `{5,8,11}` | 5 替换 3 |
| 9 | `{8,9,11}` | 9 替换 5 |

表格展示的是逻辑内容，而不是某一种具体数组布局。正确性依赖保留集合不变量（retained-set invariant）；具体实现还要维护 heap shape 和 parent/child invariant。

对链式计数，应通过动态扩容等明确的负载策略维持 `alpha=O(1)`。对固定的 key 与 operation，期望取自随机选择的 hash function。这支持 expected `O(n)` 的更新工作量；必须读取全部 `n` 个 token 又给出 `Omega(n)`，因此总计数时间为 expected `Theta(n)`。刻意构造的全碰撞输入仍是另一种最坏情形。对 top-`k`，除非合同确实固定了 `k`，否则应保留 `O(u log k)`；当 `k` 接近 `u` 时，不能省略 `log k`。


## 可执行代码

Environment: Python 3.11+; standard library only.

Input: an iterable of tokens and a positive `k`.
Output: up to `k` `(count, token)` pairs ordered from largest to smallest.
Boundary behavior: empty input returns `[]`; nonpositive `k` raises `ValueError`.

```python
from collections import defaultdict
import heapq
from typing import Iterable


def top_k_tokens(tokens: Iterable[str], k: int) -> list[tuple[int, str]]:
    if k <= 0:
        raise ValueError("k must be positive")

    counts: dict[str, int] = defaultdict(int)
    for token in tokens:
        counts[token] += 1

    retained: list[tuple[int, str]] = []
    for token, count in counts.items():
        candidate = (count, token)
        if len(retained) < k:
            heapq.heappush(retained, candidate)
        elif candidate > retained[0]:
            heapq.heapreplace(retained, candidate)

    return sorted(retained, reverse=True)


assert top_k_tokens([], 3) == []
assert top_k_tokens("a b a c b a".split(), 2) == [(3, "a"), (2, "b")]
assert top_k_tokens(["x", "y"], 5) == [(1, "y"), (1, "x")]

try:
    top_k_tokens(["x"], 0)
except ValueError:
    pass
else:
    raise AssertionError("nonpositive k must fail")
```

The final `sorted` call orders only the retained `k` elements. If the specification accepts an unordered top-`k` set, that final `O(k log k)` step can be removed.

### 开放桌观察 G：尚未取值的攻击轴

第三张账页公开窄整数键域 `0..r-1` 与“同键记录保持到达次序”的合同，并给出四张空白攻击卡：

| 攻击轴 | 尚未决定的取值 |
|---|---|
| hash chain | 链长如何变化 |
| retained frontier | `k/u` 取何比例 |
| integer domain | `r/n` 取何比例 |
| stability | 是否使用保持同键先后次序的过程 |

普通随机样本、重复成功样本与按前提构造的边界样例都还没有被选中；观察页不预先宣布哪一种能完成证伪任务。

## 阶段检查

### 公共校准三：用反例攻击自己的选择

`Omega(u log u)` 下界属于比较决策树（comparison decision tree）。稳定计数排序（stable counting sort）改为读取 `0..r-1` 中的整数 key，并支付 `Theta(u+r)` 的时间与辅助空间；当合同要求稳定性时，它仍必须保留相同 key 的到达顺序。对任意字符串，稳定比较排序产生 `O(u log u)` 次比较；在声称总运行时间之前，还必须分别计入归一化（normalization）和每次字符串比较（string comparison）的代价。

### 练习

请使用新参数，不要复用已经讲解过的轨迹：

1. 对以 `find_predecessor` 为主的 operation mix，比较 heap、chained dictionary 与 AVL tree，并写出起决定作用的不变量。
2. 给出一种 workload，使批量排序比维护 online tree 更简单。
3. 构造一个适合 stable counting sort 的 key-domain 条件，然后破坏其中一项条件。
4. 分别写出 binary peak finding 与 `max_heapify` 的进展度量（progress measure），并解释二者为何都会终止。

这些题目只用于练习，其参数不会被正式会社挑战复用。

## 综合练习

### 案例 A：相似度服务

在以下两种 workload 下，为 token count、重复 top-`k` 报告与文档夹角计算选择表示：

- 完整 batch 结束后只报告一次；
- 每次 token 更新后都报告一次。

提交内容必须包含 operation count、不变量、expected/worst-case 限定词，以及一个 adversarial test。

### 案例 B：预约账册

一份账册需要支持 insertion、exact lookup、predecessor、successor，以及所有预约中的 rank。请比较 sorted dynamic array、heap、unbalanced BST 与 augmented AVL tree；再解释当 workload 改为“插入全部记录后，只请求最终有序结果”时，哪些答案会变化。

### 案例 C：窄键域排序

每条记录都有一个小整数类别和一个到达序号。输出必须按类别排序，同时保留同一类别内的到达顺序。请比较 stable counting sort、LSD radix sort、merge sort 与不稳定的 in-place comparison sort，并写明每一项渐近结论背后的模型边界。


## 完整答案与评分点

For the worked top-`k` example, a complete explanation contains all four parts:

1. the retained-set invariant;
2. why the minimum retained candidate is the replacement threshold;
3. the `O(u log k)` operation count;
4. the `k≈u` and collision boundaries.

Naming `heapq` without these reasons is an implementation reference, not a design argument.

## 常见错误与修复路径

- **“Choose the asymptotically fastest structure.”** Repair: list the required operations first; no structure has one universal speed.
- **“Hash lookup is O(1).”** Repair: state whether the claim is expected, the load factor, and the hashing assumption.
- **“AVL and heap are both logarithmic, so they are interchangeable.”** Repair: compare supported queries, not one shared bound.
- **“Counting sort disproves the comparison lower bound.”** Repair: identify the extra key-domain operation.
- **“The code passed random tests, therefore it is correct.”** Repair: state the invariant and add an adversarial boundary input.
- **“One successful run proves the complexity.”** Repair: derive an operation count and use measurement only as supporting evidence.
