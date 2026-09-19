# 约束之环 / The Ring of Constraints

无约束目标只需问自己想往哪里走；受到约束的目标还必须问自己被允许走到哪里。拉格朗日乘数（Lagrange multiplier）把这场协商写成方程，而对偶性（duality）与 KKT 条件（KKT conditions）则说明一个候选解必须拿出哪些证据。

本课始终固定采用以下约定：

\[
g_n(x)\le 0,\qquad b_n\ge 0.
\]

如果改变不等式方向，却没有同时改变乘子的规则，数学含义也会随之改变。因此，每次推导都必须先把约束规范到统一方向。

## 前置诊断

引入乘子之前，先检查下面这些前置能力。

### 梯度与驻点

对可微的标量目标 \(f:\mathbb R^D\to\mathbb R\)，驻点（stationary point）满足

\[
\nabla f(x)=0.
\]

驻点条件是一阶条件，不是最小值证书。一个驻点可能是最小值、最大值，也可能是鞍点。加入约束以后，这条警告仍然成立。

### 先检查可行性，再谈优化

一个点只有满足全部约束，才可能对约束问题有用。对不可行点进行算术计算，无法证明最优性。

例如，在本课约定下，命题 \(x\ge2\) 必须改写为

\[
2-x\le0.
\]

若写成 \(x-2\le0\)，描述的将是相反的可行集 \(x\le2\)。

### 导数记账

对

\[
f(x)+a\,h(x)+b\,g(x)
\]

这样的和式关于 \(x\) 求导时，把乘子 \(a\) 与 \(b\) 当作相互独立的标量变量。

### 逻辑蕴含

方程 \(uv=0\) 表示至少有一个因子为零，并不表示恰好只有一个因子为零。这个看似细小的逻辑点，正是互补松弛的核心。

## 首次术语

- **约束优化（constrained optimization）**：只在满足已声明等式与不等式条件的点上进行优化；
- **可行点（feasible point）**：满足全部约束的点；
- **可行域（feasible domain）**：相关函数定义域中全部可行点组成的集合；
- **等式约束（equality constraint）**：写成 \(h_m(x)=0\) 的条件；
- **不等式约束（inequality constraint）**：本课统一写成 \(g_n(x)\le0\) 的条件；
- **拉格朗日函数（Lagrangian）**：目标函数与“乘子加权后的约束函数”之和；
- **拉格朗日乘数（Lagrange multiplier）**：附着在约束上的辅助系数；等式乘子不受正负号限制；
- **原问题（primal problem）**：最初的约束最小化问题；
- **对偶函数（dual function）**：固定乘子后，Lagrangian 关于原变量的下确界；
- **对偶问题（dual problem）**：在满足对偶可行性的乘子上最大化对偶函数；
- **弱对偶（weak duality）**：在本课的最小化约定下，每个对偶可行值都是原问题最优值的下界；
- **强对偶（strong duality）**：最佳对偶值等于原问题最优值；
- **KKT 条件（KKT conditions）**：把驻点条件、原问题可行性、对偶可行性和互补松弛连接起来的五条条件；
- **活跃约束（active constraint）**：满足 \(g_n(x)=0\) 的不等式；
- **非活跃约束（inactive constraint）**：满足 \(g_n(x)<0\) 的不等式；
- **互补松弛（complementary slackness）**：对每条不等式都有 \(b_ng_n(x)=0\)。

`primal` 与 `dual` 指的是两个不同的优化问题，不等于“正确”和“近似”。即使最佳对偶界不等于原问题最优值，对偶问题仍然能够给出有保证的界。

## 核心讲解

<!-- wanxiang:block foundations-c02-sign-observation:start -->

### 观察 S：规范化前的约束账本

账本第一页把结果栏留空，只记录原始命题，以及在不改变可行含义的前提下必须填写的栏目。

| 栏目 | 作答前可见的证据 |
|---|---|
| 原始不等式 | \(x\ge2\) |
| 原始等式 | \(h(x)=0\) |
| 公共函数定义域 | `[尚未取交集]` |
| 改写后的不等式 | `[空白]` |
| 等式乘子的符号 | `[空白]` |
| 不等式乘子的符号 | `[空白]` |

选择规则之前，至少取一个原不等式允许的点，检查它在候选改写下是否仍被允许。原始命题必须一直可见，这样一旦可行集被改错，就能立即发现并撤回。

