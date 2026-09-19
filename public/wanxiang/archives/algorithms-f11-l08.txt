# 算理研习：把宇宙折进有限格

本课研究**字典问题（dictionary problem）**：在支持插入、删除和精确查找的同时维护键值记录。核心问题不是“散列表（hash table）是否可能发生冲突（collision）”；把庞大的键空间压进有限表格时，冲突不可避免。真正的问题是：

1. 如何在冲突下保持正确性；
2. 哪项假设能让链的期望长度保持较短；
3. 哪个量决定性能；
4. 散列函数族（hash family）如何改变对手模型。

表格扩容（table resizing）与摊还重建（amortized rebuilding）被有意排除在本课之外，留给后续散列单元。本课固定 `m`，避免自动扩容掩盖 `alpha` 的作用。

## 首次术语

| 英文术语 | 中文解释 | 合同 / 符号 | 常见错误 |
|---|---|---|---|
| **Dictionary ADT** | 字典抽象数据类型：按唯一键维护记录 | `insert`、`delete`、`search` | 把接口与 Python 的具体实现混为一谈 |
| **direct-access table** | 直接寻址表：键直接作为数组下标 | 每个可能的键对应一个槽 | 忽略键空间的大小 |
| **prehash** | 预散列：把应用层键稳定映射为整数 | 相等键必须产生相等整数 | 误以为不同键绝不可能有相同预散列值 |
| **compression function** | 压缩函数：把预散列整数映射到 `0..m-1` | `h: U -> {0,...,m-1}` | 把表槽称作原始键 |
| **collision** | 冲突：不同键映射到同一表槽 | `h(k1)=h(k2)`，其中 `k1 != k2` | 把冲突当作两个键相等的证据 |
| **separate chaining** | 拉链法：每个槽保存一个可容纳多条记录的桶/链 | 桶 `T[h(k)]` | 覆盖另一个发生冲突的不同键 |
| **load factor** | 负载因子：平均每槽记录数 | `alpha=n/m` | 把平均值读成每个桶的保证 |
| **simple uniform hashing** | 简单均匀散列假设：各键独立且等概率进入任一槽 | 分析假设 | 声称某个具体确定性函数会自动满足该假设 |
| **universal hash family** | 全域散列族：随机选择函数，使任意不同键对的碰撞概率受控 | `Pr_h[h(x)=h(y)] <= 1/m` | 随机选择“键”而不是随机选择函数 |
| **expected time** | 期望时间：对声明的随机来源取平均 | `E[cost]` | 混淆期望、摊还与最坏情况代价 |

全文使用以下符号：

- `U`：预散列后的键空间；
- `n`：已存记录数；
- `m`：表槽数量；
- `alpha=n/m`：负载因子；
- `h`：用于选择表槽的压缩/散列函数。

这里有意采用两阶段术语：

```text
application key -> stable prehash integer -> compression to table slot
```

许多程序库把第一阶段称作 `hash`，但分开两个阶段才能让正确性条件清晰可见。

## 核心讲解

### 观察 A——三个未标注的映射阶段

把一个应用层键、一张整数卡和 `m` 张槽位卡中的一张放入三个未标注的纵列。当两条不同的应用记录最终对应同一张槽位卡时，让它们保持可见。在为两条箭头命名前，填写以下审计字段：

- 哪一列承载字典的玩家可见行为；
- 每条箭头可以保留哪些相等性证据；
- 经过最后一条箭头后，仍必须保留哪种记录身份；
- 有限槽位板无法排除什么事件。

暂时不要选择存储布局，也不要声称任何性能界。

### 1. Dictionary ADT 规定行为，而非布局

字典按键维护记录，并支持：

```text
insert(key, value)  add a new key-value record or overwrite that key's value
search(key)         return the value for the key if present
delete(key)         remove the record for the key
```

本课对同一键的重复插入采用覆盖语义。平衡搜索树能以最坏 `O(log n)` 时间实现这些操作，还支持前驱等有序操作。散列的目标是让精确键操作达到期望 `O(1)`，但它不保留键的排序次序。

必须先确定 ADT 合同，再选择表示方式；否则某项实现细节可能悄悄删掉必需行为。

### 2. 直接寻址为何既诱人又危险

若每个键都是较小的非负整数，数组就能把记录直接存入 `T[key]`。查找、插入和删除都只需一次随机访问。

```text
key:   0    1    2    3    4    5
T:    [ ]  [A]  [ ]  [B]  [ ]  [C]
```

