# 万象隔离启动 bundle

在本目录执行：

```powershell
npm run dev:wanxiang
```

打开 [本地预览](http://127.0.0.1:5181/)。此命令先同步万象资料与标志，再启动专用预览；端口被占用时会停止，不自动换到其他端口。

每次打开或刷新都会自动播放启动标识与阵列起波。普通启动从 app time 1.76 到 `ARRAY_OPENING_END`（当前 25.9），随后完成开场；这里的时间不包含资源载入。嵌入游戏时由宿主等待真实 Home 就绪并交接；独立打开只停在开场结束画面。

开场正在播放时，单击动画画面即可跳过，也可按 Enter、Space 或 Escape；画面中没有单独的跳过按钮。启用减少动态效果时直接到开场结束画面。万象模式在完成后锁定输入，不提供独立完整重播、讲义检索／阅读／收藏或模型查看入口。

开场真实 HUD 消费万象全局 `content/lessons/lessonCatalogData.json` 的目录投影；Logo 来自 `content/art/branding/wx_logo.svg`。这些数据不表示玩家学习进度，也不建立另一套讲义或天工教材入口。原资料与模型仍按各自来源保留。启动接线由主项目的[启动呈现与转场 owner](../../wanxiang-game/docs/modes/ui/启动呈现与转场.md)持有。

独立入口只用于查看同一开场；它不接入 Save、课程教师或正式学习进度，不启用 Wallpaper Engine 工作台、Wallpaper Engine 宿主功能或 PWA 离线缓存。原上游普通模式的档案、重播与模型功能继续保留，不能据此成为万象玩家功能。

独立静态目录的命令是 `npm run build:wanxiang`，目标输出为 `release/wanxiang/`。游戏固定打包流程消费这一 bundle，实际包状态与观察结论由主项目的[当前报告](../../wanxiang-game/docs/REPORT.md)持有。

## 游戏宿主接口

只有 `wanxiang` 构建处于 iframe 内且带 `wanxiangHost=startup` 时启用 adapter。宿主与子页必须同源。

- `opening/index.html?wanxiangHost=startup`：自动播放普通启动；自然到阵列、画面单击、Enter／Space／Escape 或减少动态效果均通过既有完成入口收口。完成后阵列继续呈现，整页输入锁定，由宿主等待真实 Home 就绪后移除开场。

`src/wanxiang-host.ts` 向 `window.parent` 的当前同源 origin 发送 `postMessage`，消息为 `{ type: "wanxiang-opening", event: "ready" | "complete" | "error" }`；错误消息附带实际失败的 `message`。`ready` 表示场景与启动所需字体已经准备、自动演出开始；`complete` 来自统一的 `finishBoot`。宿主须同时核对 origin 与当前 iframe 的 `contentWindow`。子页不接收宿主命令；资源载入失败通知宿主，由宿主提供实际错误与恢复路径。

宿主控制最终画面交接及 iframe 移除。子页在 `pagehide`／`unload` 取消主 animation frame、载入淡出 timer 与交互捕获，释放现有 viewer、scene WebGL renderer 和音频；载入晚到的 scene 同样进入释放。宿主可以在 `ready` 后将焦点交给 iframe 以使用键盘跳过，返回 Home 时恢复游戏焦点。