<!-- wanxiang:block foundations-c02-sign-observation:end -->

<!-- wanxiang:block foundations-c02-lagrangian-construction:start -->

### 1. 约束问题的标准形式与可行域

标准最小化问题写成

\[
\begin{aligned}
\min_x\quad & f(x)\\
\text{subject to}\quad
&h_m(x)=0,\qquad m=1,\ldots,M,\\
&g_n(x)\le0,\qquad n=1,\ldots,N.
\end{aligned}
\tag{C.10}
\]

声明的符号约定十分重要。例如：

| 原始命题 | 规范化的 \(g(x)\le0\) | 可行含义 |
|---|---|---|
| \(x\ge2\) | \(2-x\le0\) | 2 及其右侧的点 |
| \(x\le7\) | \(x-7\le0\) | 7 及其左侧的点 |
| \(q(x)\ge c\) | \(c-q(x)\le0\) | \(q\) 的值不小于 \(c\) |
| \(r(x)=d\) | \(r(x)-d=0\) | 等式，不需要选择方向 |

函数定义域也必须同时满足。如果 \(f\)、任一 \(h_m\) 或任一 \(g_n\) 在某点没有定义，该点就不能成为候选点。公共定义域为

\[
\mathcal D=
\operatorname{dom}(f)
\cap\bigcap_{m=1}^{M}\operatorname{dom}(h_m)
\cap\bigcap_{n=1}^{N}\operatorname{dom}(g_n)
\subseteq\mathbb R^D.
\tag{C.11}
\]

可行集是 \(\mathcal D\) 中同时满足全部等式与不等式的子集。

### 2. 等式约束及其 Lagrangian

先假设问题只有等式约束。定义

\[
\Lambda(x,\lambda)
=
f(x)+\sum_{m=1}^{M}\lambda_mh_m(x).
\tag{C.12}
\]

等式乘子 \(\lambda_m\) 可以为正、为零或为负，不受对偶可行性的符号限制。

在可微的局部最优点上，如果适当的 Lagrange multiplier 存在，Lagrangian 的驻点条件与等式可行性给出

\[
\nabla f(x)+
\sum_{m=1}^{M}\lambda_m\nabla h_m(x)=0,
\tag{C.13}
\]

\[
h_m(x)=0,\qquad m=1,\ldots,M.
\tag{C.14}
\]

这些方程产生的是**可能的解**，并不保证每个解都是约束最小值。

#### 等式候选点例题

考虑

\[
\min_{x,y}(x-2)^2+(y-1)^2
\quad\text{subject to}\quad x+y-1=0.
\]

Lagrangian 为

\[
\Lambda=(x-2)^2+(y-1)^2+\lambda(x+y-1).
\]

驻点条件与可行性给出

\[
2(x-2)+\lambda=0,\qquad
2(y-1)+\lambda=0,\qquad
x+y-1=0.
\]

由前两个方程可得 \(x=2-\lambda/2\)、\(y=1-\lambda/2\)。代入约束得到 \(\lambda=2\)，因此 \((x,y)=(1,0)\)。这是乘子方程产生的候选点。

对这个二次函数例子，把可行直线直接代回目标函数可以确认它确实是最小值；但这项确认属于另一个独立的推理步骤。

#### 为什么仅有驻点条件还不够

再考虑

\[
\min_{x,y}\;x^2-2y^2
\quad\text{subject to}\quad x-y=0.
\]

点 \((0,0)\) 与乘子 \(0\) 满足驻点条件和可行性。但沿可行直线 \(x=y=t\)，有

\[
f(t,t)=-t^2,
\]

它小于 \(f(0,0)=0\)，对每个非零且充分接近的 \(t\) 都是如此。所以这个驻点候选是约束局部最大值，而不是最小值。

### 3. 含不等式的一般 Lagrangian

对完整的标准问题，定义

\[
\Lambda(x,a,b)
=
f(x)
+\sum_{m=1}^{M}a_mh_m(x)
+\sum_{n=1}^{N}b_ng_n(x).
\tag{C.15}
\]

等式乘子 \(a_m\) 不受符号限制；不等式乘子必须满足

\[
b_n\ge0
\]

因为我们采用的不等式约定是 \(g_n(x)\le0\)。

为什么这两个方向必须配对？在可行点上，对每个 \(b_n\ge0\) 都有

