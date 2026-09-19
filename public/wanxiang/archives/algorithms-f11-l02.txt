# 算理研习·成本模型与文档距离

本课要养成一种把算法推理与代码经验之谈区分开的习惯：在断言一个程序“很快”之前，先说清机器模型，找出原语操作，再计算这些操作真正需要付出多少代价。

## 首次术语

**Problem** 规定所需的输入—输出关系。“给定两份文档，返回它们词汇差异的度量”就是一个 problem。

**Algorithm** 是解决 problem 的有限计算过程。它是一种数学抽象：精确到足以分析，但不绑定某一种编程语言。

**Program** 是 algorithm 在某种语言与环境中的实现。Program 的代价会受到语言运行时、表示选择与硬件模型的影响。

**Model of computation** 说明允许哪些原语操作，以及每种操作的代价。随后便可通过统计这些操作来得到 algorithm 的代价。

**Random-access machine (RAM)** 把内存建模为由 machine word 组成、可按下标访问的数组。在某个地址装载或存储一个 machine word，以及执行一次基本的 machine-word-sized 算术或位操作，代价均为 `Theta(1)`。

**Pointer machine** 把动态分配对象建模为具有 `O(1)` 个字段的对象。一个字段要么保存一个 machine word，要么保存指向另一对象的引用。沿一次引用跳转的代价是 `Theta(1)`，但任意地址运算并不是原语。

**Machine word** 足以表示模型内存中的一个地址，因此它的位宽至少是内存规模的对数。单位代价假设只适用于能放进一个 machine word 的值；不能把大整数悄悄当作常数大小。

**Amortized cost** 在不假设随机输入的前提下，界定一段操作序列中的平均代价。动态数组 append 通常具有 `Theta(1)` amortized cost，尽管某一次扩容会花费 `Theta(n)`。

**Expected cost** 针对明确说明的随机来源或散列假设取平均。Dictionary lookup 的 expected cost 并不等同于最坏情况下的常数时间承诺。

**Document vector** 把每个词映射到它的频数。若以词表作为坐标系，词 `w` 的计数就是坐标 `D[w]`。

## 核心讲解

### 一、观察：尚未作答的代价账本

课堂账本从五行空白开始。它只记录必须作出的判断，却不预先给出任何结论：

| 可见情境 | 待解决的问题 |
|---|---|
| 对未说明类型的 `collection` 执行一次循环 | 哪些原语操作需要计价 |
| 编号抽屉、一条 `next` 链，以及占用 `b` 个 machine word 的值 | 哪些访问代价会随距离或表示大小增长 |
| `words = words + line_words`，旧前缀长度依次为 `0,k,2k,...` | 到第 `r` 轮为止总共复制了多少 |
| 两个频率向量，其中一个输入为零向量 | 角度表达式是否有定义 |
| 无序、排序与 dictionary 三种词频账本 | 从读取输入直到求出角度的完整代价 |

不要只凭语法填写任何一行。对每一行，都应先保留观察到的表示方式、输入规模符号与准确的操作序列。

### 二、校准：从 problem 到已标价操作

一条实用的推理阶梯是：

```text
现实任务
   |
   v
输入—输出 problem
   |
   v
伪代码描述的 algorithm
   |
   v
表示方式 + model of computation
   |
   v
具体语言中的 program
   |
   v
在一台机器上实测执行
```

每一层回答的问题都不同。

- **Problem** 规定所需的输入—输出关系。
- **Algorithm** 给出解决该 problem 的有限方法。
- **Model of computation** 指明允许的原语操作及其价格。
- **Program** 在具体语言、表示方式与环境中实现 algorithm。

对于操作 `op`，代价论断必须计入：

```text
op 的总代价贡献
= execution_count(op) * model_price(op)
```

正确性主要属于 problem 与 algorithm 层。渐近代价需要同时知道 algorithm 与它的 model of computation。常数因子和内存布局则出现在实现层。基准测试描述的是特定输入、软件与硬件；它可以暴露瓶颈，却不能取代对增长率的论证。

