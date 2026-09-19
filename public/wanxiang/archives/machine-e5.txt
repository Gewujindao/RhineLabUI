# 机枢讲席·procedure 与 stack V：边界与特权门

> 栈安全（stack safety）与操作系统门（operating-system gate）

本讲的安全边界（safety boundary）：不包含可运行的利用载荷（exploit payload）、攻击字符串（attack string）、target-address 计算或用于评分的利用解答（exploit solution）。

## 正课（Lecture）

<!-- wanxiang:block machine-e5-boundary-observation:start -->
<a id="1-buffer-overflow-is-an-address-boundary-failure"></a>

### 1. 缓冲区溢出（buffer overflow）是地址边界故障

**buffer overflow** 是指 program 写入了超过已分配 array boundary 的 memory。

易受影响的代码形态：

```c
void read_line(void) {
    char buf[16];
    int i = 0;
    for (;;) {
        int ch = getchar();
        if (ch == '\n' || ch == EOF) break;
        buf[i++] = (char)ch;       /* no check that i < 15 */
    }
    buf[i] = '\0';
}
```

概念性的 frame layout：

```text
lower address
buf[0]
buf[1]
...
buf[15]
adjacent saved state
saved return address
higher address
```

确切顺序会随 compiler 与 architecture 而变化；危险来自 adjacency，而不是某一张普遍适用的 state diagram。如果 input 控制了 `buf` boundary 之外的 bytes，就可能破坏 local state 或 saved return address。
<!-- wanxiang:block machine-e5-boundary-observation:end -->

<!-- wanxiang:block machine-e5-boundary-failure:start -->
function return 时，损坏的 return address 可能改变 PC 的去向。

这就是“code 与 data 在 memory 中都是 bytes”这一事实为何在历史上意义重大。防御重点是强制执行 memory boundary，并让 data region 不可执行；本课不要求构造 exploit payload。
<!-- wanxiang:block machine-e5-boundary-failure:end -->

<!-- wanxiang:block machine-e5-bounded-repair:start -->
<a id="2-repair-the-source-before-relying-on-mitigations"></a>

### 2. 先修复源头（source），再依赖缓解机制（mitigation）

**C 字符串（C string）**是以零字节（zero byte）`\0` 结束的 `char` sequence；它会同时占用 array capacity 来存放 payload characters 与终止符（terminator）。

一种有界修复（bounded repair）如下：

```c
void read_line(void) {
    char buf[16];
    int i = 0;

    for (;;) {
        int ch = getchar();
        if (ch == '\n' || ch == EOF) break;
        if (i >= 15) {
            /* consume or report excess input according to the specification */
            continue;
        }
        buf[i++] = (char)ch;
    }
    buf[i] = '\0';
}
```

为什么是 `15` 而不是 `16`？C string 需要一个 byte 存放结尾的 `\0`。怎样处理超量 input 取决于应用（application）：可以 reject、在明确发出信号（signal）后 truncate，或改用动态大小 buffer（dynamically sized buffer）。静默 truncation 并不总能接受。

如果没有证明目标容量（destination capacity），`strcpy` 一类库调用（library call）就不安全。只说“换一个 function”还不够；programmer 还必须处理终止状态（termination）、返回状态（return status）与截断策略（truncation policy）。

<a id="3-defense-in-depth"></a>

### 3. 纵深防御（defense in depth）

**mitigation** 会降低漏洞（vulnerability）被利用（exploitation）的概率或影响，但不等于消除 source bug。每种 mitigation 都属于特定 layer：

- **bounds check**：从 source 阻止 invalid write。
- **栈金丝雀（stack canary）**：在敏感的 saved state 附近放置一个 checked value，从而能在 return 前检测 corruption。
- **不可执行栈（non-executable stack）**：阻止 stack data 中的 bytes 被当作 instructions 执行。
- **地址空间布局随机化（address-space layout randomization, ASLR）**：降低有用 addresses 在不同 runs 之间的 predictability。

没有任何一层能证明全部内存安全（memory safety）。canary 可能无法阻止绕过它的 corruption；non-executable stack 无法防住所有控制流攻击（control-flow attack）；ASLR 是依赖熵（entropy）的概率性防护；源码级边界正确性（source-level bounds correctness）仍然不可或缺。

#### 3.1 网络蠕虫（worm）：从单机 defect 到网络传播（network propagation）

worm 是能在进入一台主机（host）后，再寻找或接触其他 hosts、把自身传播出去并让新 host 重复这一过程的恶意程序（malicious program）。早期现场消息曾把 Morris 事件称为病毒（virus），后续技术通报特意改称“really worm”：这里的关键区别不是报道使用了哪个泛称，而是 propagation mechanism。virus 通常强调依附其他 program／file 并随 host execution 扩散；worm 的决定性特征是跨 host 的自传播（self-propagation）。Morris Worm 与 Code Red 都应按后一种 mechanism 理解。

