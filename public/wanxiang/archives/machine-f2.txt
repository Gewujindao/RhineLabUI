# 机枢讲席·动态流向 II：对象真正的类型

> 多态分派（polymorphic dispatch）需要两层查找

## 正课 / Lecture

<!-- wanxiang:block machine-f2-actual-object-observation:start -->
### 观察（Observation）：一个接口（interface），两份封存对象（object）快照

在判断运行哪一份实现之前，只记录可见状态：

```text
declaration at the call site: A a
sealed snapshot α: a points to object A
sealed snapshot β: a points to object B
available call through the declared interface: ping
first loaded address: blank
code entry loaded from byte offset 4: blank
```

两份快照中的 call site 与 declared interface 都没有变化。本页暂不判断究竟由 declaration、current object 还是 compile time 选择 implementation。
<!-- wanxiang:block machine-f2-actual-object-observation:end -->

<!-- wanxiang:block machine-f2-actual-object-calibration:start -->
### 1. 一种 static type，多种 runtime objects

Java 形态示例：

```java
class A {
    void ping() { /* A version */ }
    void pong() { /* A version */ }
}

class B extends A {
    @Override void ping() { /* B version */ }
    void wiff() { /* B-only */ }
}

static void use(A a) {
    a.ping();
    a.pong();
}
```

变量 `a` 的**静态类型（static type）**是 compiler 从 declaration 得到的 `A`。runtime 中，它可能引用 `A` object，也可能引用 `B` object；实际存在的 object 所属 class 是它的**动态类型（dynamic type）**。

**继承（inheritance）**使 subclass 接受 base class 已声明的方法（method）interface。若 dynamic type 是 `B`，`a.ping()` 会因为**重写（overriding）**而选择 `B.ping`：`B` 为 inherited method 提供了 new implementation。`B` 没有 override `pong`，所以 `a.pong()` 仍选择 `A.pong`。

这种依据 dynamic type 在 runtime 选择 method entry 的过程就是 polymorphic dispatch。
<!-- wanxiang:block machine-f2-actual-object-calibration:end -->

<!-- wanxiang:block machine-f2-double-lookup-observation:start -->
### 观察：停在未决步骤上的一次查找

隔离台只公开地址与固定 slot，不指明哪条 transfer 有效：

```text
r0 = 0x4000
m[0x4000] = 0x5000
the call uses byte offset 4 after the first load

candidate trace α: pc <- 0x5000
candidate trace β: next read starts at 0x5000 + 4
resolved code entry: blank
```

学习者必须区分 address、该 address 保存的 value，以及随后如何使用该 value。本页不说明哪条 candidate trace 抵达 code，也不说明能否 capture continuation。
<!-- wanxiang:block machine-f2-double-lookup-observation:end -->

<!-- wanxiang:block machine-f2-double-lookup-calibration:start -->
### 2. Object、类表（class table）与 method address

一种实现模型让每个 class 共享一张 class table；table 中每个固定位置是**方法槽（method slot）**，保存一个 method code address。

```text
variable a
   |
   v
instance object
   field 0: pointer to class table   --------+
   remaining instance fields                 |
                                              v
                                      class table
                                      slot 0: address of ping
                                      slot 1: address of pong
                                      slot 2: address of wiff (B only)
```

三个事实共同起作用：

1. instance -> class-table address 是 dynamic 的，因为 `a` 可能引用不同 dynamic type；
2. method slot offset 是 static 的，因为 compiler 知道 `ping` 占 slot 0、`pong` 占 slot 1；
3. 从该 slot load 的 method address 是 dynamic call target。

为了满足**可替换性（substitutability）**——按 base class 编译的 code 仍能正确使用 subclass object——subclass table 必须保留**继承前缀（inherited prefix）**的顺序。`B` class table 开头仍是按 `A` 编译的 code 所期待的 slots；override 改变的是 slot 中的 address，而不是 slot 的含义。

#### Memory example

```text
r0 = 0x4000                         B class table starts at 0x5000
m[0x4000] = 0x5000   # object.class
m[0x5000] = 0x1200   # slot 0 -> B_ping
m[0x5004] = 0x1100   # slot 1 -> A_pong
m[0x5008] = 0x1300   # slot 2 -> B_wiff
```

对于 `a.pong()`，target 是 `m[m[r0] + 4] = 0x1100`。
### 3. 等价 C model