把这条公式放在一个真实循环上。设一个循环执行 `n` 轮，每轮都调用一次 `len(L)` 与一次 `x in L`：

- `len(L)` 读取作为元数据保存的长度：`execution_count = n`，`model_price = Theta(1)`，合计 `Theta(n)`；
- `x in L` 可能扫描整个 list：`execution_count = n`，`model_price = O(len(L))`，合计 `O(n * len(L))`。

两个操作被调用的次数相同；增长阶的差异全部来自循环体内部的原语价格。常数因子属于执行次数与实现的差异，增长率只能从 model price 推出来。

### 三、校准：RAM、pointer machine 与 machine-word size

#### RAM 视角

**RAM** 提供一组按地址索引的内存数组，以及常数个 machine-word-sized 寄存器。在它的 machine-word cost 假设下：

```text
address(A[i]) = base(A) + i * word_size
```

常数次 machine-word 操作加一次 machine-word load，使数组下标访问的代价为 `Theta(1)`。

这个假设附带一个位宽下界：一台含 `n` 个存储位置的机器，需要 `⌈log₂ n⌉` 位才能给每个位置写出互不相同的地址，所以一个 machine word 的位宽至少是内存规模的对数，否则连地址本身都装不进去。这也是"machine word 足以表示一个地址"这句话的来源。

这个假设有表示边界。若一个整数占用 `b` 个 machine word，那么随着 `b` 增长，读取或变换它的全部内容就不能诚实地维持 `Theta(1)`。例如一个用 4 个 machine word 保存的词频计数：读取它需要 4 次 word load，加一还要跨字进位，代价随 `b` 增长。文档的词频计数同样可能长到超出一个 machine word；在这类规模上，把 `Theta(1)` 报价换成按 `b` 计价的表述才是诚实的。

#### Pointer-machine 视角

在 **pointer machine** 中，每个对象存储常数个字段。沿一个已存储的 `next` 引用前进一步需要 `Theta(1)`，但沿引用反复前进到第 `k` 个后继需要 `Theta(k)`：

```text
+-------+-------+-------+
| value | prev  | next  |
+-------+-------+-------+
```

Python 可以呈现这两种视角：list 以动态数组为后端，而对象链沿已存储的引用前进。后文分析 dictionary 代价时，还需要额外明确写出散列假设。

#### 同一目标，两种模型

取同一个目标："读取第 `k` 个后继"。在 RAM 视角下，目标是按下标寻址的数组元素：

| 模型 | 允许的原语 | 读取第 k 个后继的代价 |
|---|---:|---:|
| RAM | 地址算术＋一次 machine-word load | `Theta(1)` |
| Pointer machine | 沿一次已存储引用前进 `Theta(1)`；任意地址运算不是原语 | `Theta(k)` |

同一个任务在同一种语言里仍可能对应两种表示：list 的下标访问走 RAM 报价，对象链的逐跳前进走 pointer-machine 报价。模型先于代码，代码选择表示。

### 补充：Python 成本不能靠语感

令 `n = len(L)`、`m = len(R)`，并令参与比较的字符串长度为 `s`。

| 操作 | 经模型限定的代价 | 原因 |
|---|---:|---|
| `L[i]` | `Theta(1)` | 计算地址，再访问一次数组 |
| `len(L)` | `Theta(1)` | 长度作为元数据存储 |
| `L.append(x)` | amortized `Theta(1)` | 偶发扩容的代价分摊到多次 append 上 |
| `L + R` | `Theta(n+m)` | 分配新 list，并复制两个操作数 |
| `L.extend(R)` | amortized `Theta(m)` | append `R` 的每个元素；一次扩容也可能复制旧前缀 |
| `L[i:j]` | `Theta(j-i)` | 新 slice 会复制选中的引用 |
| `x in L` | `O(n)` 次比较 | 可能扫描整个 list |
| 字符串的 `a == b` | `O(min(len(a),len(b)))` | 必须检查相等的前缀 |
| `key in D` | expected `Theta(1)` | 需要有限定条件的散列／负载因子假设 |
| heap push/pop | `Theta(log n)` | 修复过程沿一条根到叶路径前进 |