\[
b_ng_n(x)\le0
\]

因此，仅仅加入可行的不等式项，不会让 Lagrangian 超过原目标函数。正是这组符号关系支撑了最小化问题的下界论证。

如果改用 \(g(x)\ge0\)，与之相容的乘子符号也必须改变。把一种约定下的约束方向与另一种约定下的乘子规则混在一起，会颠倒界的逻辑。

<!-- wanxiang:block foundations-c02-lagrangian-construction:end -->

<!-- wanxiang:block foundations-c02-duality-observation:start -->

### 观察 D：关系尚未填写的两本账

当一组乘子已经通过声明的符号检查后，右侧账本从

\[
\Gamma(a,b)=\inf_{x\in\mathcal D}\Lambda(x,a,b).
\]

开始。左侧账本还给出一条原问题可行的目标函数记录，但比较栏仍然空着：

```text
原问题可行记录：P
对偶账本记录：  D
关系 D [   ] P
缺口：          [空白]
相等的理由：    [空白]
```

先根据上面的定义与符号检查，判断能够推出哪一种关系；再检查题面是否真的给出了两边相等所需的条件。

<!-- wanxiang:block foundations-c02-duality-observation:end -->

<!-- wanxiang:block foundations-c02-primal-dual-bounds:start -->

### 4. 原问题

固定 \(x\) 后，对不受限制的等式乘子和非负不等式乘子取最大，会惩罚违反约束的点。于是约束最小化可以写成

\[
\min_x\max_{a,b}\Lambda(x,a,b)
\quad\text{subject to}\quad b\ge0.
\tag{C.16-C.17}
\]

这个 min-max 表达式就是原问题。不过在实际推理中，最可靠的定义仍然是原始目标函数及其约束；min-max 形式解释了乘子为什么能够编码可行性。

### 5. 对偶函数与对偶问题

固定乘子后，定义对偶函数

\[
\Gamma(a,b)=\inf_{x\in\mathcal D}\Lambda(x,a,b).
\tag{C.18}
\]

这里对原变量取下确界，而不是对乘子取下确界。即使原目标函数并非凸函数，对偶函数关于 \((a,b)\) 仍然是凹函数。

对任意原问题可行点 \(\tilde x\) 和任意满足 \(b\ge0\) 的对偶可行乘子，都有

\[
\Gamma(a,b)
\le
\Lambda(\tilde x,a,b)
\le
f(\tilde x).
\tag{C.19}
\]

第一个不等式来自下确界的定义。第二个不等式利用了两件事：等式项在可行点上为零，而非负乘子乘以非正不等式函数不会抬高函数值。

若 \(p^\star\) 是原问题最优值，则

\[
\Gamma(a,b)\le p^\star.
\tag{C.20}
\]

对偶问题寻找最大的、有保证的下界：

\[
\begin{aligned}
\max_{a,b}\quad&\Gamma(a,b)\\
\text{subject to}\quad&b\ge0.
\end{aligned}
\tag{C.21-C.22}
\]

用 \(d^\star\) 表示对偶最优值。

### 6. 弱对偶与强对偶

**弱对偶**是

\[
d^\star\le p^\star.
\]

它直接来自上面的界论证，并不要求原问题与对偶问题的值相等。

**强对偶**则是额外的等式

\[
d^\star=p^\star.
\]

强对偶不会自动成立。写出一个对偶问题，只能证明弱对偶的界。所以下面的 KKT 推导把 \(d^\star=p^\star\) 当作显式假设；如果尚未建立这个等式，就必须保留 \(d^\star\le p^\star\)。

<!-- wanxiang:block foundations-c02-primal-dual-bounds:end -->

<!-- wanxiang:block foundations-c02-kkt-observation:start -->

### 观察 K：尚未勾选的五行

候选点核查表送到面前时，只有五个栏目名称，还没有结论：

```text
[ ] 驻点条件（stationarity）
[ ] 等式原问题可行性（equality primal feasibility）
[ ] 不等式原问题可行性（inequality primal feasibility）
[ ] 互补松弛（complementary slackness）
[ ] 对偶可行性（dual feasibility）
```

其中一条不等式标成 \(g_j(x^\star)=0\)，但乘子栏和定理假设栏都还是空白。你必须判断：应当核查全部五行、只检查第一行，还是仅凭“活跃”标签就推断乘子数值。

