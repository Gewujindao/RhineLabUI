# 信息的重量：不确定性、编码与分布之距

> 信息（Information）不是一页纸上符号的数量，而是一次观测在已声明的概率模型（probability model）与对数底（logarithm base）下带来的不确定性减少量。

## 前置诊断

本课使用以下前置知识：

- 验证有限 probability vector；
- 读取 joint probability table 并计算 marginals；
- 仅在条件边缘概率为正时构造 conditional probability；
- 计算 logarithm 并换底；
- 区分 `p` 下的 expectation 与含有 `q` 的函数求值；
- 把有限矩阵读作各项均为非负质量的 transport plan。

继续之前，先回答下列问题。

1. 若 `p=(0.5,0.5)`，它是否已归一化？
2. 若某事件的概率为 `1/8`，`-log_2(1/8)` 的单位是 bits 还是 nats？
3. 若 `P(Y=y)=0`，能否把基本比值 `P(X=x,Y=y)/P(Y=y)` 指定为零？
4. 一个对称的非负函数是否自动满足三角不等式？
5. 若质量从坐标 `0` 移到坐标 `3`，能否在声明 ground distance 之前计算 transport cost？

诊断答案：

- 该向量已归一化，因为各项非负且总和为一。
- 以二为底得到 bits。
- 不能。该比值的分母为零，在基本条件公式下没有定义。
- 不能。对称性只是度量公理之一。
- 不能。transport 需要 ground cost，例如绝对距离、平方 Euclidean distance，或另一种已声明的度量诱导代价。

若第三题仍不清楚，请先复习 conditional probability，再使用 conditional entropy。若第四或第五题仍不清楚，请在整课中始终保留“对称 divergence”与“感知度量的 transport distance”之间的区别。

## 首次术语

| 术语 | 本课含义 |
|---|---|
| `信息论（information theory）` | 研究如何在不确定性下量化、表示、存储与传递信息的数学领域。 |
| `自信息/惊奇量（self-information / surprisal）` | 赋予概率为 `p` 的单个事件的信息量，即 `-log p`。 |
| `对数底（logarithm base）` | 决定信息量数值尺度与单位的底数。 |
| `比特（bit）` | 以二为底的 logarithm 所产生的单位。 |
| `奈特（nat）` | 自然 logarithm 所产生的单位。 |
| `熵（entropy）` | 某分布下 self-information 的期望。 |
| `支撑集（support）` | 在离散情形中，分布赋予正概率的结果集合。 |
| `熵编码（entropy coding）` | 让概率更高的符号平均获得更短描述的编码。 |
| `前缀码（prefix code）` | 任何完整码字都不是另一完整码字前缀的编码，因此可以即时解码。 |
| `霍夫曼编码（Huffman coding）` | 针对已声明符号概率，给出最优逐符号 prefix code 的构造。 |
| `算术编码（arithmetic coding）` | 通过嵌套概率区间表示一个序列块，使平均代价能够逼近分数形式的信息预算。 |
| `联合熵（joint entropy）` | 把一对或一组变量整体考虑时的不确定性。 |
| `条件熵（conditional entropy）` | 观测另一个变量后，某变量剩余不确定性的期望。 |
| `互信息（mutual information, MI）` | 观测另一个变量后，某变量不确定性的期望减少量。 |
| `交叉熵（cross-entropy）` | 数据服从 `p`、但由模型 `q` 评分时的期望码长或 log loss。 |
| `KL 散度（KL divergence）` | cross-entropy 超出 `p` 的 entropy 的部分，记作 `KL(p||q)`。 |
| `参考/数据分布（reference / data distribution）` | 在 `H(p,q)` 与 `KL(p||q)` 中提供期望权重的分布 `p`。 |
| `模型/编码分布（model / coding distribution）` | 概率出现在 logarithm 内部的分布 `q`。 |
| `JS 散度（Jensen–Shannon divergence, JS）` | 到混合分布 `m=(p+q)/2` 的两个 KL divergence 的对称平均。 |
| `耦合（coupling）` | 两个边缘分布分别等于待比较两分布的 joint distribution。 |
| `底层度量/底层代价（ground metric / ground cost）` | 在两个 support 位置之间搬运一单位质量所赋予的代价。 |
| `Wasserstein 距离（Wasserstein distance）` | 在所有有效 coupling 上求最小期望幂次 ground cost，再取相应次方根。 |
| `有限矩（finite moment）` | 例如距离 `r` 次幂的期望有限；有限 `W_r` 需要这类有限性条件。 |
| `微分熵（differential entropy）` | 用于连续密度的积分对应量；它并不继承离散 entropy 的全部性质。 |

符号 `H(p,q)` 具有方向性。第一个参数提供 expectation，第二个参数提供被评分的概率。同样，记号 `KL(p||q)` 必须按公式读取，而不能依赖“从一个分布到另一个分布的 divergence”这类含混说法。

## 核心讲解

<!-- wanxiang:block foundations-e01-information-entropy-coding:start -->
### 1. 为什么 information 采用 logarithm

Claude Shannon 的关键一步，是把定性的不确定性转化为数值演算，从而支持编码、存储、通信与统计推理。假设结果 `x` 的概率为 `p(x)>0`，则其在 logarithm base `b>1` 下的 self-information 为

`I_b(x)=-log_b p(x)`.

可以立刻得到三个性质。

第一，必然事件没有惊奇量：

`p(x)=1` implies `I_b(x)=0`.

第二，概率越低的事件具有越多 self-information，因为 `-log_b p` 随 `p` 增大而减小。

第三，独立证据可以相加。若两个独立事件的联合概率为 `p(x)p(y)`，则

