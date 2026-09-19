# 切线与余项：从局部变化到区间累计

> 导数（derivative）回答局部问题。Taylor 多项式（Taylor polynomial）把多个局部答案组合成邻域模型。积分（integral）回答整个区间上的累计问题。本课要做的是始终分清这三者的职责。

## 前置诊断

本课假定你会计算普通函数、整理代数式、阅读求和符号（sigma notation），并理解极限（limit）是随着试验不断细化而趋近的值；不假定你已经学过机器学习微积分（calculus）。

继续之前先回答：

1. 当 `h` 从 `0.1` 变为 `0.01` 时，`x` 与 `x+h` 之间的区间怎样变化？
2. 在比值“输出变化量／输入变化量”中，计算有限商之前，哪个量必须非零？
3. `5` 这样的一个数与 `x^2 + C` 这样的一族函数有什么区别？
4. 对 partition `a=x_0<x_1<...<x_N=b`，`x_n-x_{n-1}` 度量什么？
5. 若近似模型在 `a` 处建立，能否自动认为它在 `a+0.01` 与 `a+10` 处同样可信？

诊断答案：

- 更小但非零的 `h` 会让第二个点更靠近第一个点。
- 每个有限差商中的输入变化量都必须非零；只有取极限后才能得到 derivative。
- 确定的数值结果与含任意常数的一族函数是不同的数学对象。
- `x_n-x_{n-1}` 是一个子区间的宽度。
- 要在远离中心的位置相信局部近似，必须补充新的证据。

若仍分不清有限商与 limit，请在下文第一处状态追踪暂停；若不熟悉 sigma notation，请先手工展开四项 Riemann sum 示例，再运行代码。

## 首次术语

下表刻意保持紧凑；每个术语稍后都会进入一条完整因果链。

| 术语 | 本单元中的操作性含义 |
|---|---|
| `calculus` | 研究求导、积分及其应用。 |
| `derivative` | limit 存在时，某点处“输出变化量／输入变化量”的极限。 |
| `secant slope` | 使用两个不同点得到的有限差商。 |
| `tangent slope` | derivative 在一点处的几何解释。 |
| `higher-order derivative` | 对 derivative 再求 derivative；二阶 derivative 记录一阶 derivative 如何变化。 |
| `partial derivative` | 固定其他输入坐标，只对一个输入坐标求 derivative。 |
| `differentiation` | 计算 derivative 的过程。本节强调求导操作与 differentiability，不另行建立形式化微分理论。 |
| `可微函数（differentiable function）` | 在指定定义域或区间的每一点都存在 derivative 的函数。 |
| `Taylor's formula` | 用展开点处的各阶 derivative 构成的多项式，再加上 remainder。 |
| `remainder / residual` | 截断后的 Taylor 多项式没有表示出的精确部分。 |
| `antiderivative` | derivative 等于被积函数的函数。 |
| `indefinite integral` | 一族 antiderivative，其中包含任意加法常数。 |
| `definite integral` | 表示一个区间内有符号累计量的数。 |
| `partition` | 把一个区间划分成若干子区间的有限有序点集。 |
| `representative point` | 每个子区间内选取、用于采样函数值的点。 |
| `Riemann sum` | 把每个采样高度乘以相应子区间宽度后求和。 |
| `分割细度（mesh size）` | partition 中最大的子区间宽度。 |

三个符号的职责必须分开：

- `h` 或 `Delta x` 是取极限之前的有限输入步长。
- `f'(a)` 是点 `a` 处的局部变化率。
- integral 中的 `dx` 标记积分变量；若没有数值方法，它并不表示直接代入某个有限步长。

## 核心讲解

### 1. derivative 从一次有限比较开始

<!-- wanxiang:block foundations-b01-finite-to-local-observation:start -->

第一张板书只呈现可见几何关系和一份尚未完成的证据账：

```text
第一个点          (x_0, f(x_0))
第二个点          (x_0 + h, f(x_0 + h))
步长标记          h != 0
直线              穿过两个标记点

一次有限放置能够证明什么：____________________
仍需检查什么：            ____________________
```

这张板书不提供极限值，也不提前给出最终分类。

<!-- wanxiang:block foundations-b01-finite-to-local-observation:end -->

<!-- wanxiang:block foundations-b01-derivative-limit:start -->

设 `f: R -> R`。对非零步长 `h`，有限差商

$$
\frac{f(x_0+h)-f(x_0)}{h}
$$

