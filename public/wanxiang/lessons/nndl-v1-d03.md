# 时间中的分布：随机过程（Stochastic Processes）

> 随机过程（stochastic process）不是一个不确定的数，而是一族按时间或空间编排的不确定量，以及规定哪些历史、转移与相关关系成立的一组规则。

## 前置诊断

本课使用以下前置知识：

- 读懂条件概率；
- 用矩阵左乘列向量；
- 检查概率向量（probability vector）非负且总和为一；
- 区分协方差（covariance）与方差（variance）；
- 读懂多元正态分布（multivariate normal distribution）；
- 求解小型线性方程组；
- 认识到：当每个二次型（quadratic form）`c^T K c` 都非负时，对称矩阵才是 positive semidefinite。

继续前，先回答以下问题：

1. 若 `p` 是概率列向量，`M p` 是下一时刻的分布，那么 `M` 的哪个方向必须和为一？
2. `M pi = pi` 是否说明了从其他任意初始分布出发会发生什么？
3. 若在给定当前状态后，转移只依赖当前状态，是否就能推出在不加该条件时未来与过去也独立？
4. 若 `epsilon` 的标准差为 `0.2`，其 variance 是多少？
5. 若有 `N` 个训练观测和一个测试输入，训练 covariance 矩阵与“测试到训练”的 covariance 行应分别具有什么形状？

诊断答案：

- 使用概率列向量并从左侧乘矩阵时，`M` 的每一列之和为一。
- `M pi = pi` 证明 `pi` 是 stationary distribution，但它本身不能证明从任意起点出发都会收敛。
- Markov 命题以当前状态为条件；去掉这个条件就改变了命题。
- variance 为 `0.2^2=0.04`。
- 两个形状分别是 `N x N` 与 `1 x N`。

若你不确定第一题，请在每次计算时都把下一节的方向约定框放在眼前。混用行约定与列约定，可能得到数值上看似合理、语义上却完全反向的结果。

## 首次术语

| 术语 | 本课所用含义 |
|---|---|
| `随机过程（stochastic process）` | 一族由集合 `T` 索引的随机变量（random variable）`{X_t : t in T}`。 |
| `索引集（index set）` | 标记时间点、空间位置或其他有序定义域的集合 `T`。 |
| `状态空间（state space）` | 每个过程变量可以取值的集合 `S`。 |
| `随机序列（random sequence）` | index set 离散的过程，常见形式为 `T={0,1,2,...}`。 |
| `随机场（random field）` | 由空间坐标或其他多维定义域索引的过程。 |
| `马尔可夫性质（Markov property）` | 给定当前状态后，下一状态分布不再需要更早的状态。 |
| `时间齐次（time-homogeneous）` | 每一个时间步都使用同一条转移规则。 |
| `马尔可夫链（Markov chain）` | 具有 Markov property 的离散时间过程。 |
| `转移矩阵（transition matrix）` | 汇集条件转移概率的矩阵。 |
| `列随机（column-stochastic）` | 元素非负、每列之和均为一的矩阵。 |
| `平稳分布（stationary distribution）` | 满足 `M pi=pi` 的概率向量 `pi`。 |
| `细致平衡（detailed balance）` | 在候选 stationary distribution 下，任意一对状态间的正向与反向概率流相等。 |
| `不可约（irreducible）` | 在有限链中，每个状态都能到达其他任意状态。 |
| `非周期（aperiodic）` | 链的返回时刻不被迫只能是某个大于一的整数的倍数。 |
| `高斯过程（Gaussian Process / GP）` | 任意有限变量集合都服从联合 multivariate normal distribution 的过程。 |
| `均值函数（mean function）` | `mu(x)=E[f(x)]`，即每个输入处先验（prior）分布的中心。 |
| `核函数／协方差函数（kernel / covariance function）` | `k(x,x')`，即赋给两个输入处过程值的 covariance。 |
| `半正定（positive semidefinite / PSD）` | kernel matrix 的性质：对每个系数向量 `c` 都有 `c^T K c>=0`。 |
| `长度尺度（length scale）` | 控制相似性随输入距离增大而下降速度的 kernel 参数。 |
| `噪声方差（noise variance）` | `sigma_n^2`，即观测噪声的 variance；`sigma_n` 是它的标准差。 |
| `后验（posterior）` | 用观测数据对先验模型 conditioning 后得到的分布。 |

### 方向约定框

本课始终使用同一套约定：

$$
M_{ij}
=
P(X_{t+1}=s_i\mid X_t=s_j).
$$

当前状态对应列索引 `j`，下一状态对应行索引 `i`。因此

$$
M_{ij}\ge0,
\qquad
\sum_i M_{ij}=1
\quad\text{for every column }j,
$$

