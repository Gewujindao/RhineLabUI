# 随机并非混乱：从样本空间到联合分布

> 概率不会把不确定性变成确定性。它会把一个描述不足的故事，变成一个明确声明的结果空间、一个可以度量的事件，以及一个总质量恰好为一的分布。

## 前置诊断

本课使用以下前置知识：

- 读懂有限集合与笛卡尔积（Cartesian product）；
- 计算有限和；
- 把定积分理解为带符号面积；
- 区分标量与向量；
- 把函数读作从输入到输出的映射。

继续之前，回答下面的问题：

1. 如果一次观测同时记录 `{north, south}` 中的路线和 `{dry, wet}` 中的天气，共有多少个完整 outcome？
2. “天气为 wet”是一个 outcome，还是一组 outcome？
3. 四个和为 `1.07` 的非负数能否构成 PMF？
4. 如果一个连续 density 在某一点的值为 `1.4`，是否违反概率规律？
5. 概率向量的各分量必须满足什么条件？

诊断答案：

- Cartesian product 包含四个完整 outcome。
- “Wet”是一个 event，包含 `(north, wet)` 与 `(south, wet)`。
- 不能。离散概率质量之和必须恰好等于一。
- 不一定。density 是横轴变量每单位长度上的概率；必须受一约束的是它的积分，而不是每一个高度。
- 每个分量都非负，并且所有分量之和为一。

如果第二问仍不清楚，就把 outcome 与 event 的区别一直写在眼前。如果第四问仍不清楚，在真正分清面积与高度之前，不要使用 density。

## 首次术语

| 术语 | 本课含义 |
|---|---|
| 随机试验（experiment） | 一个可以重复执行、但无法事先知道确切 outcome 的过程。 |
| 样本空间（sample space） | 明确声明的集合 `Omega`，包含与问题有关的全部完整 outcome。 |
| 结果／样本点（outcome / sample point） | sample space 中的一个元素 `omega`。 |
| 事件（event） | sample space 的一个子集。观测到的 outcome 属于该子集时，这个 event 发生。 |
| 笛卡尔积（Cartesian product） | 把若干被记录的属性组合为完整元组 outcome 的构造。 |
| 随机变量（random variable） | 作用于不确定 outcome 的确定性函数 `X: Omega -> R`。 |
| 支撑集（support） | 分布能够放置正质量或正密度的取值集合。 |
| 离散随机变量（discrete random variable） | 可能取值为有限集或可数集的 random variable。 |
| 连续随机变量（continuous random variable） | 在不可数范围上建模的 random variable，通常取值于区间或区域。 |
| 概率质量函数（probability mass function, PMF） | 对离散 `X`，函数 `p_X(x)=P(X=x)`。 |
| 概率密度函数（probability density function, PDF） | 对连续 `X`，在区域上积分便得到概率的非负函数。 |
| 便携式文档格式（Portable Document Format） | 同样缩写为 PDF 的文件格式；它与 probability density function 无关。 |
| 累积分布函数（cumulative distribution function, CDF） | 函数 `F_X(x)=P(X<=x)`。 |
| 伯努利分布（Bernoulli distribution） | 定义在 `{0,1}` 上、成功概率为 `p` 的单次试验分布。 |
| 二项分布（binomial distribution） | `N` 次相互独立且成功概率相同的 Bernoulli 试验中，成功次数的分布。 |
| 随机向量（random vector） | 同一 experiment 上定义的一组 random variable 组成的向量 `[X_1,...,X_K]^T`。 |
| 联合分布（joint distribution） | 为各分量取值的组合分配概率或密度的分布。 |
| 多项分布（multinomial distribution） | 固定类别概率下进行多次独立抽取所得类别计数的分布。 |
| 多元正态分布（multivariate normal distribution） | 由均值向量与协方差矩阵控制、用于实向量的连续分布。 |
| 各向同性高斯分布（isotropic Gaussian distribution） | 协方差为 `sigma^2 I` 的 multivariate normal distribution。 |
| 狄利克雷分布（Dirichlet distribution） | 定义在“各分量非负且和为一”的向量上的连续分布。 |

缩写 `PDF` 有多种含义，必须结合语境判断。在本课中，`p(x)` 这样的公式表示 probability density function；下载的 `.pdf` 文件则采用 Portable Document Format。两者只共享三个字母，没有其他关系。