是通过 `(x_0,f(x_0))` 与 `(x_0+h,f(x_0+h))` 两点的 secant slope。它表示有限区间上的平均变化率，此时还不是 derivative。

当 `h` 趋近于零时，若该商从 `h<0` 与 `h>0` 两侧都趋近同一个有限实数，则

$$
f'(x_0)=\lim_{h\to 0}\frac{f(x_0+h)-f(x_0)}{h}.
$$

在定义域的内点，只有这个有限的双侧极限存在时，普通 derivative 才存在。定义域端点处的单侧 derivative 属于另一项约定。分子记录输出变化，分母记录输入变化；极限消除对某一个任意有限步长的依赖，从而确定 `x_0` 处的局部线性响应。

从几何上看，`f'(x_0)` 是 tangent slope；从操作上看，它给出一阶预测

$$
f(x_0+h)\approx f(x_0)+f'(x_0)h
$$

其中 `h` 必须足够小。符号 `approx` 不可省略：derivative 给出精确的局部斜率信息；只有当 `f` 在某个有限区间内为仿射函数时，该预测才保证在整个区间内精确。对非线性函数，某个孤立的有限步长也可能偶然落在切线上，因此要写等号仍需另行举证。

源材料用 `f(x)=log(x)+1` 展示切线。在 `x_0=3` 处，

$$
f'(3)=\frac{1}{3}.
$$

当 `h=0.06` 时，切线模型预测输出增加

$$
\frac13(0.06)=0.02.
$$

这个预测只在局部成立。它不表示对数函数上任意位置只要步长为 `0.06`，输出都会增加 `0.02`，因为 derivative 会随 `x` 改变。

<!-- wanxiang:block foundations-b01-derivative-limit:end -->

### 2. 小型 derivative 表只是工具，不能替代理解

源材料列出四条常用规则：

| 函数 | derivative | 定义域说明 |
|---|---|---|
| `f(x)=C` | `f'(x)=0` | 常数不发生变化。 |
| `f(x)=x^r` | `f'(x)=r x^(r-1)` | 有效的实数定义域取决于 `r`。 |
| `f(x)=exp(x)` | `f'(x)=exp(x)` | 对每个实数 `x` 都有定义。 |
| `f(x)=log(x)` | `f'(x)=1/x` | 在实数 calculus 中要求 `x>0`。 |

只背表而不检查定义域，会得到无效结果。例如，derivative 公式 `1/x` 并不允许在 `x=0` 处计算 `log(x)`。

### 3. higher-order derivative 与 partial derivative 回答不同问题

`二阶导数（second derivative）`

$$
f''(x)=\frac{d}{dx}f'(x)
$$

描述一阶 derivative 如何变化。若 `f'(x)` 是速度，`f''(x)` 就是加速度；若 `f'(x)` 是局部斜率，`f''(x)` 就度量局部曲率信息。second derivative 为正，表示斜率在局部增大，并不能单独推出函数值为正。

对多变量函数 `F: R^D -> R`，partial derivative 固定其他坐标，只改变一个坐标：

$$
\frac{\partial F(\mathbf{x})}{\partial x_i}.
$$

对示例函数

$$
F(u,v)=u^2v+\exp(v),
$$

可得

$$
\frac{\partial F}{\partial u}=2uv,
\qquad
\frac{\partial F}{\partial v}=u^2+\exp(v).
$$

在 `(u,v)=(2,0)` 处，第一个 partial derivative 为 `0`，第二个为 `5`。这两个数描述两次不同的坐标实验；任意同时移动两个坐标时，它们都不等于总变化。后续矩阵 calculus 单元会把所有坐标响应组织成向量和矩阵。

### 4. differentiability 强于 continuity

若函数在 `a` 处的值等于邻近输入趋近时的极限值，则函数在 `a` 处 continuous；若一个局部线性斜率能够同时拟合两侧行为，则函数在 `a` 处 differentiable。

differentiability 蕴含 continuity：

$$
\text{differentiable at }a \Longrightarrow \text{continuous at }a.
$$

反向蕴含不成立。考虑

$$
f(x)=|x|.
$$

在零点，函数 continuous。左侧差商为

$$
\frac{|h|-0}{h}=-1 \quad \text{for }h<0,
$$

而右侧差商为

$$
\frac{|h|-0}{h}=1 \quad \text{for }h>0.
$$

由于两个单侧极限不一致，零点处不存在普通 derivative。图像在此形成尖角：它没有断开，却不存在唯一的 tangent slope。