`L.append(x)` 的摊还价需要单独记账。设动态数组每次装不下时把容量翻倍。从容量 1 开始连续 append `n` 个元素，扩容发生在长度 1、2、4、…、`2^m`（`2^m < n <= 2^(m+1)`）处，每次扩容把旧数组的全部元素复制到新数组：

```text
复制总量 = 1 + 2 + 4 + ... + 2^m < 2^(m+1) <= 2n
```

加上这 `n` 次 append 本身各写入一个元素，总代价为 `Theta(n)`，摊到每次 append 上就是 amortized `Theta(1)`。这个账目同时保留两个事实：某一次扩容最坏仍要花 `Theta(当前长度)`，而整段序列的平均代价是常数——摊还界描述序列，不描述单次调用。

表格里另有三行可以从表示直接推出来：

- `L[i:j]` 返回新 list 并复制选中的 `j-i` 个引用，代价是 `Theta(j-i)`，而不是"保存一个视图"的 `Theta(1)`；
- 字符串的 `a == b` 必须找到第一条不相等的前缀为止，代价 `O(min(len(a), len(b)))`；
- `key in D` 的 `Theta(1)` 只在明确的散列与负载因子假设下成立，写代价时不能丢掉 expected 限定。

### 四、校准：重复复制与 amortized extension

假设一份文档分 `r` 行到达，每行贡献 `k` 个 token references。下面的 program 每一轮都会分配新 list，并重新复制旧前缀：

```python-fragment
words = []
for line_words in tokenized_lines:
    words = words + line_words
```

在第 `1,2,...,r` 轮之前，旧前缀长度依次为 `0,k,2k,...,(r-1)k`。各轮新 list 的长度为 `k,2k,...,rk`，因此复制总量为：

```text
k + 2k + 3k + ... + rk
= k * r(r+1)/2
= Theta(k r²)
```

把赋值改为 `words.extend(line_words)` 会保留 token 顺序，同时不再重建每一个旧前缀。在 dynamic-array amortized analysis 下，append 这 `kr` 个新引用的总代价为 `Theta(kr)`。某一次扩容仍可能花费 `Theta(current_length)`；线性论断属于整段 append 序列，而不是说每次调用在最坏情况下都为线性总界中的常数一步。

用 `r=4`、`k=2` 的最小例子并排观察两种写法。`+` 每轮重建旧前缀，`extend` 只写入新引用：

| 轮 | `words = words + line_words` 本轮复制 | `words.extend(line_words)` 本轮写入 |
|---:|---:|---:|
| 1 | 0 + 2 = 2 | 2 |
| 2 | 2 + 2 = 4 | 2 |
| 3 | 4 + 2 = 6 | 2 |
| 4 | 6 + 2 = 8 | 2 |
| 合计 | 20 | 8 |

`extend` 的 8 次写入只是新增引用；动态数组内部扩容导致的旧元素复制另计（即上一段的摊还账）。"不重建旧前缀"是 20 与 8 之间差距的全部来源。

### Generator 与 materialized list

Generator 可以逐个生成值，从而避免保存整个序列。这可以降低内存峰值，但也会改变合同：一个已经消费过的 generator 并不会自动支持重复遍历或随机下标访问。“使用更少内存”不能替代对后续所需操作的检查。

三组小动作把合同写清楚：

```python
def stream(n):
    for i in range(n):
        yield i

g = stream(3)
first = list(g)   # 第一次遍历：[0, 1, 2]
second = list(g)  # 同一个 generator 已消费：[]
```

