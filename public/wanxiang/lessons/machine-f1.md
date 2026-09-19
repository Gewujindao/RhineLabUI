# 机枢讲席·动态流向 I：可被保存的入口

> 函数（function）拥有地址（address）

## 正课 / Lecture

<!-- wanxiang:block machine-f1-static-dynamic-observation:start -->
<a id="observation-one-call-site-two-sealed-runs"></a>
### 观察：同一调用点（call site），两次封存运行（sealed run）

在为转移形式命名之前，先比较两份封存记录：

```text
call site C: unchanged
sealed run A: selector cell = ENTRY_A
sealed run B: selector cell = ENTRY_B
both records stop at checkpoint AFTER_CALL
```

这项观察只说明哪些内容保持不变、哪些发生差异；它尚未判定目标（target）如何取得、是否仍需续行地址（continuation），以及哪些字节模式（byte pattern）可作为有效函数入口（function entry）。
<!-- wanxiang:block machine-f1-static-dynamic-observation:end -->

<!-- wanxiang:block machine-f1-static-dynamic-target:start -->
<a id="1-static-target-and-dynamic-target"></a>
### 1. 静态目标（static target）与动态目标（dynamic target）

像下面这样的**直接调用（direct call）**，会让 call site 直接编码或链接到 fixed function entry：

```c
ping();
```

若 `ping` 的 function entry 在**编译时（compile time）**已经确定，它就可以编译为**直接跳转（direct jump）**；**返回（return）**仍是 dynamic，因为 return address 取决于 call site。

现在假设一次**运行时选择（runtime choice）**会从两个**操作（operation）**中选一个：

```c
void ping(void) { /* ... */ }
void pong(void) { /* ... */ }

void choose(int use_ping) {
    void (*operation)(void);
    operation = use_ping ? ping : pong;
    operation();
}
```

此时**代码地址（code address）**成了**数据（data）**。`operation` 是**函数指针（function pointer）**：它保存一个 function entry address。**编译器（compiler）**无法在 call site 放置唯一 fixed direct target；它必须经由**指针值（pointer value）**跳转。

这种 transfer 称为**间接调用（indirect call）**：**执行（execution）**先取得 code address，再把**程序计数器（program counter, PC）**改成该 address。`indirect` 只描述 target 的取得方式；创建并保存**返回地址（return address）**的常规义务仍然存在。
<!-- wanxiang:block machine-f1-static-dynamic-target:end -->

<!-- wanxiang:block machine-f1-declaration-signature-observation:start -->
<a id="observation-before-parsing-a-declaration"></a>
### 观察：解析声明（declaration）之前

先只记录可见**记号（token）**与**候选值（candidate value）**，不急着给出答案：

```text
int ( * parse ) ( char * )
candidate value: ENTRY_C or NULL
```

先预测两件事：parentheses 让 `*` 与谁结合；当 value 是 `NULL` 时能否调用。后文再逐项核对 parentheses 两侧的 types 与 `NULL` branch。
<!-- wanxiang:block machine-f1-declaration-signature-observation:end -->

<!-- wanxiang:block machine-f1-declaration-signature:start -->
<a id="2-read-declarations-from-the-variable-name-outward"></a>
### 2. 从变量名（variable name）向外读取 declaration

Declaration：

```c
int (*parse)(char *);
```

从 `parse` 开始读取：

1. `parse` 被 `(*parse)` 包住：它是 pointer。
2. 紧接右侧的是 `(char *)`：它指向一个接收一个 `char *` **实参（argument）**的 function。
3. 最左侧的 `int` 是**结果类型（result type）**。

因此：“`parse` 是一个 pointer，指向接收 `char *` 并返回 `int` 的 function。”

再与下面的**函数声明（function declaration）**比较：

```c
int *parse(char *);    /* a function returning int *; not a function-pointer variable */
```

**括号（parentheses）**会改变**结合关系（binding）**，绝非装饰。

Call forms：

```c
int result = parse(text);
int same_result = (*parse)(text);
```

当 `parse` 指向 argument type 与 result type 都匹配的 function 时，两种 C 写法都有效；第一种更清晰。

<a id="3-signature-compatibility-is-part-of-correctness"></a>
### 3. 函数签名（function signature）必须匹配

Function signature 明确 argument 的数量、每个**参数类型（parameter type）**与 result type。function pointer 因此不是“任意 code address”：经由它调用的 function 必须使用相同 signature。

```c
int length_of(const char *s);
int (*metric)(const char *) = length_of;
```

通过**不兼容的类型转换（incompatible cast）**发起 call 也许能通过编译，却可能违反**调用约定（calling convention）**并产生**未定义行为（undefined behavior）**。不要“不断强转，直到能用”；应保留**编译器警告（compiler warning）**，并优先采用 matching declaration。

**函数原型（function prototype）**是在 compile time 写明 parameter types 与 result type 的 function declaration；compiler 用它检查 call site 的 signature 是否匹配。

**回调（callback）**是作为 argument 传入、再由接收它的 code 调用的 function。第一个安全示例：

```c
int apply_to_text(const char *text, int (*fn)(const char *)) {
    if (fn == NULL) {
        return -1;
    }
    return fn(text);
}
```

**空指针检查（null check）**必须发生在 indirect call 前：`fn == NULL` 时直接 return，因而不会尝试调用 address 0。
<!-- wanxiang:block machine-f1-declaration-signature:end -->

<!-- wanxiang:block machine-f1-indirect-call-observation:start -->
<a id="observation-before-tracing-the-return"></a>
### 观察：追踪返回之前

隔离门给出以下起始状态（starting state）：

```text
r1 = ENTRY_A          # accepted for this controlled run
next bytes:
  gpc $2, r6
  j (r1)
```

先分别填写 dynamic target、continuation 与 returned data；三者是不同的值，不能用同一个 address 代替。
<!-- wanxiang:block machine-f1-indirect-call-observation:end -->

<!-- wanxiang:block machine-f1-indirect-call-trace:start -->
<a id="4-machine-path-for-an-indirect-call"></a>
### 4. Indirect call 的机器路径（machine path）

假设 `r1` 保存 valid function-entry address，且不需要**栈参数（stack argument）**：

```asm
gpc $2, r6           # continuation is after the 2-byte indirect jump
j (r1)               # pc <- r1
```

状态方程（state equation）：

```text
r6 <- PC_after_fetch + 2
pc <- r1
```

若 function pointer 本身存放在**内存（memory）**中，应先把它 load 出来：

```asm
ld $operation, r1
ld (r1), r1          # r1 <- m[&operation]
gpc $2, r6
j (r1)
```

**调用目标（call target）**是 dynamic 的，因为 `m[&operation]` 在不同 execution 中可能不同。
<!-- wanxiang:block machine-f1-indirect-call-trace:end -->

## 复习闭环 / Review Loop

不重读例题，完成以下复盘：

1. 从 variable name 向外解析一个新的 function-pointer declaration。
2. 说明在赋值并经由 pointer call 之前，需要哪些 signature evidence。
3. 追踪 `load target -> check validity -> capture continuation -> indirect jump`，并解释 `gpc` **偏移量（offset）**为什么是 2。
