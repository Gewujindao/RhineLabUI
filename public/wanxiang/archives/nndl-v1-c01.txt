# 沿坡而下：方向、步长与可信的下降

> 优化不是追随任何一支看似朝下的箭头。它要求先声明问题，再检查候选点究竟能证明什么，并控制迭代搜索的每一步。

## 前置诊断

本课使用以下前置知识：

- 计算标量函数在一点的取值；
- 计算一阶和二阶导数；
- 读懂向量内积；
- 使用一阶 Taylor model 和二阶泰勒模型（second-order Taylor model）；
- 通过“对每个向量 `v` 都有 `v^T H v >= 0`”识别半正定矩阵（positive semidefinite matrix）。

继续之前，先回答下列问题：

1. 如果 `g` 是非零向量，`(-g)^T g` 等于多少？
2. 仅凭 `f'(a)=0` 能否证明 `a` 是最小值点？
3. 如果变量必须取整数，搜索域是否连续？
4. 如果目标函数是线性的，但有一个约束是二次的，完整问题是否属于线性规划？
5. 如果一种迭代方法连续两步降低了目标值，是否已经证明全局收敛？

诊断答案：

- `(-g)^T g = -||g||^2 < 0`.
- 导数为零只能识别驻点，不能自动证明最小值。
- 整数变量会产生离散定义域。
- 只要有一个非线性约束，整个问题就是非线性的。
- 一小段成功轨迹只能证明这几步的表现；收敛结论还需要假设与完整论证。

如果第一题不清楚，请先复习内积，再推导下降方向。如果第二题不清楚，请在整课学习中始终保留驻点反例作为对照。

## 首次术语

| 术语 | 本课含义 |
|---|---|
| `数学优化（mathematical optimization）` | 选择一个可行变量，使目标函数取得最小值或最大值。 |
| `目标函数／代价函数（objective / cost function）` | 需要最小化或最大化的标量。 |
| `参数／决策变量（parameter / decision variable）` | 优化过程所选择的值。 |
| `可行集／可行域（feasible set / feasible domain）` | 同时满足变量定义域和全部约束的变量集合。 |
| `可行解（feasible solution）` | 可行集中的一个候选点。 |
| `离散优化（discrete optimization）` | 在整数或其他有限／可数集合上进行的 optimization。 |
| `连续优化（continuous optimization）` | 在实值变量上进行的 optimization。 |
| `无约束优化（unconstrained optimization）` | 可行集就是所声明完整实数空间的 optimization。 |
| `约束优化（constrained optimization）` | 带有等式或不等式限制的 optimization。 |
| `线性规划（linear programming）` | 目标函数与所有约束函数都为线性函数的问题。 |
| `非线性规划（nonlinear programming）` | 目标函数非线性，或至少一个约束非线性的问题。 |
| `凸集（convex set）` | 任意两点之间的整条线段都仍在集合内的集合。 |
| `凸函数（convex function）` | 在定义域中任意两点之间，函数图像都不高于对应弦线的函数。 |
| `局部最小解（local minimizer）` | 与所有充分邻近的可行点相比都不更差的可行点。 |
| `全局最小解（global minimizer）` | 与全部可行点相比都不更差的可行点。 |
| `驻点／临界点（stationary / critical point）` | 梯度为零的可微点。 |
| `半正定（positive semidefinite / PSD）` | 对每个方向 `v` 都满足 `v^T H v >= 0` 的对称曲率矩阵。 |
| `搜索方向（search direction）` | 迭代更新所选择的方向。 |
| `步长／学习率（step length / learning rate）` | 施加在搜索方向上的正比例系数。 |
| `梯度下降（Gradient Descent）` | 沿负梯度方向迈步的迭代最小化方法。 |
| `牛顿法（Newton's method）` | 同时使用梯度与二阶曲率信息的二阶方法。 |
| `梯度上升（Gradient Ascent）` | 用于寻找局部最大值、符号与 Gradient Descent 相反的迭代。 |

两组分类词不能混为一谈：

- `discrete/continuous` 描述变量定义域；
- `linear/nonlinear` 描述目标函数与约束。

整数问题可以有线性目标函数，continuous 问题也可以有非线性目标函数。这两条分类轴彼此独立。

## 核心讲解