而分布列向量按下式演化：

$$
p_{t+1}=M p_t.
$$

使用分布行向量的资料或程序通常写作 `p_{t+1}^T=p_t^T P`。这只是转置后的约定，并不是第二条规律。绝不能把一种约定下的矩阵元素与另一种约定下的更新方程混在一起。

## 核心讲解

<!-- wanxiang:block foundations-d03-process-markov:start -->
### 1. 过程为不确定性加上索引

标量随机变量描述单个量的不确定性。stochastic process 则是一个集合：

$$
\{X_t:t\in\mathcal T\}.
$$

index set `T` 回答“在哪里或何时”，state space `S` 回答“可能取什么值”。

例如：

- 每小时电力需求：`T={0,1,2,...}`，`S` 可以是非负实数；
- 连续监测的信号：`T` 是一个实数区间；
- 黑白图像：`T` 是二维像素网格，`S={0,1}`；
- 温度图：`T` 是一个空间区域，`S` 是实数温度范围。

当 `T` 离散时，这个过程可以称为 random sequence；当索引是空间坐标时，过程通常称为 random field。这里的“离散过程”指 index set 离散，并不强迫 state space 本身也离散。

像下面这样一列已经实现的取值：

```text
晴，阴，阴，雨，晴
```

只是一条样本路径（sample path），不是完整的概率模型。模型会为可能的路径或带索引变量的有限集合赋予概率。

### 2. Markov property 必须保留当前状态这个条件

对离散时间过程，一步 Markov property 为

$$
P(X_{t+1}=x_{t+1}\mid X_0=x_0,\ldots,X_t=x_t)
=
P(X_{t+1}=x_{t+1}\mid X_t=x_t).
$$

正确的解释是：

> 一旦给定当前状态，更早的状态就不会再为下一状态分布提供额外信息。

错误的解释是：

> 未来与过去独立。

若不以当前状态为条件，过去与未来可能高度相关。一个下雨的早晨可以预测下雨的下午，正是因为两者都经由当前天气状态相连。只有先给出当前状态，Markov property 才会移除更久远历史所带来的额外预测作用。

状态如何设计很重要。若候选状态遗漏了下一步所需的信息，观测到的过程可能不具备 Markov property；扩展状态、把这些信息纳入其中，可以恢复该性质。

### 3. 时间齐次与 transition matrix

time-homogeneous 链在每一步都使用相同的条件概率：

$$
P(X_{t+1}=s_i\mid X_t=s_j)=M_{ij},
$$

其中不存在对 `t` 的依赖。

在已经声明的 column-stochastic 约定下，第 `j` 列包含从当前状态 `s_j` 出发的所有可能目的状态。对 `K` 个状态，

$$
M\in\mathbb R^{K\times K},
\qquad
p_t\in\mathbb R^{K\times1}.
$$

更新式

$$
p_{t+1}=M p_t
$$

具有如下形状：

```text
(K x K)(K x 1) -> (K x 1).
```

概率总量之所以保持不变，是因为

$$
\mathbf 1^T p_{t+1}
=
\mathbf 1^T M p_t
=
\mathbf 1^T p_t,
$$

其中 column-stochastic 性质给出 `1^T M=1^T`。

### 4. 三状态轨迹例题

考虑下面这个原创例子：

$$
M=
\begin{bmatrix}
0.6&0.3&0.1\\
0.3&0.4&0.3\\
0.1&0.3&0.6
\end{bmatrix}.
$$

每个元素都非负，每一列之和均为一。从

$$
p_0=[1,0,0]^T,
$$

出发，前几步为

$$
p_1=M p_0=[0.6,0.3,0.1]^T,
$$

$$
p_2=M p_1=[0.46,0.33,0.21]^T,
$$

$$
p_3=M p_2=[0.396,0.333,0.271]^T.
$$

这个分布正在趋近

$$
\pi=[1/3,1/3,1/3]^T.
$$

这条轨迹提供了有用的数值证据，但 stationary 方程才是直接验证：

$$
M\pi=\pi.
$$

<!-- wanxiang:block foundations-d03-process-markov:end -->
<!-- wanxiang:block foundations-d03-stationary-balance:start -->
### 5. Stationary 不等于“已经从任意起点收敛”

stationary distribution 是满足下式的概率向量：

$$
\pi=M\pi.
$$

若链从 `pi` 出发，一步之后仍然是 `pi`，此后每一步也都会保持 `pi`。这是一个不变性（invariance）命题。

从任意初始分布收敛则是另一个命题：

$$
M^t p_0\longrightarrow\pi
\quad\text{as }t\to\infty.
$$

仅凭 stationary 方程不能推出这个极限。有限链可能拥有多个闭合类，也可能发生周期振荡。

例如，