## 核心讲解

<!-- wanxiang:block foundations-d01-question-map:start -->
### 1. 模型从问题开始，而不是从公式开始

假设一名快递员可能走 north 或 south 路线，也可能遇到 dry 或 wet 天气。如果问题只问走了哪条路线，那么 sample space

`Omega_route = {north, south}`

已经足够。如果问题要问 wet 天气是否影响路线表现，这个空间就过于粗糙。合适的完整空间是

`Omega = {north, south} x {dry, wet}`.

其中四个 outcome 都是有序对。event

`A = {(north, wet), (south, wet)}`

表示“天气为 wet”。outcome `(north, wet)` 是一个完整结果；event `A` 则是由两个可能结果组成的集合。概率赋给 event，而一次观测揭示一个 outcome。

几乎不存在一个放之四海而皆准的 sample space；存在的是对已声明问题而言足够正确的空间。记录无关细节会让模型变得昂贵，丢弃相关细节则会让所问 event 无法表达。因此，第一项设计决定是粒度。

概率测度（probability measure）遵守三条核心规则：

1. 对每个 event `A`，都有 `P(A) >= 0`；
2. `P(Omega)=1`;
3. 互不相交 event 的概率可以相加。

空 event 的概率为零，每个 event 的概率都介于零和一之间。这些事实是一致模型的必然结果，不是可有可无的格式要求。

### 2. random variable 是函数，不是神秘数字

设 `omega` 为不确定的 outcome。random variable 对它应用一条固定规则：

`X(omega) = delay in minutes recorded for omega`.

不确定的是哪一个 `omega` 会发生；映射本身是确定的。两个 random variable 可以用不同方式压缩同一个 outcome。对 outcome 为 `(i,j)` 的两枚骰子，一个映射可以是 `S(i,j)=i+j`，另一个可以是 `G(i,j)=|i-j|`。原 sample space 有 36 个有序 outcome；`S` 的取值从 2 到 12，`G` 的取值从 0 到 5。

这个多对一映射解释了为什么 random variable 的分布可以比原始 outcome 上的分布更简单。对两枚公平骰子，

`P(S=7)=6/36=1/6`

因为有六个 outcome 映射到数值七。`7` 本身并不是一个骰子 outcome；它是六个 outcome 在 `S` 下的像。

<!-- wanxiang:block foundations-d01-question-map:end -->
<!-- wanxiang:block foundations-d01-mass-density-cdf:start -->
### 3. 离散变量使用质量

对 discrete random variable，PMF 为

`p_X(x)=P(X=x)`.

有效 PMF 满足

对每个可能的 `x` 都有 `p_X(x) >= 0`，

且

`sum_x p_X(x)=1`.

对可能取值组成的集合 `B`，

`P(X in B)=sum_{x in B} p_X(x)`.

“质量”这个词很有帮助：每个点都可能承载非零概率。如果一张候选表的各项非负、总和却是 `0.97`，它并不是“差不多是一个分布”，而是一个不完整或归一化错误的模型。

### 4. Bernoulli 对应一次试验，binomial 对应计数

Bernoulli 变量 `Y` 记录一次二元试验：

`P(Y=1)=p`，且 `P(Y=0)=1-p`。

参数必须满足 `0<=p<=1`。pass/fail 或 active/inactive 这样的标签可以编码为一和零，但数字只是编码，并不表示某个 outcome 在道德上更好。

现在把试验重复 `N` 次。如果各次试验相互独立，并且成功概率同为 `p`，那么成功次数

`K = Y_1 + ... + Y_N`

服从 binomial distribution：

`P(K=k) = C(N,k) p^k (1-p)^(N-k)`，其中 `k=0,...,N`。

组合数 `C(N,k)=N!/[k!(N-k)!]` 计算哪些 `k` 次试验成功。对四次相互独立、通过概率为 `0.9` 的组件检查，

`P(K=3)=C(4,3)(0.9)^3(0.1)=0.2916`.

如果各次试验彼此强烈影响，或成功概率不同，这个公式就不成立。“四次二元观测”并不足够；独立性与相同概率是结构性假设。

### 5. 连续变量使用密度与面积

对采用绝对连续 density 建模的 random variable，单个精确点的概率为零：