这条蕴含只有一个方向。一个反例足以推翻“continuous 蕴含 differentiable”，却不能推翻正确命题“differentiable 蕴含 continuous”。

### 5. Taylor 公式把 derivative 数据变成局部多项式

<!-- wanxiang:block foundations-b01-taylor-remainder-observation:start -->

第二张板书记录设定，但不填结论：

```text
展开点                      a
有限阶数                    n
目标位置                    x
多项式工作区                [写到 n 阶]
未填写的证据框              ____________________

可以从 a 带到别处的主张：   ____________________
在目标 x 处仍需的证据：     ____________________
```

板书结束时，两行证据都保持空白。

<!-- wanxiang:block foundations-b01-taylor-remainder-observation:end -->

<!-- wanxiang:block foundations-b01-taylor-remainder:start -->

设展开点 `a` 处的 derivative 信息已知。`n` 阶 Taylor 表示为

$$
f(x)=\sum_{k=0}^{n}\frac{f^{(k)}(a)}{k!}(x-a)^k+R_n(x).
$$

其中多项式部分为

$$
T_n(x)=\sum_{k=0}^{n}\frac{f^{(k)}(a)}{k!}(x-a)^k,
$$

精确 residual 为

$$
R_n(x)=f(x)-T_n(x).
$$

本课采用一个清楚的充分条件：`f` 在 `a` 的某个邻域内有 `n` 阶 derivative，且 `f^{(n)}` 在 `a` 处 continuous。在此条件下，当 `x` 趋近 `a` 时，`R_n(x)=o(|x-a|^n)`；也就是

$$
\lim_{x\to a}\frac{R_n(x)}{|x-a|^n}=0.
$$

这是局部渐近陈述，不是有限距离上的误差界。本课中，只要精确值可得，就应直接计算 residual；不要引用尚未核对前提的 remainder bound。

一阶：

$$
T_1(a+h)=f(a)+f'(a)h.
$$

二阶：

$$
T_2(a+h)=f(a)+f'(a)h+\frac12 f''(a)h^2.
$$

完整例题：

对 `f(x)=cos(x)` 在 `a=0` 处展开，

$$
f(0)=1,\qquad f'(0)=0,\qquad f''(0)=-1.
$$

因此

$$
T_2(x)=1-\frac{x^2}{2}.
$$

在 `x=0.3` 处，

$$
T_2(0.3)=1-\frac{0.09}{2}=0.955.
$$

精确值约为 `0.95533649`，所以

$$
R_2(0.3)\approx 0.00033649.
$$

这次计算不能证明二阶模型始终足够准确；它只展示了从一个展开点出发、在一个距离上测得的误差。

<!-- wanxiang:block foundations-b01-taylor-remainder:end -->

### 6. 阶数与距离承担不同作用

提高 Taylor 阶数可能减小局部 residual，因为模型在中心匹配了更多 derivative 信息。远离中心则可能增大 residual，因为 `(x-a)` 的幂会增大，函数离开 `a` 后也可能表现不同。

因此，“二阶”不是通用的准确度标签。每项准确性主张都必须说明：

- 函数；
- 展开点；
- 计算点或邻域；
- 截断阶数；
- 实际 residual、已有依据的界，或其他误差论证。

若在 `a=0` 建立的模型在 `x=0.2` 表现良好，这份证据不能自动转移到 `x=5`。

### 7. indefinite integral 返回一族函数

`f` 的 antiderivative 是满足下式的函数 `F`：

$$
F'(x)=f(x).
$$

indefinite integral 记号

$$
\int f(x)\,dx=F(x)+C
$$

表示一族函数，因为任意常数 `C` 的 derivative 都为零。省略 `+C` 会丢失这族函数中的有效成员。

例：

$$
\int (6x^2-4x+3)\,dx=2x^3-2x^2+3x+C.
$$

对结果求 derivative 进行检查：

$$
\frac{d}{dx}\left(2x^3-2x^2+3x+C\right)=6x^2-4x+3.
$$

这项检查比单凭模式识别更可靠。

### 8. definite integral 返回有符号累计量

对闭区间上的黎曼可积（Riemann-integrable）实函数，definite integral

$$
\int_a^b f(x)\,dx
$$

是一个数。从几何上看，它表示有符号面积：横轴上方的贡献为正，横轴下方的贡献为负。