$$
F=
\begin{bmatrix}
0&1\\
1&0
\end{bmatrix}
$$

是 column-stochastic 的，并且具有 stationary distribution `[1/2,1/2]^T`。它对这个分布也满足 detailed balance。然而，从 `[1,0]^T` 出发时，序列会永远在 `[1,0]^T` 与 `[0,1]^T` 之间交替。stationary distribution 虽然存在，但这条周期链不会从该起点收敛。

### 6. Detailed balance 可以证明 stationarity

在本课的列约定下，从当前状态 `j` 流向下一状态 `i` 的概率流为

$$
\pi_j M_{ij}.
$$

detailed balance 要求

$$
\boxed{\pi_j M_{ij}=\pi_i M_{ji}}
\qquad\text{for every }i,j.
$$

这是与已声明列方向一致的原始关系式。它表示在 `pi` 下，每一对状态间的正向概率流都与反向概率流相等。

对 `j` 求和可得

$$
\begin{aligned}
(M\pi)_i
&=\sum_j M_{ij}\pi_j\\
&=\sum_j M_{ji}\pi_i\\
&=\pi_i\sum_j M_{ji}\\
&=\pi_i.
\end{aligned}
$$

最后一个求和针对第 `i` 列，因此等于一。所以 detailed balance 蕴含 stationarity。

逻辑箭头到这里就停止：

$$
\text{detailed balance}
\Longrightarrow
\text{stationary}.
$$

正如两状态翻转例子所示，它本身不能推出从每个初始分布出发都会收敛。

### 7. 有限状态收敛还需要什么

**准确性补充（accuracy extension）。** 原始资料引入了 detailed balance，但本课保留的原资料层结论仅为：detailed balance 使 `pi` stationary。下一段的有限状态收敛定理属于额外补充的准确性边界，不能把它悄然归作 detailed balance 的推论。

对有限链，一条标准的充分条件路径是：

1. 链 irreducible，因此每个状态都与其他任意状态互通；
2. 链 aperiodic，因此运动不会被锁在固定循环中。

在这些条件下，链具有唯一的 stationary distribution，并会从任意初始分布收敛到它。该收敛定理并不要求 detailed balance；许多不可逆链同样会收敛。

作为同一项准确性补充，在 irreducible 有限链中，存在正概率自转移（self-transition）通常是证明 aperiodicity 的简便方式，因为一步即可返回会打破长度大于一的强制循环。这是一个充分的诊断依据，并不是 aperiodicity 的定义。

定理边界十分重要：

- 只有 detailed balance：验证了 stationary distribution；
- 有限状态下 irreducible 加 aperiodic：得到唯一 stationary distribution，并从任意起点收敛；
- 两条结论都不能被提升为无需假设的保证。

<!-- wanxiang:block foundations-d03-stationary-balance:end -->
<!-- wanxiang:block foundations-d03-gp-conditioning:start -->
### 8. Gaussian Process 描述函数上的分布

Gaussian Process 是这样一种过程：其中任意有限变量集合都联合服从高斯分布。对输入

$$
X=[x_1,\ldots,x_N],
$$

有限向量

$$
f_X=[f(x_1),\ldots,f(x_N)]^T
$$

满足

$$
f_X\sim\mathcal N(\mu(X),K(X,X)).
$$

均值向量的元素为

$$
\mu(X)_i=\mu(x_i),
$$

covariance 矩阵的元素为

$$
K(X,X)_{ij}=k(x_i,x_j).
$$

等价地说，过程值的每个有限线性组合都服从一元高斯分布。这些 finite-dimensional distribution 必须彼此相容：重排输入会以相同方式重排高斯向量与 covariance 矩阵，移除一个输入则会得到对应的高斯边缘分布。这种相容性使模型描述的是同一个过程，而不是每种选定规模下彼此无关的高斯向量。在回归中，这一结构可视为可能函数上的分布，并在给出预测的同时返回以模型为条件的不确定性。

### 9. 有效 kernel 必须生成 PSD covariance 矩阵

对称性是必要条件：

$$
k(x,x')=k(x',x).
$$

但它并不充分。对每个有限输入集合以及每个系数向量 `c`，都必须有

$$
\boxed{c^T K(X,X)c\ge0.}
$$

因此，有效的 kernel matrix 必须 positive semidefinite。之所以需要这个条件，是因为线性组合 `c^T f_X` 的 variance 恰好是 `c^T K c`，而 variance 不可能为负。

一种常见 kernel 是平方指数核（squared-exponential kernel）：

$$
k(x_i,x_j)
=
\exp\left(
-\frac{||x_i-x_j||^2}{2\ell^2}
\right),
$$