<!-- wanxiang:block foundations-c02-kkt-observation:end -->

<!-- wanxiang:block foundations-c02-kkt-audit:start -->

### 7. 五条 KKT 条件

对于可微函数，候选点 \((x^\star,a^\star,b^\star)\) 必须逐行核查以下五条条件。

#### 1. 驻点条件

\[
\nabla f(x^\star)
+\sum_{m=1}^{M}a_m^\star\nabla h_m(x^\star)
+\sum_{n=1}^{N}b_n^\star\nabla g_n(x^\star)
=0.
\tag{C.23}
\]

#### 2. 等式原问题可行性

\[
h_m(x^\star)=0,\qquad m=1,\ldots,M.
\tag{C.24}
\]

#### 3. 不等式原问题可行性

\[
g_n(x^\star)\le0,\qquad n=1,\ldots,N.
\tag{C.25}
\]

#### 4. 互补松弛

\[
b_n^\star g_n(x^\star)=0,\qquad n=1,\ldots,N.
\tag{C.26}
\]

#### 5. 对偶可行性

\[
b_n^\star\ge0,\qquad n=1,\ldots,N.
\tag{C.27}
\]

五行缺一不可。一个点即使通过四行，只要有一行失败，也不能通过 KKT 核查。

### 8. 必要与充分：让假设始终可见

命题的方向十分重要。

- 如果强对偶成立，原问题和对偶问题的最优值都能达到，而且函数具有足以写出梯度的可微性，那么最优的原—对偶变量对满足 KKT 条件。
- 对于可微的凸优化问题，如果目标函数为凸函数、\(g_n\) 为凸函数且等式约束为仿射函数，那么任何满足 KKT 的点都能在这些假设下证明是全局的原—对偶最优解。
- 缺少这些假设时，KKT 方程可以产生候选点，却不能证明全局最优性。
- 仅有等式 Lagrangian 的驻点条件还要更弱：它只会产生可能的约束极值点，仍需单独分类。

不要把这些陈述缩短成“KKT 总能证明最优”。

### 9. 互补松弛与活跃性

对一条不等式，有

\[
b\ge0,\qquad g(x)\le0,\qquad b\,g(x)=0.
\]

需要区分两种重要情形。

**非活跃约束：**若 \(g(x^\star)<0\)，非零的松弛量会迫使

\[
b^\star=0.
\]

该约束在候选点处仍有余量，因此不会贡献乘子作用力。

**活跃约束：**若 \(g(x^\star)=0\)，互补松弛变成

\[
b^\star\cdot0=0.
\]

对每个 \(b^\star\ge0\)，这个等式都成立。仅凭活跃性，**不能**推出乘子严格为正；必须联立驻点条件和其他条件，才能判断乘子为零还是为正。

有效的蕴含是

\[
g(x^\star)<0\Longrightarrow b^\star=0.
\]

它的逆命题，以及严格断言 \(g(x^\star)=0\Longrightarrow b^\star>0\)，通常都不成立。

#### 活跃约束例题

考虑

\[
\min_x (x+2)^2
\quad\text{subject to}\quad x\ge0.
\]

把约束规范为 \(g(x)=-x\le0\)。可行最小点为 \(x^\star=0\)。驻点条件给出

\[
2(x^\star+2)+b^\star(-1)=0,
\]

所以 \(b^\star=4\)。这里约束是活跃的，乘子也为正；但正值来自驻点条件，而不是仅由互补松弛推出。

#### 非活跃约束例题

对

\[
\min_x (x-4)^2
\quad\text{subject to}\quad x\ge1,
\]

取 \(g(x)=1-x\le0\)。最小点 \(x^\star=4\) 满足 \(g(x^\star)=-3<0\)。因此互补松弛迫使 \(b^\star=0\)，驻点条件也随之退化为无约束方程。

<!-- wanxiang:block foundations-c02-kkt-audit:end -->

## 完整因果链

完整的推理链如下：