按照这一符号约定，即使图像围出的几何面积不为零，definite integral 仍可能为零，因为正负贡献会相互抵消。若问题要求无符号总面积或总路程，可能需要绝对值或分段计算；普通 definite integral 记录的是净累计量。

### 9. Riemann sum 把累计变成可计算过程

<!-- wanxiang:block foundations-b01-interval-accumulation-observation:start -->

第三张板书展示 partition 与采样值，但不完成累计总和：

| 子区间 | 采样值 | 子区间宽度 | 对总量的贡献 |
|---|---:|---:|---:|
| 1 | `f(t_1)` | `x_1-x_0` | `________` |
| 2 | `f(t_2)` | `x_2-x_1` | `________` |
| ... | ... | ... | ... |
| N | `f(t_N)` | `x_N-x_{N-1}` | `________` |

连接两列数值的运算、最终总和及其解释全部留空。

<!-- wanxiang:block foundations-b01-interval-accumulation-observation:end -->

<!-- wanxiang:block foundations-b01-riemann-sum:start -->

对 `[a,b]` 作 partition：

$$
a=x_0<x_1<\cdots<x_N=b.
$$

在每个子区间 `[x_{n-1},x_n]` 中选择 representative point

$$
t_n\in[x_{n-1},x_n].
$$

Riemann sum 为

$$
S=\sum_{n=1}^{N} f(t_n)(x_n-x_{n-1}).
$$

每一项都是：

$$
\text{采样高度}\times\text{子区间宽度}.
$$

若漏掉宽度，得到的只是采样值之和，不是面积近似。

定义 mesh size

$$
\lambda=\max_{1\le n\le N}(x_n-x_{n-1}).
$$

源材料中的收敛思想强于“选取很大的 `N`”。只有当最大宽度趋近于零时，所有允许的 Riemann sum 都趋向同一个公共极限，函数才具有相应的黎曼积分（Riemann integral）。在均匀 partition 上，增大 `N` 会缩小宽度，因此 `N` 是方便的控制量；在非均匀 partition 上，直接控制量是最大宽度。

<!-- wanxiang:block foundations-b01-riemann-sum:end -->

### 10. 左端点法（left rule）与中点法（midpoint rule）是两种 representative point 选择

对宽度为下式的均匀 partition，

$$
\Delta x=\frac{b-a}{N},
$$

left rule 选择

$$
t_n=x_{n-1},
$$

midpoint rule 选择

$$
t_n=\frac{x_{n-1}+x_n}{2}.
$$

在课堂例题中，`f(x)=x^2`、区间为 `[0,2]`、`N=4`，宽度是 `0.5`。

左端点为：`0, 0.5, 1.0, 1.5`。

$$
S_{\text{left}}
=0.5(0^2+0.5^2+1^2+1.5^2)
=1.75.
$$

中点为：`0.25, 0.75, 1.25, 1.75`。

$$
S_{\text{mid}}
=0.5(0.25^2+0.75^2+1.25^2+1.75^2)
=2.625.
$$

精确 integral 为

$$
\int_0^2x^2\,dx=\frac83\approx2.66666667.
$$

对这个递增凸函数和这一 partition，midpoint rule 的结果更接近精确值。这只是本次实验的证据，不能证明某种方法对所有被积函数和 partition 都更优。

## 完整因果链

### 因果链 A：从两点到局部模型

1. 选择一点 `x_0` 和非零步长 `h`。
2. 计算有限输出变化 `f(x_0+h)-f(x_0)`。
3. 除以 `h`，得到 secant slope。
4. 换用绝对值逐渐缩小的正、负步长重复计算。
5. 若所有差商趋向同一个公共值，则 derivative 存在。
6. 把这个 derivative 作为局部线性模型的系数。
7. 比较有限步长预测与函数精确值。
8. 记录 residual，保留“近似”与“等号”的区别。

### 因果链 B：从尖角到 derivative 不存在

1. 检查邻近函数值是否趋近 `f(a)`，据此判断 continuity。
2. 用左侧步长计算斜率。
3. 用右侧步长计算斜率。
4. 比较两个极限值。
5. 若二者不同，就不存在能同时拟合两侧的 tangent slope。
6. 得出该点 continuous、但 differentiability 不成立的结论。
7. 保持逻辑方向：这个例子只推翻错误的逆命题。

### 因果链 C：从局部 derivative 到 Taylor 近似