其中，正的 length scale `ell` 控制相似性随距离增加而下降的速度。相近输入间的 covariance 接近一，距离很远的输入间 covariance 接近零。这里展示的公式使用单位先验 variance，与原资料形式一致。

### 10. 观测噪声使用 variance

令

$$
y_n=f(x_n)+\epsilon_n,
\qquad
\epsilon_n\sim\mathcal N(0,\sigma_n^2).
$$

观测模型还假设各噪声项相互独立，并且与潜在（latent）过程值独立。写成向量形式为

$$
\epsilon\sim\mathcal N(0,\sigma_n^2 I_N),
\qquad
\epsilon\perp f_X.
$$

正是这些独立性假设，而不只是相同的边缘 variance，使噪声 covariance 成为对角矩阵，并消除它与 `f_X` 之间的交叉 covariance 项。

符号

$$
\boxed{\sigma_n^2}
$$

表示 noise variance，符号 `sigma_n` 则表示 noise standard deviation。因此，训练观测的 covariance 为

$$
A=K(X,X)+\sigma_n^2 I_N.
$$

加入非负的对角 variance 会保持 positive semidefinite。若 `sigma_n^2>0`，则 `A` 正定（positive definite）。数值计算时，应使用 `A` 求解线性方程组；不要仅仅因为代数表达式写成 `A^{-1}`，就显式构造矩阵逆。

### 11. Conditioning 与形状追踪

对一个测试输入 `x_*`，定义

$$
k_{*X}=K(x_*,X)\in\mathbb R^{1\times N},
$$

$$
k_{X*}=K(X,x_*)=k_{*X}^T\in\mathbb R^{N\times1},
$$

以及

$$
k_{**}=k(x_*,x_*)\in\mathbb R.
$$

训练观测与潜在测试值的联合模型为

$$
\begin{bmatrix}
y\\
f_*
\end{bmatrix}
\sim
\mathcal N
\left(
\begin{bmatrix}
\mu_X\\
\mu_*
\end{bmatrix},
\begin{bmatrix}
A&k_{X*}\\
k_{*X}&k_{**}
\end{bmatrix}
\right).
$$

conditioning 得到单点潜在 posterior：

$$
p(f_*\mid X,y)=\mathcal N(m_*,v_*),
$$

其均值为

$$
m_*
=
\mu_*+k_{*X}A^{-1}(y-\mu_X)
$$

而 variance 为

$$
v_*
=
k_{**}-k_{*X}A^{-1}k_{X*}.
$$

当 mean function 设为零时，均值简化为

$$
m_*=k_{*X}A^{-1}y.
$$

形状账本如下：

| 对象 | 形状 |
|---|---:|
| `X`，包含 `N` 个 `d` 维输入 | `N x d` |
| `y`, `mu_X` | `N x 1` |
| `K(X,X)`, `A` | `N x N` |
| `k_*X` | `1 x N` |
| `k_X*` | `N x 1` |
| `m_*`, `v_*`, `k_**` | 标量 |

posterior 均值等于先验均值加上由 covariance 加权的残差修正；posterior variance 等于先验 variance 减去由训练 covariance 所解释的部分。这些公式描述的是在所示联合模型下，潜在过程值的不确定性。

### 12. Posterior 能保证什么、不能保证什么

kernel 决定哪些输入位置会共享信息。较长的 length scale 会把影响传播得更远，较短的 length scale 会使观测的作用更局部。

noise variance 控制模型对观测的信任程度。较大的 `sigma_n^2` 会增大 `A`、削弱修正，通常也会留下更多 posterior 不确定性。若 `sigma_n` 表示标准差，加入 `sigma_n I` 就是错误的。

狭窄的 posterior 带以所选 kernel、超参数（hyperparameter）与噪声模型为条件。它并不是一种无需假设的保证，不能证明未知世界一定平滑，也不能证明模型一定正确。

<!-- wanxiang:block foundations-d03-gp-conditioning:end -->

## 完整因果链

### 因果链 A：辨认 stochastic process

1. 写出带索引的随机变量 `X_t`。
2. 声明 index set `T`。
3. 声明 state space `S`。
4. 判断索引是离散、连续、空间坐标还是其他定义域。
5. 把一条观测路径与可能路径上的分布区分开。
6. 记录将要分析哪个有限变量集合。

### 因果链 B：审计有限 Markov chain

1. 声明 `M_ij=P(next=i | current=j)`。
2. 检查 `M_ij>=0`。
3. 检查每一列之和均为一。
4. 用 `K x 1` 列向量表示当前分布。
5. 计算 `p_(t+1)=M p_t`。
6. 验证每一个结果分布仍保持归一化（normalization）。
7. 用 `M pi=pi` 检验 stationarity。
8. 若声称满足 detailed balance，对每一对状态检验 `pi_j M_ij=pi_i M_ji`。
9. 从 detailed balance 只推出 stationarity。
10. 声称从任意起点收敛前，检查有限状态下的 irreducibility 与 aperiodicity。