Base-class method table：

```c
struct A_class {
    void (*ping)(void *self);
    void (*pong)(void *self);
};

struct A {
    struct A_class *class;
    int value;
};

void A_ping(void *self) { /* ... */ }
void A_pong(void *self) { /* ... */ }

struct A_class A_class_object = {
    A_ping,
    A_pong
};
```

**构造函数（constructor）**：

```c
struct A *new_A(void) {
    struct A *obj = malloc(sizeof *obj);
    if (obj == NULL) return NULL;
    obj->class = &A_class_object;
    obj->value = 0;
    return obj;
}
```

Call：

```c
if (obj == NULL || obj->class == NULL || obj->class->ping == NULL) {
    /* reject a malformed or failed construction */
} else {
    obj->class->ping(obj);
}
```

**隐式接收者（implicit receiver）**是 object-language call 自动提供给 instance method 的 object，通常写作 `this` 或 `self`。普通 C function 不会自动收到它，所以 `obj` 必须作为 explicit argument 传入。
`new_A` 可能返回 `NULL`，所以 caller 不能盲目**解引用（dereference）**结果。constructor 必须初始化 class-table pointer；indirect call 前还要检查 object、class table 与选中的 method slot 都不是 `NULL`。

Subclass prefix：

```c
struct B_class {
    void (*ping)(void *self);
    void (*pong)(void *self);
    void (*wiff)(void *self);
};

struct B_class B_class_object = {
    B_ping,   /* override slot 0 */
    A_pong,   /* inherit slot 1 */
    B_wiff    /* new slot 2 */
};
```

### 4. assembly 与两层查找

假设当前 function 已把 incoming return address 保存在 `0(r5)`，因此 argument `a` 位于 `4(r5)`。下面的完整片段包含对应的**尾声（epilogue）**；outer return address 已受**栈帧（stack frame）**保护，所以每个 inner `gpc` 都可以覆盖 `r6`：

```asm
ld 4(r5), r0          # r0 = a
beq r0, dispatch_error
ld (r0), r1           # r1 = a->class
beq r1, dispatch_error
ld 0(r1), r2           # r2 = class->ping
beq r2, dispatch_error

deca r5
st r0, (r5)           # explicit self argument
gpc $2, r6
j (r2)                # pc <- r2, call the checked ping address
inca r5

ld 4(r5), r0          # reload a; the first callee may have changed registers
beq r0, dispatch_error
ld (r0), r1           # reload a->class
beq r1, dispatch_error
ld 4(r1), r2           # r2 = class->pong
beq r2, dispatch_error
deca r5
st r0, (r5)
gpc $2, r6
j (r2)                # pc <- r2, call the checked pong address
inca r5

dispatch_return:
ld 0(r5), r6           # restore this function's incoming return address
inca r5
j (r6)

dispatch_error:
# record or return an error without reading through a missing link
br dispatch_return
```

若练习给出更强的**前置条件（precondition）**——“`a`、`a->class` 与所选 slots 都结构完好且非 `NULL`”——则 trace 时可以省略 guards。没有该 precondition 时，必须保留上面的 checks。

**双重间接跳转（double-indirect jump）**先从 object load class-table address，再从所选 method slot load code address 并写入 PC。star memory jump 的单步 semantics 是：先计算**有效地址（effective address）**，再 load 该 address 的 memory value，最后把 loaded value 写入 PC：

```text
j *o(rt)          -> pc <- m[r[t] + o]
j *(rt, ri, 4)    -> pc <- m[r[t] + r[i]*4]
```

因此 `j *o(rt)` 的 target 是 `m[r[t]+o]`，不是 `r[t]+o`；`j *(rt,ri,4)` 同理只多出 scaled index。星号表示 load table-cell value，而不是跳到 table cell address 本身。
<!-- wanxiang:block machine-f2-double-lookup-calibration:end -->

## 复习闭环 / Review Loop

不回看已完成示例，完成以下复盘：

1. 对一个具有 base static type、但可能拥有两种 dynamic type 的 variable，列出每个 call site 选中的 method。
2. 计算 `object -> class table -> fixed slot -> code address`，写出两个 intermediate address。
3. 画出兼容的 base/subclass table prefix，并解释为什么 override 改变 value，却不改变 inherited slot 的含义。