<!-- wanxiang:block foundations-c01-problem-contract-observation:start -->

第一张仪器记录纸保留了可见装置，但把所有判断栏都留空：

```text
未标注栏位 A                 ____________________
未标注栏位 B                 ____________________
未标注栏位 C                 ____________________
未标注栏位 D                 ____________________

起始铜珠位置                  已标记
黄铜边界片                    可见
候选读数                      尚未接受或拒绝
```

这张记录纸没有预设偏好的方法，也没有把任何候选项判定为解。

<!-- wanxiang:block foundations-c01-problem-contract-observation:end -->

<!-- wanxiang:block foundations-c01-problem-contract:start -->

### 1. 从 optimization 陈述开始

一个 optimization 问题需要声明三个对象：

1. 目标函数 `f`；
2. decision variable `x`；
3. feasible set `D`。

minimizer `x*` 满足

$$
x^*\in D
\quad\text{and}\quad
f(x^*)\le f(x)\ \text{for every }x\in D.
$$

若要求最大化，则把不等号反向。最大化 `f` 等价于最小化 `-f`，但这个符号变化必须贯彻到梯度和更新方向中。

即使目标值很诱人，位于 `D` 外的候选点也不是 feasible solution。这一点在把 discrete 问题松弛为 continuous 问题时尤其重要：对松弛解取整可能破坏可行性，也不一定能恢复 discrete 最优解。

<!-- wanxiang:block foundations-c01-problem-contract:end -->

### 2. 分类需要沿四条轴判断

#### Axis A：discrete 或 continuous

如果变量取自整数、标签、图结构或有限集合，问题就是 discrete optimization。组合优化（combinatorial optimization）从有结构的有限集合中选择元素；整数规划（integer programming）则把坐标限制为整数。

实向量 `x in R^D` 定义 continuous optimization。本课余下分析聚焦 continuous 变量，因为梯度和海森矩阵需要实空间中的邻域。

#### Axis B：unconstrained 或 constrained

unconstrained continuous 最小化写成

$$
\min_x f(x),\qquad x\in\mathbb R^D.
$$

constrained 问题还带有等式或不等式条件。约束会改变一点附近的可行方向，因此不能原样搬用 unconstrained 梯度检验。

#### Axis C：linear 或 nonlinear

linear program 要求目标函数和所有约束都为 linear。只要目标函数或任一约束为 nonlinear，整个问题就应归为 nonlinear。

“linear”描述的是完整问题，而不只是你最先注意到的那条公式。

#### Axis D：convex，或尚未建立 convex 性

集合 `D` 为 convex set，当且仅当

$$
\alpha x+(1-\alpha)y\in D
$$

对每个 `x,y in D` 和每个 `alpha in [0,1]` 都成立。

函数 `f` 为 convex function，当且仅当

$$
f(\alpha x+(1-\alpha)y)
\le
\alpha f(x)+(1-\alpha)f(y).
$$

对于这里讨论的 constrained convex 形式，目标函数是 convex 的，等式约束是 linear 的，不等式约束函数则在统一的符号约定下为 convex。unconstrained 情形取 `D=R^D`，它本身就是 convex set。

convex 性之所以重要，是因为 convex optimization 问题的每个 local minimizer 都是 global minimizer。没有 convex 性时，找到局部最小值并不能建立全局最优性。

### 3. 分类例题

某工坊选择实值温度 `p`，以最小化

$$
c(p)=(p-6)^2
$$

并满足 `0 <= p <= 10`。

变量是 continuous 的，问题是 constrained 的。目标函数为二次函数，因此是 nonlinear 的。该区间是 convex feasible set，二次目标函数也是 convex 的，所以这是 convex 问题。

如果工坊改为要求 `p` 取整数，定义域就变成 discrete。代数公式没有变化，但 optimization 类别变了。

### 4. local、global 与 stationary 是不同主张

如果存在 `delta>0`，使得

$$
f(x^*)\le f(x)
$$

对每个满足 `||x-x*||<=delta` 的 feasible `x` 都成立，那么点 `x*` 就是 local minimizer。

如果该不等式对整个定义域内的每个 feasible `x` 都成立，它就是 global minimizer。

stationary point 满足

$$
\nabla f(x^*)=0.
$$