`P(X=x)=0`.

这不表示该点在日常语言中“不可能出现”。它表示点的宽度为零，因此在 density 下贡献的面积为零。PDF `p_X(x)` 必须满足

`p_X(x)>=0`

且

`integral from -infinity to infinity of p_X(x) dx = 1`.

对一个区间，

`P(a<=X<=b)=integral from a to b of p_X(x) dx`.

density 是相对于 `x` 的单位量度的高度，本身不是点概率。如果 support 足够窄，density 值可以超过一。例如，`[2,6]` 上的均匀分布在该区间内的 density 为 `1/4`，其他位置为零。因此

`P(3<=X<=4.5)=(4.5-3)/(6-2)=0.375`.

这个概率来自面积：宽 `1.5` 乘以高 `0.25`。

均值为 `mu`、标准差为 `sigma>0` 的标量正态分布（normal distribution）具有归一化 density

`p(x) = [1/(sqrt(2*pi)*sigma)] exp(-(x-mu)^2/(2*sigma^2))`.

它可以简写为 `X ~ Normal(mu, sigma^2)`。均值确定中心位置，方差 `sigma^2` 控制扩散程度。指数中的表达式惩罚与均值之间的平方距离，前置系数则让总面积等于一。

### 6. CDF 为两种情形提供统一接口

CDF 为

`F_X(x)=P(X<=x)`.

对离散变量，

`F_X(x)=sum_{x_i<=x} p_X(x_i)`.

对具有 density 的连续变量，

`F_X(x)=integral from -infinity to x of p_X(t) dt`.

每个 CDF 都单调不减，在趋向负无穷时趋近于零，在趋向正无穷时趋近于一。对 `a<b`，

`P(a<X<=b)=F_X(b)-F_X(a)`.

对离散变量，端点取开还是取闭很重要，因为点可能承载质量。在连续 density 下，端点概率为零，因此常见的各种开闭区间具有相同概率。

<!-- wanxiang:block foundations-d01-mass-density-cdf:end -->
<!-- wanxiang:block foundations-d01-joint-support:start -->
### 7. 多个变量要求严格管理形状

random vector

`X = [X_1,...,X_K]^T`

收集来自同一底层 experiment 的多个测量值，其形状为 `K x 1`。离散向量的联合 PMF 满足

`p(x_1,...,x_K)>=0`

且

`sum_{x_1} ... sum_{x_K} p(x_1,...,x_K)=1`.

连续向量的联合 density 满足相应的多重积分归一化。联合模型包含哪些组合会共同出现的信息。一般而言，只知道每个分量各自的分布，并不足以重建 joint distribution。

这个区别非常实际。如果 `X_1` 表示负载，`X_2` 表示温度，模型就必须表示高负载与高温是否倾向于同时出现。两个一维摘要可能掩盖这种依赖关系。

### 8. 三个向量值分布族解决不同问题

multinomial distribution 对固定类别概率 `pi_1,...,pi_K` 下进行 `N` 次独立抽取得到的 `K` 类计数建模。其状态是满足下式的计数向量 `x`：

`x_k` 是非负整数，且 `sum_k x_k=N`。

参数满足 `pi_k>=0` 与 `sum_k pi_k=1`。其质量为

`P(X=x) = [N!/(x_1!...x_K!)] product_k pi_k^(x_k)`.

multivariate normal distribution 对实向量建模。它使用均值向量 `mu in R^K` 与协方差矩阵（covariance matrix）`Sigma in R^(K x K)`。covariance matrix 必须对称且半正定；含有 `Sigma^(-1)` 与 `|Sigma|` 的常规完整 density 公式还要求它正定。非对角元素编码线性协同变化。

isotropic Gaussian 这一特例令

`Sigma = sigma^2 I`.

此时所有方向具有相同方差。在 multivariate normal 模型下，对角 covariance 还使各分量相互独立。各向同性很方便，但无法表示不同尺度或倾斜椭圆形的依赖关系。

Dirichlet distribution 不对无约束实向量建模，而是对单纯形（simplex）上的概率向量建模：

`x_k>=0`，且 `sum_k x_k=1`。

其浓度参数（concentration parameter）满足 `alpha_k>0`，并令 `alpha_0=sum_k alpha_k`。density 正比于