### 因果链 C：对小型 Gaussian Process 做 conditioning

1. 声明训练输入形状 `N x d` 与观测形状 `N x 1`。
2. 构造对称的 `K(X,X)`。
3. 检查 kernel matrix positive semidefinite。
4. 使用 noise variance，加入 `sigma_n^2 I_N`。
5. 构造形状为 `1 x N` 的 `k_*X`，以及形状为 `N x 1` 的转置。
6. 求解 `A alpha=y-mu_X`。
7. 计算 `m_*=mu_*+k_*X alpha`。
8. 求解 `A beta=k_X*`。
9. 计算 `v_*=k_**-k_*X beta`。
10. 检查每个结果是否具有预期形状，并确认 variance 在数值容差内非负。
11. 把结论限定在所选先验、kernel 与噪声模型内。

## 图示与状态追踪

### 过程、索引与状态图

```text
索引集 T：       0 -------- 1 -------- 2 -------- 3
                 |          |          |          |
随机变量：       X_0        X_1        X_2        X_3
                 |          |          |          |
状态空间 S：     每个 X_t 都从同一个已声明集合中取一个值

一条样本路径：   s_2        s_2        s_1        s_3
模型：           许多可能路径上的概率，而不只描述这一条路径
```

### Column-stochastic 轨迹

| 检查项 | 例题矩阵的结果 |
|---|---|
| 元素非负 | 通过 |
| 列和 | `1,1,1` |
| `p_0` | `[1,0,0]^T` |
| `p_1` | `[0.6,0.3,0.1]^T` |
| `p_2` | `[0.46,0.33,0.21]^T` |
| stationary 候选 | `[1/3,1/3,1/3]^T` |
| stationary 残差 | `M pi-pi=0` |

### Detailed balance 概率流表

对例题中的对称矩阵与均匀 `pi`，从当前状态 `j` 流向下一状态 `i` 的概率流为 `pi_j M_ij`。

| 状态对 | 正向概率流 | 反向概率流 | 平衡？ |
|---|---:|---:|---|
| `1 <-> 2` | `(1/3)(0.3)` | `(1/3)(0.3)` | 是 |
| `1 <-> 3` | `(1/3)(0.1)` | `(1/3)(0.1)` | 是 |
| `2 <-> 3` | `(1/3)(0.3)` | `(1/3)(0.3)` | 是 |

这张表证明了该例中每一对状态间的概率流相等。收敛结论仍然需要 irreducibility 与 aperiodicity，不能只凭这张表得到。

### 原创 kernel 热力图

对输入 `-1,0,1`，当 `ell=1` 时，squared-exponential covariance 矩阵近似为

$$
\begin{bmatrix}
1.0000&0.6065&0.1353\\
0.6065&1.0000&0.6065\\
0.1353&0.6065&1.0000
\end{bmatrix}.
$$

强度示意如下：

```text
          x=-1   x=0   x=1
x=-1      ████   ███    █
x=0        ███  ████   ███
x=1          █   ███  ████
```

对角线最强，因为每个输入都与自身完全相同。相邻输入共享的 covariance 比两个端点之间更多。

### 一维 posterior 示意图

```text
先验不确定性：          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
观测：                         x          x       x
后验不确定性：          ~~~~~~---~~~~~~~~---~~~~~---~~~~
后验均值：                _____/ \________/ \_____/ \___
输入轴：                 -------------------------------->
```

图中的收窄是定性示意：训练位置通过 kernel 降低不确定性。具体幅度取决于距离、length scale 与 noise variance。

## 可执行代码

下面这一个 NumPy 程序会检查有限 Markov 例子，以及一个小型 Gaussian Process conditioning 问题。它把概率向量与观测向量显式存成 `(K,1)` 与 `(N,1)` 数组，使用已经声明的 column-stochastic 约定，并通过求解线性方程组来代替显式构造矩阵逆。