驻性（stationarity）是导数条件，local 与 global 最小性则是比较条件。这些词不能相互替换。

例题中的曲面为：

$$
q(x)=(x^2-1)^2.
$$

它的导数为

$$
q'(x)=4x(x^2-1),
$$

因此 stationary points 为 `-1`、`0` 和 `1`。点 `-1` 与 `1` 是函数值为零的 global minimizers；点 `0` 虽然 stationary，却是局部最大值（local maximum），而不是 minimum。

### 5. 一阶必要条件（first-order necessary condition）

设 `x*` 是 unconstrained local minimizer，并且 `f` 在 `x*` 的邻域内可微。此时必要条件是

$$
\nabla f(x^*)=0.
$$

原因如下。一阶泰勒模型（first-order Taylor model）为

$$
f(x^*+\Delta x)
\approx
f(x^*)+\Delta x^T\nabla f(x^*).
$$

如果梯度（gradient）非零，可以选择

$$
\Delta x=-\alpha\nabla f(x^*)
$$

其中 `alpha` 是充分小的正数。此时预测变化为

$$
\Delta x^T\nabla f(x^*)
=-\alpha||\nabla f(x^*)||^2<0.
$$

这会产生一个邻近的下降方向，与 local minimality 矛盾。

该条件是必要的，却不是充分的。stationary point 可能是 minimum、maximum、鞍点（saddle point），也可能是更平坦的非 minimum。

### 6. 二阶必要条件（second-order necessary condition）

设 `x*` 是 unconstrained local minimizer，并且 `f` 在 `x*` 的邻域内二阶可微。此时

$$
\nabla f(x^*)=0
$$

且

$$
\nabla^2 f(x^*)\succeq 0.
$$

该记号表示海森矩阵（Hessian）为 PSD：

$$
v^T\nabla^2 f(x^*)v\ge0
$$

对每个方向 `v` 都成立。

在 stationary point 处，二阶泰勒模型（second-order Taylor model）化为

$$
f(x^*+\Delta x)-f(x^*)
\approx
\frac12\Delta x^T\nabla^2f(x^*)\Delta x.
$$

负曲率方向会预测邻近下降，从而与 local minimality 矛盾。因此，local minimum 的 Hessian 不可能存在二次型为负的方向。

同样，该条件是必要的，却不是充分的。考虑

$$
r(x)=x^3.
$$

在零点，`r'(0)=0` 且 `r''(0)=0`。一维 Hessian `[0]` 为 PSD。然而紧邻零点左侧的函数值为负，右侧为正，因此零点不是 local minimum。

正确结论是：

$$
\text{local minimum}
\Longrightarrow
\text{gradient zero and Hessian PSD},
$$

而不是反向蕴含。

<!-- wanxiang:block foundations-c01-gradient-update-observation:start -->

第二张仪器记录纸记下了一次候选移动，但没有填写判断栏：

```text
当前点                        x_t
箭头标记                      [已画出，标签留空]
打结细绳                      [数值留空]
候选终点                      [已标记]

预测的局部变化                ____________________
实际目标值变化                ____________________
边界检查                      ____________________
```

观察页上的判断空格均未填写。

<!-- wanxiang:block foundations-c01-gradient-update-observation:end -->

<!-- wanxiang:block foundations-c01-gradient-update:start -->

### 7. 迭代 optimization 要把方向与长度分开

迭代方法（iterative method）从估计值 `x_0` 开始，并产生

$$
x_1,x_2,\ldots,x_t,\ldots
$$

希望借此逼近有用的最优解（optimizer）。

每一步在概念上包含两个决定：

- 选择 search direction `d_t`；
- 选择正的 step length `alpha_t`。

于是

$$
x_{t+1}=x_t+\alpha_t d_t.
$$

线搜索策略（line-search strategy）同时搜索方向与 step length；信赖域策略（trust-region strategy）则限制局部模型可被信任的距离。本课不实现这些更广泛的算法，而是利用方向—长度分离来理解 Gradient Descent。

### 8. 从 Taylor 推理导出 Gradient Descent

下面的推导只适用于可微的 unconstrained 最小化问题。在 constrained 问题中，方向及其产生的更新步还必须保持可行；不能原样照搬 unconstrained 的负梯度论证。

在当前点 `x_t`，写成