`-log_b[p(x)p(y)] = -log_b p(x) - log_b p(y)`.

这种可加性使 logarithm 自然适用于连续消息：相乘的概率会变成相加的信息预算。

底数是答案的一部分：

- `I_2(x)=-log_2 p(x)` 以 bits 为单位；
- `I_e(x)=-ln p(x)` 以 nats 为单位。

同一事件在这两种单位下的数值不同。换算关系固定为：

`I_e(x)=I_2(x) ln 2`.

只报告“3.0 information”的结果并不完整，必须同时说明底数或单位。

### 2. Entropy 是 self-information 的期望

对于 probability mass function 为 `p` 的离散变量 `X`，entropy 为

`H_b(X)=E_p[I_b(X)]`

`=-sum_x p(x) log_b p(x)`.

下标经常省略，但底数仍必须明确。求和式按照每个可能事件的出现频率，对其惊奇量加权。这说明 entropy 并非某次具体观测的惊奇量，而是在下一次观测出现前，分布层面的平均值。

在含 `K` 个可能标签的固定有限字母表或结果空间上，entropy 通过两项极值检查：

- 若某个标签的概率为一，entropy 为零；
- 若全部 `K` 个标签的概率均为 `1/K`，entropy 取最大值 `log_b K`。

确定分布对将出现哪个标签没有不确定性；均匀分布则把不确定性平均分配到每个可用标签。在这两个极端之间，概率越不均衡，entropy 越低。

### 3. `0 log 0=0` 是 expectation 约定，不是事件信息值

不能混淆下面两个极限。

对于概率趋近于零的事件，

`-log_b p -> +infinity`.

因此，在扩展值意义下，不可能事件具有无穷 self-information。当 `p(x)=0` 时，不能写成 `I(x)=0`。

但在 entropy 内部，事件由自身概率加权：

`-p log_b p`.

当 `p` 从正侧趋近于零时，这个乘积的极限为零。因此 entropy 求和采用约定

`0 log 0 = 0`.

这表示零概率项对*期望*信息的贡献为零，并不表示观测到模型判为不可能的事件时毫不意外。若数据中出现这种观测，则模型的 support 有误，或数据管线需要检查。

后续 cross-entropy 与 KL divergence 也受同一 support 逻辑约束。当 `p(x)>0` 而 `q(x)=0` 时，模型把参考分布可能产生的事件赋为零概率，由此得到无穷 log loss。

### 4. Entropy 与实际码长有关，但并不相同

以二为底时，`-log_2 p(x)` 是符号 `x` 的理想实数码长预算。Entropy 是相应的理想平均值：

`H_2(p)=-sum_x p(x)log_2 p(x)`.

实际的二进制逐符号码字包含整数个 bits。若 `p(x)=0.3`，理想预算 `-log_2 0.3` 约为 `1.737` bits，但一个孤立符号不可能实际获得长度为 `1.737` bits 的二进制串。这就在信息论理想与有限实际编码之间形成了差距。

Huffman coding 在给定符号概率的二进制 prefix code 中，以整数码字长度最小化期望长度；它并不保证每个码长都等于 self-information。Arithmetic coding 跨序列或块工作，把分数预算分摊到多个符号上，因此平均码率可以更接近 entropy。

正确说法是：

> 在已声明的概率编码模型下，entropy 是理想平均编码基准；实际有限编码受到结构与有限块约束。

错误说法是：

> 每个符号都会实际获得恰好 `-log_2 p(x)` 个 bits。

<!-- wanxiang:block foundations-e01-information-entropy-coding:end -->
<!-- wanxiang:block foundations-e01-joint-conditional-mi:start -->
### 5. Joint entropy 计算组合中的不确定性

对于 joint mass 为 `p(x,y)` 的离散变量 `X` 与 `Y`，

`H(X,Y)=-sum_x sum_y p(x,y) log p(x,y)`.

这里沿用相同底数与 `0 log 0` 约定。Joint entropy 把 `(X,Y)` 视为一个复合结果；除非依赖结构支持相应恒等式，否则不能直接把 `H(X)` 与 `H(Y)` 相加。

若 `X` 与 `Y` 独立，则 `p(x,y)=p(x)p(y)`，logarithm 可以拆开，因此

`H(X,Y)=H(X)+H(Y)`.

当变量共享信息时，联合不确定性小于独立情形的和，因为一个变量所提供的部分信息会与另一个变量重叠。

### 6. Conditional entropy 要求有效的条件 support

Conditional entropy 可以写成有效条件 entropy 的加权平均：

`H(X|Y)=sum_{y:p_Y(y)>0} p_Y(y) H(X|Y=y)`,

其中

`H(X|Y=y)=-sum_x p(x|y) log p(x|y)`.

等价地，

`H(X|Y)=-sum_{y:p_Y(y)>0} sum_x p(x,y) log p(x|y)`.

限制 `p_Y(y)>0` 并非形式要求。基本比值

`p(x|y)=p(x,y)/p_Y(y)`

在分母为零时没有定义。零边缘列不含任何参考分布质量，不能把它改写为均匀 conditional distribution，也不能任意填成一行零。

Entropy chain rule 为

`H(X|Y)=H(X,Y)-H(Y)`.

同理，

`H(Y|X)=H(X,Y)-H(X)`.

这些恒等式提供数值审计：直接条件计算应当与对应的“联合减边缘”计算一致。

### 7. Mutual information 衡量不确定性的减少量

Mutual information 为

`I(X;Y)=sum_x sum_y p(x,y) log [p(x,y)/(p_X(x)p_Y(y))]`.

它有若干等价的 entropy 形式：

`I(X;Y)=H(X)-H(X|Y)`,