但应用层键可能是字符串、元组或对象，而非整数下标。即使转换成整数，其取值范围也可能极其庞大。仅仅保存一个 256 位标识符，并不能证明创建含 `2^256` 个槽的数组是合理的。

因此，直接寻址暴露了两个独立问题：

1. **表示问题：**把合法键转换为稳定整数；
2. **空间问题：**把巨大的整数空间压缩到 `m` 个可负担的槽中。

### 3. 预散列解决表示问题，不解决冲突

预散列函数把应用层键转换为整数。其正确性合同是单向的：

```text
x == y  implies  prehash(x) == prehash(y)
```

反命题并不成立。不同键可以有相同的预散列值，后续解决冲突时仍必须比较实际键。

键在存储期间不得发生任何影响相等性或预散列结果的变化。若预散列值改变，后续查找会算出另一个桶，从而找不到记录。这就是许多字典实现不允许用可变列表作键的原因。

预散列并不解决空间问题：所得整数仍可能来自巨大的取值空间。

### 4. 压缩会产生不可避免的冲突

选择 `m` 个表槽和一个压缩函数：

```text
h: U -> {0,1,...,m-1}
```

若 `|U| > m`，鸽巢原理保证必有某些不同键映射到同一槽。因此，冲突是正常现象，不是异常失败。

压缩后，表仍必须保留完整的键值记录：

```text
prehashed keys:  14, 27, 40, 53
slot function:   h(k) = k mod 13
all slots:       1

wrong: T[1] = only the last record
right: T[1] = chain containing all four distinct keys
```

正确性不能依赖于为无界输入空间找到一张绝无冲突的有限表。


### 观察 B——一个槽、三条记录、三个待执行操作

使用一块四槽板，把带标签的记录 `(2,A)`、`(6,B)` 和 `(10,C)` 放在槽 `2` 旁。正面朝上摆出三张操作卡：插入 `(6,Z)`、插入 `(14,D)`、删除键 `2`。先把桶内容、覆盖规则和比较字段留空，预测每个存储节点必须携带哪些信息，再重演三个操作，期间不得丢弃任何纸面记录。


### 5. 拉链法保留发生冲突的记录

在拉链法中，每个槽都保存一个桶；从概念上看，它是一条链表：

```text
slot 0 -> []
slot 1 -> [(14,A) -> (27,B) -> (40,C)]
slot 2 -> [(2,D)]
...
```

各项操作先选择桶，再比较桶内的实际键：

```text
search(k):
    bucket = T[h(prehash(k))]
    scan bucket until stored_key == k

insert(k,v):
    scan selected bucket
    if stored_key == k: overwrite its value
    else: append or prepend a new record

delete(k):
    scan selected bucket
    unlink the record whose stored_key == k
```

由于完整键得到保留，即使两个不同键拥有相同预散列值或压缩槽，二者仍可区分。

换一种表示法并不会改变最坏情况：若全部 `n` 条记录落入同一条链，精确查找、覆盖和删除都可能耗费 `Theta(n)`。拉链法保证冲突下的正确性，但它本身不保证常数性能。


### 观察 C——相同的负载符号，不同的槽分布

在两行未标注的数据上方写下 `n=18`、`m=6` 和 `alpha=n/m`：

```text
3, 3, 3, 3, 3, 3
18, 0, 0, 0, 0, 0
```

加入一个不在已存键集合中的查询键 `q`，并把随机性来源、平均对象、单键代价和单次运行上界等字段留空。说明在这些字段中写入任何常数时间结论前，需要哪些证据。

### 6. 负载因子衡量链所承受的压力

对于 `n` 条记录和 `m` 个槽：

```text
alpha = n/m
```

它表示每槽的平均记录数，可以小于一、等于一，也可以远大于一；它并不是最大链长保证。

示例：

```text
n = 18, m = 6
alpha = 3
```

分布 `[3,3,3,3,3,3]` 与 `[18,0,0,0,0,0]` 的负载因子相同，但最坏桶代价差异很大。要把平均值转化为查找代价的期望界，必须引入分布假设。

### 7. 推导查找失败的期望代价 `Theta(1+alpha)`

在**简单均匀散列（simple uniform hashing）**假设下，每个键都以相同概率进入 `m` 个槽中的任意一个，且彼此独立。

先固定一个**不属于已存键集合、因而查找失败的查询键 `q`**。对每个已存键 `ki`，定义指示变量（indicator variable）：