$$
x_{t+1}=x_t+\Delta x.
$$

first-order Taylor model 给出

$$
f(x_{t+1})
\approx
f(x_t)+\Delta x^T\nabla f(x_t).
$$

为了让预测变化为负，选择

$$
\Delta x=-\alpha_t\nabla f(x_t),
\qquad \alpha_t>0.
$$

于是

$$
\Delta x^T\nabla f(x_t)
=-\alpha_t||\nabla f(x_t)||^2\le0.
$$

得到更新式

$$
x_{t+1}=x_t-\alpha_t\nabla f(x_t).
$$

当 gradient 非零时，局部模型会预测下降。要让实际函数值也下降，还要求局部模型在所选步长范围内保持准确。“learning rate 为正”并不够；它还必须适合当前目标函数与所在区域。

理想的单调轨迹（monotone trace）是

$$
f(x_0)\ge f(x_1)\ge f(x_2)\ge\cdots.
$$

这是在步长选择合适时希望得到的性质，并不是对每个可微函数、每个正 learning rate 都成立的无条件承诺。

<!-- wanxiang:block foundations-c01-gradient-update:end -->

### 9. 用一维例子细看 learning rate

考虑例题中的目标函数

$$
\phi(x)=\frac12(x-4)^2.
$$

它的 gradient 为

$$
\phi'(x)=x-4.
$$

Gradient Descent 给出

$$
x_{t+1}=x_t-\alpha(x_t-4).
$$

定义误差 `e_t=x_t-4`，则

$$
e_{t+1}=(1-\alpha)e_t.
$$

这条精确递推揭示了五种情形：

- `0<alpha<1`：误差保持符号不变，绝对值缩小；
- `alpha=1`：该二次函数一步到达 minimizer；
- `1<alpha<2`：符号交替，但绝对值缩小；
- `alpha=2`：符号交替，绝对值不变；
- `alpha>2`：绝对值增大，因此迭代发散。

这些阈值只属于这个特定的归一化二次函数。曲率不同，安全尺度也会变化。一般性的结论是检查更新因子或目标值轨迹，而不是把 `2` 背成普适边界。

### 10. 过小与过大的 learning rate 会以不同方式失败

很小的 learning rate 可能稳定降低目标值，却几乎没有进展。这就是慢收敛（slow convergence）。

适度偏大的 learning rate 可能越过 minimizer，在两侧交替，但仍然收敛。

过大的 learning rate 可能抬高目标值、增大迭代点绝对值，或产生非有限数。这是不收敛（nonconvergence），而不只是“移动得快”。

因此，稳健的实验需要：

- 最大步数；
- 有限数检查；
- 迭代点绝对值守卫；
- gradient 容差；
- 目标值上升记录；
- 明确的“停止但未收敛”状态。

运行失败后静默打印最后一个迭代点，会制造虚假证据。

### 11. gradient 方向与水平集（level set）

level set 包含目标值相同的点。对于可微目标函数，gradient 垂直于局部 level set，并指向函数值增大的方向。在通常的欧几里得长度约束（Euclidean length constraint）下，负 gradient 指向一阶近似中下降最快的方向。

因此，一张二维下降图应当显示：

- 嵌套的等值线（level curves）；
- 当前点；
- 穿过局部等值线的负 gradient 箭头；
- 按 learning rate 缩放该箭头后得到的新点；
- 点间距能反映所选 step sizes 的轨迹。

只有当所画箭头的方向与尺度符合更新方程时，它才算解释性证据。

<!-- wanxiang:block foundations-c01-method-comparison:start -->

### 12. Newton's method 与 Gradient Ascent

Gradient Descent 是一阶方法（first-order method）：它使用 gradient 信息。靠近 local minimum 时，gradients 会变小，进展可能变慢，狭长等值线还可能形成之字形路径。

Newton's method 同时使用 gradient 与 Hessian 信息。记

$$
g_t=\nabla f(x_t),
\qquad
H_t=\nabla^2 f(x_t).
$$

它的形式化局部方向由下列线性方程组定义：

$$
H_t d_t=-g_t.
$$

更新式仍然是

$$
x_{t+1}=x_t+\alpha_t d_t,
$$