`=H(Y)-H(Y|X)`,

`=H(X)+H(Y)-H(X,Y)`.

第一种形式可以读作“观测 `Y` 前对 `X` 的不确定性，减去观测后剩余的不确定性”。比值形式则比较实际 joint mass 与独立假设预测的质量。

若 `X` 与 `Y` 独立，则每个正 support 比值都为一，每个 logarithm 都为零，mutual information 也为零。依赖会使 `p(x,y)` 与 `p_X(x)p_Y(y)` 产生系统性差异，从而得到正的信息量。

尽管 conditional entropy 具有方向性，mutual information 仍然对称：

`I(X;Y)=I(Y;X)`,

但一般而言

`H(X|Y) != H(Y|X)`.

这些恒等式说明了为何两种陈述可以同时成立。

<!-- wanxiang:block foundations-e01-joint-conditional-mi:end -->
<!-- wanxiang:block foundations-e01-crossentropy-kl-js:start -->
### 8. Cross-entropy 固定 expectation 方向

设 `p` 为 reference distribution，`q` 为同一组离散结果标签上的 model 或 coding distribution。Cross-entropy 为

`H(p,q)=E_{x~p}[-log q(x)]`

`=-sum_x p(x) log q(x)`.

各角色应按公式直接读取：

- 样本与权重来自 `p`；
- log score 来自 `q`。

交换参数会同时改变两种角色：

`H(q,p)=-sum_x q(x)log p(x)`.

一般没有理由认为这两个数相等。

若 `p(x)>0` 且 `q(x)=0`，则 `-log q(x)=+infinity`，所以 `H(p,q)=+infinity`。若 `p(x)=0`，无论该结果在 `q` 下取何值，它对 expectation 的贡献都为零；这里使用与 entropy 相同的极限约定。

### 9. KL divergence 是额外编码代价，不是普通距离

KL divergence 为

`KL(p||q)=H(p,q)-H(p)`

`=sum_x p(x) log [p(x)/q(x)]`.

它非负，并且仅当概率空间上 `p=q`（更一般地，`p`-almost everywhere）时等于零。仅仅拥有相同 support 还不够。参数顺序至关重要，因为 expectation 仍然来自 `p`。

三种近似距离的直觉需要纠正：

1. **非对称性。** 一般有 `KL(p||q) != KL(q||p)`。
2. **Support。** 若某处 `p(x)>0` 而 `q(x)=0`，则 `KL(p||q)=+infinity`；反向结果仍可能有限。
3. **三角不等式。** KL divergence 不是普通 metric。

最稳妥的表述应以公式为先：

> `KL(p||q)` 衡量结果服从 `p`、却由 `q` 评分时，多付出的期望 log loss。

这样可以避开“从 `q` 到 `p`”这类含混说法，因为不同作者可能作出不同解释。

### 10. JS divergence 修复对称性，但不修复全部 metric 公理

定义 mixture

`m=(p+q)/2`.

Jensen–Shannon divergence 为

`JS(p,q)=0.5 KL(p||m)+0.5 KL(q||m)`.

它具有对称性，因为交换 `p` 与 `q` 后，mixture 与两个平均项都不变：

`JS(p,q)=JS(q,p)`.

在有限离散 support 上，只要任一输入具有正质量，`m` 就为正。因此，即使 `p` 与 `q` 的 support 不相交，标准 JS 构造仍为有限值。

当 mixture 权重相等且 logarithm base 为 `b` 时，标准构造还满足

`0 <= JS(p,q) <= log_b 2`.

当 `p=q` 时取到下界；当两者 support 不相交时取到上界。因此，以二为底时范围为 `[0,1]` bits，使用自然 logarithm 时范围为 `[0,ln 2]` nats。

对称性本身不能证明三角不等式。因此，本课把 `JS` 称为 divergence，不会静默升级为 metric。若要声称某个经过变换的 JS 量满足 metric 公理，必须另有定理支持，不属于本课范围。

<!-- wanxiang:block foundations-e01-crossentropy-kl-js:end -->
<!-- wanxiang:block foundations-e01-geometry-wasserstein:start -->
### 11. 准确性扩展——离散 entropy 不等于 differential entropy

上面的 entropy、cross-entropy、KL 与 mutual-information 求和均针对离散分布。连续密度 `f` 的 differential entropy 为

`h(X)=-integral f(x) log f(x) dx`,

前提是该积分有定义。Differential entropy 不是点事件 self-information 的概率加权平均，因为连续点事件的概率为零。它可以为负，也会随坐标缩放或重新参数化而改变。

因此：

- 有限 support 上的离散 entropy 非负；
- differential entropy 不一定非负；
- 改变物理单位可能改变 differential entropy；
- 不能把离散编码结论逐字套用到连续密度上。

适当连续密度之间的 KL divergence 仍使用密度比积分，但其 support 与 absolute-continuity 条件需要另行处理。除非某节明确说明，否则本课的计算均保持离散。

### 12. Wasserstein distance 通过几何比较分布

KL 与 JS 比较共同标签上的概率赋值；Wasserstein distance 还知道这些标签位于何处。

设 `P` 与 `Q` 是 ground metric 为 `d` 的空间上的 probability distributions。对阶数 `r>=1`，

`W_r(P,Q) = [ inf_{gamma in Pi(P,Q)} E_{(X,Y)~gamma}[d(X,Y)^r] ]^(1/r)`.

这里 `Pi(P,Q)` 是所有有效 couplings 的集合。Coupling `gamma(x,y)` 非负，并满足 marginal constraints

`sum_x gamma(x,y)=Q(y)`

and

`sum_y gamma(x,y)=P(x)`.

对离散 coupling，幂次 transport work 为