```text
Xi = 1 if h(ki) = h(q)
Xi = 0 otherwise
```

查询桶中的已存记录数为：

```text
X = X1 + X2 + ... + Xn
```

由于 `Pr[Xi=1]=1/m`：

```text
E[X]
  = E[X1] + ... + E[Xn]
  = Pr[X1=1] + ... + Pr[Xn=1]
  = n/m
  = alpha
```

查找还要支付访问桶的常数时间。在本课采用的字长键或缓存预散列值模型下，预散列与压缩也都是常数时间。若从头散列变长键，则必须明确加上读取键和预散列的代价。在所述模型下，查找失败的期望代价为：

```text
Theta(1 + alpha)
```

对于成功查询 `q=kj`，目标记录必然贡献一项；只有其余 `n-1` 个已存键是冲突指示变量。于是桶内记录数的期望不超过 `1+(n-1)/m`，查找一个固定的成功目标为 `O(1+alpha)`。若要对成功查找声称对应的 `Theta(1+alpha)`，还需额外假设查询的是哪个成功目标或链中哪个位置；本课不会暗中补入该假设。若 `alpha=O(1)`，上述查找失败界和成功查找上界均为 `O(1)`。

这一推导没有消除 `Theta(n)` 的最坏情况；它说明了所取平均的对象及其理由。


### 观察 D——三张尚未署名的性能卡

在桌上放置三张卡：一个已声明的随机性来源；一份跨越许多操作、其中偶尔提出重建建议的账本；一条观察到的、包含全部记录的链。暂时不要给任何卡标注 `expected`、`amortized` 或 `worst-case`。请为每张卡写出量化对象、证据归属，并说明重建已存在于当前实现，还是仅为未来提案。

### 8. 三种性能表述必须彼此区分

- **最坏情况（worst-case）：**若一条链包含全部记录，拉链法仍可能耗费 `Theta(n)`。
- **期望（expected）：**简单均匀散列使查找失败为 `Theta(1+alpha)`；没有额外的目标位置假设时，成功查找为 `O(1+alpha)`；对于固定键集合，全域散列族则给出相应的冲突上界。
- **摊还（amortized）：**对一串操作的代价取平均，例如偶尔进行表格重建。扩容及其摊还证明不属于本课。

无论负载多高，拉链法都能保持正确性。要在无界操作序列中维持 `alpha=O(1)`，通常需要扩容策略；固定大小表的分析不包含这一策略。

### 观察 E——有模式的键与尚未抽取的函数牌组

把若干 `64` 的倍数放在确定性规则 `h(k)=k mod 64` 旁，并记录它们落入的槽。随后，把一叠候选函数卡放在一个固定键集合旁。暂时不要填写以下字段：抽样对象是什么、哪些量保持固定、声称的是哪个概率空间，以及抽定一张卡后仍采用什么冲突处理过程。

### 9. 三种散列函数策略

#### 除法散列（division method）

```text
h(k) = k mod m
```

它很简单，但有模式的输入可能造成灾难。若 `m=64` 且每个键都是 64 的倍数，所有键都会落入槽零。把 `m` 选为不太接近二或十的幂的素数，可以削弱常见的低位模式，但确定性函数依然存在对抗性键集合。

#### 乘法散列（multiplication method）

对于 `w` 位键和大小为 `m=2^r` 的表，一种面向机器字的形式是：

```text
h(k) = ((a*k) mod 2^w) >> (w-r)
```

其中 `a` 是合适的奇数乘数。它先混合各位，再取高 `r` 位，因而适合大小为二的幂的表；其行为仍取决于乘数选择和采用的定长机器字模型。

#### 全域散列（universal hashing）

一个全域散列族包含多个函数。构造表时，按照该函数族规定的随机分布选择一个函数，通常采用均匀分布。对手可以选择困难的固定键集合，但对于任意两个不同键 `x` 和 `y`，该函数族保证：

```text
Pr_h[h(x)=h(y)] <= 1/m
```

对于小于素数 `p` 的整数键，一个常见函数族是：

```text
h_a,b(k) = ((a*k + b) mod p) mod m

a in {1,...,p-1}
b in {0,...,p-1}
```

精确界取决于所声明的函数族；“使用一个看起来随机的函数”并不构成证明。

固定一个已存键 `x`，令 `Xxy` 表示它是否与另一个已存键 `y` 冲突，则：

```text
E_h[number of collisions with x]
  = E_h[sum_y Xxy]
  = sum_y E_h[Xxy]
  = sum_y Pr_h[h(x)=h(y)]
  <= (n-1)/m
  < alpha
```