1. 选择展开点 `a`。
2. 计算 `f(a)`、`f'(a)`，并在需要时计算 `f''(a)`。
3. 把这些值与多项式系数对应起来。
4. 在目标点 `x` 计算多项式值。
5. 精确值可得时，计算 `R_n(x)=f(x)-T_n(x)`。
6. 固定目标点、改变阶数，研究阶数的影响。
7. 固定阶数、改变目标点，研究距离的影响。
8. 只陈述被测点上的证据，避免扩张成无限制的准确性结论。

### 因果链 D：从区间到 Riemann 近似

1. 选择 `[a,b]` 与 partition。
2. 确认所有宽度为正，且各子区间无遗漏地覆盖整个区间。
3. 每个子区间选择一个 representative point。
4. 在每个 representative point 计算函数值。
5. 每个采样值都乘以其所属子区间的宽度。
6. 把带符号的贡献相加。
7. 缩小最大宽度，细化 partition。
8. 比较多次细化的估计；精确 integral 已知时也与之比较。
9. 把差异归因到离散化与规则选择；有限和只有在得到充分依据后才能视为精确 integral。

### 因果链 E：选择局部预测还是区间累计

先判断所求输出代表什么：

- “这个状态附近发生一次小变化后会怎样？”指向 derivative 或 Taylor 模型。
- “整个区间上的净贡献是多少？”指向 definite integral。
- “哪一族函数求 derivative 后回到这个函数？”指向 indefinite integral。
- “计算机怎样近似区间累计量？”指向 Riemann sum 一类数值求和。

同一问题中可以同时出现 derivative 与 integral，但它们回答不同的子问题。

## 图示与状态追踪

### 状态追踪 1：secant slope 逼近 tangent slope

取 `f(x)=log(x)+1`、`x_0=3`，精确 derivative 为 `1/3`。

| `h` | secant slope `[f(3+h)-f(3)]/h` | 到 `1/3` 的距离 |
|---:|---:|---:|
| `1.0` | 约 `0.287682` | 约 `0.045651` |
| `0.5` | 约 `0.308301` | 约 `0.025032` |
| `0.1` | 约 `0.327899` | 约 `0.005434` |
| `0.01` | 约 `0.332779` | 约 `0.000554` |

状态转移：

```text
两个点
  -> 有限 secant slope
  -> 从两侧缩小步长
  -> 公共极限斜率
  -> tangent 系数
  -> 局部线性预测
  -> 实测的有限步长 residual
```

### 状态追踪 2：尖角处有两个不相容的局部斜率

考察 `f(x)=|x|` 在零点的情形：

| 试验方向 | `h` | `|h|/h` |
|---|---:|---:|
| 左侧 | `-0.1` | `-1` |
| 左侧 | `-0.001` | `-1` |
| 右侧 | `0.001` | `1` |
| 右侧 | `0.1` | `1` |

图像在零点连续，但局部斜率无法收敛为同一个值。

### 状态追踪 3：Taylor 阶数与距离是两个独立控制量

考察 `exp(x)` 在零点附近的展开：

$$
T_1(x)=1+x,\qquad T_2(x)=1+x+\frac{x^2}{2}.
$$

| 目标点 | `T_1` 绝对误差 | `T_2` 绝对误差 | 观察 |
|---:|---:|---:|---|
| `0.25` | 约 `0.034025` | 约 `0.002775` | 在邻域内补入曲率信息能改善结果。 |
| `0.90` | 约 `0.559603` | 约 `0.154603` | 二阶仍有改善，但离中心更远时 residual 明显更大。 |

这张表支持的不是“二阶就是准确”，而是受函数、中心、目标点与实测 residual 共同约束的结论。

### 状态追踪 4：矩形贡献形成累计估计

对一个子区间：

```text
区间 [x_(n-1), x_n]
  -> 在其中选择 t_n
  -> 采样 f(t_n)
  -> 乘以宽度 x_n-x_(n-1)
  -> 带符号的矩形贡献
```

对整个区间：

```text
全部矩形贡献
  -> 有限 Riemann sum S_N
  -> 缩小最大宽度 lambda
  -> 比较细化后的和
  -> 公共极限值（若存在）
  -> definite integral
```

源材料的图 B.2 直观比较了不断细化的 partition。关键观察是竖条逐渐变窄，矩形边界因而更贴近曲线。这里不再分发原始图片；本表与可执行实验共同提供可复现的项目自制状态追踪。

## 可执行代码

下面唯一的主代码块只使用 Python 标准库，可以独立运行。它用 secant slope 检查 derivative，测量一阶与二阶 Taylor residual，并比较 left rule 与 midpoint rule。