`sum_x sum_y gamma(x,y) d(x,y)^r`.

优化会选择代价最低的有效方案。外层的 `r` 次方根把单位恢复为 ground distance 的单位。

必须满足三项假设：

1. 必须声明 ground metric 或 cost；
2. 必须至少存在一个有效 coupling；
3. 若要得到有限 `W_r`，相关的 `r` 阶矩必须有限。

当两个分布的 support 不相交时，Wasserstein distance 仍可能提供信息，因为它衡量质量需要搬运多远，而不是逐点相除概率。这一解释仅在已声明的几何与矩条件下成立，并不允许省略这些条件。

### 13. 准确性扩展——Gaussian `W_2^2` 不等于 `W_2`

对于 Gaussian distributions

`P=Normal(mu_1,Sigma_1)` and `Q=Normal(mu_2,Sigma_2)`,

标准闭式表达对应的是二阶 Wasserstein distance 的*平方*：

`W_2^2(P,Q)`

`= ||mu_1-mu_2||_2^2`

`+ tr[Sigma_1+Sigma_2-2(Sigma_2^(1/2) Sigma_1 Sigma_2^(1/2))^(1/2)]`.

距离本身为

`W_2(P,Q)=sqrt(the entire right-hand side)`.

若省略外层 square root、直接把右侧写成 `W_2`，就混淆了 squared distance 与 distance。

在零 covariance 边界上，covariance trace 项消失：

`W_2^2(P,Q)=||mu_1-mu_2||_2^2`,

而

`W_2(P,Q)=||mu_1-mu_2||_2`.

这项纠正明确属于准确性扩展：它只解决平方与 square root 的错配，并不把本课扩展为一般 optimal-transport 证明。

<!-- wanxiang:block foundations-e01-geometry-wasserstein:end -->

## 完整因果链

完整的 information-measure 因果链为：

`probability model -> support audit -> log base -> event surprise -> expected surprise -> coding interpretation -> joint table -> valid conditioning -> uncertainty reduction -> directional scoring -> symmetric mixture -> ground geometry -> coupling -> Gaussian square audit`.

每一步转换都有理由。

1. **Probability model。** Information 值依赖概率；不存在脱离模型的 surprisal。
2. **Support audit。** 正的参考质量与零模型质量配对，会产生无穷 log loss。
3. **Log base。** 以二为底得到 bits；以 `e` 为底得到 nats。
4. **Event surprise。** `-log p(x)` 把概率乘积转化为可加证据。
5. **Expected surprise。** 用 `p(x)` 对 surprisal 加权即可得到 entropy。
6. **Coding interpretation。** 以二为底的 entropy 给出理想平均预算，实际码字结构则解释有限差距。
7. **Joint table。** Joint entropy 衡量完整变量对的不确定性，而不是分别衡量各标签。
8. **Valid conditioning。** Conditional entropy 只平均条件边缘为正的 conditional distributions。
9. **Uncertainty reduction。** 用原始不确定性减去剩余不确定性，即得 mutual information。
10. **Directional scoring。** Cross-entropy 与 KL 保持 `p` 为 expectation，把 `q` 放在 logarithm 内。
11. **Symmetric mixture。** JS 把每个输入与共同 mixture 比较，再平均两个方向。
12. **Ground geometry。** 在声明感知位置的 ground cost 前，不能计算 Wasserstein。
13. **Coupling。** 只有当 transport plan 的行和与列和复现输入分布时，该方案才有效。
14. **Optimization。** 代价最低的 coupling 决定 Wasserstein 值。
15. **Moment boundary。** 有限的幂次 transport expectation 要求相关矩有限。
16. **Gaussian square audit。** Trace 表达式是 `W_2^2`；`W_2` 是其 square root。

这条因果链可防止四种常见分类错误：

- `0 log 0=0` 不会把不可能事件的 surprisal 变为零；
- entropy 不保证每个符号都有分数长度的实际码字；
- JS 的对称性不会自动补齐所有 metric 公理；
- Gaussian squared-distance 公式不会仅因标签漏写平方就变成 distance。

## 图示与状态追踪

### Probability-to-information 曲线

横坐标为事件概率 `p`，纵坐标为两种单位下的 self-information。

| `p` | `I_2(p)=-log_2 p` | bit 轮廓 | `I_e(p)=-ln p` | nat 轮廓 |
|---:|---:|:---|---:|:---|
| `1` | `0` bits | `▁` | `0.0000` nats | `▁` |
| `1/2` | `1` bit | `▂` | `0.6931` nats | `▂` |
| `1/4` | `2` bits | `▄` | `1.3863` nats | `▄` |
| `1/8` | `3` bits | `▆` | `2.0794` nats | `▆` |
| `1/16` | `4` bits | `█` | `2.7726` nats | `█` |
| `p -> 0+` | `+infinity` | `↑` | `+infinity` | `↑` |

两条曲线都随概率下降而上升。它们的形状编码相同排序，但纵向尺度相差常数 `ln 2`。

### 原创 entropy 对比

下面的四标签分布是项目原创示例。

| 分布 | probability vector | entropy（bits） | entropy（nats） | 解释 |
|---|---|---:|---:|---|
| deterministic | `(1,0,0,0)` | `0.0000` | `0.0000` | 标签没有不确定性 |
| strongly skewed | `(0.7,0.1,0.1,0.1)` | `1.3568` | `0.9404` | 一个高概率标签、三个低概率标签 |
| graded | `(0.4,0.3,0.2,0.1)` | `1.8464` | `1.2799` | 不确定性分布不均 |
| uniform | `(0.25,0.25,0.25,0.25)` | `2.0000` | `1.3863` | 在这个固定四标签字母表上取最大值 |