`product_k x_k^(alpha_k-1)`.

固定归一化均值比例 `alpha_k/alpha_0` 时，增大总浓度 `alpha_0` 往往会让更多 density 聚集在这些比例附近；当某些 `alpha_k<1` 时，density 可能偏向相应边界。第一遍学习时，最重要的角色区别是：

- multinomial：总数固定的随机整数计数；
- multivariate normal：随机实值向量；
- Dirichlet：随机概率向量。

<!-- wanxiang:block foundations-d01-joint-support:end -->
## 完整因果链

完整推理链为：

`question -> recorded attributes -> sample space -> event -> random variable -> support type -> representation -> validity -> query -> computation -> interpretation`.

每个箭头都有理由。

1. **从问题到记录属性。** 询问天气影响时，outcome 中必须包含天气；只问路线时则未必需要。
2. **从属性到 sample space。** Cartesian product 枚举完整组合，不会静默合并情形。
3. **从 sample space 到 event。** 文字条件被转化为 outcome 的子集。
4. **从 outcome 到 random variable。** 确定性映射把每个 outcome 压缩为分析所需的数值。
5. **从 support 到表示。** 可数取值使用 PMF，连续区域使用 density，两者都可以使用 CDF。
6. **从表示到有效性。** 非负性杜绝负概率，归一化则涵盖全部可能性。
7. **从有效性到查询。** 模型通过这些检查后，询问点质量、区间面积或累计概率才有意义。
8. **从查询到计算。** 离散 event 使用求和，连续区域使用积分，累计差分则复用 CDF。
9. **从计算到解释。** 最终数值必须对应已声明的 event 与假设。

考虑骰子点数和 `S`。不能靠猜测“所有和值等可能”来计算 event `S=7`；应追溯到 36 个等可能有序 outcome，数出其中映射到七的六个，再除以 36。random variable 的 support 看似简单，并不会抹去 sample space 中的映射重数。

对连续区间，这条链还能防止另一种常见错误。如果 `p_X(3)=0.25`，这个高度本身并不是 `P(X=3)`。event 必须具有宽度，例如 `3<=X<=4.5`，在该区间上的积分才产生概率。

## 图示与状态追踪

### 原创 density—CDF 坐标板

使用可执行程序中的三角形 density：

`p(x)=x` 适用于 `[0,1]`，`p(x)=2-x` 适用于 `(1,2]`，而其他位置有 `p(x)=0`。

它的 CDF 为

`F(x)=0` 适用于 `x<0`，

`F(x)=x^2/2` 适用于 `0<=x<=1`，

`F(x)=1-(2-x)^2/2` 适用于 `1<x<=2`，

并且当 `x>2` 时，`F(x)=1`。

横坐标是 `x`。两列数值都是纵坐标：density 高度 `p(x)` 与累计面积 `F(x)`。

| `x` 坐标 | `p(x)` density 高度 | density 轮廓 | `F(x)` 累计概率 | CDF 轮廓 |
|---:|---:|:---|---:|:---|
| `0.00` | `0.00000` | `▁` | `0.00000` | `▁` |
| `0.25` | `0.25000` | `▂` | `0.03125` | `▁` |
| `0.50` | `0.50000` | `▄` | `0.12500` | `▂` |
| `0.75` | `0.75000` | `▆` | `0.28125` | `▃` |
| `1.00` | `1.00000` | `█` | `0.50000` | `▄` |
| `1.25` | `0.75000` | `▆` | `0.71875` | `▆` |
| `1.50` | `0.50000` | `▄` | `0.87500` | `▇` |
| `1.75` | `0.25000` | `▂` | `0.96875` | `█` |
| `2.00` | `0.00000` | `▁` | `1.00000` | `█` |

分别读取两条轮廓。density 先升后降，但从不为负；CDF 从不下降，因为每次向右移动都会增加非负面积。density 为正时，CDF 上升；在 `[0,2]` 之外 density 为零时，CDF 保持水平。在可微点上，`F'(x)=p(x)`。中央区间可以直接读作累计面积：

`P(0.5<=X<=1.5)=F(1.5)-F(0.5)=0.875-0.125=0.75`.

### 表示方法对照表