```python
from math import exp, log


def secant_slope(f, x0, h):
    if h == 0:
        raise ValueError("h must be nonzero for a finite difference quotient")
    return (f(x0 + h) - f(x0)) / h


def taylor_exp_first(x):
    return 1.0 + x


def taylor_exp_second(x):
    return 1.0 + x + 0.5 * x * x


def uniform_riemann(f, a, b, n, rule):
    if n <= 0:
        raise ValueError("n must be positive")
    width = (b - a) / n
    total = 0.0
    for i in range(n):
        left = a + i * width
        if rule == "left":
            sample = left
        elif rule == "midpoint":
            sample = left + 0.5 * width
        else:
            raise ValueError("rule must be 'left' or 'midpoint'")
        total += f(sample) * width
    return total


def run_lab():
    print("A. Secants for f(x)=log(x)+1 at x0=3")
    f = lambda x: log(x) + 1.0
    exact_derivative = 1.0 / 3.0
    derivative_errors = []
    for h in (1.0, 0.5, 0.1, 0.01):
        slope = secant_slope(f, 3.0, h)
        error = abs(slope - exact_derivative)
        derivative_errors.append(error)
        print(f"h={h:>4}: slope={slope:.9f}, error={error:.9f}")
    assert all(
        later < earlier
        for earlier, later in zip(derivative_errors, derivative_errors[1:])
    )

    print("\nB. Taylor residuals for exp(x) around zero")
    for x in (0.25, 0.90):
        exact = exp(x)
        error_1 = abs(exact - taylor_exp_first(x))
        error_2 = abs(exact - taylor_exp_second(x))
        print(
            f"x={x:.2f}: first_error={error_1:.9f}, "
            f"second_error={error_2:.9f}"
        )
        assert error_2 < error_1

    print("\nC. Riemann rules for integral of x^2 on [0,2]")
    square = lambda x: x * x
    exact_integral = 8.0 / 3.0
    previous_left_error = None
    for n in (4, 16, 64, 256):
        left = uniform_riemann(square, 0.0, 2.0, n, "left")
        midpoint = uniform_riemann(square, 0.0, 2.0, n, "midpoint")
        left_error = abs(left - exact_integral)
        midpoint_error = abs(midpoint - exact_integral)
        print(
            f"n={n:>3}: left={left:.9f}, midpoint={midpoint:.9f}, "
            f"left_error={left_error:.9f}, midpoint_error={midpoint_error:.9f}"
        )
        assert midpoint_error < left_error
        if previous_left_error is not None:
            assert left_error < previous_left_error
        previous_left_error = left_error


if __name__ == "__main__":
    run_lab()
```

修改代码块之前，先预测：

- 使用负的 secant 步长时，结果是否仍趋近 `1/3`；
- `x=1.5` 处的 Taylor residual 是否会大于 `x=0.25` 处；
- 对递增正函数，left rule 在均匀 partition 上是否倾向于低估；
- 增大 `n` 是否会改变 Taylor 截断误差（不会；积分循环中的 `n` 是 partition 数量，不是 Taylor 阶数）。

可选编辑片段：原代码块通过后，再添加梯形法（trapezoid rule）。

```python-fragment
def trapezoid_rule(f, a, b, n):
    width = (b - a) / n
    interior = sum(f(a + i * width) for i in range(1, n))
    return width * (0.5 * f(a) + interior + 0.5 * f(b))
```

## 阶段检查

### 阶段检查 A：局部预测

在 `x_0=2.5` 处，已知 `f(2.5)=4.7`、`f'(2.5)=-1.2`。用一阶模型预测 `f(2.47)`，并把结果明确标为近似值。

### 阶段检查 B：continuity 与 differentiability

对 `g(x)=|x-2|`，判断它在 `x=2` 处是否 continuous、是否 differentiable，并用左、右斜率支持结论。

### 阶段检查 C：Taylor residual

构造 `cos(x)` 在零点展开的二阶 Taylor 多项式。在 `x=0.3` 处计算它的值，再用 `cos(0.3)≈0.95533649` 求 residual。

### 阶段检查 D：integral 类型

判断下列所求输出属于哪一类：

1. derivative 为 `3x^2` 的函数族；
2. `3x^2` 从 `0` 到 `2` 的净累计量；
3. 对该净累计量所作的数值矩形近似。

### 阶段检查 E：Riemann 状态