只有因为每一行都定义在同一个固定四标签字母表或结果空间上，并且单位已经声明，这项比较才有效。按照“正质量”这一严格 support 含义，deterministic 行与 uniform 行并不具有相同 support。

### Joint、marginal、conditional 与 MI 面板

令 `X` 表示系统状态 `quiet` 或 `busy`，`Y` 表示请求 `short` 或 `long`。

| `X \ Y` | short | long | `p_X(x)` | `p(Y|X=x)` | `H(Y|X=x)` |
|---|---:|---:|---:|---|---:|
| quiet | `0.40` | `0.10` | `0.50` | `(0.80,0.20)` | `0.7219` bits |
| busy | `0.20` | `0.30` | `0.50` | `(0.40,0.60)` | `0.9710` bits |
| `p_Y(y)` | `0.60` | `0.40` | `1.00` | — | — |

关联的 entropy 值如下：

| 量 | 值 | 审计恒等式 |
|---|---:|---|
| `H(X)` | `1.0000` bits | 两行等概率 |
| `H(Y)` | `0.9710` bits | `(0.60,0.40)` 的 entropy |
| `H(X,Y)` | `1.8464` bits | 四个 joint cells 的 entropy |
| `H(Y|X)` | `0.8464` bits | `0.5(0.7219)+0.5(0.9710)` |
| `H(X|Y)` | `0.8755` bits | `H(X,Y)-H(Y)` |
| `I(X;Y)` | `0.1245` bits | `H(Y)-H(Y|X)` |

每个已显示的 conditional 行都除以正的行 marginal `0.50`。MI 值也等于 `H(X)+H(Y)-H(X,Y)`。

### Coding-length 示意

对于 `p=(0.4,0.3,0.2,0.1)`，理想长度是分数，而一个有效 prefix code 的长度为整数。

| 符号 | 概率 | 理想 `-log_2 p` | 示例码字 | 实际长度 |
|---|---:|---:|---|---:|
| A | `0.40` | `1.3219` | `0` | `1` |
| B | `0.30` | `1.7370` | `10` | `2` |
| C | `0.20` | `2.3219` | `110` | `3` |
| D | `0.10` | `3.3219` | `111` | `3` |

理想平均值是每个符号 `1.8464` bits 的 entropy。示例 prefix code 的平均长度为

`0.4(1)+0.3(2)+0.2(3)+0.1(3)=1.9`

bits/符号。`0.0536` bit 的差距并不矛盾；整数符号长度约束了这个有限编码。

### 非对称 KL 与对称 JS 面板

使用以二为底的 logarithm 与下列分布：

`P=(0.8,0.2)`, `Q=(0.6,0.4)`, and `R=(0.2,0.8)`.

各行是 reference distribution，各列是 model distribution：

| `KL(row || column)` in bits | P | Q | R |
|---|---:|---:|---:|
| P | `0.0000` | `0.1320` | `1.2000` |
| Q | `0.1510` | `0.0000` | `0.5510` |
| R | `1.2000` | `0.4830` | `0.0000` |

不相等的一对 `KL(P||Q)=0.1320` 与 `KL(Q||P)=0.1510` 清楚展示了方向性。

对应的对称 JS 比较为：

| `JS(row,column)` in bits | P | Q | R |
|---|---:|---:|---:|
| P | `0.0000` | `0.0349` | `0.2781` |
| Q | `0.0349` | `0.0000` | `0.1245` |
| R | `0.2781` | `0.1245` | `0.0000` |

镜像位置的条目相等。该表只展示对称性，并不是三角不等式的证明。

### 原创一维质量搬运图

取位置 `0,1,2,4,5`，ground distance 为 `d(x,y)=|x-y|`，并令

`P=(0.50,0,0,0.50,0)`,

`Q=(0,0.25,0.50,0,0.25)`.

一种单调最优方案为：

| 源端移动 | 质量 | 距离 | 对 `W_1` work 的贡献 |
|---|---:|---:|---:|
| `0 -> 1` | `0.25` | `1` | `0.25` |
| `0 -> 2` | `0.25` | `2` | `0.50` |
| `4 -> 2` | `0.25` | `2` | `0.50` |
| `4 -> 5` | `0.25` | `1` | `0.25` |
| 总计 | `1.00` | — | `1.50` |

可以从两个方向读取质量守恒：

- 位置 `0` 的流出质量为 `0.50`，位置 `4` 的流出质量为 `0.50`；
- 位置 `1,2,5` 的流入质量分别为 `0.25,0.50,0.25`。

因此，该方案的 marginals 为 `P` 与 `Q`。在绝对 ground distance 下，其总 work 为 `1.50`，所以 `W_1(P,Q)=1.50`。

## 可执行代码

这是本课唯一的独立程序。它使用标准库检查 probability normalization、entropy 与 mutual-information 恒等式、KL 方向与 support failure、JS 对称性，以及一维 Wasserstein 计算。

函数 `wasserstein_1d` 的范围有意窄于一般 transport solver。对于严格递增实数坐标上的 probability masses，在 ground metric `d(x,y)=|x-y|` 下，它实现

`W_1(P,Q)=integral |F_P(t)-F_Q(t)| dt`

具体做法是累计带符号的 CDF imbalance，再把其绝对值乘以相邻坐标宽度。已声明的分布必须具有 finite first moments；下面的有限坐标示例会自动满足这一边界。