纯 Newton step 取 `alpha_t=1`。当 `H_t` 非奇异时，该解在数学上等价于 `d_t=-H_t^{-1}g_t`，但实现时通常求解线性方程组，而不是显式构造逆矩阵。

如果 `H_t` 为正定矩阵（positive definite matrix），且 `g_t` 非零，那么

$$
g_t^T d_t=-g_t^T H_t^{-1}g_t<0,
$$

因此 Newton direction 是 descent direction。仅有非奇异性只能保证方向方程有唯一解；不定海森矩阵（indefinite Hessian）可能给出并不下降的方向。

原始材料把 Newton's method 描述为具有更快的二阶收敛，但单步复杂度更高，因为需要 Hessian 信息并求解线性方程组。这种比较是局部的，并依赖假设。二次收敛（quadratic convergence）主张需要足够的光滑性、解附近非奇异的 Hessian，以及合适的起始区域。Newton's method 并不是无条件的全局胜者。

Gradient Ascent 改变更新符号：

$$
x_{t+1}=x_t+\alpha_t\nabla f(x_t).
$$

它寻找局部上升，用于最大化。等价地，可以通过最小化 `-f` 来实现最大化 `f`，因为后者的 gradient 为 `-\nabla f`。

<!-- wanxiang:block foundations-c01-method-comparison:end -->

## 完整因果链

### Chain A：从问题陈述到分类

1. 写出 decision variable 及其定义域。
2. 写出目标函数，并说明任务是最小化还是最大化。
3. 写出每个等式与不等式约束。
4. 根据变量定义域判断 discrete 或 continuous。
5. 根据 feasible set 判断 unconstrained 或 constrained。
6. 根据目标函数与所有约束判断 linear 或 nonlinear。
7. 单独检验或建立 convex 性；不能从光滑性推出 convex 性。
8. 记录该分类允许得出哪些结论。

### Chain B：从候选点到有根据的主张

1. 检查可行性。
2. 如果问题光滑且 unconstrained，计算 gradient。
3. 如果 gradient 非零，否定内部点是 local minimum 的主张。
4. 如果 gradient 为零，把该点称为 stationary。
5. 如果二阶导数存在，计算或判定 Hessian。
6. 负曲率方向会否定 local minimum 主张。
7. PSD Hessian 通过了必要检验，却没有完成证明。
8. 在声称 minimum 之前，还要使用邻域比较、更强的充分条件或 convex 性。
9. 在声称全局最优之前，要考察完整 feasible domain。

### Chain C：从 Taylor 模型到一次下降更新

1. 计算 `g_t=\nabla f(x_t)`。
2. 如果 `||g_t||` 低于声明的容差，以“近似 stationary”状态停止。
3. 选择 `d_t=-g_t`。
4. 当 `g_t` 非零时，验证 `d_t^Tg_t=-||g_t||^2<0`。
5. 选择正 learning rate `alpha_t`。
6. 构造 `x_{t+1}=x_t+alpha_t d_t`。
7. 计算 `x_{t+1}` 处的实际目标值。
8. 比较实际变化与预测的 descent direction。
9. 记录成功、越过目标、进展缓慢或守卫触发的失败。

### Chain D：从短轨迹到收敛陈述

1. 保留每个迭代点与目标值。
2. 检查数值是否有限。
3. 检查停止条件。
4. 检查目标值是否上升。
5. 检查迭代点绝对值是否增大。
6. 如果尚未满足容差，到达最大迭代次数时停止。
7. 报告“已收敛”“守卫触发失败”或“已到最大步数”。
8. 不要把有限长度的成功前缀变成关于未来所有步骤的定理。

## 图示与状态追踪

### 分类决策表

| 问题 | 如果是 | 如果否 |
|---|---|---|
| 变量是否必须取整数、标签或有限选项？ | discrete | 继续检验是否为 continuous |
| feasible set 是否小于所声明的实数空间？ | constrained | unconstrained |
| 目标函数与每个约束是否都为 linear？ | linear | nonlinear |
| 在声明的约束约定下，feasible set 与目标函数是否均为 convex？ | 已建立 convex 结构 | 尚未建立 convex 性 |

### stationary point 状态轨迹

对于 `q(x)=(x^2-1)^2`：

