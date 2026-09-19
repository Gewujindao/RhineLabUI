# 万象合流：从变化到信息

## 跨单元复盘

<!-- wanxiang:block foundations-int-change-update:start -->
### 1. 先问“它是什么”，再问“怎么算”

同一个符号可能代表标量、向量、矩阵、随机变量或概率分布。运算合法性由对象决定：

- 标量对向量的导数通常以梯度表示；
- 向量对向量的导数是 Jacobian；
- 标量目标的二阶导数是 Hessian；
- 概率向量必须逐项非负且总和为一；
- 协方差矩阵必须与随机向量维度一致；
- 条件概率的分母必须为正；
- KL、交叉熵和 Wasserstein 距离都比较分布，但它们需要的声明不同。

因此，任何综合题都先写一行账本：

```text
input / parameter shape -> intermediate shape -> output or scalar objective
probability support -> normalization -> expectation direction -> unit
```

形状不一致时，后面的数字没有解释；概率不合法时，后面的信息量也没有解释。

### 2. 从局部变化走到参数更新

设标量目标为 `L(w)`。在当前位置 `w` 附近，一阶 Taylor 模型给出

```text
L(w + Delta w) approximately L(w) + gradient(L)(w)^T Delta w.
```

若选择 `Delta w = -eta * gradient(L)(w)` 且 `eta>0`，线性项为

```text
-eta * ||gradient(L)(w)||^2,
```

当 `∇L(w)≠0` 时，负梯度是局部下降方向；在驻点处它是零向量。即使非零，这仍然只是局部模型，不自动保证任意步长都下降。

若目标由多层计算构成，例如

```text
w -> z = w^T x -> a = sigmoid(z) -> L(a),
```

以下固定 `x` 为输入并采用列梯度约定。链式法则沿依赖路径、按形状相容的次序复合局部导数，得到 `∇_w L ∈ R^{d×1}`。例如令 `r=Xw-y` 且 `L=1/2 ||r||^2`，才有 `∇_w L=X^T r`；一般损失仍须按自身计算图应用链式法则。计算后再把梯度送入

```text
w_next = w - eta * gradient_w L.
```

“导数正确”和“更新正确”是两道门：前者检查依赖路径，后者还要检查负号、步长与当前状态。
<!-- wanxiang:block foundations-int-change-update:end -->

<!-- wanxiang:block foundations-int-probability-information:start -->
### 3. 从分数走到概率，再走到损失

Sigmoid 把一个实数映射到 `(0,1)`；Softmax 把一组实数分数映射为正且和为一的概率向量。对 Softmax，

```text
q_i = exp(z_i) / sum_j exp(z_j).
```

给所有 `z_i` 加同一个常数不会改变 `q`。这既是代数性质，也允许先减去最大分数再计算，避免不必要的数值溢出。

当真实分布为 `p`、模型分布为 `q` 时，交叉熵必须保留方向：

```text
H(p,q) = -sum_x p(x) log q(x).
```

第一项 `p` 提供期望权重，第二项 `q` 提供被评分的概率。对数底为二时单位是 bits；底为 `e` 时单位是 nats。若存在 `p(x)>0` 而 `q(x)=0`，交叉熵与 `KL(p||q)` 都会发散，不能用 `0 log 0=0` 掩盖。

### 4. 从观测走到后验，再走到信息减少

Bayes 关系把先验、似然和证据连接为后验：

```text
posterior = likelihood * prior / evidence.
```

证据是归一化常数，也必须大于零。得到后验后，熵可以量化剩余不确定性；互信息可以写成

```text
I(X;Y) = H(X) - H(X|Y).
```

这里的条件熵是对所有具有正概率的条件分层取平均，而不是只挑一个有利观测。一个观测后的熵可以用于解释该观测，却不能直接冒充完整互信息。
<!-- wanxiang:block foundations-int-probability-information:end -->

<!-- wanxiang:block foundations-int-constraints-process:start -->
### 5. 约束、概率与最优性必须同时成立

概率向量经常同时受到

```text
p_i >= 0,    sum_i p_i = 1
```

的约束。若再加入容量或阈值限制，就得到一个约束优化问题。记等式约束为 `h_j(x)=0`，本关固定

```text
L(x,lambda,nu) = f(x) + sum_i lambda_i g_i(x) + sum_j nu_j h_j(x),
lambda_i >= 0,    nu_j has no sign restriction.
```

在这个符号约定下，KKT 审计包括：

1. primal feasibility（原问题可行性）；
2. dual feasibility（不等式乘子非负）；
3. stationarity（Lagrangian 驻点）；
4. complementary slackness（互补松弛）；
5. equality constraints（等式约束）。

等式可行性属于 primal feasibility，也必须进入 stationarity；等式乘子 `nu_j` 不受非负限制。活动不等式约束满足 `g_i(x)=0`，但这本身不推出对应乘子必为正。只有把驻点方程和其余条件一起解出，才能知道该题里的乘子值。对于凸目标与仿射约束，完整且满足相应假设的 KKT 证据可以给出全局最优性；离开这些假设时，不得照搬结论。

### 6. 时间更新与分布比较是两层问题

在声明的列随机约定下，有限状态 Markov 链写作

```text
p_(t+1) = M p_t,
```

其中 `M_ij>=0`，且每一列和为一。先用矩阵更新得到下一时刻分布，再选择比较量。若使用 `KL(p_t||pi)`，必须保留方向并检查 `pi` 在 `p_t` 的正质量位置上是否为正。

Gaussian Process 的条件计算也先看形状。若有 `N` 个训练点，

```text
K + sigma_n^2 I_N : N x N
k_*                 : 1 x N
k_*^T               : N x 1
```

在独立同方差高斯观测噪声假设下，观测噪声进入训练协方差时使用方差 `sigma_n^2`，不是标准差 `sigma_n`。

比较一维高斯分布时，平方二阶 Wasserstein 量可写成

```text
W_2^2 = (mu_1 - mu_2)^2 + (sigma_1 - sigma_2)^2.
```

右侧是平方距离；真正的 `W_2` 还要取平方根。协方差给的是 `sigma^2`，代入该一维式前应先得到标准差 `sigma`。
<!-- wanxiang:block foundations-int-constraints-process:end -->

## 证据链模板

每一道题都按下列顺序落笔。并非每题需要七行，但不得跳过与题目有关的门。

| 门 | 必须留下的证据 |
| --- | --- |
| 1. 对象 | 标量、向量、矩阵、随机变量或分布 |
| 2. 形状与支持 | 维度、合法乘法、概率支持、正规化 |
| 3. 方向与约定 | 导数布局、更新正负号、条件分母、KL 顺序、对数底 |
| 4. 中间状态 | logits、概率、残差、梯度、后验或下一时刻分布 |
| 5. 核心计算 | 链式法则、期望、KKT、熵或运输距离 |
| 6. 边界 | 局部而非全局、零分母、零支持、活动约束、平方量 |
| 7. 结论 | 数值、单位与逻辑强度 |

一个只有最终小数的答案不可审计。一个只有概念名、没有代入过程的答案也不可审计。