`list(g)` 会实体化剩余序列：它换来可重复遍历与随机下标，代价是放弃流式的低内存峰值。所以选择前要问后续操作需要什么：只消费一遍用 generator；需要下标、长度或两遍扫描就用 list。两者不是同一份内存的免费切换。

### 五、校准：频率向量与 angular document distance

把 token 定义为经过小写规范化的最长连续字母数字串。逐字符切分可以写成三步：先对整串做 casefold，再按字符是否 alphanumeric 划分连续串，遇到分隔符时把当前连续串收口。两张切分表：

| 输入 | casefold 后 | 切分结果 |
|---|---|---|
| `"Red fox-red."` | `"red fox-red."` | `["red", "fox", "red"]` |
| `"Café 42."` | `"café 42."` | `["café", "42"]` |

连字符、空格与句点都是分隔符，不并入 token，也不产生空 token。这里采用 Unicode 字母数字判定，而不是"替换 ASCII 标点"的旧式 tokenizer；两者在非 ASCII 词（如 `café`）上会给出不同结果，token 策略必须在实现里显式声明。

对于：

```text
D1 = "red fox red"
D2 = "red owl"
```

采用共享坐标顺序 `[fox, owl, red]`，可得：

```text
D1 = [1, 0, 2]
D2 = [0, 1, 1]
D1 · D2 = 1*0 + 0*1 + 2*1 = 2
```

同一个方向的两次测量暴露了问题：`[1,1] · [1,1] = 2`，而 `[2,2] · [2,2] = 8`。两个向量方向相同，dot product 却随尺度成倍放大，所以原始 dot product 不能直接当作距离。应使用 Euclidean norm 与 angular document distance：

```text
||D|| = sqrt(D · D)
cos(theta) = (D1 · D2) / (||D1|| * ||D2||)
theta = acos(cos(theta))
```

在这个例子中，`||D1|| = sqrt(5)`、`||D2|| = sqrt(2)`，且 `theta = acos(2/sqrt(10))`。

解释这一结果时，需要同时说明两个边界：

- 如果两个向量都非零，且 positive-count supports 互不相交，则它们的 dot product 为零，`theta = pi/2`；
- 如果任一向量是零向量，则至少一个 norm 为零，规范化表达式在数学上没有定义。

产品可以拒绝零向量输入、返回 sentinel value，或声明其他约定。产品策略与数学事实彼此独立；不能把这种策略说成公式本身返回了某个角度。

实现层还有一个浮点边界：余弦值的数学范围是 `[-1,1]`，但 `numerator / denominator` 的浮点舍入可能产生 `1.0000000000000002` 这类越界值。此时在调用 `acos` 之前先做一次 clamp 到 `[-1,1]` 是实现的防御，不是对数学值的修正——数学值从未越界，越界的是表示误差。

### 六、校准：三条完整的表示流水线

令：

- `C1`、`C2` 为输入字符数；
- `W1`、`W2` 为 token 总数；
- `U1`、`U2` 为不同 token 的数量。

每条路径都从读取全部输入字符并进行 tokenization 开始，因此首先支付 `Theta(C1+C2)`。只用 `W` 与 `U` 写出的界采用本课的 unit-cost word-key abstraction。面对真实字符串时，构造、比较或首次散列一个 key，还要计入所检查字符的代价。

#### 路径 A：无序词频 list

对每个 token 扫描当前 `(key,count)` list。在 unit-cost key comparison 下：

```text
构造两张词频表：O(W1*U1 + W2*U2)
用嵌套扫描计算 dot product：O(U1*U2)
计算两个 norm square：Theta(U1+U2)
计算 cosine 与 acos：Theta(1)，前提是两个 norm 都非零
```

最终代价包含构造词频表；快速的标量角度计算不会抹掉此前的扫描。

逐行推一遍：`W1` 个 token 各自都要扫描当前 distinct-key list，第 `t` 个 token 最多扫到当时已有的 `U` 项，所以构造两张词频表合计 `O(W1*U1 + W2*U2)`。两张表无序，dot product 只能嵌套扫描每对 distinct key，`O(U1*U2)`。最后的 `acos` 是常数步，但常数步不抹掉前面的扫描。