```python
import numpy as np


def check_markov_chain(matrix, candidate, start, steps=8, tolerance=1e-12):
    matrix = np.asarray(matrix, dtype=float)
    candidate = np.asarray(candidate, dtype=float)
    current = np.asarray(start, dtype=float)

    if matrix.ndim != 2 or matrix.shape[0] != matrix.shape[1]:
        raise ValueError("transition matrix must be square")
    state_count = matrix.shape[0]
    if candidate.shape != (state_count, 1) or current.shape != (state_count, 1):
        raise ValueError("distributions must have explicit shape (K, 1)")
    if np.any(matrix < -tolerance):
        raise ValueError("transition matrix contains a negative entry")
    if not np.allclose(matrix.sum(axis=0), np.ones(state_count), atol=tolerance):
        raise ValueError("columns must sum to one under the declared convention")
    if np.any(candidate < -tolerance) or not np.isclose(candidate.sum(), 1.0):
        raise ValueError("candidate is not a probability distribution")
    if np.any(current < -tolerance) or not np.isclose(current.sum(), 1.0):
        raise ValueError("start is not a probability distribution")

    stationary_residual = np.max(np.abs(matrix @ candidate - candidate))
    flow = matrix * candidate.T
    balance_residual = np.max(np.abs(flow - flow.T))

    adjacency = matrix > tolerance
    reachable = adjacency.copy()
    np.fill_diagonal(reachable, True)
    for middle in range(state_count):
        reachable |= reachable[:, middle, None] & reachable[middle, None, :]
    irreducible = bool(np.all(reachable))
    aperiodic_by_self_loop = bool(
        irreducible and np.any(np.diag(matrix) > tolerance)
    )

    history = [current.copy()]
    for _ in range(steps):
        current = matrix @ current
        assert np.all(current >= -tolerance)
        assert np.isclose(current.sum(), 1.0)
        history.append(current.copy())

    return {
        "stationary_residual": stationary_residual,
        "balance_residual": balance_residual,
        "irreducible": irreducible,
        "aperiodic_by_self_loop": aperiodic_by_self_loop,
        "history": np.asarray(history),
    }


def squared_exponential(left, right, length_scale=1.0):
    left = np.atleast_2d(np.asarray(left, dtype=float))
    right = np.atleast_2d(np.asarray(right, dtype=float))
    if not np.isfinite(length_scale) or length_scale <= 0:
        raise ValueError("length_scale must be finite and strictly positive")
    squared_distance = (
        (left[:, None, :] - right[None, :, :]) ** 2
    ).sum(axis=2)
    return np.exp(-0.5 * squared_distance / length_scale**2)


def gp_condition(train_x, train_y, test_x, length_scale, noise_variance):
    train_x = np.atleast_2d(np.asarray(train_x, dtype=float))
    train_y = np.asarray(train_y, dtype=float)
    test_x = np.atleast_2d(np.asarray(test_x, dtype=float))
    sample_count = train_x.shape[0]

    if train_y.shape != (sample_count, 1):
        raise ValueError("train_y must have explicit shape (N, 1)")
    if test_x.shape[0] != 1:
        raise ValueError("this demonstration expects exactly one test input")
    if noise_variance < 0:
        raise ValueError("noise variance must be nonnegative")

    kernel_xx = squared_exponential(train_x, train_x, length_scale)
    kernel_star_x = squared_exponential(test_x, train_x, length_scale)
    kernel_x_star = kernel_star_x.T
    kernel_star_star = squared_exponential(test_x, test_x, length_scale)[0, 0]
    system = kernel_xx + noise_variance * np.eye(sample_count)

    eigenvalues = np.linalg.eigvalsh(kernel_xx)
    assert eigenvalues.min() >= -1e-12
    assert kernel_xx.shape == (sample_count, sample_count)
    assert kernel_star_x.shape == (1, sample_count)
    assert kernel_x_star.shape == (sample_count, 1)

    mean_weights = np.linalg.solve(system, train_y)
    variance_weights = np.linalg.solve(system, kernel_x_star)
    posterior_mean = (kernel_star_x @ mean_weights).item()
    posterior_variance = (
        kernel_star_star - kernel_star_x @ variance_weights
    ).item()
    assert posterior_variance >= -1e-12

    return {
        "kernel_eigenvalues": eigenvalues,
        "posterior_mean": posterior_mean,
        "posterior_variance": max(0.0, posterior_variance),
        "shapes": (
            kernel_xx.shape,
            kernel_star_x.shape,
            kernel_x_star.shape,
        ),
    }


transition = np.array(
    [
        [0.6, 0.3, 0.1],
        [0.3, 0.4, 0.3],
        [0.1, 0.3, 0.6],
    ]
)
stationary = np.array([[1.0 / 3.0], [1.0 / 3.0], [1.0 / 3.0]])
start = np.array([[1.0], [0.0], [0.0]])
markov = check_markov_chain(transition, stationary, start)

assert markov["stationary_residual"] < 1e-12
assert markov["balance_residual"] < 1e-12
assert markov["irreducible"]
assert markov["aperiodic_by_self_loop"]

try:
    squared_exponential([[0.0]], [[1.0]], length_scale=0.0)
except ValueError as error:
    assert "strictly positive" in str(error)
else:
    raise AssertionError("nonpositive length_scale was not rejected")

gp = gp_condition(
    train_x=[[-1.5], [0.0], [1.5]],
    train_y=[[0.3], [-0.1], [1.2]],
    test_x=[[0.75]],
    length_scale=1.1,
    noise_variance=0.04,
)

print("Markov p0:", markov["history"][0])
print("Markov p3:", markov["history"][3])
print("Markov p8:", markov["history"][-1])
print("stationary residual:", markov["stationary_residual"])
print("detailed-balance residual:", markov["balance_residual"])
print("GP shapes:", gp["shapes"])
print("GP kernel eigenvalues:", gp["kernel_eigenvalues"])
print("GP posterior mean:", gp["posterior_mean"])
print("GP posterior variance:", gp["posterior_variance"])
```