期望的线性性质不要求所有冲突指示变量相互独立。因此，全域散列能对任意固定键集合提供期望控制，其中的期望取自从函数族中随机选择的函数。


## 完整因果链

### 因果链 A——从 Dictionary ADT 到拉链法

```text
Goal:
  exact insert / search / delete by application key
      |
      v
Prehash:
  convert a stable key to an integer
      |
      v
Problem:
  the integer universe is too large for direct access
      |
      v
Compression:
  map the universe into m affordable slots
      |
      v
Unavoidable consequence:
  different keys may select the same slot
      |
      v
Correctness mechanism:
  retain full keys in a chain and compare within the selected bucket
      |
      v
Boundary:
  one long chain still gives Theta(n) worst-case time
```

### 因果链 B——从分布假设到期望代价

```text
Premise:
  each stored key hits the query slot with probability 1/m
      |
      v
Indicator model:
  Xi records whether key i collides with the query
      |
      v
Linearity:
  E[sum Xi] = sum E[Xi] = n/m = alpha
      |
      v
Operation cost:
  constant prehash/compression/access + scan expected alpha records
      |
      v
Result:
  expected unsuccessful search = Theta(1+alpha)
      |
      v
Boundary:
  this is not a deterministic worst-case guarantee
```

### 因果链 C——从确定性模式到散列函数族

```text
Failure:
  one fixed h can align badly with structured or adversarial keys
      |
      v
Mechanism:
  randomly choose h from a declared universal family
      |
      v
Pairwise guarantee:
  every distinct pair collides with probability at most 1/m
      |
      v
Expected collisions:
  sum pairwise indicators by linearity of expectation
      |
      v
Result:
  expected chain work is controlled for any fixed key set
      |
      v
Boundary:
  the expectation is over function choice; collision remains possible
```

## 图示与状态追踪

### 两阶段映射

```text
application keys
  "north"      "south"      "west"
      |            |            |
      v            v            v
stable prehash integers:  91, 44, 135
      |            |            |
      +------ compression h -----+
                   |
                   v
table slots:       1, 4, 5
```

预散列的相等一致性与表格的冲突处理是两项不同职责。

### 带覆盖与删除的冲突追踪

令 `m=4` 且 `h(k)=k mod 4`。

```text
insert (2,"A")   slot 2: [(2,A)]
insert (6,"B")   slot 2: [(2,A),(6,B)]
insert (10,"C")  slot 2: [(2,A),(6,B),(10,C)]
insert (6,"Z")   slot 2: [(2,A),(6,Z),(10,C)]  # overwrite same key
delete  (2)      slot 2: [(6,Z),(10,C)]
search  (10)     scans 6, then finds (10,C)
```

发生冲突并不意味着覆盖；只有实际键相等才会触发覆盖。

### `alpha` 相同的负载分布

```text
n=12, m=4, alpha=3

balanced-looking: [3,3,3,3]
clustered:         [0,1,0,11]

same average; different maximum chain
```

期望界需要概率陈述，而不能依靠视觉上的愿望。

### 指示变量推导

```text
query bucket
    ^
    |
X1 + X2 + ... + Xn = bucket length

E[length]
  = sum_i Pr[key i selects query bucket]
  = n * (1/m)
  = alpha
```

对于全域散列族，把等式替换为函数族保证 `Pr <= 1/m`；由此得到的期望冲突数至多为 `alpha`。

## 可执行代码

**语言与环境：**Python 3.11 或更高版本；仅使用标准库。

**范围：**固定大小的拉链字典；有意不执行扩容。

**输入合同：**

- `prehash(key)` 返回稳定整数，并让相等键产生相等整数；
- `p` 是素数，且大于实验中所用整数键编码空间；
- `1 <= a < p`、`0 <= b < p` 且 `m >= 1`。

**输出合同：**`put` 返回旧值或 `None`；`get` 返回已存值或抛出 `KeyError`；`delete` 返回被删除的值或抛出 `KeyError`。