| 点 | gradient | 曲率符号 | 分类 |
|---:|---:|---:|---|
| `-1` | `0` | 正 | global minimum 与 local minimum |
| `0` | `0` | 负 | local maximum |
| `1` | `0` | 正 | global minimum 与 local minimum |

重复出现的 gradient 值说明，为什么仅凭 stationarity 无法完成点的分类。

### 必要但不充分的轨迹

对于 `r(x)=x^3` 的零点：

| 证据 | 结果 | 允许得出的结论 |
|---|---:|---|
| `r'(0)` | `0` | stationary 候选点 |
| `r''(0)` | `0`，因此在一维中为 PSD | 通过二阶必要检验 |
| 对正的小量 `epsilon` 计算 `r(-epsilon)` | 负 | 函数值低于 `r(0)` |
| 最终结论 | 不是 local minimum | 必要检验并未提供充分性证书 |

### 例题二次函数的 learning rate 轨迹

从 `x_0=12` 开始，因此 `e_0=8`。

当 `alpha=0.25` 时，误差乘数为 `0.75`：

| `t` | `x_t` | `phi(x_t)` |
|---:|---:|---:|
| 0 | 12.0000 | 32.0000 |
| 1 | 10.0000 | 18.0000 |
| 2 | 8.5000 | 10.1250 |
| 3 | 7.3750 | 5.6953 |
| 4 | 6.5313 | 3.2036 |

当 `alpha=2.2` 时，误差乘数为 `-1.2`。迭代点越过 minimizer，并且与它的距离不断增大：

| `t` | `x_t` | `phi(x_t)` |
|---:|---:|---:|
| 0 | 12.0000 | 32.0000 |
| 1 | -5.6000 | 46.0800 |
| 2 | 15.5200 | 66.3552 |

应当停止这次不安全的运行，而不是因为它步子更大就加以肯定。

## 可执行代码

下面的标准库程序精确运行上面两种 learning rate。它会记录状态、检查收敛性，并在目标值持续上升或数值状态变得不安全时抛出守卫失败。

```python
from math import isfinite


def objective(x):
    return 0.5 * (x - 4.0) ** 2


def gradient(x):
    return x - 4.0


def run_descent(
    alpha,
    start=12.0,
    max_steps=100,
    gradient_tolerance=1e-8,
    magnitude_limit=1e6,
    allowed_consecutive_increases=1,
):
    if alpha <= 0:
        raise ValueError("alpha must be positive")

    x = float(start)
    history = []
    previous_value = None
    increase_streak = 0

    for step in range(max_steps + 1):
        value = objective(x)
        grad = gradient(x)

        if not (isfinite(x) and isfinite(value) and isfinite(grad)):
            raise RuntimeError("non-finite state detected")
        if abs(x) > magnitude_limit:
            raise RuntimeError("iterate magnitude guard triggered")

        history.append(
            {
                "step": step,
                "x": x,
                "objective": value,
                "gradient": grad,
            }
        )

        if abs(grad) <= gradient_tolerance:
            return history, "converged"

        if previous_value is not None and value > previous_value + 1e-12:
            increase_streak += 1
        else:
            increase_streak = 0

        if increase_streak > allowed_consecutive_increases:
            raise RuntimeError(
                "objective increased repeatedly; stop before claiming convergence"
            )

        previous_value = value
        x = x - alpha * grad

    raise RuntimeError("maximum steps reached without gradient convergence")


def show_prefix(label, history, count=8):
    print(label)
    for row in history[:count]:
        print(
            f"t={row['step']:>2} "
            f"x={row['x']:>11.6f} "
            f"f={row['objective']:>12.6f} "
            f"g={row['gradient']:>11.6f}"
        )


def main():
    safe_history, safe_status = run_descent(alpha=0.25)
    show_prefix("safe alpha=0.25", safe_history)
    print("status:", safe_status, "steps:", len(safe_history) - 1)
    assert safe_status == "converged"
    assert safe_history[-1]["objective"] < 1e-14

    try:
        unsafe_history, unsafe_status = run_descent(alpha=2.2)
        show_prefix("unsafe alpha=2.2", unsafe_history)
        raise AssertionError(
            f"unsafe run unexpectedly returned with status {unsafe_status}"
        )
    except RuntimeError as error:
        print("unsafe alpha=2.2")
        print("guarded failure:", error)
        assert "increased repeatedly" in str(error)


if __name__ == "__main__":
    main()
```