Markov 部分的断言为该例建立了归一化、stationarity、detailed balance、可达性以及 aperiodicity 见证。Gaussian Process 部分的断言则建立了矩阵形状、数值容差内的 kernel PSD，以及非负的潜在 posterior variance。

## 阶段检查

### 检查 A：辨认过程

对每小时电力需求过程，声明它的 index set、state space，并说明一天的记录与过程模型有何区别。

### 检查 B：读取一列转移概率

使用例题中的 `3 x 3` 矩阵，用文字解释它的第二列，然后用该矩阵乘 `[0,1,0]^T`。

### 检查 C：验证 stationarity

用例题矩阵乘均匀候选分布，并准确说明残差为零证明了什么。

### 检查 D：驳回错误的收敛主张

使用两状态翻转矩阵说明：stationarity 与 detailed balance 可以同时成立，而从任意起点出发的分布仍可能不收敛。

### 检查 E：追踪高斯形状

当 `N=3` 时，列出 `K(X,X)`、`k_*X`、`k_X*`、`y`、`m_*` 与 `v_*` 的形状。

## 综合练习

### 练习 1：状态设计与 Markov 命题

某设备状态只记录服务器是“忙碌”还是“空闲”，但下一次转移还取决于服务器已经连续忙碌了多久。

1. 解释为什么这个只有两个标签的过程可能不满足 Markov property。
2. 提出一种扩展状态。
3. 针对扩展后的状态，重新表述 conditional independence 命题。

### 练习 2：另一条两状态链

使用 column-stochastic 矩阵

$$
R=
\begin{bmatrix}
0.9&0.4\\
0.1&0.6
\end{bmatrix}
$$

以及 `p_0=[0.2,0.8]^T`。

1. 计算 `p_1`。
2. 在 `pi_1+pi_2=1` 下求解 `R pi=pi`。
3. 检查 detailed balance。
4. 解释为什么正概率的跨状态转移与自转移支持有限状态下的 irreducible 与 aperiodic 条件。

### 练习 3：kernel 与噪声审计

假设某候选 covariance 矩阵为

$$
K=
\begin{bmatrix}
1&1.2\\
1.2&1
\end{bmatrix}.
$$

1. 使用 `c=[1,-1]^T` 检验 `c^T K c`。
2. 判断它能否成为有效的 covariance 矩阵。
3. 若观测噪声的标准差为 `0.3`，写出正确的对角噪声项。

### 练习 4：posterior 形状账本

当 `N=4` 时，为下式建立形状账本：

$$
k_{*X}(K(X,X)+\sigma_n^2I)^{-1}(y-\mu_X)
$$

再为下式建立形状账本：

$$
k_{*X}(K(X,X)+\sigma_n^2I)^{-1}k_{X*}.
$$

解释为什么两个最终结果都是标量。

## 完整答案

### 阶段检查 A

对每小时需求，一种自然的 index set 是观测窗口内的整数小时；state space 可以是非负的实数功率值。一天的数据是一条已实现路径，而过程模型描述可能路径上的概率或 finite-dimensional distribution。

### 阶段检查 B

第二列为 `[0.3,0.4,0.3]^T`。给定当前状态 `2`，下一状态分别以 `0.3`、`0.4`、`0.3` 的概率取 `1`、`2`、`3`。乘以当前状态的独热（one-hot）分布，就会选出这一列。

### 阶段检查 C

例题矩阵的每一行之和也为一，因此乘以均匀向量后仍得到同一个均匀向量。残差 `M pi-pi` 为零。这证明的是 stationarity，而不是从每个起点出发都会收敛。

### 阶段检查 D

翻转矩阵会保持 `[1/2,1/2]^T`，两个方向的概率流也都为 `1/2`。然而从 `[1,0]^T` 出发时，

```text
p0=[1,0]^T
p1=[0,1]^T
p2=[1,0]^T
```

周期为二的振荡阻止了收敛。

### 阶段检查 E

各形状为：

```text
K(X,X): 3 x 3
k_*X:   1 x 3
k_X*:   3 x 1
y:      3 x 1
m_*:    scalar
v_*:    scalar
```