```python
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Generic, TypeVar

K = TypeVar("K")
V = TypeVar("V")


@dataclass(frozen=True)
class UniversalCompressor:
    """One chosen member of h(k)=((a*k+b) mod p) mod m."""

    p: int
    m: int
    a: int
    b: int

    def __post_init__(self) -> None:
        if self.p <= 2:
            raise ValueError("p must be a declared prime larger than two")
        if self.m < 1:
            raise ValueError("m must be positive")
        if not (1 <= self.a < self.p):
            raise ValueError("a must lie in 1..p-1")
        if not (0 <= self.b < self.p):
            raise ValueError("b must lie in 0..p-1")

    def __call__(self, integer_key: int) -> int:
        if type(integer_key) is not int:
            raise TypeError("prehash output must be an integer")
        return ((self.a * integer_key + self.b) % self.p) % self.m


class ChainedMap(Generic[K, V]):
    def __init__(
        self,
        prehash: Callable[[K], int],
        compressor: UniversalCompressor,
    ) -> None:
        self._prehash = prehash
        self._compressor = compressor
        self._buckets: list[list[tuple[K, V]]] = [
            [] for _ in range(compressor.m)
        ]
        self._size = 0

    def _index(self, key: K) -> int:
        return self._compressor(self._prehash(key))

    def put(self, key: K, value: V) -> V | None:
        bucket = self._buckets[self._index(key)]
        for index, (stored_key, stored_value) in enumerate(bucket):
            if stored_key == key:
                bucket[index] = (key, value)
                return stored_value
        bucket.append((key, value))
        self._size += 1
        return None

    def get(self, key: K) -> V:
        bucket = self._buckets[self._index(key)]
        for stored_key, stored_value in bucket:
            if stored_key == key:
                return stored_value
        raise KeyError(key)

    def delete(self, key: K) -> V:
        bucket = self._buckets[self._index(key)]
        for index, (stored_key, stored_value) in enumerate(bucket):
            if stored_key == key:
                bucket.pop(index)
                self._size -= 1
                return stored_value
        raise KeyError(key)

    def __len__(self) -> int:
        return self._size

    def bucket_lengths(self) -> list[int]:
        return [len(bucket) for bucket in self._buckets]

    @property
    def load_factor(self) -> float:
        return self._size / len(self._buckets)


if __name__ == "__main__":
    # With these parameters, 1, 6, and 11 deliberately collide in slot 1.
    compressor = UniversalCompressor(p=101, m=5, a=1, b=0)
    table: ChainedMap[int, str] = ChainedMap(
        prehash=lambda key: key,
        compressor=compressor,
    )

    assert table.put(1, "A") is None
    assert table.put(6, "B") is None
    assert table.put(11, "C") is None
    assert table.bucket_lengths() == [0, 3, 0, 0, 0]
    assert table.get(6) == "B"

    assert table.put(6, "updated") == "B"
    assert len(table) == 3
    assert table.get(6) == "updated"

    assert table.delete(1) == "A"
    assert table.bucket_lengths() == [0, 2, 0, 0, 0]
    assert table.load_factor == 2 / 5

    try:
        table.get(99)
    except KeyError:
        pass
    else:
        raise AssertionError("missing-key failure case was not reported")
```

**正常情况：**发生冲突的不同键仍然可以被查到。

**边界情况：**空桶、覆盖相等键、删除链首记录，以及负载因子小于或大于一。

**失败情况：**不稳定或可变的键、违反相等一致性的预散列、无效的函数族参数，以及负载因子失控导致的内存或性能退化。

代码会验证参数范围，但不检测 `p` 是否为素数；保证其素性是调用方的明确责任。代码也不承诺对任意 Python 对象都具有全域散列性质——预散列合同必须单独审计。

## 阶段检查

1. **ADT 与表示。**`insert`、`search`、`delete` 中哪些部分属于接口，哪些部分提到了拉链法？
2. **追踪。**给定 `m=4` 和 `h(k)=k mod 4`，追踪 `(2,A),(6,B),(10,C)`，覆盖键 `6`，再删除键 `2`。
3. **负载。**给定 `n=18` 和 `m=6`，计算 `alpha`，并写出简单均匀散列假设下查找失败的期望代价表达式。
4. **糟糕的压缩。**解释为何字符编码求和会把 `"lamp red"` 和 `"red lamp"` 映射到相同值，并说明问题为何不只是表太小。
5. **全域散列指示变量。**若某全域散列族保证任意键对的冲突概率至多为 `1/25`，固定一个键，在其余 49 个已存键中，它的期望冲突数可得出什么上界？

每份回答都必须说明所讨论的是正确性、最坏情况性能还是期望性能。

## 综合练习

### 引导式设计审计

某离线目录快照包含 `60,000` 条记录，其不可变整数标识符均小于已声明的素数 `p`。表中固定有 `75,000` 个槽。系统需要精确查找、覆盖和删除，但不需要有序前驱查询。