```python
from math import inf, isclose, log2


def validate_probability(probabilities, name="distribution", tolerance=1e-12):
    if not probabilities:
        raise ValueError(f"{name} must be nonempty")
    if any(value < 0.0 for value in probabilities):
        raise ValueError(f"{name} contains negative mass")
    total = sum(probabilities)
    if not isclose(total, 1.0, abs_tol=tolerance):
        raise ValueError(f"{name} must sum to 1, got {total}")


def entropy(probabilities):
    validate_probability(probabilities)
    return -sum(value * log2(value) for value in probabilities if value > 0.0)


def joint_marginals(joint):
    if not joint or not joint[0]:
        raise ValueError("joint table must be nonempty")
    width = len(joint[0])
    if any(len(row) != width for row in joint):
        raise ValueError("joint table must be rectangular")
    validate_probability(
        [value for row in joint for value in row],
        name="joint distribution",
    )
    row_marginal = [sum(row) for row in joint]
    column_marginal = [
        sum(joint[row][column] for row in range(len(joint)))
        for column in range(width)
    ]
    return row_marginal, column_marginal


def conditional_entropy_y_given_x(joint):
    row_marginal, _ = joint_marginals(joint)
    result = 0.0
    for row_probability, row in zip(row_marginal, joint):
        if row_probability == 0.0:
            continue
        conditional = [cell / row_probability for cell in row]
        result += row_probability * entropy(conditional)
    return result


def mutual_information(joint):
    row_marginal, column_marginal = joint_marginals(joint)
    result = 0.0
    for i, row in enumerate(joint):
        for j, cell in enumerate(row):
            if cell > 0.0:
                independent_mass = row_marginal[i] * column_marginal[j]
                result += cell * log2(cell / independent_mass)
    return result


def cross_entropy(reference, model):
    validate_probability(reference, name="reference")
    validate_probability(model, name="model")
    if len(reference) != len(model):
        raise ValueError("reference and model supports must align")
    result = 0.0
    for p_value, q_value in zip(reference, model):
        if p_value == 0.0:
            continue
        if q_value == 0.0:
            return inf
        result -= p_value * log2(q_value)
    return result


def kl_divergence(reference, model):
    value = cross_entropy(reference, model)
    if value == inf:
        return inf
    return value - entropy(reference)


def js_divergence(left, right):
    validate_probability(left, name="left")
    validate_probability(right, name="right")
    if len(left) != len(right):
        raise ValueError("supports must align")
    mixture = [(a + b) / 2.0 for a, b in zip(left, right)]
    return (
        kl_divergence(left, mixture)
        + kl_divergence(right, mixture)
    ) / 2.0


def wasserstein_1d(positions, left, right):
    if positions != sorted(positions) or len(set(positions)) != len(positions):
        raise ValueError("positions must be strictly increasing")
    if len(positions) != len(left) or len(left) != len(right):
        raise ValueError("positions and distributions must align")
    validate_probability(left, name="left transport marginal")
    validate_probability(right, name="right transport marginal")
    imbalance = 0.0
    cost = 0.0
    for index in range(len(positions) - 1):
        imbalance += left[index] - right[index]
        width = positions[index + 1] - positions[index]
        cost += abs(imbalance) * width
    return cost


joint = [
    [0.40, 0.10],
    [0.20, 0.30],
]
row_marginal, column_marginal = joint_marginals(joint)
h_x = entropy(row_marginal)
h_y = entropy(column_marginal)
h_xy = entropy([cell for row in joint for cell in row])
h_y_given_x = conditional_entropy_y_given_x(joint)
mi_direct = mutual_information(joint)
mi_from_entropies = h_x + h_y - h_xy

p = [0.80, 0.20]
q = [0.60, 0.40]
kl_pq = kl_divergence(p, q)
kl_qp = kl_divergence(q, p)
support_failure = kl_divergence([0.50, 0.50], [1.00, 0.00])
js_pq = js_divergence(p, q)
js_qp = js_divergence(q, p)

positions = [0, 1, 2, 4, 5]
transport_p = [0.50, 0.00, 0.00, 0.50, 0.00]
transport_q = [0.00, 0.25, 0.50, 0.00, 0.25]
w1 = wasserstein_1d(positions, transport_p, transport_q)

assert isclose(sum(row_marginal), 1.0, abs_tol=1e-12)
assert isclose(sum(column_marginal), 1.0, abs_tol=1e-12)
assert isclose(h_xy - h_x, h_y_given_x, abs_tol=1e-12)
assert isclose(mi_direct, mi_from_entropies, abs_tol=1e-12)
assert isclose(mi_direct, h_y - h_y_given_x, abs_tol=1e-12)
assert not isclose(kl_pq, kl_qp, abs_tol=1e-12)
assert support_failure == inf
assert isclose(js_pq, js_qp, abs_tol=1e-12)
assert isclose(w1, 1.50, abs_tol=1e-12)

print("normalization:", row_marginal, column_marginal)
print(
    "entropy identities:",
    f"HX={h_x:.6f}",
    f"HY={h_y:.6f}",
    f"HXY={h_xy:.6f}",
    f"HY|X={h_y_given_x:.6f}",
    f"MI={mi_direct:.6f}",
)
print("KL direction:", f"KL(p||q)={kl_pq:.6f}", f"KL(q||p)={kl_qp:.6f}")
print("KL support failure:", support_failure)
print("JS symmetry:", f"JS(p,q)={js_pq:.6f}", f"JS(q,p)={js_qp:.6f}")
print("1D Wasserstein:", f"W1={w1:.6f}")
```

该程序不证明一般定理，只提供一项可复现的有限审计：

- 行与列 marginals 均已归一化；
- 直接计算的 MI 与两个 entropy 恒等式一致；
- 反转 KL 会改变数值；
- model support 缺失会产生 infinity；
- JS 在反转参数后保持一致；
- 在已声明的 finite-first-moment 边界下，一维 `|x-y|` CDF-imbalance 公式与 transport 图都得到 `W_1=1.5`。