守卫本身就是结果的一部分。如果任由不安全情形运行到溢出，最终异常所揭示的信息反而少于早期目标值轨迹已经给出的信息。

## 阶段检查

### Check A - 求解前先分类

对下列问题分类：

$$
\min_{0\le p\le10}(p-6)^2.
$$

说明变量定义域、约束状态、线性与 convex 性。

### Check B - 区分 stationary points

对于 `q(x)=(x^2-1)^2`，计算三个 stationary points，并利用函数值或曲率分别分类。

### Check C - 检验必要条件

在零点检验 `r(x)=x^3` 的一阶和二阶必要条件，并解释为什么同时通过两项检验仍不能建立 minimum。

### Check D - 验证 descent direction

在某一点，已知

$$
\nabla f(x)=
\begin{bmatrix}
2\\-1
\end{bmatrix},
$$

使用 `Delta x=-0.1\nabla f(x)`，计算一阶预测变化。

### Check E - 追踪两步

对于 `phi(x)=0.5(x-4)^2`，从 `x_0=12` 开始并取 `alpha=0.25`。计算 `x_1`、`x_2` 及对应的两个目标值。

## 综合练习

### Practice 1 - 完整的问题声明

一个小型系统选择二进制激活向量 `a in {0,1}^4`。它在满足 `sum(a_i)<=2` 的条件下最小化线性代价 `c^T a`。

1. 声明目标函数、定义域与 feasible set。
2. 沿四条轴对问题分类。
3. 解释为什么先求实值松弛问题、再取整，不能自动证明原问题的可行性或最优性。

### Practice 2 - 在同一个二次函数上比较 Gradient Descent 与 Newton

令

$$
F(w)=\frac12(3w-6)^2.
$$

1. 推导 `F'(w)` 与 `F''(w)`。
2. 从 `w_0=0` 开始，使用 `alpha=0.1` 执行两次 Gradient Descent 更新。
3. 从相同起点计算一次 Newton 更新。
4. 比较两者使用的导数信息与单步工作量。
5. 说明为什么这一个二次函数不能证明 Newton 对每个目标函数都总能一步收敛。

### Practice 3 - 不另造规则地处理最大化

令

$$
G(z)=-(z-5)^2+9.
$$

1. 写出 Gradient Ascent 更新。
2. 把同一任务改写为最小化 `-G`。
3. 证明当 learning rates 相同时，两种更新的方向一致。

### Practice 4 - 收敛证据账本

为一次迭代运行建立包含下列各栏的账本：

| 步数 | 迭代点 | 目标值 | gradient 范数 | 目标值变化 | 状态 |
|---|---:|---:|---:|---:|---|

分别为下列情形设置状态标签：

- 达到 gradient 容差；
- 目标值反复上升；
- 触发迭代点绝对值守卫；
- 状态不是有限数；
- 到达最大步数。

## 完整答案

### 阶段检查 A

`p` 为实数，因此问题是 continuous 的。区间约束使它成为 constrained 问题；二次目标函数使它成为 nonlinear 问题。区间与二次函数均为 convex，所以已经建立 convex 结构。

### 阶段检查 B

$$
q'(x)=4x(x^2-1)=0
$$

在 `x=-1,0,1` 处成立。函数值为 `q(-1)=0`、`q(0)=1`、`q(1)=0`。因此 `-1` 与 `1` 是 global minima，`0` 是 local maximum。

### 阶段检查 C

对于 `r(x)=x^3`，

$$
r'(0)=0,\qquad r''(0)=0.
$$

标量 Hessian `[0]` 为 PSD，所以两项必要检验都通过。然而，对每个正的小量 `epsilon` 都有 `r(-epsilon)<r(0)`，因此零点不是 local minimum。

### 阶段检查 D

令 `g=[2,-1]^T`。则

$$
\Delta x=-0.1g=
\begin{bmatrix}
-0.2\\0.1
\end{bmatrix}.
$$

预测变化为

$$
\Delta x^Tg=-0.1||g||^2=-0.1(5)=-0.5.
$$

### 阶段检查 E

更新式为 `x_{t+1}=x_t-0.25(x_t-4)`。

$$
x_1=12-0.25(8)=10,
$$