buffer overflow 只说明“一次越界可能改变一台机器上的 control flow”，并不自动产生 worm。要把局部 vulnerability 放大成 network propagation，至少还要同时具备以下传播前提（propagation prerequisites）：

1. network 上存在可到达的 target，而且它运行着相同的 vulnerable service，或存在另一条可重复 exploitation 的薄弱入口。
2. 初始 host 上的 vulnerability 或薄弱 policy 允许外来 input 取得足够 execution capability；只有 crash 而没有后续 execution，并不能完成 propagation。
3. 已受影响的 host 能选择或发现下一批 target，并能把 propagation 所需的 data 送到它们可接收的 service。
4. 新 target 接收后会重复“进入—执行—再发送”，且 patch、停用 service、隔离 host 或切断 reachability 尚未把这条 chain 截断。

```text
共同暴露的 service／薄弱 policy
              ↓
一个可到达 target 被进入
              ↓
该 target 成为新的发送端
              ↓
更多 target 重复同一过程
```

这幅 propagation chain 的教学作用是把 **vulnerability** 与 **propagation** 分开：vulnerability 是一个 target 的进入条件；network reachability、可重复的 target condition 和受影响 host 的再次发送，才形成跨 host 的 amplification loop。由此可以推演：如果一次 overflow 只让 service 终止，或被进入的 host 无法接触下一台 target，incident 可能仍很严重，但它不会仅凭这次 overflow 成为 worm 式 propagation。

#### 3.2 Morris Worm（1988）：多条进入路径叠加共同环境

Morris Worm 的课件时间线从 1988 年 11 月 2 日的设想开始：让已知机器把消息继续转发，以估计 Internet 的规模。这个设想把“每个新 host 都成为下一轮起点”写得很直观，也预告了失控原因——一旦重复传播比发现、修补和隔离更快，原本看似有限的动作就会级联式快速放大。

随后几张现场资料不是装饰性的日期，而是逐步补全因果链：

- 11 月 3 日凌晨的早期 newsgroup 告警把事件暂称为可能的 virus，并立即把止损指向三项当时怀疑的暴露面：修补或停用有缺陷的 network service，以及停用另一项不必要的 remote service。它说明现场防御首先要阻断传播条件，而不是先等分类名称完全确定；后续技术分析才负责确认实际进入路径。
- MIT Media Lab 稍后的 message of the day 宣布暂停外部 mail。它展示的不是 worm “通过邮件附件传播”，而是事件造成的 availability 与协调代价：组织为了隔离风险关闭正常通信，同时又必须寻找不依赖受影响通道的办法发布清理信息。
- 11 月 4 日的技术通报明确称其为 worm，并归纳出多条进入路径：两个广泛部署的 system service 存在 software flaw，另有一条依赖 password guessing。这里的重点不是复现这些路径，而是认识到 **software vulnerability** 与 **security-policy weakness** 是不同前提；修补一项 service 不会自动修好另一项，也不会自动改善 password policy。
- 1989 年的 GAO 报告把传播归因进一步压成两个因果类别：许多联网机器共有的 system-software flaw，以及宽松的 host security policy。它还记录了传播速度与后果：出现后一小时内已有许多站点报告，到次日清晨已有数千台机器受影响；主要损失是 computer processing 与 staff time，即使当时未见永久破坏，稍作改变也可能造成更广泛的损害或敏感信息风险。
- 1991 年的判决摘要把技术后果连接到 authorization 边界：未经授权访问并造成损失或妨碍合法使用，本身就有法律意义；声称目标只是测量网络，并不能消除实际造成的可用性与成本后果。

课件最后展示装有 Morris Worm source code 的软盘展品。它不是网络 topology 图，也不提供传播步骤；它承担的教学作用是形成尺度反差：程序本体可以只是有限的 bytes，网络可达性、共同漏洞与自我重复却能把同一份软件行为放大到许多组织。

#### 3.3 Code Red（2001）：单一、广泛暴露的 Web-service 漏洞

**Code Red（红色代码蠕虫）**利用 Microsoft IIS Web server 的 buffer overflow。课件把一个过长的 Web request 与其后的机器数据并排显示，是为了把前文的局部 memory chain 接回真实 service：request 超过目标 buffer 的边界，越界破坏 control state，继而使收到的数据取得执行机会。本讲义只保留这层因果，不保留原 request、byte sequence、offset 或 target address。

这个相对统一的 remote entry 使 propagation 非常快：课件记录它在 14 小时内影响约 359,000 台机器，估计成本为 26 亿美元；受影响 system 出现网页篡改，并计划参与针对 whitehouse.gov 的拒绝服务（denial of service, DoS）行动。event 被发现后，target site 通过更换 IP address 暂时避开预定 traffic，这属于针对当时 attack target 的应急规避，并没有修复 IIS 的 source bug。

Morris Worm 与 Code Red 因而不能只用“都利用了 buffer overflow”合并成一个案例：

