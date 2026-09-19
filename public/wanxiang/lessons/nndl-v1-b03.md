# 概率门的机关

> 一道门独立变换每个坐标，另一道门让所有坐标共享同一份概率总量。导数会告诉我们，眼前究竟是哪一种机器。

## 前置诊断

本课使用一门基础微积分课程的内容，以及上一课约定的矩阵微积分规范：

- `exp(x)` 是自然指数函数，并且 `d exp(x)/dx = exp(x)`；
- 商法则（quotient rule）会同时对分子与分母求导；
- Jacobian 记录每个输出坐标如何随每个输入坐标变化；
- `diag(v)` 把向量 `v` 放到一个方阵的对角线上；
- `uv^T` 是 outer product；
- chain rule 按形状相容的次序复合局部导数。

本课使用列向量

$$
x=[x_1,\ldots,x_K]^T
$$

并把分量导数写作

$$
J_{ij}=\frac{\partial z_i}{\partial x_j}.
$$

原附录采用 denominator layout 呈现。Softmax Jacobian 的最终矩阵是对称矩阵，因此紧凑公式不因转置而改变。出现下游标量时，本课会先明确采用列梯度约定，再进行乘法。

## 首次术语

- **按位函数（elementwise function）**：输出坐标 `z_k` 只由同一个标量函数作用于 `x_k` 得到；
- **依赖关系（dependency）**：如果改变一个输入可能改变某个输出，就说该输出依赖这个输入；
- **Jacobian**：由全部一阶偏导数组成的矩阵；
- **对角雅可比矩阵（diagonal Jacobian）**：所有非对角偏导数都为零；
- **逻辑斯蒂函数（Logistic function）**：由正尺度 `L`、斜率参数 `K` 和中心参数 `x_0` 控制的一族 S 形曲线；
- **标准 S 形函数（standard sigmoid）**：`L=1`、`K=1`、`x_0=0` 时的特殊 Logistic 函数；
- **未归一化分数（logit）**：送入概率变换的实数分数；
- **Softmax 函数（Softmax）**：把 `K` 个实数 logits 耦合映射为 `K` 个正数，且这些正数之和为一；
- **平移不变性（shift invariance）**：给所有 logits 加上同一个标量不会改变 Softmax 输出；
- **克罗内克 delta（Kronecker delta）**：当 `i=j` 时 `delta_ij=1`，否则为 `0`；
- **数值雅可比矩阵（numerical Jacobian）**：用于检验解析导数的有限差分近似。

不要混淆下面两个词：

- *elementwise* 描述依赖图；
- *向量化（vectorized）* 只描述计算如何书写或执行。

vectorized 计算仍然可能存在很强的耦合。

## 核心讲解

<!-- wanxiang:block foundations-b03-elementwise-observation:start -->
### 观察 A — 每次只移动一个输入

三窗记录表开始时把所有滑块都置于零。每次试验恰好移动一个输入滑块，
另外两个保持不动。表中只记录哪些量发生了变化，暂时不命名导数模式。

| 试验 | 改变的输入 | `z_1` 窗口 | `z_2` 窗口 | `z_3` 窗口 |
|---|---|---|---|---|
| A | `x_1` | 移动 | 保持 | 保持 |
| B | `x_2` | 保持 | 移动 | 保持 |
| C | `x_3` | 保持 | 保持 | 移动 |

根据这些 trace 判断哪些输入—输出对之间存在可见的 dependency 路径。
不要仅仅因为三个坐标写在同一个向量中，就臆测额外路径。
<!-- wanxiang:block foundations-b03-elementwise-observation:end -->

<!-- wanxiang:block foundations-b03-elementwise-jacobian:start -->
### 1. 同一条标量规则作用于多个坐标

令标量函数 `f` 分别独立作用于 `K` 个输入：

$$
z_k=f(x_k),\qquad k=1,\ldots,K. \tag{B.23}
$$

把各个坐标收集起来，可得

$$
x=[x_1,\ldots,x_K]^T,\qquad
z=[z_1,\ldots,z_K]^T=f(x). \tag{B.24}
$$

这里的记号 `f(x)` 表示 elementwise 应用，并不表示每个输出都可以使用整个向量。

固定一对 `(i,j)`，

