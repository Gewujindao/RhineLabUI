# 反向传播（backpropagation）之前：矩阵微积分（Matrix Calculus）

matrix calculus 并不取代普通微积分。它把许多偏导数组织进数组，让我们可以
一次推理完整的向量值计算。最重要的纪律很简单：

> 先声明布局，写出每个形状，然后才可以相乘导数。

本课采用书中的**分母布局（denominator layout）**。每当程序库使用更常见的
输出优先（output-first）雅可比矩阵（Jacobian matrix）时，我们都会明确写出两者的转换。

## 前置诊断

对于标量函数 \(f:\mathbb R\to\mathbb R\)，它在 \(x\) 处的导数描述了最佳的
局部线性近似：

\[
f(x+\Delta x)\approx f(x)+f'(x)\Delta x.
\]

同一个想法在多维情形中仍然成立。若
\(f:\mathbb R^M\to\mathbb R^N\)，微小的输入变化 \(\Delta x\) 会产生近似线性的
输出变化：

\[
f(x+\Delta x)-f(x)\approx J_{\text{out}}(x)\Delta x.
\]

这里的 \(J_{\text{out}}\in\mathbb R^{N\times M}\) 是采用 output-first、
numerator layout 的 Jacobian。书中则用 denominator layout 保存完全相同的条目：

\[
D_x f = J_{\text{out}}^\mathsf T\in\mathbb R^{M\times N}.
\]

作为数学上的局部映射，导数本身并未改变；改变的只有导数表的朝向。分清这一点
可以避免一个常见错误：把记法导致的转置误当成新的数学内容。