$$
x_2=10-0.25(6)=8.5.
$$

对应目标值为 `phi(x_1)=18` 与 `phi(x_2)=10.125`。

### 综合练习 1

目标函数为 `c^T a`，定义域为 `{0,1}^4`。feasible set 包含至多有两个激活坐标的二进制向量。

该问题是 discrete、constrained、linear 且 combinatorial 的。continuous convex 性可以描述松弛问题，却不能替代 discrete 分类。对松弛解取整可能违反耦合约束，也不一定得到最佳可行二进制向量。

### 综合练习 2

展开或直接求导：

$$
F'(w)=9w-18,\qquad F''(w)=9.
$$

使用 `alpha=0.1` 的 Gradient Descent：

$$
w_1=0-0.1(-18)=1.8,
$$

$$
w_2=1.8-0.1(9(1.8)-18)=1.98.
$$

Newton：

$$
w_1
=0-\frac{-18}{9}
=2.
$$

Gradient Descent 使用一阶导数。Newton 使用一阶与二阶导数，并按曲率调整步长。这个二次函数的曲率恒定且非零，因此 Newton 一步到达 optimizer；这一性质并不是普适的全局保证。

### 综合练习 3

$$
G'(z)=-2(z-5).
$$

Gradient Ascent 使用

$$
z_{t+1}=z_t+\alpha G'(z_t).
$$

最小化 `-G` 使用

$$
z_{t+1}
=z_t-\alpha(-G)'(z_t)
=z_t-\alpha(-G'(z_t))
=z_t+\alpha G'(z_t).
$$

两者方向相同。

### 综合练习 4

完整账本会记录复现停止决定所需的每个状态。状态必须把收敛与下列情形区分开：

- 目标值反复上升；
- 绝对值上限失败；
- 非有限算术状态；
- 迭代预算耗尽。

## 常见错误与修复路径

### Error 1：只根据目标函数分类

症状：“目标函数是 linear 的，所以问题就是 linear 的。”

修复路径：

1. 列出每个约束。
2. 分别检验每个函数是否 linear。
3. 对完整问题分类。

### Error 2：忽略可行性

症状：把不可行点（infeasible point）上更低的目标值报告为解。

修复路径：

1. 比较函数值之前，先写出 feasible set。
2. 拒绝位于集合外的候选点。
3. 只比较 feasible candidates。

### Error 3：把每个 stationary point 都称为 minimum

症状：`gradient=0`，所以是 minimum。

修复路径：

1. 先把它称为 stationary candidate。
2. 检查曲率或邻近函数值。
3. 在升级该主张之前，使用 convex 性或充分条件。

### Error 4：颠倒必要条件

症状：“gradient 为零且 Hessian 为 PSD，所以是 local minimum。”

修复路径：

1. 写出从 local minimum 指向必要条件的逻辑箭头。
2. 检验 `x^3` 的零点。
3. 指出还缺少什么额外证据。

### Error 5：把 Taylor 预测当作实际下降保证

症状：任何正 learning rate 都一定降低真实目标值。

修复路径：

1. 把一阶方程标记为局部近似。
2. 计算下一点的实际目标值。
3. 如果模型在该距离上不可靠，就缩小步长或为更新加守卫。

### Error 6：把进展缓慢与发散当成同一种失败

症状：把每条不理想的轨迹都称为“过小”。

修复路径：

1. 检查目标值变化方向。
2. 检查符号是否交替。
3. 检查迭代点绝对值。
4. 区分进展很小与振幅不断增大的振荡。

### Error 7：只报告最后一个迭代点，不报告状态

症状：把到达最大步数后的停止说成收敛。

修复路径：

1. 声明停止条件。
2. 记录 gradient 范数与状态。
3. 分别标记“收敛”与“预算耗尽”。

### Error 8：声称 Newton 总是更快

症状：认为二阶方法就意味着无条件获胜。

修复路径：

1. 写明局部光滑性与非奇异曲率假设。
2. 计入 Hessian 的单步成本。
3. 区分局部收敛阶与全局稳健性。

### Error 9：用 descent 处理最大化

症状：寻找 maximum 时仍然减去 gradient。

修复路径：

1. 要么加上 gradient；
2. 要么把目标函数取负后再最小化；
3. 验证两种符号约定一致。