请设计并审计一个拉链字典：

1. 陈述 Dictionary ADT 的行为；
2. 选择预散列/压缩合同；
3. 追踪一次有意制造的冲突，不丢失任何一条记录；
4. 计算 `alpha`；
5. 用指示变量推导查找失败的期望代价，并给出成功查找上界；
6. 陈述最坏情况代价；
7. 指出哪项未来需求会迫使我们讨论扩容。

## 完整答案与评分点

### 引导练习答案

1. 接口规定可观察效果：按键新增或覆盖、返回匹配值、删除匹配记录。选择桶、扫描链表和解除链接都是拉链表示的细节。
2. 三个键都选择槽二。桶的变化如下：

   ```text
   [(2,A)]
   [(2,A),(6,B)]
   [(2,A),(6,B),(10,C)]
   [(2,A),(6,Z),(10,C)]
   [(6,Z),(10,C)]
   ```

   只有相等键 `6` 才触发覆盖；仅仅发生冲突不会覆盖。
3. `alpha=18/6=3`。在简单均匀散列假设下，查找失败的期望代价为 `Theta(1+alpha)=Theta(4)`；没有额外的目标位置假设时，对固定成功目标的查找为 `O(1+alpha)`；最坏情况仍为 `Theta(18)`。
4. 字符编码加法满足交换律，因此重排相同字符不会改变总和。这是结构性缺陷：甚至还没考虑有限表格的冲突问题，许多相关输入就已经坍缩到一起。
5. 为与其余 49 个键的每次冲突各设一个指示变量。由期望的线性性质，期望冲突数至多为 `49*(1/25)=1.96`。求和不要求所有指示变量相互独立。

### 引导式设计审计答案

- 对相等标识符采用覆盖语义，并在每条链中保留完整标识符。
- 对声明的整数空间，恒等映射是合法预散列；压缩时从有文档说明的全域散列族中随机选择一个成员。
- 任意两个共享槽位的不同标识符都共存于桶中，扫描时通过相等性比较区分。
- `alpha=60,000/75,000=0.8`。
- 键对冲突概率至多为 `1/m`，因此桶内工作的期望至多约为 `alpha`；再加上常数预散列、压缩和访问，查找期望为 `O(1+alpha)=O(1)`。
- 若全部记录都冲突，查找、删除和覆盖的最坏情况仍为 `Theta(n)`。
- 若快照变为无界数据流，`n` 增长而 `m` 固定，`alpha` 就会增长；此时需要另行研究扩容和摊还重建策略。

## 常见错误与修复路径

| 错误 | 失败原因 | 修复方法 |
|---|---|---|
| “不同键具有不同散列值。” | 当键空间更大时，压缩到 `m` 个槽必然产生冲突。 | 保留完整键并处理冲突。 |
| “预散列值相同，键就相等。” | 相等一致性是单向的；不同键也可能冲突。 | 在桶内比较实际键。 |
| “拉链法让每项操作都是 `O(1)`。” | 一条链可能包含全部 `n` 条记录。 | 分别陈述最坏 `Theta(n)`、查找失败的期望 `Theta(1+alpha)`，以及成功查找上界 `O(1+alpha)`。 |
| “`alpha` 是每条链的长度。” | 它只是平均值；分布可能不均匀。 | 展示至少两种 `alpha` 相同的桶分布。 |
| “确定性的取模函数能输出每个槽，所以它是均匀的。” | 结构化键可能与模数对齐。 | 审计键模式，或从有文档说明的散列函数族中选择函数。 |
| “全域散列能防止冲突。” | 它约束的是随机选择函数时的键对冲突概率。 | 说明概率空间，并保留冲突处理。 |
| “期望就是摊还。” | 期望对随机性取平均；摊还对操作序列取平均。 | 给出界之前先说清平均所针对的来源。 |
| 修改已存键 | 查找会重新算出另一个桶或另一种相等关系。 | 使用不可变键，或先删除，再修改并以新键重新插入。 |
| 把扩容混入固定大小表的分析 | 它掩盖了固定 `m` 与 `alpha` 的意义，并越过本课技术边界。 | 把扩容与摊还重建留给后续单元。 |

修复顺序：

```text
write the ADT contract
  -> separate prehash from compression
  -> preserve full keys in collisions
  -> trace one bucket
  -> define n, m, and alpha
  -> name the randomness behind expectation
  -> state worst-case and boundary
```
