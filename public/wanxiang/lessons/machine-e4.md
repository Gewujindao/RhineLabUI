# 机枢讲席·procedure 与 stack IV：重入与回声

> recursion、return value 与安全优化（safe optimization）

## 正课（Lecture）

<!-- wanxiang:block machine-e4-recursion-observation:start -->
<a id="1-frames-turn-recursion-into-ordinary-local-reasoning"></a>

### 1. frame 让 recursion 成为普通的 local reasoning

原始示例：

```c
int count_nonzero(const int *a, int n) {
    if (n == 0) {
        return 0;
    }
    return count_nonzero(a, n - 1) + (a[n - 1] != 0);
}
```

追踪 `a = {4, 0, -2}`、`n = 3`：

```text
activation n=3 waits for result of n=2, then checks a[2]
activation n=2 waits for result of n=1, then checks a[1]
activation n=1 waits for result of n=0, then checks a[0]
activation n=0 returns 0
```
<!-- wanxiang:block machine-e4-recursion-observation:end -->

<!-- wanxiang:block machine-e4-recursion-unwind:start -->
下行（descent）会建立 frame；**回卷（unwinding）**则从基例（base case）开始逐层 return、恢复各 activation 的 state，并按相反顺序消费这些 frames：

| 正在 return 的 activation | `r0` 中传入的递归返回值（recursive value） | 当前 element 非零？ | 传出的 `r0` |
|---:|---:|---:|---:|
| `n=0` | - | - | 0 |
| `n=1` | 0 | 是（`4`） | 1 |
| `n=2` | 1 | 否（`0`） | 1 |
| `n=3` | 1 | 是（`-2`） | 2 |

每个 non-base activation 都必须跨越 recursive call 保存足够的 state，才能在 return 后定位 `a[n-1]`。保存下来的 `a`、`n` 与 return address 都属于该 activation 自己的 frame。
<!-- wanxiang:block machine-e4-recursion-unwind:end -->

<!-- wanxiang:block machine-e4-frame-restoration:start -->
#### 具体的 frame address 与 offset

假设某个非 base activation 进入时 `r5 = 0x7fc0`。在本例由 caller 持有的 argument area 中：

```text
0x7fc0 : argument a       = entry r5 + 0
0x7fc4 : argument n       = entry r5 + 4
```

callee 分配 12 bytes 后，当前 `r5 = 0x7fb4`。它的 frame 如下：

| 绝对地址（absolute address） | 相对当前 `r5` 的 offset | 含义 |
|---:|---:|---|
| `0x7fb4` | `0` | recursive call 返回后仍需使用的已保存 `a` |
| `0x7fb8` | `4` | recursive call 返回后仍需使用的已保存 `n` |
| `0x7fbc` | `8` | 已保存的 incoming return address |
| `0x7fc0` | `12` | caller 提供的 argument `a` |
| `0x7fc4` | `16` | caller 提供的 argument `n` |

prologue 可以明确建立 frame，无需猜测：

```asm
# on entry: r5 = 0x7fc0
ld $-12, r2
add r2, r5           # r5 = 0x7fb4
ld 12(r5), r2        # incoming a
st r2, 0(r5)         # preserve a
ld 16(r5), r2        # incoming n
st r2, 4(r5)         # preserve n
st r6, 8(r5)         # preserve this activation's continuation
```

在 recursive call 之前，这个 activation 可以 allocate 一块 8-byte child-argument area，使 `r5` 暂时从 `0x7fb4` 移到 `0x7fac`。child return 后，free 这 8 bytes 会恢复 `r5 = 0x7fb4`；只有到这时，offset `0`、`4`、`8` 才重新指向本 frame 保存的 values。最后，free callee 的 12-byte portion，便会恢复 entry value `0x7fc0`。正是这种显式的 base restoration，让 static frame offsets 在 recursion 中始终可靠。
<!-- wanxiang:block machine-e4-frame-restoration:end -->

<!-- wanxiang:block machine-e4-return-and-leaf:start -->
<a id="2-return-address-and-return-value-travel-on-parallel-channels"></a>

### 2. Return address 与 return value 沿并行通道传递

callee return 时：

```text
r0 = computed data result
r6 = continuation code address (restored if it was saved)
pc <- r6
```

如果 `r0` 正承载 result，return sequence 在恢复 frame state 时就不能误写 `r0`。这正是寄存器约定（register convention）重要的原因之一。

<a id="3-stack-arguments-versus-register-arguments"></a>

### 3. 栈传参（stack argument passing）与寄存器传参（register argument passing）

不再 call 其他 procedure 的 procedure 称为叶过程（leaf procedure）；还会发起 nested call 的 procedure 称为非叶过程（non-leaf procedure）。只有先完成这一区分，才能判断 incoming return address 是否需要写入 stack。

stack-passed arguments：

- 能采用统一的内存布局（memory layout）；
- 可以承载大量 argument，不会耗尽指定 registers；
- 能让 nested／recursive state 自然分离；
- 代价是增加内存操作（memory operation）。

register-passed arguments：

- 能为小型 call 减少 load／store；
- 对 leaf helper 可能更快；
- 必须约定使用哪些 registers；
- 当 argument 很多或 caller value 长期存活时，会造成压力。

**寄存器压力（register pressure）**是指同一时刻需要保留的活跃值多于方便可用的 registers。即使 register passing 在其他方面更有吸引力，它也可能迫使一部分值回到 memory。

小型 register-argument leaf 示例：

```c
int add_pair(int a, int b) {
    return a + b;
}
```

```asm
# convention for this example only: a in r0, b in r1, result in r0
add_pair:
    add r1, r0
    j (r6)
```

如果 procedure 不需要 local stack object、不需要保存其他 registers，并且不会发起 nested call，就不需要 stack frame。

<a id="4-saving-return-address-only-when-needed"></a>

### 4. 仅在需要时保存 return address

leaf procedure 可以一直把 incoming return address 保存在 `r6` 中，直到自身 return。non-leaf procedure 通常必须先保存 incoming `r6`，再为 nested call 创建新的 return address。

不要过度概括：

- ABI 要求或 register convention 仍可能要求保存更多 state。
- 如果 local variable 的 address 从未逸出（escape），并且有足够的 registers，它可以留在 register 中；但本课的 teaching convention 会把 locals 放在 stack 上，让 layout 保持明确。
- optimization 绝不改变源码可见行为（source-visible behavior）；它只在条件得到证明后，改变 storage 与 instruction 的选择。
<!-- wanxiang:block machine-e4-return-and-leaf:end -->

## 复习闭环（Review Loop）

不回看例题，完成以下任务：

1. 为一个新的三层 recursion 分别画出 descent 与 unwind 两条 timelines。
2. 从一个具体的 entry `r5` 出发，为已保存的 arguments 与 return address 分配 absolute addresses 和 offsets，再证明 `r5` 会被恢复。
3. 判断一个未见过的 helper 是否适合 leaf optimization，并列出判断所依赖的全部 conditions。
