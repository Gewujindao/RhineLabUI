# 从观测反推世界（From Observation Back to the World）

观测并非世界本身，而只是联合模型的一张切片。边缘化（marginalization）会移除当前不关心的变量；条件化（conditioning）会选出相容切片并重新归一化；贝叶斯法则（Bayes' rule）会反转条件陈述的方向。随后，期望（expectation）、方差（variance）与协方差（covariance）把分布压缩为可解释的数值摘要。詹森不等式（Jensen's inequality）与大数定律（Law of Large Numbers）则分别说明，平均值如何与非线性函数以及重复观测发生作用。

本课会把每一个分母与逻辑方向都明确写出。即使公式看起来熟悉，只要 conditioning 的分母为零，它就不成立；covariance 为零也不是独立（independence）的通用证明。

## 前置诊断

开始推断前，先检查四项前置条件。

### 联合概率是起始账本

对离散随机变量，联合概率质量函数（joint probability mass function）会为每一对取值分配一个非负数，完整表格之和为一。对连续随机变量，联合密度（joint density）非负，并且在定义域上的积分为一。某一行或某一条纵向切片不会自动成为 conditional distribution；必须先检查它的概率质量。

### 求和移除离散可能，积分移除连续可能

若变量是离散的，就用求和累积它的所有可能取值；若变量是连续的，对应操作就是积分。写在求和指标或微分符号中的变量，就是被移除的变量。

### 比值必须有有效分母

除以零并非轻微的数值麻烦，而是说明这个比值没有定义出条件概率（conditional probability）。执行除法前，先找出分母里的边缘概率（marginal probability）或边缘密度（marginal density），再确认它在 conditioning 取值处为正。

### 代数摘要不能替代分布

两个分布可以有相同的均值与 variance，却在其他方面不同。Expectation、variance 与 covariance 只能回答特定问题，不能重建每一个概率。

## 首次术语

- **边缘分布（marginal distribution）**：把其他变量的所有取值求和或积分掉以后，所保留变量的分布；
- **marginalization**：通过完整累积移除不需要的变量，而不是随意删掉一行或一列；
- **conditional distribution**：用正的 marginal 概率质量或密度除所选联合切片，使切片归一化；
- **条件事件（conditioning event）**：被视为已经观测到的事件；初等比值要求该事件具有正概率；
- **prior**：使用当前观测之前，赋给假设的概率；
- **likelihood**：在固定假设下观测到数据的概率，并把它看作关于假设的函数；
- **evidence / marginal likelihood**：模型中所有假设对该观测给出的总概率；
- **posterior**：纳入观测以后，假设的条件概率；
- **independence**：联合概率可分解为各 marginal 的乘积；
- **conditional independence**：分解关系在每个有效 conditioning 分层内成立；
- **expectation**：当所需的求和或积分存在时，以概率为权重得到的平均值；
- **variance**：到均值的平方距离的 expectation；
- **covariance**：中心化偏差乘积的 expectation；
- **不相关（uncorrelated）**：在已经声明的标量、分量或随机向量口径下，covariance 为零；
- **凸函数（convex function）**：混合点上的函数值不超过各端点函数值的同权混合；
- **仿射函数（affine function）**：线性函数加上常数；
- **样本均值（sample mean）**：已观测随机样本的算术平均；
- **convergence mode**：赋给收敛箭头的精确概率含义，例如某一正式定理明确指定的模式。

这里的 *evidence* 指归一化概率，而不是日常所说的“证明材料”。*independent* 指一种分解性质，而不只是“在一张图上看起来没有关系”。

## 核心讲解

<!-- wanxiang:block foundations-d02-conditioning-bayes:start -->
### 1. Marginalization 保留全部相容概率质量

设 \(p_{X,Y}(x,y)\) 是离散联合分布。\(X\) 的 marginal distribution 为

\[
p_X(x)=\sum_y p_{X,Y}(x,y).
\]

\(Y\) 的每一个可能取值都会参与累积。同理，

\[
p_Y(y)=\sum_x p_{X,Y}(x,y).
\]

看下面这张演算表：