一维先算一遍。取 \(f(x)=x^2\)、\(x=2\)、\(\Delta x=0.1\)：真实值
\(f(2.1)=4.41\)，近似值 \(f(2)+f'(2)\cdot 0.1=4+4\cdot 0.1=4.4\)，误差
\(0.01=\Delta x^2\)。误差按 \(\Delta x\) 的平方收缩，这正是“局部线性”的含义。

多维同样成立。取本课稍后会出现的 \(v(x)=[x_1+2x_2, x_1x_2, x_2^2]^\mathsf T\)，
在 \(x=[1,1]^\mathsf T\) 处有

\[
J_{\text{out}}=
\begin{bmatrix}
1&2\\
1&1\\
0&2
\end{bmatrix}.
\]

取 \(\Delta x=[0.1,0.2]^\mathsf T\)：

```text
v(x+dx)          = [3.5, 1.32, 1.44]
v(x) + J_out*dx  = [3.5, 1.3,  1.4 ]
```

第一个坐标完全吻合，另外两个坐标的误差仍按 \(\Delta x\) 的平方收缩。
\(J_{\text{out}}\) 就是这段局部的线性近似。

求导之前，先写一张类型账本：

| 对象 | 类型 | 作用 |
|---|---:|---|
| \(x\) | \(\mathbb R^M\) | 输入 |
| \(y=f(x)\) | \(\mathbb R^N\) | 输出 |
| \(D_x f\) | \(\mathbb R^{M\times N}\) | denominator-layout 导数 |
| \(J_{\text{out}}\) | \(\mathbb R^{N\times M}\) | output-first Jacobian |

如果计划中的矩阵乘法无法约去一个公共维度，就停下来：这一步代数还没有意义。

## 首次术语

本课会用到 matrix calculus、denominator layout、numerator layout、gradient、
Jacobian、Hessian matrix 与 chain rule。下文会在定义每个术语时，把它绑定到
具体的输入—输出形状。

<!-- wanxiang:block foundations-b02-evidence-ledger:start -->
### B02 证据账本

第一页展示三份尚未作答的纸面记录，既不给导数公式，也不给最终形状：

1. 两张输入轴与输出轴朝向相反的表格；行标签、列标签和每个单元格都仍可供比较；
2. 一张空账本，等待填写每个导数对象的输入、输出与形状；
3. 四个相邻节点，依次标为 (x)、(z)、(r) 与 (L)，每个局部导数格都留空。

先根据轴标签判断已经可以推出什么；相乘之前，记录每个导数对象的输入、输出与
形状；再检验仅凭吻合的最终形状，能否恢复中间的依赖链。完成这三项判断后，
再与后面的完整推导比较。
<!-- wanxiang:block foundations-b02-evidence-ledger:end -->

<!-- wanxiang:block foundations-b02-layout:start -->
### 布局合同：公式 B.6-B.10

matrix calculus 文献中常见两种约定：

- **denominator layout：**输入坐标索引行；
- **numerator layout：**输出坐标索引行。

除非另有明确说明，本课始终采用 denominator layout。

#### 向量输入、标量输出

令 \(x\in\mathbb R^M\)，且 \(y=f(x)\in\mathbb R\)。

与 B.6 对应的 denominator layout 把偏导数保存为一列：

\[
\frac{\partial y}{\partial x}
=
\begin{bmatrix}
\frac{\partial y}{\partial x_1}\\
\vdots\\
\frac{\partial y}{\partial x_M}
\end{bmatrix}
\in\mathbb R^{M\times 1}.
\]

与 B.7 对应的 numerator layout 则把相同的数保存为一行：

\[
\left(\frac{\partial y}{\partial x}\right)_{\text{num}}
=
\begin{bmatrix}
\frac{\partial y}{\partial x_1}&\cdots&
\frac{\partial y}{\partial x_M}
\end{bmatrix}
\in\mathbb R^{1\times M}.
\]

因此，两种表示互为转置。

#### 标量输入、向量输出

令 \(x\in\mathbb R\)，且 \(y=f(x)\in\mathbb R^N\)。在 denominator layout 下，
B.8 是一行：

\[
\frac{\partial y}{\partial x}
=
\begin{bmatrix}
\frac{\partial y_1}{\partial x}&\cdots&
\frac{\partial y_N}{\partial x}
\end{bmatrix}
\in\mathbb R^{1\times N}.
\]

在 numerator layout 下，B.9 是对应的 \(\mathbb R^{N\times1}\) 列。

#### 向量输入、向量输出

令 \(x\in\mathbb R^M\)，且 \(y=f(x)\in\mathbb R^N\)。在 denominator layout 下，
B.10 为

\[
\frac{\partial f(x)}{\partial x}
=
\begin{bmatrix}
\frac{\partial y_1}{\partial x_1}&\cdots&
\frac{\partial y_N}{\partial x_1}\\
\vdots&\ddots&\vdots\\
\frac{\partial y_1}{\partial x_M}&\cdots&
\frac{\partial y_N}{\partial x_M}
\end{bmatrix}
\in\mathbb R^{M\times N}.
\]

书中准确地把它称为常见 output-first 约定下 Jacobian 的转置：

\[
D_xf=J_{\text{out}}^\mathsf T.
\]

程序库返回形状为 \((N,M)\) 的 Jacobian，并不与书中矛盾；它报告的是
numerator/output-first layout。把程序库的 \((N,M)\) 结果接入本课账本时，先转置再
入账；跳过转置会得到颠倒轴的导数表，后续乘法立刻形状不合。

把同一张表在两种 layout 下逐项写出来。取 \(v(x_1,x_2)=[x_1+2x_2, x_1x_2, x_2^2]^\mathsf T\)。
denominator layout（输入索引行）是 \(2\times3\)：

\[
\frac{\partial v}{\partial x}
=
\begin{bmatrix}
1&x_2&0\\
2&x_1&2x_2
\end{bmatrix}
\in\mathbb R^{2\times3}.
\]

output-first Jacobian（输出索引行）就是它的 \(3\times2\) 转置：

\[
J_{\text{out}}
=
\begin{bmatrix}
1&2\\
x_2&x_1\\
0&2x_2
\end{bmatrix}
\in\mathbb R^{3\times2}.
\]

两种写法保存完全相同的六个条目。B.6 与 B.8 的两种签名也各配一个条目：
\(\mathbb R^2\to\mathbb R\) 的 \(f(x)=x_1^2+x_2^2\) 给出 \(2\times1\) 列
\([2x_1, 2x_2]^\mathsf T\)；\(\mathbb R\to\mathbb R^2\) 的 \(y=[x, x^2]^\mathsf T\)
给出 \(1\times2\) 行 \([1, 2x]\)。
<!-- wanxiang:block foundations-b02-layout:end -->

## 核心讲解

<!-- wanxiang:block foundations-b02-derivative-objects:start -->
### Gradient、Jacobian 与 Hessian：公式 B.10-B.11

**gradient** 汇集标量输出对向量输入的一阶导数：

\[
\nabla_x f=
\begin{bmatrix}
\partial f/\partial x_1\\
\vdots\\
\partial f/\partial x_M
\end{bmatrix}
\in\mathbb R^{M\times1}.
\]

**Jacobian** 汇集向量输出对向量输入的一阶导数。在常见的 output-first layout 下，
它的形状是 \(N\times M\)；书中的 denominator-layout 导数表则是
\(M\times N\)。

**Hessian matrix** 汇集标量输出的二阶导数。B.11 定义

\[
H=\frac{\partial^2 f(x)}{\partial x^2}
=
\begin{bmatrix}
\frac{\partial^2 f}{\partial x_1^2}&\cdots&
\frac{\partial^2 f}{\partial x_1\partial x_M}\\
\vdots&\ddots&\vdots\\
\frac{\partial^2 f}{\partial x_M\partial x_1}&\cdots&
\frac{\partial^2 f}{\partial x_M^2}
\end{bmatrix}
\in\mathbb R^{M\times M}.
\]

当混合二阶偏导连续时，
\(\partial^2 f/\partial x_i\partial x_j=
\partial^2 f/\partial x_j\partial x_i\)，因此 \(H\) 对称。

对称来自这个连续性前提，不是“方阵天然对称”。混合偏导不连续时不能断言对称；
把程序库返回的 \((N,M)\) Jacobian 直接当作本课 \((M,N)\) 导数表使用时也要先转置——
两种失配都发生在记法与前提上，而不是发生在新数学里。

不要根据公式里出现了多少符号来给对象分类；要根据函数签名分类：

| 映射 | 一阶导数 | 本课采用的形状 |
|---|---|---:|
| \(\mathbb R^M\to\mathbb R\) | gradient | \(M\times1\) |
| \(\mathbb R\to\mathbb R^N\) | 导数行 | \(1\times N\) |
| \(\mathbb R^M\to\mathbb R^N\) | 常见 Jacobian 的转置 | \(M\times N\) |
| \(\mathbb R^M\to\mathbb R\) 的曲率 | Hessian | \(M\times M\) |

#### 分类例题

考虑

\[
u(x_1,x_2)=3x_1^2-x_1x_2+x_2^2
\]

以及

\[
v(x_1,x_2)=
\begin{bmatrix}
x_1+2x_2\\
x_1x_2\\
x_2^2
\end{bmatrix}.
\]

\(u:\mathbb R^2\to\mathbb R\) 的导数是 \(2\times1\) gradient，Hessian 是
\(2\times2\)。\(v:\mathbb R^2\to\mathbb R^3\) 的 denominator-layout 导数为
\(2\times3\)，而典型自动微分（automatic differentiation）程序库的 output-first Jacobian 为 \(3\times2\)。

形状之外，把条目也算出来。对 \(u\)，gradient 为

\[
\nabla u=
\begin{bmatrix}
6x_1-x_2\\
-x_1+2x_2
\end{bmatrix}
\in\mathbb R^{2\times1},
\]

Hessian 为

\[
H_u=
\begin{bmatrix}
6&-1\\
-1&2
\end{bmatrix}
\in\mathbb R^{2\times2}.
\]

混合二阶偏导 \(\partial^2 u/\partial x_1\partial x_2\) 与
\(\partial^2 u/\partial x_2\partial x_1\) 都是 \(-1\)，对称在这里逐项可见。对 \(v\)，
denominator-layout 导数的六个条目为

\[
\frac{\partial v}{\partial x}
=
\begin{bmatrix}
1&x_2&0\\
2&x_1&2x_2
\end{bmatrix}
\in\mathbb R^{2\times3}.
\]

按函数签名分类给形状，按坐标求偏导给条目；两种证据合起来，导数表才完整。
<!-- wanxiang:block foundations-b02-derivative-objects:end -->

### Addition rule 与减法法则（subtraction rule）：公式 B.12

令 \(x\in\mathbb R^M\)、\(y=f(x)\in\mathbb R^N\)，且
\(z=g(x)\in\mathbb R^N\)。B.12 给出

\[
\frac{\partial(y+z)}{\partial x}
=
\frac{\partial y}{\partial x}
+
\frac{\partial z}{\partial x}
\in\mathbb R^{M\times N}.
\]

把第二项乘以 \(-1\)，就得到 subtraction rule。

为什么 \(y\) 与 \(z\) 必须具有相同的输出形状？因为原来的加法 \(y+z\) 必须有定义。
于是它们的导数表也同为 \(M\times N\)，可以逐项相加。

#### 例题

令

\[
y(x)=
\begin{bmatrix}
2x_1-x_2\\
x_1^2
\end{bmatrix},
\qquad
z(x)=
\begin{bmatrix}
x_1x_2\\
4x_2
\end{bmatrix}.
\]

在 denominator layout 下，

\[
\frac{\partial y}{\partial x}
=
\begin{bmatrix}
2&2x_1\\
-1&0
\end{bmatrix},
\qquad
\frac{\partial z}{\partial x}
=
\begin{bmatrix}
x_2&0\\
x_1&4
\end{bmatrix}.
\]

两者之和仍是一张 \(2\times2\) 导数表。重要的证据不只是各项数值，而是相加之前
已经明确确认两个形状一致。

八个条目逐项派生。对 \(y=[2x_1-x_2, x_1^2]^\mathsf T\)：
\(\partial y_1/\partial x_1=2\)、\(\partial y_1/\partial x_2=-1\)、
\(\partial y_2/\partial x_1=2x_1\)、\(\partial y_2/\partial x_2=0\)；
对 \(z=[x_1x_2, 4x_2]^\mathsf T\)：
\(\partial z_1/\partial x_1=x_2\)、\(\partial z_1/\partial x_2=x_1\)、
\(\partial z_2/\partial x_1=0\)、\(\partial z_2/\partial x_2=4\)。
两张表同为 \(2\times2\)，逐项相减得到 \(y-z\) 的导数。先验证形状、再算数值的顺序
在这里是强制性的：若一张表是 \(2\times3\) 而另一张是 \(2\times2\)，减法本身就没有定义。

### 三种 Product rules：公式 B.13-B.15

矩阵 product rules 只是把普通标量 product rule 装进数组。最稳妥的方法是先写出原表达式的
输出类型，再标注每个因子的形状。

#### 内积（inner product）\(y^\mathsf Tz\)：B.13

若 \(x\in\mathbb R^M\)，且 \(y,z\in\mathbb R^N\)，则
\(y^\mathsf Tz\) 是标量：

\[
\frac{\partial(y^\mathsf Tz)}{\partial x}
=
\frac{\partial y}{\partial x}z
+
\frac{\partial z}{\partial x}y.
\]

形状追踪：

\[
(M\times N)(N\times1)+(M\times N)(N\times1)
\longrightarrow M\times1.
\]

#### 双线性型（bilinear form）\(y^\mathsf TAz\)：B.14

令 \(y\in\mathbb R^S\)、\(z\in\mathbb R^T\)，常量
\(A\in\mathbb R^{S\times T}\)。于是

\[
\frac{\partial(y^\mathsf TAz)}{\partial x}
=
\frac{\partial y}{\partial x}Az
+
\frac{\partial z}{\partial x}A^\mathsf Ty.
\]

第一项的形状为
\((M\times S)(S\times T)(T\times1)=M\times1\)。
第二项的形状为
\((M\times T)(T\times S)(S\times1)=M\times1\)。
第二次缩并迫使 \(A\) 转置。

#### 标量乘向量 \(yz\)：B.15

令标量 \(y=f(x)\) 乘以向量 \(z=g(x)\in\mathbb R^N\)：

\[
\frac{\partial(yz)}{\partial x}
=
y\frac{\partial z}{\partial x}
+
\frac{\partial y}{\partial x}z^\mathsf T
\in\mathbb R^{M\times N}.
\]

外积（outer product）\((\partial y/\partial x)z^\mathsf T\) 的形状是
\((M\times1)(1\times N)=M\times N\)。若写成未转置的 \(z\)，这次乘法就不合法。

#### 乘积追踪例题

取 \(x\in\mathbb R^2\)、
\(y=[x_1+1,\;2x_2]^\mathsf T\)，以及
\(z=[x_1-x_2,\;x_1]^\mathsf T\)。
对于 \(q=y^\mathsf Tz\)，\(D_xy\) 与 \(D_xz\) 都是 \(2\times2\)；product rule 的
两项都是 \(2\times1\)，与标量输出的 gradient 相符。甚至不用展开任何一个
多项式，就能先确定这个形状结论。

现在把同一例子完整展开做反向验证。
\(q=y^\mathsf Tz=(x_1+1)(x_1-x_2)+2x_2\cdot x_1=x_1^2+x_1x_2+x_1-x_2\)，
直接求梯度：

\[
\nabla q=
\begin{bmatrix}
2x_1+x_2+1\\
x_1-1
\end{bmatrix}.
\]

两条 product-rule 路径分别给出 \((D_xy)z=[x_1-x_2, 2x_1]^\mathsf T\) 与
\((D_xz)y=[x_1+2x_2+1, -x_1-1]^\mathsf T\)，相加同样得到
\([2x_1+x_2+1, x_1-1]^\mathsf T\)。“无需展开也能定形状”与“展开后两条路径一致”
是同一结论的两份证据。

B.15 再用一个具体数值例。取标量 \(y=x_1^2\)、向量 \(z=[x_2, 2x_1]^\mathsf T\)，
先逐项写出两个局部导数：

\[
\frac{\partial y}{\partial x}
=
\begin{bmatrix}
2x_1\\
0
\end{bmatrix}
\in\mathbb R^{2\times1},
\qquad
\frac{\partial z}{\partial x}
=
\begin{bmatrix}
0&2\\
1&0
\end{bmatrix}
\in\mathbb R^{2\times2}.
\]

规则给出

\[
\frac{\partial(yz)}{\partial x}
=
x_1^2
\begin{bmatrix}
0&2\\
1&0
\end{bmatrix}
+
\begin{bmatrix}
2x_1\\
0
\end{bmatrix}
\begin{bmatrix}
x_2&2x_1
\end{bmatrix}
=
\begin{bmatrix}
2x_1x_2&6x_1^2\\
x_1^2&0
\end{bmatrix}.
\]

与直接展开 \(yz=[x_1^2x_2, 2x_1^3]^\mathsf T\) 逐项求导一致。外积项
\((\partial y/\partial x)z^\mathsf T\) 正是让第二项形状闭合的那一步。

### 由形状控制复合的 Chain rule：B.16-B.18

**chain rule** 复合局部导数映射。在 denominator layout 中，矩阵按照变量相同的
从左到右顺序出现：

\[
x\longrightarrow y\longrightarrow z,
\qquad
\frac{\partial z}{\partial x}
=
\frac{\partial y}{\partial x}
\frac{\partial z}{\partial y}.
\]

#### 标量到向量再到向量：B.16

若 \(x\in\mathbb R\)、\(y=g(x)\in\mathbb R^M\)，且
\(z=f(y)\in\mathbb R^N\)，则

\[
\frac{\partial z}{\partial x}
=
\frac{\partial y}{\partial x}
\frac{\partial z}{\partial y}
\in\mathbb R^{1\times N}.
\]

形状追踪为 \((1\times M)(M\times N)\to1\times N\)。

把 B.16 走一遍数值。取 \(x\in\mathbb R\)、\(y=[x, x^2]^\mathsf T\)、
\(z=[y_1y_2, y_2^2]^\mathsf T\)。局部导数为

\[
\frac{\partial y}{\partial x}
=[1, 2x]\in\mathbb R^{1\times2},
\qquad
\frac{\partial z}{\partial y}
=
\begin{bmatrix}
y_2&0\\
y_1&2y_2
\end{bmatrix}
\in\mathbb R^{2\times2}.
\]

按 \((1\times2)(2\times2)\) 复合：

\[
\frac{\partial z}{\partial x}
=
[1, 2x]
\begin{bmatrix}
y_2&0\\
y_1&2y_2
\end{bmatrix}
=
[y_2+2xy_1, 4xy_2].
\]

在 \(x=1\) 处 \(y=[1,1]^\mathsf T\)，得 \(\partial z/\partial x=[3, 4]\)；
直接展开 \(z=[x^3, x^4]^\mathsf T\) 求导同样得 \([3, 4]\)。复合与展开两种算法在
同一点汇合，\(1\times2\) 的行形状贯穿始终。

#### 向量到向量再到向量：B.17

若 \(x\in\mathbb R^M\)、\(y=g(x)\in\mathbb R^K\)，且
\(z=f(y)\in\mathbb R^N\)，则

\[
\frac{\partial z}{\partial x}
=
\frac{\partial y}{\partial x}
\frac{\partial z}{\partial y}
\in\mathbb R^{M\times N}.
\]

中间维度 \(K\) 必须被约去：

\[
(M\times K)(K\times N)\to M\times N.
\]

#### 矩阵输入到向量再到标量：B.18

令 \(X\in\mathbb R^{M\times N}\)、\(y=g(X)\in\mathbb R^K\)，且
\(z=f(y)\in\mathbb R\)。按分量写为

\[
\frac{\partial z}{\partial x_{ij}}
=
\frac{\partial y}{\partial x_{ij}}
\frac{\partial z}{\partial y}
\in\mathbb R.
\]

对损失关于某一个权重求导时，这个形式很有用。它也解释了完整权重 gradient
为何与权重矩阵形状相同：每个 \(W_{ij}\) 的位置都保存一个标量偏导数。

#### Chain rule 调试协议

1. 给每个中间值命名。
2. 在名称旁写出它的形状。
3. 写出每个局部导数的形状。
4. 只相乘相邻的局部导数。
5. 检查最终导数的行是否对应原始输入，列是否对应最终输出。

这套协议是 backpropagation 的概念核心。反向模式自动微分（reverse-mode automatic differentiation）改变的是高效求值顺序，
并没有发明另一条 chain rule。

### 常用向量导数：公式 B.19-B.22

对于列向量 \(x\)，B.19 给出恒等映射的导数：

\[
\frac{\partial x}{\partial x}=I.
\]

输出坐标 \(x_j\) 对输入 \(x_i\) 的依赖只在 \(i=j\) 时存在，所以导数表的对角线为一，
其余位置为零。

对于欧几里得范数（Euclidean norm）的平方，B.20 给出

\[
\frac{\partial\lVert x\rVert_2^2}{\partial x}=2x.
\]

这是因为 \(\lVert x\rVert_2^2=\sum_i x_i^2\)，所以坐标 \(i\) 贡献 \(2x_i\)。

对于常量 \(A\)，B.21 给出

\[
\frac{\partial(Ax)}{\partial x}=A^\mathsf T
\]

这里采用 denominator layout。若 \(A\in\mathbb R^{N\times M}\)，则
\(Ax\in\mathbb R^N\)，所以它的 denominator-layout 导数必须是
\(M\times N\)；\(A^\mathsf T\) 恰好具有这个形状。常见的 output-first Jacobian
则报告 \(A\)。

最后，B.22 给出

\[
\frac{\partial(x^\mathsf TA)}{\partial x}=A.
\]

若 \(A\in\mathbb R^{M\times N}\)，则 \(x^\mathsf TA\in\mathbb R^{1\times N}\)，
而 denominator-layout 导数的形状为 \(M\times N\)，与 \(A\) 一致。

这四条公式应当根据依赖关系与形状重新推出来，而不是当成四句互不相关的咒语死记。

三条公式的坐标推导。B.19：\(\partial x_i/\partial x_j=\delta_{ij}\)，对角线为一、
其余为零，即 \(I\)。B.21：\((Ax)_i=\sum_k A_{ik}x_k\) 对 \(x_j\) 求偏导只剩
\(k=j\) 一项 \(A_{ij}\)；本课布局输入索引行、输出索引列，于是第 \(j\) 行第 \(i\) 列
是 \(A_{ij}\)，整表就是 \(A^\mathsf T\)。B.22：
\((x^\mathsf TA)_j=\sum_i x_iA_{ij}\) 对 \(x_i\) 求偏导得 \(A_{ij}\)，输入索引行、
输出索引列，整表就是 \(A\)。output-first 程序库报告 \(A\) 时，就是 B.21 在另一种
布局下的同一张表。

<!-- wanxiang:block foundations-b02-affine-chain:start -->
## 完整因果链

每道多阶段问题都使用这张账本：

| 阶段 | 数值 | 形状 | denominator layout 下的局部导数 |
|---|---|---:|---:|
| 输入 | \(x\) | \(N\times1\) | - |
| 仿射 | \(z=Wx+b\) | \(M\times1\) | \(D_xz=W^\mathsf T:N\times M\) |
| 残差 | \(r=z-t\) | \(M\times1\) | \(D_zr=I:M\times M\) |
| 损失 | \(L=\tfrac12r^\mathsf Tr\) | 标量 | \(D_rL=r:M\times1\) |

沿着从 \(x\) 到 \(L\) 的链：

\[
\nabla_xL
=
D_xz\,D_zr\,D_rL
=
W^\mathsf Tr
\in\mathbb R^{N\times1}.
\]

对于单个权重 \(W_{ij}\)，

\[
\frac{\partial L}{\partial W_{ij}}
=
\frac{\partial z_i}{\partial W_{ij}}
\frac{\partial L}{\partial z_i}
=
x_jr_i.
\]

把所有条目组织起来，就得到 outer product

\[
\nabla_WL=rx^\mathsf T\in\mathbb R^{M\times N}.
\]

因为加上 \(b_i\) 只会以系数一改变 \(z_i\)，所以

\[
\nabla_bL=r\in\mathbb R^{M\times1}.
\]

这就是完整的因果链：

```text
x --(W,b)--> z --(-t)--> r --(half squared norm)--> L
                    local evidence flows back through each edge
```

只有在每个数值、导数与缩并都写明形状时，最终答案才可信。

这条链的每一格都会在后续学习里被直接消费：梯度下降的一步更新就是把 \(W\) 与
\(b\) 分别沿各自梯度方向移动一步，\(W\) 更新为 \(W - lr \cdot \nabla_WL\)，\(b\)
更新为 \(b - lr \cdot \nabla_bL\)，其中 \(lr\) 是学习率。本课只负责把
\(\nabla_WL\) 与 \(\nabla_bL\) 的形状和条目算对；学习率如何选、什么时候停止，
留给优化那节课。
<!-- wanxiang:block foundations-b02-affine-chain:end -->

## 图示与状态追踪

### 状态追踪例题：另一组仿射损失

令

\[
W=
\begin{bmatrix}
2&-1&0\\
1&1&-2
\end{bmatrix},
\quad
x=
\begin{bmatrix}
1\\2\\-1
\end{bmatrix},
\quad
b=
\begin{bmatrix}
-1\\2
\end{bmatrix},
\quad
t=
\begin{bmatrix}
0\\3
\end{bmatrix}.
\]

前向计算为

\[
z=Wx+b=
\begin{bmatrix}
-1\\7
\end{bmatrix},
\qquad
r=z-t=
\begin{bmatrix}
-1\\4
\end{bmatrix}.
\]

因此

\[
L=\frac12r^\mathsf Tr=\frac12(1+16)=8.5.
\]

输入 gradient 为

\[
\nabla_xL=W^\mathsf Tr
=
\begin{bmatrix}
2&1\\
-1&1\\
0&-2
\end{bmatrix}
\begin{bmatrix}
-1\\4
\end{bmatrix}
=
\begin{bmatrix}
2\\5\\-8
\end{bmatrix}
\in\mathbb R^{3\times1}.
\]

权重 gradient 为

\[
\nabla_WL=rx^\mathsf T
=
\begin{bmatrix}
-1\\4
\end{bmatrix}
\begin{bmatrix}
1&2&-1
\end{bmatrix}
=
\begin{bmatrix}
-1&-2&1\\
4&8&-4
\end{bmatrix},
\]

它与 \(W\) 的 \(2\times3\) 形状一致。偏置 gradient 为
\(\nabla_bL=r\)，形状是 \(2\times1\)。

三项检查进一步支持这份推导：

1. \(z,r,b,t,\nabla_bL\) 都共享输出维度 \(M=2\)；
2. \(\nabla_xL\) 具有输入维度 \(N=3\)；
3. \(\nabla_WL\) 与 \(W\) 的形状完全相同。

## 可执行代码

下面是本课唯一一个可以独立运行的 Python 代码块。NumPy 保存一维数组时不区分
行列方向，因此代码在断言书中的列向量约定时会重塑 gradients。

```python
import numpy as np


def output_first_jacobian(f, x, eps=1e-6):
    """Central-difference Jacobian with rows=outputs, columns=inputs."""
    x = np.asarray(x, dtype=float)
    y = np.asarray(f(x), dtype=float)
    jac = np.empty((y.size, x.size), dtype=float)
    for i in range(x.size):
        step = np.zeros_like(x)
        step[i] = eps
        jac[:, i] = (f(x + step) - f(x - step)) / (2.0 * eps)
    return jac


def scalar_gradient(f, x, eps=1e-6):
    """Central-difference gradient returned as a one-dimensional array."""
    x = np.asarray(x, dtype=float)
    grad = np.empty_like(x)
    for i in range(x.size):
        step = np.zeros_like(x)
        step[i] = eps
        grad[i] = (f(x + step) - f(x - step)) / (2.0 * eps)
    return grad


def matrix_gradient(f, matrix, eps=1e-6):
    """Central-difference gradient with the same shape as matrix."""
    matrix = np.asarray(matrix, dtype=float)
    grad = np.empty_like(matrix)
    for index in np.ndindex(matrix.shape):
        step = np.zeros_like(matrix)
        step[index] = eps
        grad[index] = (f(matrix + step) - f(matrix - step)) / (2.0 * eps)
    return grad


# Part A: one vector map, two layout representations.
def vector_map(u):
    u1, u2 = u
    return np.array([u1**2 + 3.0 * u2, u1 * u2, u2**2 - u1])


u = np.array([1.5, -0.5])
j_out = output_first_jacobian(vector_map, u)  # (outputs, inputs) = (3, 2)
d_den = j_out.T                             # (inputs, outputs) = (2, 3)
assert j_out.shape == (3, 2)
assert d_den.shape == (2, 3)
assert np.allclose(d_den, j_out.T)


# Part B: affine squared-error loss.
W = np.array([[1.0, -2.0, 0.5], [0.0, 1.5, -1.0]])
x = np.array([0.5, -1.0, 2.0])
b = np.array([0.25, -0.75])
t = np.array([-1.0, 0.5])


def loss_for(W_value, x_value):
    z = W_value @ x_value + b
    r = z - t
    return 0.5 * float(r @ r)


z = W @ x + b
r = z - t
loss = 0.5 * float(r @ r)
grad_x = W.T @ r
grad_W = np.outer(r, x)
grad_b = r.copy()

# Shape evidence in the book's denominator-layout interpretation.
assert z.reshape(-1, 1).shape == (2, 1)
assert r.reshape(-1, 1).shape == (2, 1)
assert grad_x.reshape(-1, 1).shape == (3, 1)
assert grad_W.shape == W.shape == (2, 3)
assert grad_b.reshape(-1, 1).shape == (2, 1)
assert np.ndim(loss) == 0

# Numerical evidence for x and W.
grad_x_num = scalar_gradient(lambda x_value: loss_for(W, x_value), x)
grad_W_num = matrix_gradient(lambda W_value: loss_for(W_value, x), W)
assert np.allclose(grad_x, grad_x_num, atol=1e-7, rtol=1e-7)
assert np.allclose(grad_W, grad_W_num, atol=1e-7, rtol=1e-7)

# A directional derivative provides one more scalar consistency check.
direction = np.array([1.0, -2.0, 0.5])
eps = 1e-6
directional_num = (
    loss_for(W, x + eps * direction) - loss_for(W, x - eps * direction)
) / (2.0 * eps)
directional_true = float(grad_x @ direction)
assert np.isclose(directional_num, directional_true, atol=1e-7, rtol=1e-7)

print("output-first Jacobian shape:", j_out.shape)
print("denominator-layout derivative shape:", d_den.shape)
print("loss:", loss)
print("max |grad_x analytic - numeric|:", np.max(np.abs(grad_x - grad_x_num)))
print("max |grad_W analytic - numeric|:", np.max(np.abs(grad_W - grad_W_num)))
```

central finite differences 是证据，不是符号推导。若 `eps` 太大，截断误差占主导；若它太小，
浮点消减误差占主导。两者吻合可以支持实现，但只有形状账本解释了公式为何正确。

拐点可以在一个弯曲的函数上直接观察到。对 \(f(x)=e^x\) 在 \(x=1\) 处（真值
\(e\approx2.7182818\)）做 central difference：

| eps | \|数值−真值\| | 主导误差 |
|---:|---:|---|
| `1e-2` | `4.5e-5` | 截断主导 |
| `1e-4` | `4.5e-9` | 接近最优 |
| `1e-6` | `1.6e-10` | 最小值附近 |
| `1e-8` | `6.6e-9` | 消减回升 |

误差先随 `eps` 缩小而下降（截断项），再因两个几乎相等的数相减失去精度而回升
（消减项）。本课的 affine loss 恰好是二次函数，central difference 对任意 `eps`
都精确到舍入——这正是“数值审计是证据而非证明”的极端例子：数值可以完美吻合，
公式为何正确仍要由形状账本解释。

## 阶段检查

### 检查题

- 识别当前采用的 layout 与导数表形状；
- 根据函数签名选择 gradient、Jacobian 或 Hessian；
- 在开始算数值之前验证 addition rule。

### 挑战题

- 在 inner product 与 bilinear product rule 中保留必要的转置；
- 根据中间维度复合 chain rule 因子；
- 根据依赖关系与形状恢复 B.19-B.22；
- 完成一道 affine squared error 题的前向部分；
- 完成并审计反向部分，并另行核对形状证据。

## 综合练习

令

\[
s=Cu+d,\qquad e=s-v,\qquad J=\frac12e^\mathsf Te,
\]

其中 \(u\in\mathbb R^3\)、\(C\in\mathbb R^{2\times3}\)，且
\(d,v\in\mathbb R^2\)。

为前向路径写出完整的形状账本，并推导 \(\nabla_uJ\)、\(\nabla_CJ\) 与
\(\nabla_dJ\)。然后准确说明 central finite difference 审计应当比较什么。如果答案只给公式，
却不给与参数匹配的形状，就不完整。

## 完整答案

前向账本为

| 数值 | 定义 | 形状 |
|---|---|---:|
| \(u\) | 输入 | \(3\times1\) |
| \(C\) | 仿射权重 | \(2\times3\) |
| \(s\) | \(Cu+d\) | \(2\times1\) |
| \(e\) | \(s-v\) | \(2\times1\) |
| \(J\) | \(\tfrac12e^\mathsf Te\) | 标量 |

由于 \(D_eJ=e\)，恒等残差路径给出 \(D_sJ=e\)。随后，仿射路径给出

\[
\nabla_uJ=C^\mathsf Te\in\mathbb R^{3\times1},
\qquad
\nabla_CJ=eu^\mathsf T\in\mathbb R^{2\times3},
\qquad
\nabla_dJ=e\in\mathbb R^{2\times1}.
\]

central finite difference 审计每次扰动 \(u\)、\(C\) 或 \(d\) 的一个坐标，再把得到的数值导数与
解析 gradient 中的对应条目比较。比较数值之前，数值数组与解析数组必须具有相同的
参数形状。

## 常见错误与修复路径

如果答案出错，请按以下顺序诊断：

1. **Layout 错误：**输入轴与输出轴是否颠倒？
2. **对象错误：**需要标量 gradient 的地方是否误用了 Jacobian？
3. **形状错误：**相邻矩阵乘积是否无法约去公共维度？
4. **依赖错误：**计算图中是否漏掉了一条路径？
5. **算术错误：**只有结构检查通过后，才重新计算数值。