| comparison dimension | Morris Worm | Code Red |
|---|---|---|
| entry condition | 多个 service flaws，再叠加薄弱 password policy | 一个广泛暴露的 IIS buffer overflow |
| propagation structure | 多条 entries 并存；封住一条仍可能留下其他 paths | 大量同质 Web servers 共享同一 remote entry，便于 repeated automatic propagation |
| teaching role | 说明 software、configuration／policy 与 human response 会共同决定 propagation | 说明单一 memory bug 在统一、联网的 service group 中也能迅速放大 |
| emergency-action boundary | patch、停用 exposed service、改善 password policy 与 isolation 都各自只切断部分 conditions | 改变 target IP 可避开一次预定 DoS，但 source patch 才能移除特定 entry condition |

由表可以直接推演：只加强 password policy 不能阻止 Code Red 的 IIS overflow；只修补 Morris 的其中一个 service，也不能证明其余入口已经消失。相反，如果某个 target 已修补特定 overflow，即使它仍连接 Internet，Code Red 的那条进入链也会在该 target 处断开。

#### 3.4 历史案例为何导向现代 defense in depth

这些案例把前面的 mitigation 清单变成一组有因果分工的 defense layers：

- **消除 source condition**：bounds check、正确的 memory handling 与及时 patch 直接移除特定 overflow；这是最靠近根因的一层。
- **提高单机利用难度**：stack canary、non-executable stack 与 ASLR 在 source bug 尚存时降低 control-flow corruption 成功转成执行的机会，但不能修复错误的 boundary logic。
- **减少可重复 target**：停用不必要的 service、修补所有已知入口、改进 authentication／password policy，可减少 worm 能反复进入的同质目标；其中每项只覆盖自己的 failure mode。
- **截断传播回路**：隔离受影响 host、限制其继续接触其他 target，并维持不依赖受影响服务的通知渠道，可以把“受害者又成为发送端”的回路截断。
- **检测、响应与治理**：监测异常、建立 computer emergency response center、快速分发可信修复、教育 users，并明确 authorization 与法律／伦理边界，处理的是发现速度、协调能力和人的 policy，而不是替代程序修复。

课件以 2022 年一份真实系统安全更新收尾，其中“improved memory handling”出现 8 次，“improved bounds checks”出现 4 次。这两个计数只是该次更新的案例快照，不是整个行业的发生率；它的教学作用是证明 1988 与 2001 的案例并非已经失效的古老故事：现代 systems 仍持续修正 memory handling 与 bounds correctness。**defense in depth** 的结论也因此更精确——不同 layers 分别防止 vulnerability 产生、降低单机 exploitation、减少可传播 targets、截断 network amplification 并组织 response；任何一层都不能替其他层完成全部工作。
<!-- wanxiang:block machine-e5-bounded-repair:end -->

<!-- wanxiang:block machine-e5-privilege-gate:start -->
<a id="4-system-calls-cross-a-privilege-boundary"></a>

### 4. 普通 program 如何请求修改受保护状态（protected state）

普通 program code 不能直接修改 devices、files 或其他 protected state。以 `write` 为例，请求必须明确给出服务编号（service number）、文件描述符（file descriptor）、buffer address 与 size，随后才能取得 result。

正在执行该 program 的实例称为进程（process）；管理 protected state 的系统软件称为操作系统（operating system, OS）。process 通过系统调用（system call）请求 OS 执行受控 service。system call 与 procedure call 一样拥有 arguments 与 result，但会进入 OS handling。

**特权边界（privilege boundary）** 是 ordinary process code 与获准操作 devices、files、process state 的 OS code 之间的 permission boundary。因此，system call 不只是 jump 到任意 library address。service 改变 protected state 之前，processor 与 OS 会验证 entry mechanism、service number、arguments 与 permissions。

本次机枢讲席的代码只练习有界的 `write` service，但会完整展示教学接口：

| service | number | `r0` | `r1` | `r2` | `r0` 中的 result |
|---|---:|---|---|---|---|
| read | 0 | file descriptor | buffer address | size | bytes read 或 -1 |
| write | 1 | file descriptor | buffer address | size | bytes written 或 -1 |
| execute | 2 | buffer address | size | 未使用 | 0 或 -1 |

安全的 write 示例：

```asm
.pos 0x1000
ld $1, r0            # stdout file descriptor
ld $message, r1      # buffer address
ld $4, r2            # byte count
sys $1               # write
halt

.pos 0x2000
message:
    .long 0x4f4b210a # bytes for "OK!\n"
```

system call 之后，`r0` 不再是 file descriptor，而是 result。与跨越 procedure call 一样，我们必须追踪跨 interface 的 state change。
<!-- wanxiang:block machine-e5-privilege-gate:end -->

## 复习闭环（Review Loop）

不回看例题，完成以下任务：

1. 把 payload capacity 与 terminator capacity 分开，审计一个 fixed-size input buffer。
2. 分别说明 bounds check、canary、non-executable stack 与 ASLR 能保证什么、不能保证什么。
3. 追踪 write system call 前的 `r0-r2` 以及 call 后的 result state，不得混淆 service number、descriptor 与 return value。