## 阶段检查

### 检查 A——声明单位

某事件的概率为 `1/32`。

1. 计算以 bits 表示的 self-information。
2. 计算以 nats 表示的 self-information。
3. 解释为何数值答案不同，而事件排序不变。

### 检查 B——区分两种零值约定

对于 deterministic distribution `(1,0)`：

1. 计算 entropy；
2. 说明零概率项对 entropy 的贡献；
3. 说明扩展值意义下，该不可能项的 self-information。

### 检查 C——审计 conditional-support failure

给定 joint table

| `X \ Y` | `Y=0` | `Y=1` |
|---|---:|---:|
| `X=0` | `0.40` | `0.00` |
| `X=1` | `0.60` | `0.00` |

能否把 `p(X|Y=1)` 填成 `(0.5,0.5)`？请解释计算 `H(X|Y)` 时如何处理 zero-marginal 条件。

### 检查 D——保留 KL 方向

令 `p=(0.9,0.1)`、`q=(1,0)`。

1. 判断 `KL(p||q)` 是否有限。
2. 判断 `KL(q||p)` 是否有限。
3. 指出使两个方向不同的准确 support 关系。

### 检查 E——平方审计

在 zero-covariance 边界上，两个 Gaussian 位置的均值为 `mu_1=2` 与 `mu_2=7`。

1. 写出 `W_2^2`。
2. 写出 `W_2`。
3. 指出连接两者的运算。

## 综合练习

### 综合练习 1——联合不确定性账本

设二元变量 `A` 与 `B` 的 joint distribution 为

| `A \ B` | `0` | `1` |
|---|---:|---:|
| `0` | `0.35` | `0.15` |
| `1` | `0.05` | `0.45` |

使用以二为底的 logarithm：

1. 计算两个 marginals；
2. 计算 `H(A)`、`H(B)` 与 `H(A,B)`；
3. 计算 `H(A|B)` 与 `H(B|A)`；
4. 用两个不同的 entropy 恒等式计算 `I(A;B)`；
5. 判断变量是否独立，并给出一项失败的 factorization。

### 综合练习 2——编码与方向错配

设 `p=(0.75,0.25)` 为 reference distribution，`q=(0.50,0.50)` 为 model。

1. 计算 `H_2(p)`；
2. 计算 `H_2(p,q)`；
3. 计算 `KL_2(p||q)`；
4. 计算 `KL_2(q||p)`；
5. 解释反转方向时，哪些 expectation 权重发生了变化。

### 综合练习 3——先定几何，再做 transport

Distribution `P` 把一半质量放在 `0`、另一半放在 `3`；distribution `Q` 把一半放在 `1`、另一半放在 `2`。

1. 在 ground distance `|x-y|` 下，给出有效 coupling 并计算 `W_1`；
2. 验证 coupling 的两个 marginals；
3. 解释为何用另一种几何替换 ground distance 可能改变结果。

### 综合练习 4——Gaussian distance 标签

在一维情形中，设两个 Gaussian distributions 的均值为 `0` 与 `3`，标准差为 `1` 与 `2`。一维特例给出

`W_2^2=(mu_1-mu_2)^2+(sigma_1-sigma_2)^2`.

分别计算 `W_2^2` 与 `W_2`，并保留不同标签。

## 完整答案

### 阶段检查答案

**检查 A**

`I_2=-log_2(1/32)=5` bits.

`I_e=-ln(1/32)=ln 32 approximately 3.4657` nats.

两者都是对同一事件的 logarithmic measure。恒定换算因子改变的是尺度，而不是两个概率中哪一个更令人意外。

**检查 B**

Entropy 为

`H=-(1 log 1 + 0 log 0)=0`.

按极限约定，零概率项对 expectation 的贡献为零；它的 self-information 并不为零：

`-log 0=+infinity`

这里取扩展值意义。

**检查 C**

Marginal `P(Y=1)=0`，因此基本 conditional distribution `p(X|Y=1)` 没有定义，不能用 `(0.5,0.5)` 替代。

通过有效分层计算 conditional entropy 时，

`H(X|Y)=sum_{y:p_Y(y)>0} p_Y(y)H(X|Y=y)`,

不能把 zero-marginal 分层当作普通 conditional distribution 求值；这里仅 `Y=0` 有贡献。

**检查 D**

`KL(p||q)=+infinity`，因为第二个结果满足 `p_2=0.1>0`、`q_2=0`。

`KL(q||p)` 有限，因为 `q` 下唯一具有正质量的结果在 `p` 下也具有正概率：

`KL_2(q||p)=log_2(1/0.9) approximately 0.1520` bits.

**检查 E**

均值距离为 `|2-7|=5`。因此

`W_2^2=25`

and

`W_2=5`.

Distance 是 squared distance 的 square root。

### 综合练习答案

**综合练习 1**

Row marginal 为 `(0.50,0.50)`，column marginal 为 `(0.40,0.60)`。

因此

`H(A)=1.0000` bit,

`H(B)=-(0.4 log_2 0.4+0.6 log_2 0.6)=0.9710` bits.

Joint entropy 为

`H(A,B)=-sum of [0.35 log_2 0.35, 0.15 log_2 0.15, 0.05 log_2 0.05, 0.45 log_2 0.45]`

`approximately 1.6751` bits.

所以

`H(A|B)=H(A,B)-H(B)=0.7042` bits,

`H(B|A)=H(A,B)-H(A)=0.6751` bits,

and

`I(A;B)=H(A)+H(B)-H(A,B)=0.2958` bits.

第二条审计路径给出相同数值：