| \(X\backslash Y\) | 0 | 1 | 行 marginal |
|---|---:|---:|---:|
| 0 | 0.18 | 0.12 | 0.30 |
| 1 | 0.22 | 0.48 | 0.70 |
| 列 marginal | 0.40 | 0.60 | 1.00 |

\(X=1\) 的行 marginal 是 \(0.22+0.48=0.70\)，\(Y=1\) 的列 marginal 是 \(0.12+0.48=0.60\)。两个 marginal distribution 仍然归一化，因为任意一个 marginal 的总和都等于完整联合表的总和。

对连续联合密度，

\[
p_X(x)=\int_{-\infty}^{\infty}p_{X,Y}(x,y)\,dy,
\qquad
p_Y(y)=\int_{-\infty}^{\infty}p_{X,Y}(x,y)\,dx.
\]

微分符号会表明被移除的变量。对 \(dy\) 积分会移除 \(Y\)，留下关于 \(x\) 的函数。多维 marginal 可能需要对多个坐标积分，但逻辑不变。

### 2. Conditioning：选择、检查并重新归一化

对于离散联合分布以及满足 \(p_X(x)>0\) 的取值，

\[
p_{Y\mid X}(y\mid x)
=\frac{p_{X,Y}(x,y)}{p_X(x)}.
\]

使用上面的演算表，

\[
p(Y=1\mid X=1)=\frac{0.48}{0.70}=\frac{24}{35}.
\]

完整的 conditional 行为

\[
p(Y=0\mid X=1)=\frac{22}{70},
\qquad
p(Y=1\mid X=1)=\frac{48}{70},
\]

且两项之和为一。这揭示了三步操作：

1. 选出与观测相容的行；
2. 计算该行的 marginal 概率质量；
3. 用这个正的概率质量除以该行每一项。

若所选行的总概率质量为零，初等比值就没有定义。不要把全零行改成均匀分布，也不要仅因分子同样为零就报告 posterior 为零。模型没有给这个条件分配任何概率质量，因此该公式没有有效分母。

对于 marginal density 满足 \(p_X(x)>0\) 的连续变量，

\[
p_{Y\mid X}(y\mid x)
=\frac{p_{X,Y}(x,y)}{p_X(x)}.
\]

连续型点事件即使密度值为正，其概率质量通常仍为零。因此，密度比值检查的是 conditioning 取值处的 marginal *density*。如果该密度分母为零，上式仍然不能在该点定义条件密度（conditional density）。对零概率事件进行 conditioning 的更高级构造不在本课范围内。

乘法形式

\[
p_{X,Y}(x,y)=p_X(x)p_{Y\mid X}(y\mid x)
\]

则是沿正向读取同一关系。

### 3. Bayes' rule 反转有效的条件方向

联合分布可以用两种方式分解：

\[
p_{X,Y}(x,y)
=p_{X\mid Y}(x\mid y)p_Y(y)
=p_{Y\mid X}(y\mid x)p_X(x).
\]

当 evidence \(p_X(x)\) 为正时，

\[
p_{Y\mid X}(y\mid x)
=\frac{p_{X\mid Y}(x\mid y)p_Y(y)}{p_X(x)}.
\]

假设某个部件发生故障的 prior probability 为 \(0.20\)。部件故障时，红色信号出现的概率是 \(0.75\)；部件正常时，该概率是 \(0.10\)。红色信号的 evidence 为

\[
P(R)=0.75(0.20)+0.10(0.80)=0.23.
\]

Posterior 为

\[
P(F\mid R)=\frac{0.75(0.20)}{0.23}
=\frac{15}{23}\approx0.6522.
\]

语义账本如下：

```text
prior        P(F)       = 0.20
likelihood   P(R | F)   = 0.75
evidence     P(R)       = 0.23
posterior    P(F | R)   = 15/23
```

Likelihood 不是 posterior，因为它既没有纳入 prior，也没有纳入正常状态这一竞争假设对 evidence 的贡献。若每个假设都给当前观测分配零 likelihood，evidence 就为零，这个 Bayes 比值也没有定义。此时应当审计模型，而不是随意归一化。