对 `f(x)=x^2`、区间 `[0,2]` 和 `N=4`，列出四个中点采样值、共同宽度以及所得 midpoint sum。

## 综合练习

### 综合练习 1：一次运动，两个问题

粒子的位置为 `s(t)`。在 `t=3` 时，已知 `s(3)=10` 米、`s'(3)=1.8` 米／秒。

1. 用局部线性模型预测 `s(3.04)`。
2. 解释为什么这不能确定从 `t=3` 到 `t=8` 的精确路程。
3. 说明需要哪项区间信息才能计算累计位移。

### 综合练习 2：一个函数，两种近似机制

设 `f(x)=exp(x)`。

1. 构造它在零点展开的 `T_2(x)`。
2. 计算 `T_2(-0.4)`，并用 `exp(-0.4)≈0.67032005` 求 residual。
3. 另用 `N=2` 的 left Riemann sum 近似 $\int_0^1 \exp(x)\,dx$。
4. 解释 Taylor residual 与 Riemann 离散化误差为何不是同一种误差。

### 综合练习 3：有符号累计

设 `r(t)=t-1`，区间为 `[0,2]`。

1. 求 antiderivative 函数族。
2. 计算 definite integral。
3. 解释 definite integral 为零而 `r(t)` 并非恒等于零的原因。
4. 若问题改为求无符号总面积，应怎样改写？

### 综合练习 4：证据账

写一张四行的证据账，列为：

| 主张 | 所需证据 | 已获证据 | 适用范围 |
|---|---|---|---|

每行分别处理：

- 一点处是否存在 derivative；
- Taylor 在目标点的准确性；
- differentiability 与 continuity；
- 数值积分实验是否收敛。

目标是避免把真实观察扩张成缺乏支持的更宽主张。

## 完整答案与评分点

### 阶段检查 A

步长为 `h=2.47-2.5=-0.03`。

$$
f(2.47)\approx f(2.5)+f'(2.5)h
=4.7+(-1.2)(-0.03)
=4.736.
$$

评分，共 4 分：

- `h=-0.03`，1 分；
- derivative 乘以步长，1 分；
- 得到 `4.736`，1 分；
- 明确标注结果为近似值，1 分。

### 阶段检查 B

`g(x)=|x-2|` 在 `2` 处 continuous。对 `h<0`，

$$
\frac{|h|}{h}=-1,
$$

而对 `h>0`，

$$
\frac{|h|}{h}=1.
$$

两个单侧斜率不同，因此 `2` 处不存在普通 derivative。

评分，共 4 分：

- continuity，1 分；
- 左侧斜率，1 分；
- 右侧斜率，1 分；
- differentiability 不成立的结论，1 分。

### 阶段检查 C

$$
T_2(x)=1-\frac{x^2}{2},
\qquad
T_2(0.3)=0.955.
$$

$$
R_2(0.3)=0.95533649-0.955=0.00033649.
$$

评分，共 5 分：

- 多项式正确，2 分；
- 近似值正确，1 分；
- residual 按“精确值减近似值”计算，1 分；
- 解释范围只限这个目标点，1 分。

### 阶段检查 D

1. $\int 3x^2\,dx=x^3+C$ 是 indefinite integral。
2. $\int_0^2 3x^2\,dx=8$ 是 definite integral。
3. 有限矩形和是 Riemann 近似。

评分，共 3 分：每项分类和对象类型均正确，得 1 分。

### 阶段检查 E

宽度为 `0.5`，中点采样值是 `0.25, 0.75, 1.25, 1.75`。

$$
S_{\mathrm{mid}}
=0.5(0.25^2+0.75^2+1.25^2+1.75^2)
=2.625.
$$

评分，共 4 分：

- 宽度正确，1 分；
- 所有采样位置正确，1 分；
- 每项贡献都包含宽度，1 分；
- 得到 `2.625`，1 分。

### 综合练习 1

1. `s(3.04)≈10+1.8(0.04)=10.072` 米。
2. 一个 derivative 值只给出 `t=3` 附近的局部变化率，不能说明整整五秒内的速度。
3. 若已知整个区间上的速度函数 `v(t)=s'(t)`，就能用 $\int_3^8 v(t)\,dt$ 计算位移。

评分，共 5 分：

- 局部预测，2 分；
- 保留近似语气，1 分；
- 拒绝由局部信息推断远区间，1 分；
- 写出区间 integral，1 分。

### 综合练习 2