$$
\frac{\partial z_i}{\partial x_j}
=
\frac{\partial f(x_i)}{\partial x_j}.
$$

分两种情况。

若 `i=j`，对应坐标发生变化：

$$
\frac{\partial z_i}{\partial x_i}=f'(x_i).
$$

若 `i\ne j`，则 `z_i=f(x_i)` 中不含 `x_j`，因此

$$
\frac{\partial z_i}{\partial x_j}=0.
$$

所以，B.25—B.27 记录的完整导数为

$$
\frac{\partial f(x)}{\partial x}
=
\begin{bmatrix}
f'(x_1)&0&\cdots&0\\
0&f'(x_2)&\cdots&0\\
\vdots&\vdots&\ddots&\vdots\\
0&0&\cdots&f'(x_K)
\end{bmatrix}
=\operatorname{diag}(f'(x)). \tag{B.25-B.27}
$$

这些零元素不是代数技巧，而是在陈述因果关系：当 `i != j` 时，从 `x_j` 到 `z_i` 不存在 dependency 边。

对比下面的映射：

$$
z_1=x_1+x_2,\qquad z_2=x_1-x_2.
$$

两个输出都使用了两个输入，因此它的 Jacobian 是稠密矩阵：

$$
\begin{bmatrix}
1&1\\
1&-1
\end{bmatrix}.
$$
<!-- wanxiang:block foundations-b03-elementwise-jacobian:end -->

<!-- wanxiang:block foundations-b03-logistic-sigmoid:start -->
### 2. 广义 Logistic 函数族

广义 Logistic 函数为

$$
\operatorname{logistic}(x)
=\frac{L}{1+\exp[-K(x-x_0)]}. \tag{B.28}
$$

本课假设 `L>0`。逐个读取这些参数：

- 当 `K>0` 时，`L` 是上侧极限值：曲线在最左侧趋近 `0`，在最右侧趋近 `L`。当 `K<0` 时，这两个极限方向互换。
- 当 `K!=0` 时，`x_0` 会水平移动过渡中心。在 `x=x_0` 处，指数项为 `1`，所以输出为 `L/2`。
- `K` 控制陡峭程度与方向。更大的正 `K` 会让中心附近的过渡更尖锐，负 `K` 会反转方向。当 `K=0` 时，整个函数恒为 `L/2`，因此 `x_0` 不再产生影响。

在中心处，

$$
\operatorname{logistic}(x_0)=\frac{L}{2}.
$$

中心检验可以有效发现参数读取错误。当 `K!=0` 时，改变 `x_0` 不会改变两个极限值，只会移动曲线穿过半高值的位置。当 `K=0` 时，根本不存在可供移动的过渡。

四条曲线的对比关系如下：

- `L=1` 与 `L=2` 的差别会改变上方平台；
- `K=1` 与 `K=2` 的差别会改变中心附近的陡峭程度；
- 所有曲线都取 `x_0=0`，所以它们的半高点落在同一水平坐标上。

把三个参数的读数合成一张表：

| 参数选择 | 中心值 | 最右侧极限 | 曲线形状 |
|---|---:|---:|---|
| L=1, K=1, x0=0 | 0.5 | 1 | 标准 S 形 |
| L=2, K=1, x0=0 | 1 | 2 | 平台翻倍 |
| L=1, K=2, x0=0 | 0.5 | 1 | 中心更陡 |
| L=1, K=0, 任意 x0 | 0.5 | 0.5 | 平坦常数 L/2 |
| L=1, K=−1, x0=0 | 0.5 | 0 | 方向反转 |

中心值恒为 `L/2`（`K!=0` 时），最右极限由 `K` 的符号与 `L` 共同决定；`K=0` 时
根本没有过渡可供 `x_0` 移动。

### 3. 标准 sigmoid 及其导数

令 `L=1`、`K=1`、`x_0=0`。标准 Logistic 函数为

$$
\sigma(x)=\frac{1}{1+\exp(-x)}. \tag{B.29}
$$

它把每个实数输入映射到 `(0,1)`。

把它视为倒数并求导：

$$
\begin{aligned}
\sigma'(x)
&=\frac{d}{dx}(1+e^{-x})^{-1}\\
&=-(1+e^{-x})^{-2}(-e^{-x})\\
&=\frac{e^{-x}}{(1+e^{-x})^2}.
\end{aligned}
$$

现在改写这两个因子：

$$
\sigma(x)=\frac{1}{1+e^{-x}},
$$

并且

$$
1-\sigma(x)
=1-\frac{1}{1+e^{-x}}
=\frac{e^{-x}}{1+e^{-x}}.
$$

相乘即可得到同一个导数：

$$
\boxed{\sigma'(x)=\sigma(x)(1-\sigma(x)).} \tag{B.30}
$$

对于向量输入，sigmoid 仍然逐坐标应用。因此，第一部分得到的 dependency 结论给出

$$
\boxed{
\frac{\partial \sigma(x)}{\partial x}
=\operatorname{diag}\bigl(\sigma(x)\odot(1-\sigma(x))\bigr).
} \tag{B.31}
$$

哈达玛积（Hadamard product）`odot` 表示逐坐标相乘。矩阵之所以是对角矩阵，是因为各坐标独立应用，而不仅仅是因为标量导数具有紧凑形式。
<!-- wanxiang:block foundations-b03-logistic-sigmoid:end -->

<!-- wanxiang:block foundations-b03-softmax-coupling-observation:start -->
### 观察 B — 一个分子变化，所有分量共享一个总和

取三个有限 logits。两行之间只有第二个 logit 发生变化。
表中给出了指数权重及其共享总和；第一类概率仍为空白，请补全并比较。

| 行 | logits | 指数权重 | 共享总和 | 第一类概率 |
|---|---|---|---:|---:|
| 基线 | `(0, 0, 0)` | `(1, 1, 1)` | `3` | `?` |
| 干预 | `(0, ln 2, 0)` | `(1, 2, 1)` | `4` | `?` |

保持第一和第三个 logits 不变。先比较两行中的第一类概率，再说出变化方向。
<!-- wanxiang:block foundations-b03-softmax-coupling-observation:end -->

<!-- wanxiang:block foundations-b03-softmax-shift-observation:start -->
### 观察 C — 比较两种缩小大数的方法

原始 logits 为 `(800, 801, 802)`。定宽指数表无法表示它们的直接指数值。
请先补全两个候选行中的成对间隔，再判断哪一行保留了原始比例。

| 行 | 平移后的 logits | 间隔 `(x_2-x_1, x_3-x_2)` | 最大指数输入 |
|---|---|---|---:|
| 原始值 | `(800, 801, 802)` | `(1, 1)` | `802` |
| 共同平移 `802` | `(-2, -1, 0)` | `?` | `0` |
| 分别平移 | `(0, 0, 0)` | `?` | `0` |

表格只提供观察结果。下一步仍须在公式中说明，一个公共因子能否同时从分子和分母中约去。
<!-- wanxiang:block foundations-b03-softmax-shift-observation:end -->

<!-- wanxiang:block foundations-b03-softmax-jacobian:start -->
### 4. Softmax 建立一份共享的概率总量

对于 logits `x_1,\ldots,x_K`，定义

$$
z_k
=\operatorname{softmax}(x)_k
=\frac{\exp(x_k)}{\sum_{i=1}^{K}\exp(x_i)}. \tag{B.32}
$$

对于有限 logits，每个指数值都为正。当 `K>=2` 时，分母中至少还含有另一个正数项，因此

$$
z_k\in(0,1). \tag{B.33}
$$

在退化的 `K=1` 情形中，唯一的输出为 `z_1=1`；下面推导 Jacobian 时会保留这一边界。

把所有输出相加，会重新得到分母：

$$
\sum_{k=1}^{K}z_k
=
\frac{\sum_{k=1}^{K}e^{x_k}}
{\sum_{i=1}^{K}e^{x_i}}
=1. \tag{B.34}
$$

写成向量形式，B.35—B.38 表达的是同一件事：

$$
z=\operatorname{softmax}(x), \tag{B.35}
$$

$$
z=
\frac{1}{\sum_{k=1}^{K}e^{x_k}}
\begin{bmatrix}
e^{x_1}\\
\vdots\\
e^{x_K}
\end{bmatrix}, \tag{B.36}
$$

$$
z=\frac{\exp(x)}{\sum_{k=1}^{K}e^{x_k}}
=\frac{\exp(x)}{\mathbf 1_K^T\exp(x)}. \tag{B.37-B.38}
$$

这里的 `exp(x)` 是 elementwise 的，但除法存在耦合：每个输出都使用同一个分母。改变一个 logit 会改变这个分母，因此可能改变每个概率。

关键区别就在这里：

- elementwise sigmoid 产生相互独立的坐标与对角 Jacobian；
- Softmax 产生彼此竞争的坐标，其 Jacobian 通常是稠密矩阵。

### 5. 平移不变性

任取标量 `c`。对每个坐标，

$$
\begin{aligned}
\operatorname{softmax}(x+c\mathbf 1)_k
&=
\frac{e^{x_k+c}}
{\sum_i e^{x_i+c}}\\
&=
\frac{e^c e^{x_k}}
{e^c\sum_i e^{x_i}}\\
&=
\operatorname{softmax}(x)_k.
\end{aligned}
$$

因此

$$
\boxed{\operatorname{softmax}(x+c\mathbf 1)=\operatorname{softmax}(x).}
$$

B.32 直接给出了这一结论：共同平移会给每个分子和共享分母都乘上同一个因子，所以该因子可以约去。

**稳定 Softmax 计算。** 选择

$$
c=-\max_i x_i
$$

会使平移后的最大 logit 等于零，其余 logits 都不大于零。于是它们的指数值至多为一，从而避免普通浮点计算中的溢出：

```text
shifted = x - max(x)
weights = exp(shifted)
probabilities = weights / sum(weights)
```

平移后的计算在数学上与 B.32 完全相同。它让每个指数输入都不大于零，在保留概率不变的同时防止溢出。

这个稳定写法与 log-sum-exp 是同一件事的两面：
\(\log\sum_k\exp(x_k)=\max_k x_k+\log\sum_k\exp(x_k-\max)\)，右边对数内的每一项
都不大于一。后续把 Softmax 接进 cross-entropy 时，还会再次用到这个形式。

两个边界顺带记下。退化情形 `K=1`：Softmax 恒等于 `z=1`，Jacobian 是 `1 x 1` 的
零矩阵，全一方向上的不变性仍在。概率边界：某个 `z_k` 可以任意接近 0 但永远不取 0
（logits 有限时），所以 `log z_k` 在没有额外约定的情况下没有定义——这为后续损失
函数的数值实现留了边界。

### 6. 按元素推导 Softmax Jacobian

令

$$
S=\sum_{k=1}^{K}e^{x_k},\qquad z_i=\frac{e^{x_i}}{S}.
$$

对于对角元素，`i=j`。分子与分母都依赖 `x_i`：

$$
\begin{aligned}
\frac{\partial z_i}{\partial x_i}
&=
\frac{e^{x_i}S-e^{x_i}e^{x_i}}{S^2}\\
&=
\frac{e^{x_i}}{S}
\left(1-\frac{e^{x_i}}{S}\right)\\
&=z_i(1-z_i).
\end{aligned}
$$

对于非对角元素，`i\ne j`。相对于 `x_j`，分子 `e^{x_i}` 是常数，但分母不是：

$$
\begin{aligned}
\frac{\partial z_i}{\partial x_j}
&=
-\frac{e^{x_i}e^{x_j}}{S^2}\\
&=-z_i z_j.
\end{aligned}
$$

两种情况可以统一写成：

$$
\boxed{
\frac{\partial z_i}{\partial x_j}
=z_i(\delta_{ij}-z_j).
}
$$

当 `K>=2` 且 logits 有限时，每个概率都严格位于零和一之间，因此对角元素为正，非对角元素为负。在退化的 `K=1` 情形中，Softmax 恒为一，唯一的 Jacobian 元素为零。在通常的多分类情形中，提高一个 logit 会提高它自身的概率，同时从其他类别抽走概率质量。

### 7. 用矩阵形式从 B.39 推到 B.45

也可以直接推导整个矩阵。从下式开始：

$$
z=\frac{\exp(x)}{\mathbf 1_K^T\exp(x)}.
$$

B.39—B.40 使用乘积／商的结构：分别对向量分子和标量分母的倒数求导。

因为 `exp` 是 elementwise 的，所以分子的导数是对角矩阵：

$$
\frac{\partial \exp(x)}{\partial x}
=\operatorname{diag}(\exp(x)).
$$

分母的导数收集了同一组指数值：

$$
\frac{\partial(\mathbf 1_K^T\exp(x))}{\partial x}
=\exp(x).
$$

B.41—B.43 代入这些导数，并把它们放到公共分母之上：

$$
\frac{\operatorname{diag}(\exp(x))}
{\mathbf 1_K^T\exp(x)}
-
\frac{\exp(x)\exp(x)^T}
{(\mathbf 1_K^T\exp(x))^2}.
$$

B.44 把每个归一化后的指数向量识别为 `z`，B.45 得到

$$
\boxed{
J_{\text{softmax}}
=\operatorname{diag}(z)-zz^T.
} \tag{B.39-B.45}
$$

这个矩阵逐元素对应上面的两种情况推导：

- 对角元素：`z_i-z_i^2=z_i(1-z_i)`；
- 非对角元素：`0-z_i z_j=-z_i z_j`。

中间那一步的商规则值得补两行。把 \(z=\exp(x)/(\mathbf 1_K^T\exp(x))\) 看成
“向量分子 ÷ 标量分母”，denominator layout 下：

1. 固定分母对分子求导：`exp` 是 elementwise 的，贡献
   \(\operatorname{diag}(\exp(x))\)；
2. 固定分子对分母求导：\(\partial(\mathbf 1_K^T\exp(x))/\partial x=\exp(x)\)
   是 \(K\times1\) 列，标量分母的倒数规则把它与分子合并成外积
   \(\exp(x)\exp(x)^T\)——这正是 B02 标量乘向量规则里
   \((\partial y/\partial x)z^T\) 的同一结构。

两个外积因子一组合，放到公共分母上，就得到
\(\operatorname{diag}(\exp(x))/(\mathbf 1_K^T\exp(x))-\exp(x)\exp(x)^T/(\mathbf 1_K^T\exp(x))^2\)，
再把归一化向量识别为 \(z\)，即 B.45。
<!-- wanxiang:block foundations-b03-softmax-jacobian:end -->

### 8. 让下游导数通过 Softmax

令标量为

$$
r=a^Tz,
$$

其中 `a` 固定，且 `z=softmax(x)`。采用列梯度约定，

$$
\nabla_z r=a.
$$

chain rule 给出

$$
\nabla_x r
=J_{\text{softmax}}^T a.
$$

因为 `diag(z)-zz^T` 是对称矩阵，

$$
\boxed{\nabla_x r=J_{\text{softmax}}a.}
$$

这就是本课要求掌握的 chain rule 概念：下游敏感度向量会经过完整 Softmax Jacobian 的混合。这里不需要使用交叉熵捷径。

接上面的完整算例继续。取下游向量 \(a=[1.5, -0.5, 0.25]^T\)。由
\(z\approx[0.843795, 0.114195, 0.042010]^T\) 组装 \(J=\operatorname{diag}(z)-zz^T\)，
乘上游梯度：

$$
\nabla_x r=Ja
\approx
\begin{bmatrix}
0.2370\\
-0.1963\\
-0.0407
\end{bmatrix}.
$$

三个坐标之和约为零——这正是共同平移方向的导数：同时等量提高三个 logits 不改变
任何概率，也不改变 \(r\)。逐坐标乘以下游梯度（错误 8）会漏掉整个非对角混合。

## 完整因果链

沿着下面的推理逐环检查，不要跳步：

1. dependency 图决定哪些偏导数可能非零。
2. elementwise 应用只产生对应坐标之间的 dependency。
3. 对应 dependency 产生 `diag(f'(x))`。
4. 广义 Logistic 展示 `L`、`K` 与 `x_0` 如何控制一族 S 形曲线。
5. 标准参数选择产生 `sigma`。
6. 用 `sigma` 改写倒数的导数，得到 `sigma(1-sigma)`。
7. elementwise 应用 sigmoid，再次回到对角 Jacobian 规则。
8. Softmax 从 elementwise 指数开始，但引入了一个共享分母。
9. 共享分母把每个输出与每个输入耦合起来。
10. 当 `K>=2` 且 logits 有限时，商法则的两种情况产生正的对角元素和负的非对角元素；`K=1` 边界仍为零。
11. 这些元素组装成 `diag(z)-zz^T`。
12. logits 的共同平移会在分子与分母中约去。
13. 同一个平移事实既解释稳定计算，也解释零响应方向。
14. chain rule 让下游敏感度通过整个 Jacobian，而不是通过彼此孤立的标量导数。

只要缺少一环，看似熟悉的公式仍可能被用到错误的 dependency 结构上。

## 图示与状态追踪

### 图 A — 相互独立的门

```text
x1 ----> f ----> z1
x2 ----> f ----> z2
x3 ----> f ----> z3
```

坐标之间没有交叉箭头。对应的 Jacobian 模式为

```text
[ *  0  0 ]
[ 0  *  0 ]
[ 0  0  * ]
```

### 图 B — 共享概率池

```text
x1 --> exp --\
x2 --> exp ----> shared sum S ----> divide every numerator ----> z1,z2,z3
x3 --> exp --/
```

每个输入都能改变 `S`，因此每个输入都能改变所有输出。Jacobian 通常呈现如下模式：

```text
[ +  -  - ]
[ -  +  - ]
[ -  -  + ]
```

### 完整算例 trace

取 logits

$$
x=[2,0,-1]^T.
$$

减去最大值：

$$
\tilde x=[0,-2,-3]^T.
$$

未归一化权重为

$$
w=[1,e^{-2},e^{-3}]^T.
$$

它们的总和约为 `1.185122`，因此

$$
z\approx[0.843795, 0.114195, 0.042010]^T.
$$

第一个对角导数为

$$
\frac{\partial z_1}{\partial x_1}
=z_1(1-z_1)
\approx0.131805.
$$

其中一个非对角导数为

$$
\frac{\partial z_1}{\partial x_2}
=-z_1z_2
\approx-0.096359.
$$

这些符号符合概率总量的解释：提高 `x_1` 会提高 `z_1`，而提高 `x_2` 会从 `z_1` 抽走概率质量。

## 可执行代码

下面是本课唯一的主 Python 代码块。它检验稳定 Softmax、加性平移不变性、解析 Jacobian 与中心差分 numerical Jacobian。

```python
import numpy as np


def stable_softmax(x):
    """Return a 1D Softmax vector using a max shift."""
    x = np.asarray(x, dtype=float)
    if x.ndim != 1 or x.size == 0:
        raise ValueError("x must be a nonempty 1D array")
    shifted = x - np.max(x)
    weights = np.exp(shifted)
    return weights / np.sum(weights)


def softmax_jacobian_from_probabilities(z):
    """Analytic Jacobian J = diag(z) - z z^T."""
    z = np.asarray(z, dtype=float)
    return np.diag(z) - np.outer(z, z)


def numerical_jacobian(f, x, step=1e-6):
    """Central-difference Jacobian: rows are outputs, columns are inputs."""
    x = np.asarray(x, dtype=float)
    base = np.asarray(f(x), dtype=float)
    jacobian = np.empty((base.size, x.size), dtype=float)
    for j in range(x.size):
        delta = np.zeros_like(x)
        delta[j] = step
        jacobian[:, j] = (f(x + delta) - f(x - delta)) / (2.0 * step)
    return jacobian


logits = np.array([1002.0, 1000.0, 999.0])
probabilities = stable_softmax(logits)
shifted_probabilities = stable_softmax(logits - 731.5)

analytic = softmax_jacobian_from_probabilities(probabilities)
numeric = numerical_jacobian(stable_softmax, logits)

assert np.all(np.isfinite(probabilities))
assert np.all(probabilities > 0.0)
assert np.isclose(np.sum(probabilities), 1.0)
assert np.allclose(probabilities, shifted_probabilities, atol=1e-14)
assert np.allclose(analytic, numeric, atol=2e-8)
assert np.allclose(analytic @ np.ones(3), np.zeros(3), atol=1e-14)

downstream = np.array([1.5, -0.5, 0.25])
gradient = analytic.T @ downstream

print("probabilities:", probabilities)
print("analytic Jacobian:\n", analytic)
print("maximum Jacobian error:", np.max(np.abs(analytic - numeric)))
print("downstream gradient:", gradient)
```

这些断言能够证明：

- 很大的正 logits 不会溢出；
- 共同平移不会改变结果；
- 解析导数与数值导数一致；
- 全一向量的平移方向不会产生一阶变化；
- 下游向量可以通过该矩阵传播。

## 阶段检查

本节复习以下知识：

1. 画出 elementwise 映射的 dependency 图，并把缺失的边转化为零偏导数。
2. 说明广义 Logistic 曲线中的 `L`、`K` 与 `x_0` 分别控制什么。
3. 从倒数形式推导标准 sigmoid 的导数。

只认出公式不足以构成推导。有效检查必须包含使公式成立的 dependency 或代数步骤。

## 综合练习

### 练习 A — 读取广义 Logistic 参数

对于

$$
g(x)=\frac{3}{1+\exp[-2(x+1)]},
$$

辨认 `L`、`K` 与 `x_0`，并计算 `g(x_0)`。

### 练习 B — 组装二分类 Jacobian

假设 Softmax 输出为

$$
z=[0.8,0.2]^T.
$$

构造完整的 `2 x 2` Jacobian，并检验它的各行之和。

### 练习 C — 通过共享概率池应用 chain rule

使用练习 B 中的概率向量，令

$$
r=3z_1-z_2.
$$

根据 Jacobian 计算 `nabla_x r`，并解释两个梯度坐标之和为何为零。

## 完整答案

### 练习 A 解答

把给定表达式与下式对应：

$$
\frac{L}{1+\exp[-K(x-x_0)]}.
$$

因为 `x+1=x-(-1)`，

$$
L=3,\qquad K=2,\qquad x_0=-1.
$$

在中心处，指数项为一：

$$
g(x_0)=\frac{3}{2}=1.5.
$$

### 练习 B 解答

使用

$$
J=\operatorname{diag}(z)-zz^T.
$$

于是

$$
J=
\begin{bmatrix}
0.8&0\\
0&0.2
\end{bmatrix}
-
\begin{bmatrix}
0.64&0.16\\
0.16&0.04
\end{bmatrix}
=
\begin{bmatrix}
0.16&-0.16\\
-0.16&0.16
\end{bmatrix}.
$$

两行之和都为零。

### 练习 C 解答

下游梯度为

$$
\nabla_z r=[3,-1]^T.
$$

因此

$$
\nabla_x r
=J^T\nabla_z r
=
\begin{bmatrix}
0.16&-0.16\\
-0.16&0.16
\end{bmatrix}
\begin{bmatrix}
3\\
-1
\end{bmatrix}
=
\begin{bmatrix}
0.64\\
-0.64
\end{bmatrix}.
$$

两个坐标之和为零，因为同时等量移动两个 logits 不会改变 Softmax 输出或 `r`。

## 常见错误与修复路径

### 错误 1 — “向量输入就意味着稠密 Jacobian”

修复：为每个真实 dependency 画一条箭头。仅凭向量形状无法判断矩阵是否稠密。

### 错误 2 — “Softmax 中的 `exp(x)` 让整个映射都是 elementwise 的”

修复：圈出共享分母。指数运算是 elementwise 的，归一化却是耦合的。

### 错误 3 — 混淆 `K` 与 `L`

修复：检验最右侧极限与中心值。`L` 控制高度，`K` 控制陡峭程度与方向。

### 错误 4 — 不经推导就引用 sigmoid 恒等式

修复：把 `1-sigma(x)` 写成相同分母，再进行乘法。

### 错误 5 — 对 Softmax 只使用 `z_i(1-z_i)`

修复：这只是对角元素。完整 Jacobian 还必须为每个 `i != j` 包含 `-z_i z_j`。

### 错误 6 — 对很大的 logits 直接计算朴素指数

修复：使用已经证明的共同 shift invariance，先减去最大值。这是 `EXT-01`，由 B.32 推出的实现扩展。

### 错误 7 — 把行和为零当成巧合

修复：用 `J` 乘以全一向量。这是共同平移方向的导数，而 Softmax 对这个方向保持不变。

### 错误 8 — 逐坐标乘以下游梯度

修复：Softmax 存在耦合。写出完整的形状 trace：

```text
J^T: K x K
downstream gradient: K x 1
input gradient: K x 1
```