<!-- wanxiang:block foundations-d02-conditioning-bayes:end -->
<!-- wanxiang:block foundations-d02-moments-dependence:start -->
### 4. Independence 与 conditional independence 回答不同问题

当下式对所有相关取值都成立时，随机变量 \(X\) 与 \(Y\) independent：

\[
p_{X,Y}(x,y)=p_X(x)p_Y(y)
\]

凡是条件比值有定义的地方，这等价于：观测其中一个变量不会改变另一个变量的分布。

对离散变量以及满足 \(P(Z=z)>0\) 的分层，\(X\) 与 \(Y\) 在给定 \(Z=z\) 时 conditional independent，意味着

\[
p_{X,Y\mid Z}(x,y\mid z)
=p_{X\mid Z}(x\mid z)p_{Y\mid Z}(y\mid z)
\]

对连续密度比值，同一个分解式只能用于 marginal density 满足 \(p_Z(z)>0\) 的有效 conditioning 点。不能靠声称变量在该点 conditional independent 来修补零概率或零密度分母。这个分解关系只在 \(Z\) 的每个有效分层内成立；它不会自动推出 marginal 分解 \(p_{X,Y}=p_Xp_Y\)。

共同原因可以说明这种区别。在固定天气状态内，两个传感器的噪声可以 independent；隐藏天气状态以后，两者的读数仍可能相关，因为它们都会响应同一个共同状态。反过来，对某个选定结果进行 conditioning，也可能制造 marginal 情况下原本不存在的关联。每次声称分解成立时，都要说清所针对的分布。

### 5. Expectation 是加权变换

对离散随机变量，

\[
\mathbb E[X]=\sum_x x\,p_X(x).
\]

对积分存在的连续随机变量，

\[
\mathbb E[X]=\int_{-\infty}^{\infty}x\,p_X(x)\,dx.
\]

更一般地，

\[
\mathbb E[g(X)]
=\sum_x g(x)p_X(x)
\]

连续情形则使用对应的积分。不能先计算 \(g(\mathbb E[X])\)，因为它通常是另一个量。

举例来说，令 \(R\) 分别取值 \(-1,1,3\)，对应概率为 \(0.25,0.50,0.25\)。于是

\[
\mathbb E[R]
=(-1)(0.25)+(1)(0.50)+(3)(0.25)
=1.
\]

此外，

\[
\mathbb E[R^2]
=(1)(0.25)+(1)(0.50)+(9)(0.25)
=3.
\]

只要相关 expectation 存在，expectation 的线性性就给出 \(\mathbb E[aX+bY+c]=a\mathbb E[X]+b\mathbb E[Y]+c\)；这一代数性质不要求 independence。

### 6. Variance 与 covariance 先中心化，再相乘

Variance 为

\[
\operatorname{Var}(X)
=\mathbb E[(X-\mathbb E[X])^2]
=\mathbb E[X^2]-\mathbb E[X]^2.
\]

对上例中的变量 \(R\)，

\[
\operatorname{Var}(R)=3-1^2=2.
\]

标量变量之间的 covariance 为

\[
\operatorname{Cov}(X,Y)
=\mathbb E[(X-\mathbb E[X])(Y-\mathbb E[Y])]
=\mathbb E[XY]-\mathbb E[X]\mathbb E[Y].
\]

根据前面的二元联合表，

\[
\mathbb E[X]=0.70,\quad
\mathbb E[Y]=0.60,\quad
\mathbb E[XY]=0.48,
\]

所以

\[
\operatorname{Cov}(X,Y)=0.48-(0.70)(0.60)=0.06.
\]

\([X,Y]^T\) 的 covariance matrix 为

\[
\begin{bmatrix}
0.21 & 0.06\\
0.06 & 0.24
\end{bmatrix},
\]

因为成功概率为 \(p\) 的二元变量具有 variance \(p(1-p)\)。

必须区分 *uncorrelated* 的三种用法：

1. 当两个标量变量的标量 covariance 为零时，它们 uncorrelated；
2. 当一个随机向量的 covariance matrix 为对角矩阵时，它的各分量两两 uncorrelated；
3. 当两个随机向量 \(U\in\mathbb R^m\) 与 \(V\in\mathbb R^n\) 的互协方差矩阵（cross-covariance matrix）
   \[
   \operatorname{Cov}(U,V)
   =\mathbb E[(U-\mathbb E[U])(V-\mathbb E[V])^T]
   \]
   是 \(m\times n\) 零矩阵时，它们 uncorrelated。

