# 万象开场与讲义转场预览

在本目录执行：

```powershell
npm run dev:wanxiang
```

打开 [本地预览](http://127.0.0.1:5181/)。此命令先同步万象资料与标志，再启动专用预览；端口被占用时会停止，不自动换到其他端口。

每次打开或刷新都会自动重新播放启动标识与阵列起波，结束后停在可操作的讲义阵列。普通启动从 app time 1.76 到 `ARRAY_OPENING_END`（当前 25.9），不自动抽出讲义进入详情；这里的时间不包含资源载入。

- 开场正在播放时，单击动画画面即可跳过，也可按 Enter、Space 或 Escape；画面中没有单独的跳过按钮。跳过的这次操作不会继续打开讲义。启用减少动态效果时直接进入稳定阵列。
- 在阵列中选择课程与讲义，点击“阅读讲义”进入所选详情；详情中的返回按钮回到阵列。
- 点击底部“重播完整演出”，会保留当前选中的讲义，从启动段继续播放阵列、单件抽出与正文显现，到 app time 35 进入该讲义详情。重播期间同样可以点击或按键跳过，跳过后落到阵列。
- 详情里的“360° 查看文档模型”另行打开模型查看与拆解；它不是完整重播结束后自动播放的一段。

资料由万象全局 `content/lessons/lessonCatalogData.json` 及实际讲义同步，当前为三门课程的 33 份讲义；Logo 来自 `content/art/branding/wx_logo.svg`。这些数据不表示玩家学习进度，也不是天工固定教材书库。天工书本只形成候选转场映射，详见主项目的[启动呈现与转场 owner](../../wanxiang-game/docs/modes/ui/启动呈现与转场.md)。

本入口保留独立使用，也提供下面的游戏宿主 adapter。它不接入 Save、课程教师或正式学习进度，不启用 Wallpaper Engine 工作台、Wallpaper Engine 宿主功能或 PWA 离线缓存；原工作台的“正在播放”“专注计时”入口保持隐藏，不显示“未完待续”。

独立静态目录的命令是 `npm run build:wanxiang`，目标输出为 `release/wanxiang/`。游戏固定打包流程消费这一 bundle，实际包状态与观察结论由主项目的[当前报告](../../wanxiang-game/docs/REPORT.md)持有。

## 游戏宿主接口

只有 `wanxiang` 构建处于 iframe 内且带以下参数时启用 adapter；直接打开页面保留上面的独立行为。宿主与子页必须同源。

- `opening/index.html?wanxiangHost=startup`：自动播放普通启动；自然到阵列、画面单击、Enter／Space／Escape 或减少动态效果均通过既有完成入口收口。完成后阵列继续呈现，整页输入锁定，由宿主等待真实 Home 就绪后移除开场。
- `opening/index.html?wanxiangHost=preview`：自动进入完整演出，正常结束到当前讲义详情；跳过或减少动态效果落到阵列。阵列、正文返回和“重播完整演出”继续可用。宿主保留自己的“返回首页”动作，收到完成通知时不自动关闭预览。

`src/wanxiang-host.ts` 向 `window.parent` 的当前同源 origin 发送 `postMessage`，消息为 `{ type: "wanxiang-opening", event: "ready" | "complete" | "error" }`；错误消息附带实际失败的 `message`。`ready` 表示场景与启动所需字体已经准备、自动演出开始；`complete` 来自统一的 `finishBoot`。宿主须同时核对 origin 与当前 iframe 的 `contentWindow`。子页不接收宿主命令；资源载入失败通知宿主，由宿主提供实际错误与恢复路径。

宿主控制最终画面交接及 iframe 移除。子页在 `pagehide`／`unload` 取消主 animation frame、载入淡出 timer 与交互捕获，释放现有 viewer、scene WebGL renderer 和音频；载入晚到的 scene 同样进入释放。宿主可以在 `ready` 后将焦点交给 iframe 以使用键盘跳过，返回 Home 时恢复游戏焦点。