1. 写出目标函数和每一条约束。
2. 把每条不等式规范为 \(g_n(x)\le0\)。
3. 记录与之相容的乘子规则 \(b_n\ge0\)。
4. 对全部函数定义域取交集，得到 \(\mathcal D\)。
5. 先检查原问题可行性，再讨论最优性。
6. 用目标函数与乘子加权后的约束构造 Lagrangian。
7. 对仅含等式的问题，联立求解驻点条件与可行性。
8. 在完成分类前，把每个驻点解都视为候选点。
9. 对一般问题，关于 \(x\) 取下确界，构造 \(\Gamma(a,b)\)。
10. 利用原问题可行性和 \(b\ge0\)，证明 \(\Gamma(a,b)\le f(\tilde x)\)。
11. 最大化对偶函数，得到最佳下界。
12. 把 \(d^\star\le p^\star\) 称为弱对偶。
13. 只有得到独立理由时，才把等式 \(d^\star=p^\star\) 称为强对偶。
14. 核查驻点条件、两种原问题可行性、互补松弛与对偶可行性。
15. 由 \(g_n(x^\star)<0\) 推出 \(b_n^\star=0\)。
16. 不要由活跃性推出 \(b_n^\star>0\)。
17. 在本课的必要性路线中，先说明可微性、强对偶，以及原问题和对偶问题的最优值都能达到，才能断言最优的原—对偶变量对满足 KKT。
18. 在充分性路线中，先说明可微性和标准凸结构——\(f\) 为凸函数、\(g_n\) 为凸函数、\(h_m\) 为仿射函数——才能用 KKT 证明全局最优。

每一环都有自己的作用。跳过符号约定会破坏对偶界；跳过可行性会接纳非法点；跳过互补松弛会让非活跃约束施加虚构的作用力；跳过假设则会把有条件的定理写成错误的无条件口号。

## 图示与状态追踪

### 约束规范化板

```text
原始关系               规范化函数                 所需乘子
x >= c                  g(x)=c-x <= 0            b >= 0
x <= c                  g(x)=x-c <= 0            b >= 0
q(x) = d                h(x)=q(x)-d = 0          a 不限正负
```

计算任何乘子之前，都应先填完这块板。

### 原—对偶界图

```text
对偶可行的 (a,b)
        |
        v
Gamma(a,b) = inf_x Lambda(x,a,b)
        |
        |  弱对偶下界
        v
      d*  <=  p*
                 ^
                 |
          原问题可行的 x
```

只有额外理由建立 \(d^\star=p^\star\) 时，强对偶才会把缺口闭合。

### 五行 KKT 核查板

```text
[ ] 驻点条件             grad_x Lambda = 0
[ ] 等式可行性           h_m(x) = 0
[ ] 不等式可行性         g_n(x) <= 0
[ ] 互补松弛             b_n g_n(x) = 0
[ ] 对偶可行性           b_n >= 0
```

这份核查表使用“并且”关系：全部方框都必须通过。

### 候选点状态轨迹

对活跃约束例题
\(\min (x+2)^2\)，约束为 \(-x\le0\)，候选点状态按下面的顺序演化：

```text
x=0
-> g(0)=0                     活跃
-> 由驻点条件求 b
-> 4-b=0，所以 b=4           对偶可行
-> b*g=4*0=0                 满足互补松弛
-> 五行全部通过
```

对非活跃约束例题
\(\min (x-4)^2\)，约束为 \(1-x\le0\)：

```text
x=4
-> g(4)=-3                   非活跃
-> 互补松弛迫使 b=0
-> 驻点条件为 2(x-4)=0
-> 五行全部通过
```

活跃或非活跃可以直接由 \(g(x)\) 观察出来；随后必须把互补松弛与驻点条件结合起来，才能约束乘子的取值。

## 可执行代码

下面是本课唯一的主 Python 代码块。它核查标量等式与不等式候选点，并精确报告哪一条 KKT 条件失败。后面的例子用于诊断演示。