在第三种说法中，cross-covariance matrix 仅仅是对角矩阵通常还不够，因为它的对角元仍可能非零。

当所需的矩存在时，independence 蕴含 covariance 为零；反命题一般不成立。令 \(X\) 在 \(\{-2,-1,1,2\}\) 上均匀分布，并令 \(Y=X^2\)。由对称性可得 \(\mathbb E[X]=0\) 以及 \(\mathbb E[XY]=\mathbb E[X^3]=0\)，因此 covariance 为零。然而 \(Y\) 完全由 \(X\) 决定，所以两个变量 dependent。

<!-- wanxiang:block foundations-d02-moments-dependence:end -->
<!-- wanxiang:block foundations-d02-jensen-lln:start -->
### 7. Jensen 比较“先变换再平均”与“先平均再变换”

对于 convex function \(\phi\) 以及使下列 expectation 存在的可积随机变量，

\[
\phi(\mathbb E[X])\le \mathbb E[\phi(X)].
\]

不等号方向由曲率决定。Convex 图像位于连接其各点的弦下方。对 \(\phi(x)=x^2\) 以及上例中的变量 \(R\)，

\[
\phi(\mathbb E[R])=1
\le
\mathbb E[R^2]=3.
\]

对凹函数（concave function），不等号反向。选择不等号方向前，必须先判断曲率。

等号边界比两个常见特例更宽。当 \(\phi\) 在 \(X\) 的 support 的相关凸包（convex hull）上 affine 时，等号成立。常量随机变量与全局 affine function 都是有用的充分情形，但它们没有穷尽全部可能。一个函数可以在其他地方弯曲，却恰好在 \(X\) 所在区域上 affine。

### 8. Law of Large Numbers 不是路径单调的保证

对重复样本 \(X_1,\ldots,X_N\)，sample mean 为

\[
\overline X_N=\frac{1}{N}\sum_{i=1}^{N}X_i.
\]

在某个适用的 Law of Large Numbers 所要求的抽样与矩假设下，随着样本量增大，sample mean 会趋近总体 expectation。这搭起了从理论 expectation 到经验平均值的概念桥梁。

它**不**表示：

- 每一个有限 sample mean 都接近 expectation；
- sample mean 序列单调变化；
- 单个观测不再具有随机性；
- 一条轨迹可以证明一个定理；
- 未命名的箭头自动表示几乎必然收敛（almost-sure convergence）。

原始资料中的收敛箭头没有指定 convergence mode。正式的弱大数定律（weak law）与强大数定律（strong law）会命名不同模式，并各有自己的假设。因此，本课只保留原文给出的概念性收敛主张，不静默选择某一个定理。

<!-- wanxiang:block foundations-d02-jensen-lln:end -->
## 完整因果链

完整推理链如下：

1. 从一个已经归一化的联合分布开始。
2. 要移除离散变量，就对它的所有可能取值求和。
3. 要移除连续变量，就在它完整的相关定义域上积分。
4. 把所得函数标为保留变量的 marginal。
5. 要进行 conditioning，先选出相容切片。
6. 计算该切片的 marginal 概率质量或密度。
7. 若分母为零，就拒绝使用初等比值。
8. 用正分母相除，使 conditional 切片归一化为一。
9. 沿两个方向分解同一个联合分布，从而推导 Bayes' rule。
10. 在模型中的全部假设上展开 evidence。
11. 把 prior、likelihood、evidence 与 posterior 分别写在不同账本行中。
12. 用联合分解检验 independence，不凭视觉直觉判断。
13. 声称 conditional independence 时，明确写出 conditioning 变量。
14. 用概率给变换后的取值加权，从而计算 expectation。
15. 构造 variance 或 covariance 前先中心化变量。
16. 声明“uncorrelated”指的是标量、同一向量的分量，还是两个随机向量。
17. 记住：在有限矩存在时，independence 蕴含 covariance 为零；没有额外结构时，反命题不成立。
18. 应用 Jensen 前先检查 convexity，并保留“在 support 上 affine”的等号边界。
19. 在每一个有限样本量下，都把经验均值理解为随机估计量。
20. 保留未指定的 convergence mode，不把无标签箭头强化成另一个定理。