1. `T_2(x)=1+x+x^2/2`。
2. `T_2(-0.4)=1-0.4+0.08=0.68`；residual 为 `0.67032005-0.68=-0.00967995`。
3. 宽度为 `0.5`，left point 为 `0` 和 `0.5`：

$$
S_2=0.5(\exp(0)+\exp(0.5))\approx1.32436064.
$$

4. Taylor 误差来自用截断多项式替代一个中心附近的函数；Riemann 误差来自用有限个采样矩形替代区间累计量。

评分，共 8 分：

- `T_2`，2 分；
- 数值与带符号 residual，2 分；
- 含宽度的 Riemann sum，2 分；
- 区分两种误差机制，2 分。

### 综合练习 3

1. $\int(t-1)\,dt=t^2/2-t+C$。
2.

$$
\int_0^2(t-1)\,dt
=\left[\frac{t^2}{2}-t\right]_0^2
=0.
$$

3. `[0,1]` 上的负贡献与 `[1,2]` 上等量的正贡献相互抵消。
4. 无符号总面积需要计算 $\int_0^2 |t-1|\,dt$，或分别计算各段正面积；结果为 `1`。

评分，共 6 分：

- antiderivative 与 `+C`，1 分；
- definite integral 计算，2 分；
- 有符号抵消的解释，2 分；
- 改写为无符号问题，1 分。

### 综合练习 4

合格的证据账应包括：

- derivative：双侧差商行为，适用范围限于被测点；
- Taylor：中心、阶数、目标点，以及 residual 或有依据的界；
- differentiability：continuity 加上单侧斜率相同或不同的结果；
- 积分实验：规则、partition、mesh／细化过程、估计值与比较目标。

评分，共 8 分：每个完整条目 2 分，其中证据 1 分、适用范围 1 分。

## 常见错误与修复路径

### 错误 1：用一个有限差商替代 limit

表现：“derivative 就是 `h=0.1` 时的差商。”

修复：

1. 把算出的数称为 secant slope。
2. 换用更小的正、负步长重复计算。
3. 只有两侧一致时才确定极限值。

### 错误 2：把近似写成等式

表现：对任意非线性函数和有限 `h` 写出 `f(a+h)=f(a)+f'(a)h`。

修复：

1. 恢复 `approx`。
2. 精确值可得时计算精确值。
3. 记录“精确值 - 近似值”。
4. 写明被测步长。

### 错误 3：颠倒 continuity 蕴含关系

表现：“图像没有跳跃，所以存在 derivative。”

修复：

1. 检查左、右斜率。
2. 用 `|x|` 作最小反例。
3. 记住箭头方向：differentiable 蕴含 continuous。

### 错误 4：把 Taylor 阶数当成通用准确性标签

表现：“二阶就是准确。”

修复：

1. 写明函数、中心、目标点与阶数。
2. 在两个距离上计算 residual。
3. 分开考察提高阶数与远离中心的影响。

### 错误 5：漏写 `+C`

表现：把 indefinite integral 写成单个函数。

修复：

1. 对提出的 antiderivative 求 derivative。
2. 观察任意加法常数都会消失。
3. 恢复函数族 `F+C`。

### 错误 6：只加采样高度，不乘宽度

表现：把 `sum f(t_n)` 写成“Riemann sum”。

修复：

1. 在每个采样值旁写出对应子区间宽度。
2. 每一项按“高度 × 宽度”构造。
3. 检查单位：若 `f` 的单位是“每秒”，宽度单位是“秒”，乘积才具有累计量的单位。

### 错误 7：混淆带符号净累计与总大小

表现：把为零的 definite integral 解释成“什么也没发生”。

修复：

1. 找出图像位于横轴上、下方的区间。
2. 追踪各段符号。
3. 若题目要求总大小，就积分绝对值或分段计算。

### 错误 8：认为增加 partition 数量总能解决问题

表现：“`N` 很大就保证正确。”

修复：

1. 追踪最大宽度，而不只看点的数量。
2. 比较多次细化结果。
3. 确认被积函数行为与规则选择。
4. 把浮点和建模限制与离散化误差分开。

### 错误 9：混淆局部问题与累计问题

表现：只用 `f'(a)` 求长区间总量，或在只需求即时斜率时使用 integral。

修复：

1. 写出所求输出及其单位。
2. 判断它属于一个点还是一个区间。
3. 局部响应选择 derivative／Taylor，累计量选择 definite integral。