#### 路径 B：排序词频 list

只有在词频记录已经存在之后，排序才能发挥作用。一种完整实现可以先构造无序记录，再对含有 `U1` 与 `U2` 个不同 key 的表进行排序：

```text
生成词频表：取决于表示方式，例如 O(W1*U1 + W2*U2)
排序 distinct-key table：O(U1 log U1 + U2 log U2)
用 merge scan 计算 dot product：Theta(U1+U2)
计算两个 norm square：Theta(U1+U2)
计算 cosine 与 acos：Theta(1)，前提是两个 norm 都非零
```

Merge scan 维持如下 invariant：

> 每次迭代之前，左侧下标 `i` 之前与右侧下标 `j` 之前的每个 key 都已经完整计入。

每次比较至少推进一个下标。在变长字符串比较模型下，还要计入排序与 merge 时所检查字符的代价。

为什么 merge scan 一定正确？完整论证包含四部分：

1. 定义尚未处理的 suffix：`left[i:]` 与 `right[j:]`，下标 `i`、`j` 之前的所有 key 都已经完整计入累计 dot product；
2. 维护这一步：若两个头部 key 相等，把 `count(left[i]) * count(right[j])` 计入并同时推进；若不相等，key 较小的一侧不可能再与另一侧的任何 key 相遇，只推进这一侧；
3. 每个比较分支要么计入一个相等的 key 对，要么永久排除一个不相等的 key；
4. 每次比较至少推进一个下标，而两个下标最多各前进 `U1` 与 `U2` 次，所以循环在 `Theta(U1+U2)` 步内结束。

不变量（第 1、2 部分）解释正确性，推进次数（第 4 部分）解释运行时间；两者是同一张表的两种读数。

#### 路径 C：dictionary

直接在 dictionary 中计数，再扫描较小的表来计算 cross product：

```python-fragment
for word, count in smaller.items():
    total += count * larger.get(word, 0)
```

在 expected constant-time table operation 与 unit-cost key abstraction 假设下：

```text
读取并执行 Tokenization：Theta(C1+C2)
dictionary update：expected Theta(W1+W2)
dot product：expected Theta(min(U1,U2))
计算两个 norm square：Theta(U1+U2)
计算 cosine 与 acos：Theta(1)，前提是两个 norm 都非零
```

对于非空字母数字 token，有 `Ui <= Wi <= Ci`。因此，当 token 构造与首次散列按所读字符计价时，完整的 character-aware pipeline 为 expected `Theta(C1+C2)`。这是 expected hashing 论断，不是无条件的 worst-case 承诺。若 norm 为零，在执行除法或 `acos` 之前仍须调用独立的产品边界策略。

把这段压缩的结论拆成三步：

1. 每个非空 token 都来自输入里的一段字符，不同 token 的字符不重叠，所以 `Wi <= Ci`；不同 token 数不可能超过 token 总数，所以 `Ui <= Wi`。合起来 `Ui <= Wi <= Ci`。
2. token 构造（复制字符）与首次散列（读遍 key 的字符）都按所读字符计价，两份文档合计检查 `Theta(C1+C2)` 个字符。
3. dictionary update 与 cross product 在 expected hashing 下各贡献 expected `Theta(W1+W2)` 与 expected `Theta(min(U1,U2))`，两者都被 `Theta(C1+C2)` 吸收。

于是 character-aware 总界为 expected `Theta(C1+C2)`；把 expected 写成 worst-case、或把 C 与 U/W 混写，都会丢掉这条链的限定条件。
## 完整因果链

一项包含八个版本的实现研究，逐步改进同一个 document-distance program：