`I(A;B)=H(A)-H(A|B)=1-0.7042=0.2958` bits.

这些变量并不独立，例如

`P(A=0,B=0)=0.35`

而

`P(A=0)P(B=0)=0.50(0.40)=0.20`.

**综合练习 2**

`H_2(p)=-(0.75 log_2 0.75+0.25 log_2 0.25)=0.8113` bits.

由于 `q` 为 uniform，

`H_2(p,q)=-(0.75 log_2 0.5+0.25 log_2 0.5)=1.0000` bit.

因此

`KL_2(p||q)=1.0000-0.8113=0.1887` bits.

在反向中，

`KL_2(q||p)=0.5 log_2(0.5/0.75)+0.5 log_2(0.5/0.25)`

`approximately 0.2075` bits.

第一个方向用 `(0.75,0.25)` 对 log ratios 加权；反向则用 `(0.50,0.50)` 加权。

**综合练习 3**

一个有效的 monotone coupling 把质量 `0.5` 从 `0` 移到 `1`，再把质量 `0.5` 从 `3` 移到 `2`。其 source marginal 恰为 `P`，destination marginal 恰为 `Q`。

在绝对 ground distance 下，

`W_1=0.5|0-1|+0.5|3-2|=1`.

改变 ground metric 会改变同一位移所对应的代价，也可能改变哪一个 coupling 最优。

**综合练习 4**

`W_2^2=(0-3)^2+(1-2)^2=9+1=10`.

因此

`W_2=sqrt(10)`, approximately `3.1623`.

## 常见错误与修复路径

### 错误 1——省略 logarithm base

错误：报告 information 值却不写单位。

修复：

1. 声明以二为底或以 `e` 为底；
2. 使用该底数计算；
3. 为结果标注 bits 或 nats。

### 错误 2——把不可能事件的 self-information 设为零

错误：把 entropy 约定 `0 log 0=0` 套用到 `-log 0`。

修复：

1. 区分 self-information 与期望贡献；
2. 使用 `-log 0=+infinity`；
3. 只有乘以参考概率之后，才使用极限中的零。

### 错误 3——声称每个符号都有分数长度的实际码字

错误：把理想实数长度当成实际有限二进制串。

修复：

1. 计算理想预算；
2. 对逐符号二进制编码强制使用整数码长；
3. 比较期望实际长度与 entropy；
4. 用 sequence coding 解释平均开销如何缩小。

### 错误 4——未检查依赖关系就相加 marginal entropies

错误：假定每个 joint table 都满足 `H(X,Y)=H(X)+H(Y)`。

修复：

1. 比较 `p(x,y)` 与 `p_X(x)p_Y(y)`；
2. 直接计算 joint entropy；
3. 用 mutual information 衡量重叠。

### 错误 5——计算分母为零的 conditional

错误：为 zero-marginal 分层虚构 conditional distribution。

修复：

1. 计算条件 marginal；
2. 若分母为零，拒绝该基本比值；
3. 只在有效的 positive-marginal 分层上平均 conditional entropy。

### 错误 6——混淆 conditional-entropy 方向

错误：使用 `H(X,Y)-H(X)`，却把结果标作 `H(X|Y)`。

修复：

1. 把竖线后的变量读作已知变量；
2. 减去该已知变量的 entropy；
3. 用加权 conditional 计算复核。

### 错误 7——反转 cross-entropy 角色

错误：写成 `H(p,q)`，却用 `q` 为结果加权。

修复：

1. 把 `p` 作为 expectation 权重放在 logarithm 外；
2. 把 `q` 放进 `-log q(x)`；
3. 说明 `p` 是 reference、`q` 是 model。

### 错误 8——用 smoothing 隐藏无穷 KL

错误：发现 `p(x)>0,q(x)=0` 后，静默加上一个很小的 epsilon。

修复：

1. 把原始 KL 报告为 infinite；
2. 若后来引入 smoothing，必须标明 model 已改变；
3. 在新声明的 `q` 下重新计算。

### 错误 9——把 KL 称为 metric

错误：使用 distance 语言，却忽略非对称性与三角不等式失败。

修复：

1. 保留有序记号 `KL(p||q)`；
2. 比较反向数值；
3. 称其为 divergence。

### 错误 10——仅因 JS 对称就称其为 metric

错误：把满足一条公理当作满足全部 metric 公理的证明。

修复：

1. 从 mixture 验证对称性；
2. 保留 divergence 这一称呼；
3. 对任何变换后的量声称三角不等式前，要求独立定理支持。

### 错误 11——把离散 entropy 当作 differential entropy

错误：假定连续 entropy 始终非负且不随单位改变。

修复：

1. 判断 model 使用 probability masses 还是 density；
2. 离散 entropy 使用求和，differential entropy 使用积分；
3. 保留连续量对坐标的依赖。

### 错误 12——没有几何就计算 Wasserstein

错误：比较 support 标签，却从未声明 `d(x,y)`。

修复：

1. 指定 support 坐标；
2. 指定 ground metric 或 cost；
3. 验证 coupling marginals；
4. 计算幂次 work，并取正确次方根。

### 错误 13——忽略 Wasserstein 的矩条件

错误：声称每一对 heavy-tailed 分布都有有限 `W_r`。

修复：

1. 指出 transport 阶数 `r`；
2. 验证相关 `r` 阶矩有限；
3. 区分 infinite value 与 implementation failure。

### 错误 14——把 squared expression 标成 `W_2`

错误：在 Gaussian trace 公式中省略外层 square root。

修复：

1. 把完整右侧标作 `W_2^2`；
2. 对 `W_2` 取 square root；
3. 用 Euclidean distance 检查 zero-covariance 边界。