### 综合练习 1

下一次转移依赖已经持续的忙碌时间，而当前的二标签状态没有包含这项信息。更早的标签可能透露缺失的持续时长，因此仍能改进对下一状态的预测。扩展状态可以写成 `(忙碌/空闲, 持续时长分箱)`。给定这个扩展后的当前状态，下一状态分布就不应再需要更早的扩展状态。

### 综合练习 2

第一次更新为

$$
p_1=
\begin{bmatrix}
0.9&0.4\\
0.1&0.6
\end{bmatrix}
\begin{bmatrix}
0.2\\0.8
\end{bmatrix}
=
\begin{bmatrix}
0.5\\0.5
\end{bmatrix}.
$$

stationarity 给出 `0.1 pi_1=0.4 pi_2`，因此

$$
\pi=[0.8,0.2]^T.
$$

detailed balance 成立，因为

$$
\pi_1R_{21}=0.8(0.1)=0.08
=
0.2(0.4)=\pi_2R_{12}.
$$

两个跨状态转移概率都为正，因此两状态互通。正概率自转移会打破强制交替，从而给出 aperiodicity 见证。

### 综合练习 3

取 `c=[1,-1]^T`，

$$
c^T K c
=
1+1-2(1.2)
=
-0.4.
$$

负的 quadratic form 证明 `K` 不是 positive semidefinite，因此不能作为 covariance 矩阵。噪声标准差 `0.3` 对应 variance `0.09`，所以对角项为 `0.09 I`。

### 综合练习 4

均值修正的形状为

```text
(1 x 4)(4 x 4)(4 x 1) -> scalar.
```

variance 缩减项的形状为

```text
(1 x 4)(4 x 4)(4 x 1) -> scalar.
```

逆矩阵记号表示用 `4 x 4` 训练系统求解。两端的对象都只选择一个测试点，所以每个乘积最终都是 `1 x 1`，解释为标量。

## 常见错误与修复路径

### 错误 1：混淆 index set 与 state space

症状：把“第 3 小时”说成一种天气状态。

修复路径：

1. 用 `t in T` 标记“在哪里或何时”。
2. 用 `X_t in S` 标记可能取值。
3. 声明两个集合以后，再写出一条 sample path。

### 错误 2：从 Markov property 中丢掉条件

症状：“未来与过去独立。”

修复路径：

1. 写出完整的条件概率。
2. 圈出等式两边的当前状态。
3. 明确说“以当前状态为条件后，不再有额外信息”。

### 错误 3：混用转移约定

症状：列和约定与行向量更新式混用。

修复路径：

1. 声明 `M_ij=P(next=i | current=j)`。
2. 检查各列。
3. 使用 `p_(t+1)=M p_t`。
4. 若必须采用另一种约定，把这三部分一起转置。

### 错误 4：把 stationary 当作已经收敛

症状：由 `M pi=pi` 直接断言每个 `p_0` 都趋近 `pi`。

修复路径：

1. 把该方程称为不变性检验。
2. 检查互通类（communicating class）。
3. 检查周期性。
4. 声称从任意起点收敛前，先说明有限链 irreducible 且 aperiodic 的条件。

### 错误 5：夸大 detailed balance 的结论

症状：把成对概率流相等称为完整的收敛证明。

修复路径：

1. 对概率流等式求和，以证明 stationarity。
2. 让这段证明在 `M pi=pi` 处停止。
3. 用独立的遍历性（ergodicity）论证证明收敛。

### 错误 6：未检查 PSD 就接受对称 kernel

症状：矩阵对称，所以它一定是 covariance。

修复路径：

1. 检查特征值（eigenvalue）或 quadratic form。
2. 若存在负方向，把它找出来。
3. 只要某个线性组合方向上的 variance 为负，就驳回该候选 covariance。

### 错误 7：把 noise standard deviation 当作 variance

症状：向训练 covariance 中加入 `sigma_n I`。

修复路径：

1. 读取噪声模型 `N(0,sigma_n^2)`。
2. 明确 `sigma_n^2` 才是 noise variance。
3. 加入 `sigma_n^2 I_N`。

### 错误 8：转置错 GP 交叉 covariance

症状：试图在 posterior 均值中计算 `(N x 1)(N x N)`。

修复路径：

1. 让均值修正从形状为 `1 x N` 的 `k_*X` 开始。
2. 求解 `N x N` 方程组。
3. 最后接上 `N x 1` 残差向量。

### 错误 9：把 posterior 称为不依赖模型的真理

症状：把狭窄的 variance 当成对现实的确定性。

修复路径：

1. 指明 kernel；
2. 指明 length scale；
3. 指明 noise variance；
4. 把结论限定在 conditioning 后的模型内。