| 模型状态 | 离散标量 | 连续标量 | 向量值 |
|---|---|---|---|
| 可能取值 | 有限／可数 support | 区间或区域 | 乘积空间或几何 support |
| 局部表示 | `p_X(x)=P(X=x)` | density `p_X(x)` | 联合质量或联合 density |
| 归一化 | `sum_x p_X(x)=1` | `integral p_X(x)dx=1` | 嵌套求和或多重积分等于一 |
| 点查询 | 可以为正 | 在 density 模型下为零 | 取决于离散／连续 support |
| 区域查询 | 对质量求和 | 对 density 积分 | 在联合区域上求和／积分 |
| 通用累计视图 | `F_X(x)` | `F_X(x)` | 存在分量式 CDF，但需谨慎使用 |

### 分布选择对照表

| 观测对象 | 形状与 support | 候选分布族 | 必要假设 |
|---|---|---|---|
| 一个二元 outcome | `{0,1}` 中的标量 | Bernoulli | 一次试验，成功概率已声明 |
| 成功次数 | `{0,...,N}` 中的整数 | binomial | `N` 次独立试验，`p` 相同 |
| 类别计数 | 和为 `N` 的整数向量 | multinomial | 独立抽取，类别向量固定 |
| 实数测量 | `R^K` 中的向量 | multivariate normal | Gaussian 形状有依据；covariance 有效 |
| 不确定的类别比例 | 和为一的非负向量 | Dirichlet | 每个 concentration parameter 都为正 |

### 一次状态追踪

假设掷两枚公平骰子，问题是：“两枚骰子点数的绝对差至多为一的概率是多少？”

| 追踪字段 | 状态 |
|---|---|
| 原始 outcome | `(i,j)`，其中 `i,j in {1,...,6}` |
| sample space 大小 | `36` 个有序 outcome |
| random variable | `G(i,j)=|i-j|` |
| 值空间中的 event | `{G<=1}` |
| 匹配的原始 outcome | 六个相等数对，加十个相邻有序数对 |
| 表示 | 由等可能 outcome 诱导的离散 PMF |
| 计算 | `(6+10)/36=4/9` |
| 解释 | 在公平且独立的骰子假设下，点数差至多为一的概率是 `4/9` |

追踪把原始 sample space、映射、event、算术与假设分别保存在不同字段中。这样一旦计数错误，就能定位原因。

## 可执行代码

下面这一个程序生成三类证据：离散归一化、连续归一化与区间概率，以及带固定 seed 的抽样检查。程序只使用标准库。

```python
from bisect import bisect_left
from math import isclose
from random import Random


def normalize(weights):
    if not weights or any(w < 0 for w in weights):
        raise ValueError("weights must be a nonempty list of nonnegative numbers")
    total = sum(weights)
    if total <= 0:
        raise ValueError("at least one weight must be positive")
    return [w / total for w in weights]


def triangular_pdf(x):
    if 0.0 <= x <= 1.0:
        return x
    if 1.0 < x <= 2.0:
        return 2.0 - x
    return 0.0


def midpoint_integral(function, left, right, steps=200_000):
    width = (right - left) / steps
    return sum(function(left + (i + 0.5) * width) for i in range(steps)) * width


def categorical_sample(probabilities, rng):
    cumulative = []
    running = 0.0
    for probability in probabilities:
        running += probability
        cumulative.append(running)
    draw = rng.random()
    return bisect_left(cumulative, draw)


weights = [2.0, 3.0, 5.0]
pmf = normalize(weights)
continuous_total = midpoint_integral(triangular_pdf, 0.0, 2.0)
interval_probability = midpoint_integral(triangular_pdf, 0.5, 1.5)

rng = Random(20260723)
trials = 20_000
counts = [0] * len(pmf)
for _ in range(trials):
    counts[categorical_sample(pmf, rng)] += 1
frequencies = [count / trials for count in counts]
max_error = max(abs(observed - expected) for observed, expected in zip(frequencies, pmf))

assert isclose(sum(pmf), 1.0, abs_tol=1e-12)
assert isclose(continuous_total, 1.0, abs_tol=1e-9)
assert isclose(interval_probability, 0.75, abs_tol=1e-9)
assert max_error < 0.02

print(f"PMF normalization: pmf={pmf}, sum={sum(pmf):.6f}")
print(f"Continuous normalization: integral={continuous_total:.6f}")
print(f"Interval probability [0.5, 1.5]: {interval_probability:.6f}")
print(f"Sampling frequencies: {frequencies}, max_error={max_error:.6f}")
```