1. 重复拼接 list、基于 list 计数，并用嵌套扫描计算 dot product；
2. 用 `extend` 取代重复拼接；
3. 保留排序词频 list，但用 merge scan 取代嵌套 dot-product scan；
4. 用 dictionary 计数，再转换回 items，并继续为 merge scan 排序；
5. 使用更简单的 tokenizer 与高效库操作；
6. 用 merge sort 取代 insertion sort；
7. 全程保留 dictionary，移除排序；
8. 读取完整文本并执行 Tokenization，不再跨行反复重建。

关键不在历史计时数字，而在这条因果链：

```text
profile 一个具体实现
        |
        v
找出主导操作
        |
        v
改变表示方式或 algorithm
        |
        v
重新推导完整代价
        |
        v
在已声明的输入上重新测量
```

Profiling 会定位某一 workload 上的昂贵代码。Asymptotic analysis 说明代价如何增长，以及一项改进为何应当持续有效。可靠的工程论证会同时使用两者，却不混淆它们。

历史代码面向较旧的 Python 环境编写。它的 algorithmic sequence 仍有价值，但现代实现应使用当前的 string translation、Unicode-aware token policy、type hint，以及明确的空输入处理。

每个版本都解决上一版的一个主导瓶颈。只写算法层代价、不恢复历史计时数字：

| 版本 | 变更 | 解决的瓶颈 | 点积路径的新代价 |
|---|---|---|---|
| 1 | 重复拼接 list＋嵌套扫描 | —（基线） | 构造 `O(W*U)`，点积 `O(U1*U2)` |
| 2 | `extend` 取代重复拼接 | 构造阶段的重建旧前缀 | 构造降至 amortized `Theta(W)` |
| 3 | 保留排序表，merge scan 取代嵌套扫描 | 点积的嵌套扫描 | 点积 `Theta(U1+U2)`（前提：两表同序） |
| 4 | dictionary 计数后转回 items 再排序 | 计数阶段的 list 扫描 | 计数 expected `Theta(W)` |
| 5–6 | 更简单的 tokenizer、merge sort 取代 insertion sort | 常数因子与排序阶 | 排序 `Theta(U log U)` |
| 7 | 全程保留 dictionary，移除排序 | 为点积而支付的排序 | 点积 expected `Theta(min(U1,U2))` |
| 8 | 整文读取＋一次 Tokenization | 跨行反复重建 | character-aware expected `Theta(C1+C2)` |

链条的方向始终是：profile 找瓶颈 → 换表示或算法 → 重新推导代价 → 在声明的输入上重新测量。

一次闭环走查把这些环节串起来。假设 profile 显示两份大文件的运行时间约 90% 花在 list 拼接上：先把它定位为构造阶段的主导操作；把 `+` 换成 `extend`（表示层变更）；重新推导：构造从 `Theta(k r²)` 降到 amortized `Theta(kr)`；再在同一对输入上重新测量，确认瓶颈迁移到下一个主导操作（例如排序或点积）。测量确认瓶颈迁移，推导确认改进不会随输入规模退化——两步缺一不可。

## 图示与状态追踪

追踪 two-pointer cross product：

```text
left  = [(ant,2), (fox,1), (red,3)]
right = [(bee,4), (fox,2), (red,1)]
```

| `i` 的 key | `j` 的 key | 动作 | 累计 dot product |
|---|---|---|---:|
| ant | bee | `ant < bee`，推进 `i` | 0 |
| fox | bee | `bee < fox`，推进 `j` | 0 |
| fox | fox | 加上 `1*2`，同时推进两者 | 2 |
| red | red | 加上 `3*1`，同时推进两者 | 5 |

这条 trace 最多推进 `U1+U2` 次便会结束。Invariant 解释正确性；推进次数解释运行时间。

## 可执行代码

环境：Python 3.11+；只使用标准库。

输入：两个字符串。Word 是经 `casefold` 转换的 Unicode 字母数字连续串。
输出：以弧度表示的 angular document distance。
边界：如果任一文档不含 word，则抛出 `ValueError`。