```python
from dataclasses import dataclass
from typing import Callable, List


ScalarFunction = Callable[[float], float]


@dataclass(frozen=True)
class EqualityConstraint:
    name: str
    value: ScalarFunction
    gradient: ScalarFunction
    multiplier: float


@dataclass(frozen=True)
class InequalityConstraint:
    name: str
    value: ScalarFunction
    gradient: ScalarFunction
    multiplier: float


def audit_candidate(
    name: str,
    x: float,
    objective_gradient: ScalarFunction,
    equalities: List[EqualityConstraint],
    inequalities: List[InequalityConstraint],
    tolerance: float = 1e-9,
) -> dict:
    stationarity_residual = objective_gradient(x)
    for item in equalities:
        stationarity_residual += item.multiplier * item.gradient(x)
    for item in inequalities:
        stationarity_residual += item.multiplier * item.gradient(x)

    equality_residuals = {
        item.name: item.value(x) for item in equalities
    }
    inequality_values = {
        item.name: item.value(x) for item in inequalities
    }
    multiplier_values = {
        item.name: item.multiplier for item in inequalities
    }
    complementary_products = {
        item.name: item.multiplier * item.value(x)
        for item in inequalities
    }

    checks = {
        "stationarity": abs(stationarity_residual) <= tolerance,
        "equality_feasibility": all(
            abs(value) <= tolerance for value in equality_residuals.values()
        ),
        "inequality_feasibility": all(
            value <= tolerance for value in inequality_values.values()
        ),
        "complementary_slackness": all(
            abs(value) <= tolerance
            for value in complementary_products.values()
        ),
        "dual_feasibility": all(
            value >= -tolerance for value in multiplier_values.values()
        ),
    }

    failed = [condition for condition, passed in checks.items() if not passed]
    print(f"\n{name}: x={x}")
    print("  stationarity residual:", stationarity_residual)
    print("  equality residuals:", equality_residuals)
    print("  inequality values:", inequality_values)
    print("  multipliers:", multiplier_values)
    print("  complementary products:", complementary_products)
    for condition, passed in checks.items():
        print(f"  {condition}: {'PASS' if passed else 'FAIL'}")
    print("  failed conditions:", failed if failed else "none")

    return {
        "checks": checks,
        "failed": failed,
        "stationarity_residual": stationarity_residual,
    }


# Equality case: minimize (x-2)^2 subject to h(x)=x+1=0.
equality_pass = audit_candidate(
    name="equality candidate with correct multiplier",
    x=-1.0,
    objective_gradient=lambda x: 2.0 * (x - 2.0),
    equalities=[
        EqualityConstraint(
            name="x_plus_1",
            value=lambda x: x + 1.0,
            gradient=lambda x: 1.0,
            multiplier=6.0,
        )
    ],
    inequalities=[],
)

equality_fail = audit_candidate(
    name="same equality point with wrong multiplier",
    x=-1.0,
    objective_gradient=lambda x: 2.0 * (x - 2.0),
    equalities=[
        EqualityConstraint(
            name="x_plus_1",
            value=lambda x: x + 1.0,
            gradient=lambda x: 1.0,
            multiplier=5.0,
        )
    ],
    inequalities=[],
)

# Active inequality: minimize (x+2)^2 subject to g(x)=-x<=0.
active_pass = audit_candidate(
    name="active inequality optimum",
    x=0.0,
    objective_gradient=lambda x: 2.0 * (x + 2.0),
    equalities=[],
    inequalities=[
        InequalityConstraint(
            name="negative_x",
            value=lambda x: -x,
            gradient=lambda x: -1.0,
            multiplier=4.0,
        )
    ],
)

# Complementarity trap: stationarity passes, but an inactive constraint
# carries a nonzero multiplier.
complementarity_fail = audit_candidate(
    name="inactive constraint with fictitious force",
    x=2.0,
    objective_gradient=lambda x: 2.0 * (x - 4.0),
    equalities=[],
    inequalities=[
        InequalityConstraint(
            name="quadratic_cap",
            value=lambda x: x * x - 9.0,
            gradient=lambda x: 2.0 * x,
            multiplier=1.0,
        )
    ],
)

assert equality_pass["failed"] == []
assert equality_fail["failed"] == ["stationarity"]
assert active_pass["failed"] == []
assert complementarity_fail["failed"] == ["complementary_slackness"]
```

这段代码不判断全局最优性。它只检查已声明候选点的五条代数 KKT 条件；凸性、强对偶以及适当最优解的存在性仍然是独立的数学前提。

## 阶段检查

继续学习之前，不看总结，独立给出下面三份证据：

1. 把 \(r(x)\ge c\) 转换为 \(g(x)\le0\) 约定，并写出相容的乘子符号。
2. 写出一个等式约束的 Lagrangian，并解释为什么它的驻点解只是候选点，而不是有保证的最小值。
3. 从 \(\Gamma(a,b)\) 的定义出发，解释当 \(b\ge0\) 时，它为什么是每个原问题可行点的下界。