分层读取输出。归一化后的 PMF 应为 `[0.2, 0.3, 0.5]`。三角形 density 在 `[0,2]` 上的积分为一，中央区间的面积为 `0.75`。带固定 seed 的经验频率应接近理论质量，但不必与之完全相等；抽样误差是正常的，持续存在的较大差异才需要调查。

## 阶段检查

### 检查 A——先声明，再计算

一次检查记录 `(station, status)`，其中 station 为 `east` 或 `west`，status 为 `clear` 或 `blocked`。

1. 写出完整 sample space。
2. 写出“blocked”这一 event。
3. 定义一个二元 random variable `B`，记录路线是否被阻断。

不要赋数值概率；这一检查只关注结构。

### 检查 B——拒绝不完整的质量

定义在 `{-1,0,1}` 上的候选 PMF 分别赋予质量 `0.20`、`0.50` 与 `0.40`。

1. 检查非负性。
2. 检查归一化。
3. 判断该表是否为有效 PMF，并给出最小诊断。

### 检查 C——积分，而不是读取高度

一个连续变量在 `[0,1]` 上的 density 为 `p(x)=3x^2`，其他位置为零。

1. 验证归一化。
2. 计算 `P(0.2<=X<=0.6)`。
3. 写出 `P(X=0.6)`。

始终区分 density 高度、区间面积与点概率。

## 综合练习

### 练习 1——映射重数

掷两枚公平六面骰子。令 `M=max(i,j)`。

1. 列出映射到 `M=2` 的 outcome。
2. 计算 `P(M=2)`。
3. 解释为什么把等概率赋给 `M` 的六个可能取值是错误的。

### 练习 2——binomial 假设审计

对一台设备进行四次测试。每次测试相互独立，并以概率 `0.9` 通过。

1. 计算恰好通过三次的概率。
2. 计算至少通过三次的概率。
3. 写出支持 binomial 模型的两项假设。
4. 解释如果设备逐渐升温、后续测试更容易通过，哪些条件会失效。

### 练习 3——累计推理

设一个离散变量具有下列质量：

| `x` | `-2` | `0` | `3` |
|---|---:|---:|---:|
| `p_X(x)` | `0.25` | `0.50` | `0.25` |

1. 求 `F_X(-1)`、`F_X(0)` 与 `F_X(5)`。
2. 使用累计差分计算 `P(-1<X<=3)`。
3. 解释为什么端点选择在这里很重要。

### 练习 4——选择向量分布族

对下面每个对象，从 multinomial、multivariate normal 与 Dirichlet 中选择最自然的首选模型：

1. 200 次独立购买中五种票券的计数；
2. 分配给五种票券的不确定比例向量；
3. 以实向量记录的温度、振动与电流。

对每个选择，写出其 support 约束与参数形状。

## 完整答案

### 阶段检查答案

**检查 A**

完整 sample space 为

`{(east,clear), (east,blocked), (west,clear), (west,blocked)}`.

“blocked”这一 event 为

`{(east,blocked), (west,blocked)}`.

合适的 random variable 是：status 为 blocked 时 `B(station,status)=1`，否则为 `0`。

**检查 B**

三个数都非负，因此通过第一项条件。它们的和为

`0.20+0.50+0.40=1.10`,

所以归一化失败。这张表不是 PMF。诊断不是“出现负概率”，而是总质量过多。

**检查 C**

归一化：

`integral_0^1 3x^2 dx = [x^3]_0^1 = 1`.

区间概率：

`P(0.2<=X<=0.6) = [x^3]_0.2^0.6 = 0.216-0.008 = 0.208`.

因为模型是连续的，

`P(X=0.6)=0`.

### 综合练习答案

**练习 1**

这些 outcome 是 `(1,2)`、`(2,1)` 与 `(2,2)`。因此

`P(M=2)=3/36=1/12`.

`M` 的各个值并不等可能，因为映射到它们的骰子有序 outcome 数量不同。例如，只有 `(1,1)` 映射到 `M=1`，却有十一个 outcome 映射到 `M=6`。