```python
from collections import Counter
from math import acos, sqrt


def tokens(text: str) -> list[str]:
    out: list[str] = []
    current: list[str] = []
    for character in text.casefold():
        if character.isalnum():
            current.append(character)
        elif current:
            out.append("".join(current))
            current.clear()
    if current:
        out.append("".join(current))
    return out


def inner_product(left: Counter[str], right: Counter[str]) -> int:
    if len(left) > len(right):
        left, right = right, left
    return sum(count * right.get(word, 0) for word, count in left.items())


def document_angle(first: str, second: str) -> float:
    left = Counter(tokens(first))
    right = Counter(tokens(second))
    if not left or not right:
        raise ValueError("document angle is undefined for an empty word vector")

    numerator = inner_product(left, right)
    denominator = sqrt(inner_product(left, left) * inner_product(right, right))
    cosine = numerator / denominator

    # Floating-point roundoff can produce 1.0000000000000002.
    cosine = max(-1.0, min(1.0, cosine))
    return acos(cosine)


assert document_angle("Red fox red.", "red owl") > 0
assert document_angle("one two", "ONE TWO") == 0

try:
    document_angle("", "nonempty")
except ValueError:
    pass
else:
    raise AssertionError("zero-vector policy was not enforced")
```

### 为什么该实现为 expected linear

1. Tokenization 对每个输入字符检查一次。
2. 在计入构造 key 与首次散列所需字符后，`Counter` 对每个 token 执行一次 expected constant-time table operation。
3. 每个 self dot product 都会访问每个不同 key 一次。
4. Cross dot product 访问较小的 distinct-key set。
5. 最后的算术只使用常数次标量操作。

这个结论受散列模型与 word-processing cost 的限定。它并不是由源码“只有几个循环”推出来的。

## 阶段检查

1. 一个循环执行 `n` 轮，每轮都通过 `result = result + block` 加入长度为 4 的 list。推导复制引用的总数。
2. 举出一种操作：它在 RAM 视角下是常数时间，但在 pointer-machine 表示中需要沿链行走。
3. 对向量 `[2,1,0]` 与 `[1,0,2]`，计算 dot product、两个 norm、cosine 与角度表达式。

## 综合练习

1. 当最终输出还必须按字母顺序排列时，比较 sorted-list document pipeline 与 dictionary pipeline 的完整代价。
2. 解释为什么“dictionary lookup 是 `O(1)`”这句话并不完整。
3. 设计一项测试，用来区分“替换 ASCII 标点”的 tokenization 与“识别 Unicode 字母数字连续串”的 tokenization。

## 完整答案与评分点

对于已经演示的 sorted-list trace，完整解释必须包含四部分：

1. 定义尚未处理的 suffix `left[i:]` 与 `right[j:]`；
2. 说明此前所有 key 都已经计入；
3. 论证每个比较分支；
4. 说明每次至少推进一个下标，因此最多推进 `U1+U2` 次。

对于 dictionary 实现，答案必须写出 **expected**，或给出等价的明确散列假设。只写 `O(W)` 会丢失对保证条件的限定。

## 常见错误与修复路径

- **“一个循环就是线性时间。”** 修复：用迭代次数乘以循环体的代价。
- **“Append 永远是常数时间。”** 修复：区分一次 worst-case 扩容与整段序列的 amortized cost。
- **“基准测试证明了 Big-O。”** 修复：从操作推导增长率；用测量检查常数与瓶颈。
- **“Dot product 本身就是距离。”** 修复：原始 dot product 会随尺度增长；先规范化，再求角度。
- **“模长就是 word 数量。”** 修复：使用频率向量的 Euclidean norm `sqrt(D·D)`。
- **“空文档与所有对象都相差 90 度。”** 修复：零向量没有方向；必须声明边界策略。
- **“Hash table 在最坏情况下也是常数时间。”** 修复：写明 expected cost、load factor 与 collision boundary。
- **“更快的库代码会改变渐近复杂度。”** 修复：区分更小的常数因子与不同的增长阶。
