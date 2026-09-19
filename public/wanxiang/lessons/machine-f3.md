# 机枢讲席·动态流向 III：把行为作为参数

> Callback 使 traversal 通用化

## 正课 / Lecture

<!-- wanxiang:block machine-f3-callback-contract-observation:start -->
### 观察（Observation）：一份节点链（node chain）记录，多个 candidate actions

隔离台展示一条 fixed node chain 与多个 callable candidates：

```text
list: node 0 -> node 1 -> NULL
candidate action A: print a key/value pair
candidate action B: add a value to a running total
candidate callback state: ENTRY_VISIT or NULL
register state after the candidate call: unknown
```

先不调用任何候选；只留下四个待核对字段：callback parameter types、`NULL` check、保存的 next pointer 与 return address。
<!-- wanxiang:block machine-f3-callback-contract-observation:end -->

<!-- wanxiang:block machine-f3-callback-contract-calibration:start -->
### 1. 把“如何访问”与“做什么”分开

**链表（linked list）**由 nodes 组成，每个 node 的 `next` pointer 保存下一个 node 的 address；`NULL` 表示链尾。linked list 具有固定导航规则，却可以支持多种**逐元素动作（per-element action）**。先看一种具体 traversal：

```c
struct node {
    int key;
    int value;
    struct node *next;
};

void print_list(struct node *list) {
    while (list != NULL) {
        printf("%d: %d\n", list->key, list->value);
        list = list->next;
    }
}
```

这段代码混合了两项职责：

- **遍历策略（traversal policy）**：决定访问哪些 elements 以及按什么顺序访问；这里沿 `next` 前进直到 `NULL`；
- element action：按一种格式打印 key 与 value。

把 action 作为 callback 传入；F1 已经给出 callback 的 function-pointer 与 signature 边界：

```c
void follow_list(
    struct node *list,
    void (*visit)(int key, int value)
) {
    if (visit == NULL) return;

    while (list != NULL) {
        struct node *next = list->next;
        visit(list->key, list->value);
        list = next;
    }
}

void print_pair(int key, int value) {
    printf("%d: %d\n", key, value);
}

void add_value(int key, int value) {
    (void)key;
    running_total += value;
}
```

callback 接收 values，而不是 node pointer。traversal 在 user code 运行前先保存 `next`。callback 返回后，loop 只读取这个 saved pointer，不再 dereference current node；callback 仍不得释放 saved next node。

list traversal 只编写一次；传入 `print_pair` 或 `add_value` 即可改变 behavior。

### 2. Assembly 中的 callback call

Stack frame 是一次 function call 在 stack 上保存 return address、arguments 与 persistent values 的区域。**栈指针（stack pointer）**是定位 current stack top 的 register；**帧偏移（frame offset）**必须绑定到一个 precise stack-pointer state。进入 `follow_list` 时，caller-owned arguments 从 entry `r5` 开始：list 位于 `0(entry_r5)`，callback 位于 `4(entry_r5)`。callee 先把 `r5` 减去 four bytes，以保存自己的 return address。完成**序言（prologue）**后——也只有从此刻起——current-frame offsets 才是：

```text
0(r5) : saved incoming return address
4(r5) : list argument, then the persisted traversal cursor
8(r5) : callback address
```

Precondition `visit == NULL` 的 check 也必须在第一次 indirect call 前出现。一种教学实现如下：

```asm
follow_list:
    deca r5
    st r6, (r5)          # save incoming return address
    ld 8(r5), r1         # callback after the 4-byte prologue
    beq r1, done          # NULL callback: return without traversing
    ld 4(r5), r0         # r0 = list

loop:
    beq r0, done
    ld 8(r5), r1         # r1 = callback address
    ld 0(r0), r2         # r2 = list->key
    ld 4(r0), r3         # r3 = list->value
    ld 8(r0), r4         # snapshot list->next before callback
    st r4, 4(r5)         # persist next; callback may change current node state

    deca r5
    deca r5
    st r2, 0(r5)
    st r3, 4(r5)
    gpc $2, r6
    j (r1)
    inca r5
    inca r5

    ld 4(r5), r0         # reload the saved next pointer
    br loop

done:
    ld (r5), r6
    inca r5
    j (r6)
```

为什么要在 call 后重新加载 callback 与 list state？在这套 teaching convention 下，callee 可以改变 caller-visible registers。**持久值（persistent value）**必须依照 E3 已定义的 calling convention 保存或保护；不能假定每个 register 都跨 call 保持不变。

callback call 期间，两个 four-byte callback arguments 暂时让 `r5` 下移 eight bytes。两条 `inca` instructions 会在再次使用 `4(r5)` 与 `8(r5)` 前恢复 `follow_list` frame base。offset 只对这份 layout 和这个 base state 有意义。

该 contract 在 callback 前保存 `next`，所以 user code 返回后，traversal 不会再 dereference current node。若 callback 可能释放 saved next node，这个 interface 就不安全；caller 必须禁止该动作，或改用另一个明确管理 node lifetime 的 interface。
<!-- wanxiang:block machine-f3-callback-contract-calibration:end -->

<!-- wanxiang:block machine-f3-sort-layout-observation:start -->
### 观察：一次仍有两项未决合同的 `sort_records` call

caller 提供以下形态：

```c
sort_records(base, count, width, compare);
```