删除分母检查会破坏 conditioning；漏掉竞争假设会破坏 Bayes 归一化；用 covariance 替代分解关系会破坏 independence 逻辑；把渐近陈述替换成有限样本路径单调则会破坏 Law of Large Numbers。

## 图示与状态追踪

### 从联合分布到 marginal 再到 conditional 的板书

```text
联合表
    |
    +-- 沿每行求和 -------------> p_X(x)
    |
    +-- 选择 X=x_obs 对应的行
            |
            +-- 行总和 > 0？ ---- 否 --> 比值未定义
            |
            是
            |
            +-- 每项除以行总和 --> p(Y | X=x_obs)
```

### Bayes 流程

```text
prior(H) * likelihood(data | H)
                 |
                 v
          未归一化假设质量
                 |
            对所有假设求和
                 v
              evidence
                 |
           evidence 为正？
          /             \
        否               是
     拒绝比值       每项质量除以 evidence
                           |
                           v
                      posterior(H | data)
```

### Covariance 与 independence 对照轨迹

```text
X 在 {-2,-1,1,2} 上等概率取值
Y = X^2
        |
        +--> Y 由 X 决定                    dependent
        |
        +--> 对称性给出 E[X] = 0
        +--> E[XY] = E[X^3] = 0
        +--> Cov(X,Y) = 0                  标量 uncorrelated
```

Covariance 为零与 dependence 可以同时存在，因此不能交换这两个标签。

### 经验均值轨迹

```text
样本量：            10       100       1,000       10,000
sample mean：       随机      随机        随机          随机
目标：                \         \          \             \
                      ---------- 总体 expectation --------
```

路径可能越过目标后再次远离。重要的是在已声明假设下的渐近行为，而不是单调运动。

## 可执行代码

这是本课唯一一个独立可运行的 Python 程序。它审计联合表，在零分母防护下构造 marginal 与 conditional，执行一次 Bayes 更新，并打印一条固定随机种子的经验均值轨迹。