**练习 2**

恰好通过三次：

`C(4,3)(0.9)^3(0.1)=0.2916`.

通过四次：

`(0.9)^4=0.6561`.

因此至少通过三次的概率为

`0.2916+0.6561=0.9477`.

模型要求各次试验相互独立，并且每次成功概率相同。升温会使概率随时间改变，还可能通过设备状态引入依赖，因此不能再推出简单的 binomial 公式。

**练习 3**

`F_X(-1)=0.25`，因为只有 `-2` 不大于 `-1`。

`F_X(0)=0.75`，因为包含 `-2` 与 `0` 处的质量。

`F_X(5)=1`.

使用累计差分，

`P(-1<X<=3)=F_X(3)-F_X(-1)=1-0.25=0.75`.

端点选择很重要，因为离散点可以承载正概率。例如，把 `X<=0` 改为 `X<0` 会去掉质量 `0.50`。

**练习 4**

1. 票券计数使用 multinomial 模型。状态是长度为五、各项和为 200 的非负整数向量；参数是长度为五的概率向量。
2. 不确定比例使用 Dirichlet 模型。状态位于五维概率 simplex 上，正 concentration parameter 的长度为五。
3. 实数测量首先考虑 multivariate normal 模型。均值形状为 `3 x 1`；covariance 形状为 `3 x 3`，而且必须是有效 covariance matrix。

只有分布族及其 support 都正确时，结论才完整。只写分布名称而不写形状或 support 约束，并不足以说明模型成立。

## 常见错误与修复路径

### 错误 1：选择了无法表达问题的 sample space

症状：天气属性已被丢弃，但所问 event 要比较 wet 与 dry 情形。

修复：

1. 写出问题中提到的每个属性。
2. 用 Cartesian product 组成完整元组。
3. 只有证明 event 不依赖某属性后，才能将其移除。

### 错误 2：把 event 当成一个 outcome

症状：把“wet”写成了一个完整的路线—天气观测。

修复：

1. 写出一个完整元组。
2. 收集满足文字条件的所有元组。
3. 用集合括住这些元组。

### 错误 3：把 random variable 的函数规则本身当成随机的

症状：看到 outcome 后才改变映射规则。

修复：

1. 在观测前声明 `X(omega)`。
2. 保持映射为确定性规则。
3. 把不确定性放在 `omega` 中，而不是放在规则中。

### 错误 4：接受“接近归一化”

症状：因为误差“看起来很小”，便接受总和为 `0.98` 的质量。

修复：

1. 明确计算总和。
2. 判断差异能否由舍入解释。
3. 对有记录的权重进行归一化，或拒绝无效概率表。

### 错误 5：把 density 高度读成点概率

症状：把 `p_X(0.6)` 报告成 `P(X=0.6)`。

修复：

1. 先判断变量是否连续。
2. 把 event 转化为区间或区域。
3. 在该区域上对 density 积分。

### 错误 6：因为 density 超过一而拒绝它

症状：把高度为二、support 很窄的均匀 density 判为无效。

修复：

1. 检查非负性。
2. 用高度乘以 support 宽度，或直接积分。
3. 要求总面积等于一，而不是要求每个高度都等于一。

### 错误 7：不核查假设就使用 binomial

症状：只要看到成功次数，就自动称其服从 binomial。

修复：

1. 固定试验次数。
2. 验证 outcome 为二元。
3. 验证独立性。
4. 验证各次试验具有相同成功概率。

### 错误 8：混淆联合模型与各自的边缘分布

症状：声称负载与温度各自的摘要足以确定它们如何共同出现。

修复：

1. 写出联合元组。
2. 说明哪些组合获得质量或 density。
3. 在有依据的简化出现之前，保留依赖信息。

### 错误 9：忽略形状与 support

症状：允许 Dirichlet 样本含有负分量，或允许其分量和为 `1.3`。

修复：

1. 写出状态维数。
2. 写出非负约束。
3. 写出求和约束。
4. 单独检查参数正性。

### 错误 10：把 isotropic 解释为处处现实

症状：即使变量单位不同、运动相关，仍然使用 `sigma^2 I`。

修复：

1. 检查尺度。
2. 检查交叉 covariance。
3. 只有具备依据时，才把 isotropy 用作简化或基线。