两份封存 records 使用不同的 element width。一项失败候选按照 storage address 排列 records。movement boundary 与 ordering semantics 仍为空白；本页不把这些职责分配给任何 parameter。
<!-- wanxiang:block machine-f3-sort-layout-observation:end -->

<!-- wanxiang:block machine-f3-sort-contract-calibration:start -->
### 3. 通用排序（generic sort）需要 data layout 与 ordering contract

**通用排序接口（generic-sort interface）**必须独立给出四项事实：`base` 是第一个 element 的 address，`count` 是 element 数量，`width` 是相邻 elements 的 byte stride，`compare` 是 ordering callback。C library 的形态如下：

```c
void qsort(
    void *base,
    size_t count,
    size_t width,
    int (*compare)(const void *, const void *)
);
```

**不透明指针（opaque pointer, `void *`）**可以保存任意 object address，但本身没有可直接 dereference 的 element type。**比较器（comparator）**是接收两个 element addresses 的 callback；它先 cast 到实际 pointer type，再按相对次序返回 negative、zero 或 positive。

Integer comparator：

```c
int compare_ints(const void *left_raw, const void *right_raw) {
    const int left = *(const int *)left_raw;
    const int right = *(const int *)right_raw;
    return (left > right) - (left < right);
}
```

return contract 以 sign 为准：

```text
negative -> left comes before right
zero     -> equivalent for ordering
positive -> left comes after right
```

避免写 `return left - right;`，因为**有符号溢出（signed overflow）**会在 extreme integers 上产生错误 ordering。

Call：

```c
int values[] = {8, 3, 9, 1};
qsort(values, 4, sizeof values[0], compare_ints);
```

`base` 给出 first-element address；`count` 给出 element 数量；`width` 给出 byte stride；`compare` 给出 ordering semantics。**泛型性（genericity）**来自同一 algorithm 接收完整 data-layout 与 behavior contract，而不只是一次 cast。

使用**类型别名声明（typedef）**为既有 C type 建立新名称，可以让 pointer-heavy declaration 更易读：

```c
typedef int (*compare_fn)(const void *, const void *);

void sort_records(void *base, size_t count, size_t width, compare_fn cmp);
```

`typedef` 创建 type name；它不会为任意 cast 增添 runtime checking。
<!-- wanxiang:block machine-f3-sort-contract-calibration:end -->

<!-- wanxiang:block machine-f3-finalizer-ownership-observation:start -->
### 4. 三种 callback application

**映射（map）**对每个 element 应用 callback，并为它产生对应 output：

```c
void map2(
    int (*fn)(int, int),
    int n,
    const int *left,
    const int *right,
    int *out
) {
    for (int i = 0; i < n; i++) {
        out[i] = fn(left[i], right[i]);
    }
}
```

**左折叠（left fold）**从左到右处理 elements；每一步把上一步的 accumulator 与当前 element 交给 callback，并把 callback result 作为下一步 accumulator：

```c
int fold_left(int (*fn)(int, int), int acc, const int *a, int n) {
    for (int i = 0; i < n; i++) {
        acc = fn(acc, a[i]);
    }
    return acc;
}
```

对 `{2,5,1}` 做加法时的 state trace：

```text
acc=0 -> fn(0,2)=2 -> fn(2,5)=7 -> fn(7,1)=8
```

分配 cleanup authority 前，先把 payload 与元数据（metadata）分开，并封存一份 lifetime record：

```text
ref_count before operation: 1
ref_count after operation: 0
cleanup callback field: ENTRY_CLEANUP or NULL
allocator-owned payload block: present
allocator-owned metadata block: present
trigger, cleanup scope and block-release owner: blank
```

该 snapshot 只列出 count、cleanup callback 与两块 storage；先不要判断何时 call，也不要判断哪一方释放哪一块。
<!-- wanxiang:block machine-f3-finalizer-ownership-observation:end -->

<!-- wanxiang:block machine-f3-finalizer-ownership-calibration:start -->
**终结回调（finalizer）**是在 object allocation 释放前执行 type-specific cleanup 的 callback。**引用计数（reference count）**记录当前还有多少 owners；allocation 可以在 metadata 中保存 finalizer pointer。count 从 1 变为 0 表示最后一个 owner 已离开，此时 allocator 先调用 cleanup，再释放 allocation。

概念性 metadata：

```c
struct rc_metadata {
    int ref_count;
    void (*finalizer)(void *payload);
};
```

Boundary rules：

- 检查 finalizer 是否为 `NULL`；
- count 从 `1` 转为 `0` 时，对非 `NULL` finalizer 恰好调用一次；`NULL` finalizer 调用零次；
- finalizer 只清理 payload 明确拥有的 resources；payload 仅仅保存了 pointer、但不负责其 lifetime 时，不得释放该 resource；
- finalizer 不释放随后由 allocator 立即释放的 payload 或 metadata blocks；
- callback signature 必须与 object lifetime 一致。
<!-- wanxiang:block machine-f3-finalizer-ownership-calibration:end -->

## 复习闭环 / Review Loop

不回看已完成示例，完成以下复盘：

1. 在一段新的 collection routine 中标出固定 traversal policy 与可变 callback behavior。
2. 从 entry `r5` 重建 `follow_list` frame，证明 NULL callback 在任何 indirect call 前已受检查，并在 callback arguments 之后恢复 frame base。
3. 解释 `base`、`count`、`width` 与 comparator 各自独立的作用，再追踪一次 left fold 与一次 finalizer lifetime transition。