```python
from random import Random


def assert_joint_table(joint, tolerance=1e-12):
    if not joint or not joint[0]:
        raise ValueError("joint table must be nonempty")
    width = len(joint[0])
    if any(len(row) != width for row in joint):
        raise ValueError("joint table must be rectangular")
    if any(value < 0.0 for row in joint for value in row):
        raise ValueError("probabilities must be nonnegative")
    total = sum(sum(row) for row in joint)
    if abs(total - 1.0) > tolerance:
        raise ValueError(f"joint table must sum to 1, got {total}")


def marginals(joint):
    assert_joint_table(joint)
    row_marginal = [sum(row) for row in joint]
    column_marginal = [
        sum(joint[row][column] for row in range(len(joint)))
        for column in range(len(joint[0]))
    ]
    return row_marginal, column_marginal


def conditional_row(joint, row_index):
    assert_joint_table(joint)
    denominator = sum(joint[row_index])
    if denominator <= 0.0:
        raise ValueError("conditioning denominator is zero")
    return [value / denominator for value in joint[row_index]]


def bayes_binary(prior_h, likelihood_e_given_h, likelihood_e_given_not_h):
    if not 0.0 <= prior_h <= 1.0:
        raise ValueError("prior must lie in [0,1]")
    if not 0.0 <= likelihood_e_given_h <= 1.0:
        raise ValueError("likelihood P(E|H) must lie in [0,1]")
    if not 0.0 <= likelihood_e_given_not_h <= 1.0:
        raise ValueError("likelihood P(E|not H) must lie in [0,1]")
    evidence = (
        likelihood_e_given_h * prior_h
        + likelihood_e_given_not_h * (1.0 - prior_h)
    )
    if evidence <= 0.0:
        raise ValueError("Bayes evidence is zero")
    posterior = likelihood_e_given_h * prior_h / evidence
    return evidence, posterior


joint = [
    [0.14, 0.06, 0.10],
    [0.16, 0.24, 0.30],
]
row_marginal, column_marginal = marginals(joint)
given_second_row = conditional_row(joint, 1)

impossible_joint = [
    [0.40, 0.60],
    [0.00, 0.00],
]
try:
    conditional_row(impossible_joint, 1)
except ValueError as error:
    zero_denominator_message = str(error)
else:
    raise AssertionError("zero-denominator conditioning was not rejected")

evidence, posterior = bayes_binary(
    prior_h=0.30,
    likelihood_e_given_h=0.70,
    likelihood_e_given_not_h=0.20,
)

try:
    bayes_binary(
        prior_h=0.30,
        likelihood_e_given_h=1.20,
        likelihood_e_given_not_h=0.20,
    )
except ValueError as error:
    likelihood_guard_message = str(error)
else:
    raise AssertionError("invalid likelihood was not rejected")

rng = Random(20260723)
success_probability = 0.37
samples = [
    1.0 if rng.random() < success_probability else 0.0
    for _ in range(100_000)
]
checkpoints = [10, 100, 1_000, 10_000, 100_000]
mean_trace = [
    (count, sum(samples[:count]) / count)
    for count in checkpoints
]

assert abs(sum(row_marginal) - 1.0) < 1e-12
assert abs(sum(column_marginal) - 1.0) < 1e-12
assert abs(sum(given_second_row) - 1.0) < 1e-12
assert zero_denominator_message == "conditioning denominator is zero"
assert abs(evidence - 0.35) < 1e-12
assert abs(posterior - 0.60) < 1e-12
assert likelihood_guard_message == "likelihood P(E|H) must lie in [0,1]"

print("row marginal:", row_marginal)
print("column marginal:", column_marginal)
print("conditional row 1:", given_second_row)
print("guard:", zero_denominator_message)
print("Bayes evidence and posterior:", evidence, posterior)
print("empirical mean trace:")
for count, estimate in mean_trace:
    print(f"  n={count:6d} mean={estimate:.5f}")
```

因为随机种子固定，这条轨迹可以复现；但它仍然只是一条样本路径，不是收敛定理的证明。防护同样重要：若程序静默地除以全零切片，它实现的就是另一条无效规则。

## 阶段检查

继续之前，先给出以下三项证据：

1. 面对任意联合表，指出被移除的轴，并验证得到的两个 marginal 都已经归一化。
2. 解释 conditioning 为什么是“选择、检查、重新归一化”，并准确说明遇到零分母时如何处理。
3. 画出四行 Bayes 账本，并解释 likelihood 与 posterior 为什么不同。

随后无需计算，直接说明 *uncorrelated* 用于标量、同一向量的分量以及两个随机向量时的三种不同含义。

## 综合练习

设 \(S\in\{-1,2\}\) 与 \(T\in\{0,1,2\}\) 的联合分布为

| \(S\backslash T\) | 0 | 1 | 2 |
|---|---:|---:|---:|
| -1 | 0.10 | 0.15 | 0.05 |
| 2 | 0.20 | 0.25 | 0.25 |

完成以下任务：

1. 验证归一化并计算两个 marginal；
2. 计算 \(P(S=2\mid T=2)\)，并写出分母；
3. 计算 \(\mathbb E[S]\)、\(\mathbb E[T]\) 与 \(\mathbb E[ST]\)；
4. 计算 \(\operatorname{Cov}(S,T)\) 与 \(\operatorname{Var}(S)\)；
5. 使用表中的一个条目检验 independence；
6. 对 \(\phi(s)=s^2\) 验证 Jensen's inequality；
7. 解释为什么重复抽样可以估计 \(\mathbb E[S]\)，却不会让有限 sample mean 路径变成单调路径。

## 完整答案

表中六项均非负且总和为一，因此已经归一化。行 marginal 为

\[
P(S=-1)=0.30,\qquad P(S=2)=0.70.
\]

列 marginal 为

\[
P(T=0)=0.30,\qquad P(T=1)=0.40,\qquad P(T=2)=0.30.
\]

Conditioning 分母为 \(P(T=2)=0.30>0\)，因此