“对偶就是交换 min 和 max”之类的说法并不足够。有效证据必须指出下确界、可行点，以及每个不等式项的符号。

## 综合练习

考虑

\[
\min_{x,y}\;(x-3)^2+(y-1)^2
\]

约束为

\[
h(x,y)=x+y-3=0,
\qquad
g(x,y)=-y\le0.
\]

完成以下任务：

1. 构造 Lagrangian；
2. 在假设不等式非活跃的前提下，联立求解驻点条件与等式可行性；
3. 检查不等式可行性与互补松弛；
4. 核查全部五条 KKT 条件；
5. 说明还需要哪一项结构事实，才能让这里的 KKT 证据足以证明全局最优性。

## 完整答案

Lagrangian 为

\[
\Lambda(x,y,a,b)
=(x-3)^2+(y-1)^2
+a(x+y-3)-by,
\qquad b\ge0.
\]

假设不等式非活跃，因此 \(b=0\)。驻点条件给出

\[
2(x-3)+a=0,
\qquad
2(y-1)+a=0.
\]

所以

\[
x=3-\frac a2,
\qquad
y=1-\frac a2.
\]

等式可行性给出

\[
4-a=3,
\]

从而 \(a=1\)、\(x=2.5\)、\(y=0.5\)。

现在检查“非活跃”假设：

\[
g(2.5,0.5)=-0.5<0.
\]

因此互补松弛要求 \(b=0\)，而且它满足对偶可行性。

五行核查如下：

| 条件 | 证据 | 结果 |
|---|---|---|
| 驻点条件 | 取 \(a=1,b=0\) 时，两个梯度坐标都等于零 | 通过 |
| 等式可行性 | \(2.5+0.5-3=0\) | 通过 |
| 不等式可行性 | \(-0.5\le0\) | 通过 |
| 互补松弛 | \(0\cdot(-0.5)=0\) | 通过 |
| 对偶可行性 | \(b=0\ge0\) | 通过 |

目标函数是凸二次函数，不等式函数与等式函数都是仿射函数。根据本课的凸 KKT 充分性陈述，这个通过核查的候选点是全局最优点。

## 常见错误与修复路径

### 错误 1——颠倒可行集

错误：把 \(x\ge c\) 转换为 \(x-c\le0\)。

修复：代入一个显然可行的点。如果 \(x=c+1\)，则 \(c-x=-1\le0\)，而 \(x-c=1\le0\) 为假。

### 错误 2——错误地要求等式乘子非负

错误：把不等式乘子的规则套到所有乘子上。

修复：等式乘子不受符号限制。只有与 \(g_n(x)\le0\) 配对的乘子才要求 \(b_n\ge0\)。

### 错误 3——把每个 Lagrangian 驻点都认定为最小值

错误：检查完驻点条件与可行性就停止。

修复：必须在可行集上对候选点分类。乘子方程会收集可能的约束极值点，其中也包括最大值。

### 错误 4——用关于 \(x\) 的最大值定义对偶函数

错误：对这个最小化问题使用 \(\sup_x\Lambda\)。

修复：对偶函数是 \(\Gamma(a,b)=\inf_{x\in\mathcal D}\Lambda(x,a,b)\)，它给出下界。

### 错误 5——默认强对偶成立

错误：在没有理由时把 \(d^\star\le p^\star\) 改成等式。

修复：弱对偶由界论证自动得到；强对偶是额外性质，必须在适当条件下另行建立。

### 错误 6——只检查驻点条件

错误：只解出一条梯度方程，就把候选点称为 KKT 点。

修复：使用五行核查板。只要有一行失败，完整核查就不通过。

### 错误 7——给非活跃约束配置非零乘子

错误：同时允许 \(g(x^\star)<0\) 和 \(b^\star>0\)。

修复：互补乘积此时不为零。非活跃性会迫使 \(b^\star=0\)。

### 错误 8——断言每条活跃约束都有正乘子

错误：把 \(b^\star>0\) 当作由 \(g(x^\star)=0\) 必然得到的结论。

修复：\(b^\star\cdot0=0\) 同时允许零乘子与正乘子；必须由驻点条件和其余约束决定具体数值。

### 错误 9——在没有凸结构时使用凸充分性

错误：对任意非凸问题都声称“KKT 通过，所以是全局最优”。

修复：显式说明可微性与凸问题假设；否则只能报告该候选点通过了 KKT 方程。