\[
P(S=2\mid T=2)=\frac{0.25}{0.30}=\frac56.
\]

各阶矩为

\[
\mathbb E[S]=(-1)(0.30)+(2)(0.70)=1.10,
\]

\[
\mathbb E[T]=(1)(0.40)+(2)(0.30)=1.00,
\]

以及

\[
\mathbb E[ST]
=(-1)(1)(0.15)+(-1)(2)(0.05)
 +(2)(1)(0.25)+(2)(2)(0.25)
=1.25.
\]

所以

\[
\operatorname{Cov}(S,T)
=1.25-(1.10)(1.00)
=0.15.
\]

此外，

\[
\mathbb E[S^2]=(1)(0.30)+(4)(0.70)=3.10,
\]

所以

\[
\operatorname{Var}(S)=3.10-(1.10)^2=1.89.
\]

两个变量不 independent。例如，

\[
P(S=-1,T=0)=0.10
\ne
P(S=-1)P(T=0)=0.09.
\]

对于 convex 平方函数，

\[
(\mathbb E[S])^2=1.21
\le
\mathbb E[S^2]=3.10.
\]

在适当假设下重复进行 independent 抽样，sample mean 可以成为 \(\mathbb E[S]\) 的估计量。每个有限样本估计仍然是随机的；从一个检查点到下一个检查点，它既可能靠近，也可能远离 \(1.10\)。因此不能推出单调性。

## 常见错误与修复路径

### 错误 1——直接丢弃变量，而不是 marginalize

错误做法：选取一列方便的数据，并把它叫作 marginal。

修复：对被移除变量的每一个可能取值求和或积分，再验证所得 marginal 已经归一化。

### 错误 2——沿错误的轴归一化

错误做法：声称对行变量进行 conditioning，却使用列总和。

修复：先写出 conditioning 竖线后的事件，选出对应切片，再计算同一切片的总和。

### 错误 3——用零除以零

错误做法：对不可能发生的 conditioning event 报告 \(0/0=0\)。

修复：判定初等 conditional 比值未定义，并审计模型或题目所述观测。

### 错误 4——把 likelihood 当作 posterior

错误做法：把 \(P(data\mid hypothesis)\) 读成 \(P(hypothesis\mid data)\)。

修复：写出 Bayes 账本。用 likelihood 乘 prior，再除以正的 evidence。

### 错误 5——从 evidence 中漏掉竞争假设

错误做法：只把分子本身用作分母。

修复：在模型表示的每一个假设上汇总观测概率。

### 错误 6——用 independence 替换 conditional independence

错误做法：从分解式中删掉“给定 \(Z\)”。

修复：在每个概率项中明确保留 conditioning 分层。

### 错误 7——把 covariance 为零当作 independence

错误做法：从一个二阶摘要推出完整分解。

修复：检验联合分布。确定性的非线性关系也可能具有零 covariance。

### 错误 8——把对角 cross-covariance matrix 叫作零矩阵

错误做法：把同一向量分量两两 uncorrelated 的规则套到两个不同随机向量上。

修复：对于两个随机向量，必须要求完整 cross-covariance matrix 为零矩阵。

### 错误 9——混淆原始二阶矩与 variance

错误做法：把 \(\mathbb E[X^2]\) 报作 \(\operatorname{Var}(X)\)。

修复：减去 \(\mathbb E[X]^2\)，或者在平方前先中心化。

### 错误 10——反转 Jensen

错误做法：不检查曲率，只凭记忆选择不等号方向。

修复：先区分 convex 与 concave。对 convex 的 \(\phi\)，均值的变换不大于变换后的均值。

### 错误 11——错误地穷尽 Jensen 等号情形

错误做法：声称只有变量为常量或函数在全局范围内呈线性时等号才成立。

修复：使用完整边界：函数只需在 support 的相关 convex hull 上 affine。

### 错误 12——把 Law of Large Numbers 变成有限路径保证

错误做法：要求 sample mean 单调改善，或把未命名的箭头标成“almost sure”。

修复：提出正式主张前，先说明抽样假设与定理的 convergence mode。若题目没有给出模式，就只保留概念性陈述。
