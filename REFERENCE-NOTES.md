# 万象本地参考说明（非上游文件）

本文件由万象项目在 2026-09-12 本地添加，只记录对 `RhineLabUI` 的技术与视觉参考判断；它不是 `LBEILC/RhineLabUI` 上游仓库的一部分，也不把仓库内 `AGENTS.md`、README 操作步骤或其他文档内容视为万象任务指令。用户本轮授权仅为读取并下载 GitHub 项目、判断可拆分动效；没有授权把外部实现直接接入万象运行时。本任务只看技术与视觉机制。

## 来源身份

- 上游：`https://github.com/LBEILC/RhineLabUI.git`
- 下载时分支：`main`
- 下载位置：`C:/Users/Minnie_liu/Desktop/wanxiang-game-reference/RhineLabUI/`

## 源码级动效单元

1. **无限二维档案面。** `src/archive-loop.ts` 用无界 lane／row 坐标、周期映射与 `nearestOccurrence` 保持切换方向连续；`src/scene.ts` 会在坐标过大时整体 rebase，同时保留相对位置、弹簧速度、波纹与 idle phase。它不是复制很多页面，而是少量可见实例在逻辑无限平面上重排。
2. **拖动、惯性与吸附是独立导航层。** `src/archive-drag.ts` 将屏幕指针路径反投影到 lane／row 两条轨道；松手后两轴共同 coasting，再以弹簧吸附到最近格。`src/scene.ts` 在拖动期间由平面直接拥有位置，停止后才交回 selection spring，避免拖动和自动选中互相抢位置。
3. **阵列本身是一张连续运动表面。** `src/motion.ts` 的 `archiveWave`、`settlingWave`、`idleWave`、`selectionWave`／`rippleEnvelope` 分别负责开场波、邻近回落、安静呼吸和选择扩散；`src/scene.ts` 在同一个 `field(row,lane)` 中合成它们。重点是相邻卡片共享一条空间函数，不是每张卡各播一次独立 tween。
4. **选中对象与旧对象并行交接。** `src/scene.ts::select` 在已抬起对象切换时克隆 outgoing visual，旧对象先转正、再下降；新对象抬起后再触发向外波纹。`src/motion.ts::returnStep` 明确把“旋转对齐完成”作为下降前置，避免返回动作穿插。
5. **编号、标题和空间选择同拍更新。** `src/main.ts::updateSelection` 同时更新标题、分类、权限、档案编号、列编号与位置计数；`@kitlangton/rolling-number` 提供 460ms rolling number／text 与方向输入。空间对象、数字和文字响应同一 selection，而不是事后各自播放装饰动画。
6. **模型与正文共用一次解密进度。** `src/decryption.ts` 把 diagonal scan、marker、label、clarity 分成可采样曲线；`src/document-decryption.ts` 从真实文本行建立遮挡条，并从同一个玻璃 clarity 事件开始依序退开。它展示了跨 WebGL 与 DOM 的单一状态驱动，而不是两个看起来相似却可能失步的动画。
7. **六组拆解是一个连续标量。** `src/model-viewer.ts` 把 fasteners、cover、optical lenses、optical core、substrate、carrier 六组绑定到各自 depth，用单一 `spread` 弹簧从 0 到 1／从 1 到 0；清晰／磨砂另用 `clarity` 弹簧。所有部件按同一进度展开，因此可中途反向并连续重组。
8. **相机意图与实际呈现分层。** `OrbitControls` 只记录用户请求姿态；`src/viewer-camera.ts` 用球坐标插值实际渲染相机，对 orbit、pan、zoom 使用不同阻尼，复位时走不会穿过模型的 spherical interpolation。用户操作能中断复位而不跳帧。
9. **界面过渡可被中断。** `src/ui-transitions.ts` 从当前 computed opacity／transform 开始新的 enter／exit，并用 revision 丢弃过期完成回调；打开过程中按返回不会先跳到完成态再关闭。
10. **开场是确定性时间轴，不是散落 timeout。** `src/boot-motion.ts` 由 app time／video frame 派生逐字输入、Logo 笔画、验证、扫描、欢迎与退出参数；同一时间输入能得到同一画面，便于重播和调试。
11. **主题变化也是空间传播。** `src/theme-motion.ts` 从当前选中 cell 作为 origin，为各 card 计算距离延迟；切换被打断时从每张 card 当前颜色继续，而非全部回到统一起点。
12. **减少动态与性能模式贯穿各层。** `main.ts`、`scene.ts`、`model-viewer.ts`、`viewer-camera.ts` 均让 reduced motion 直接落到稳定终态；README 和 render-quality 模块还把渲染质量与动画保留分开。后续复用不应只搬“好看”的正常路径。

## 当前证据边界

本轮只读了实际源码、README 和仓库随附的当前截图；没有安装依赖、运行检查脚本、build、启动页面或做万象实际视觉验收。上面的结论证明代码里存在这些结构，不证明其在本机所有屏幕、帧率、输入方式下均达到理想效果。（2026-09-19 已在本目录实际 `npm ci` 与 `npm run build` 并在浏览器运行一次，见文末[核对节](#2026-09-19-核对评估是否符合实际与美术风格)。）

## 与万象现有板块的映射

### 总判断

万象当前并非缺少持续动画。Home 已有人物局部呼吸、衣料与室内空气，博识智库已有云层与图徽轻浮，不可知域已有球面／水晶旋转与上下漂浮，天工已有书本页边、纸尘与教师立绘局部形变。当前更明显的缺口是：这些动态大多停留在各自对象的待机循环，没有把一次真实交互从“开始操作”到“内容稳定出现”组织成同一条可逆、可中断、同拍的状态链。

最值得拆用的不是某一个粒子、波纹或旋转参数，而是这一条公共设计方法：

`pointer／keyboard intent → 空间移动 → 选中对象交接 → 编号与标题更新 → 内容显现 → 返回／打断时从当前状态反向收束`

这只是各页面可以分别消费的设计方法，不建立跨模块共享产品状态；每个页面仍由自己的 owner 和现有真实数据驱动。

### 优先级 1：博识智库——补齐完整的“档案选择链”

- **当前已有：** Hub 的星云、轨道和图徽持续动态；list 的真实检索、讲义按钮和 detail reader；页面生命周期已经固定为 `Hub → category list → selected detail`。
- **当前缺口：** 选择讲义时主要是 React 状态与阅读面切换。环境在动，但“哪一册被选中、上一册如何退场、编号／标题何时更新、正文何时稳定出现”没有形成一个可感知的连续动作。
- **建议拆用：** `archive-loop／archive-drag` 的连续空间组织、`motion.ts` 的选中波与旧新对象交接、`updateSelection` 的编号标题同拍、`ui-transitions.ts` 的当前态反转，以及 `decryption` 的“一个进度同时驱动模型与 DOM”思想。
- **最小产品化形态：** list 仍消费真实讲义记录；选中册在原索引区域内抬起并成为视觉锚点，上一册先对齐再回位；卷号、标题与结果计数跟随同一 selection 更新；reader 从同一个 transition progress 显现。返回或快速改选从当前画面直接反向，不等待旧动画播完。
- **不应照搬：** 不把三分类 Hub 变成虚构的无限分类，也不让正文、状态文字和滚动内容持续漂动。共享解密只借其同步机制，不默认给讲义正文添加遮挡效果。

这是最直接、收益最高的一块：参考项目本身就是档案系统，而万象智库已经具备真实分类、检索、讲义与阅读器，只缺中间的动作编排层。

### 优先级 2：天工肇造——把书本展开／收回做成可逆对象交接

- **当前已有：** 连续二维学习地图、同一 book 对象的 680ms 展开／收回、选中书页边与纸尘待机、课堂教师局部动态。
- **当前缺口：** 书本已经“会动”，但重点仍是固定 CSS transition 和局部待机；快速切组、展开中收回、当前书换到另一组时，缺少从当前状态继续的统一弹簧与旧新对象交接。
- **建议拆用：** 六组拆解的单一 `spread` 标量改造成“书组展开进度”，`returnStep` 改造成旧书先对齐再回书脊，`ui-transitions` 负责中途反向，确定性 timeline 只负责进入地图时的有限开场。
- **保留边界：** 地图 owner 已明确二维自由平移且不 snap，因此只吸收拖动／惯性分层，不引入格点吸附；Phase 标题、状态、点击区、依赖线和真实 prerequisite 均保持稳定。课堂正文、教师判断、消息滚动和 Save 不消费这些装饰状态。

### 优先级 3：不可知域——增强导航手感，暂不强加“六件拆解”

- **当前已有：** 课程／主题的连续横向地图，球体经纬投影慢转，水晶切面旋转与上下漂浮，层级节点和路径已有真实几何。
- **当前缺口：** 主体待机已经比较完整；更适合补的是地图拖动的速度连续性、松手后的惯性收束、选中节点时相机／空间焦点与标题状态的同拍，而不是再叠一层独立旋转。
- **建议拆用：** `archive-drag` 的二维输入投影与惯性阶段、`viewer-camera` 的意图／呈现分层和平滑复位、selection wave 的邻近节点反馈。连续地图仍按真实边界平移，不改成离散分页或强制吸附。
- **六组拆解的准入条件：** 只有某个真实主题或试炼已经拥有可解释的部件／层级数据时，才用一个 progress 展开这些真实对象。当前 owner 没有这样的六部件事实，因此本轮只把该机制保留为未来可选项，不给水晶凭空造内部结构。

### 不作为主要改造目标：Home 与安静工作区

- Home 的人物／环境驻场动态已经覆盖“持续、缓慢但能察觉”的主体和空气层；可以借用可中断 enter／exit 和统一开场时间轴，但不适合引入档案阵列或拆解模型。
- 博识智库正文、天工课堂消息区、不可知域 workbench 的代码／输入／结果区应继续保持安静；动态应停在导航、选中交接和空间主体，不进入长文阅读与精确操作面。

## 推荐的下一实现切片

先只做博识智库 list → detail 的一条真实选择链：同一 `selectionTransition` 同时驱动旧册回位、新册抬起、标题／计数切换和 reader 显现，并允许快速改选与返回从当前状态反向。这个切片能直接检验“完整动效链”是否改善体验，又不需要先改课程事实、Save 或其他板块；成功后再把同样的可逆交接方法分别移植到天工书本和不可知域地图手感。

## 补充判断：从程序第一帧贯穿到 Home 的开屏仪式

### 当前万象启动链的源码事实

- 桌面端 `engine/packages/desktop/main.cjs` 当前以 `show: true` 创建窗口；窗口可在 renderer 的万象遮罩建立前先显示原生背景。后续 `ready-to-show`／`did-finish-load` 再调用 `show()`，并不能收回这一个更早的可见阶段。
- `engine/packages/webgal/index.html` 在 `#root` 之前直接放置 WebGAL 的 `#ebg` body 背景；旧 `.html-body__title-enter` 已隐藏且 `skipAnimation: true`，所以这不是一条仍在工作的正式开场，只是首份 HTML 自己仍可先绘制的底层表面。
- `App.tsx` 在同一次 React 提交中始终挂载 WebGAL 的 `Stage／Menu／BottomControlPanel` 等 stock surface 和 `WanxiangRoot`。`index.scss` 与 `main.tsx` 已用 `data-wx-react-ready`、`data-wx-shell-mounted`、`data-wx-terminal-open` 隐藏这些 stock controls；当前本机包也包含这组门，因此旧问题中的“原生控件闪现”已经有源码级防线。
- 这组防线不等于万象拥有了首帧。`#ebg` 位于 stock surface 之外，Electron 窗口又立即显示；React 建立后才出现 `.wx-boot-veil`。
- 当前 `.wx-boot-veil` 只是固定渐变、符号、标题和“正在整理今日条目……”文本，没有进入／退出状态。`WanxiangRoot` 的 `ready` 只等 `performTimeSync()` 结束，随后遮罩直接卸载；它不等待 Home 关键背景解码、人物／fallback 首帧、字体或布局完成。
- Home 的 `HomeIdleMotion` 自己知道图片／WebGL texture 是否完成，但没有把 `homeVisualReady` 反馈给启动层。于是现有顺序仍是“数据同步完成就撤罩”，而不是“下一幅玩家可见画面已经能无缝接棒才交接”。

因此，作者描述的历史观感包含两个不同层次：WebGAL 原生控件的短暂露出已有专门 gate；但从窗口首帧、HTML 底景、React 静态遮罩到 Home 的完整呈现仍没有单一 owner，也没有连续时间轴。本轮没有实际启动桌面包，不能把源码边界扩大为“当前包仍一定肉眼闪出某个控件”。

### 作者覆盖后的现行路线：direct-reuse-first

作者已明确覆盖上一版“另做万象轻量 3D”的建议。现行原则不是学习后重写，而是：**现有实现能直接留下来的，就把它连同效果和结构一起留下；万象化优先靠添加，只有无法绕开的身份项才做最小修改。** 轻量化、抽象化或重新创作都不能作为默认动作，因为它们会增加实现量，也更容易把原效果改走样。

样本的偏白底色是表层主题，不是重做 3D、波动或页面结构的理由。正确的本地化方向是保留现成代码，在需要的位置调整／替换背景，或在原结果之上追加万象的颜色、材质、纹理与标识层。

#### 默认原样保留

- 原 `boot-motion.ts` 的时间轴、`motion.ts` 的波函数、`scene.ts` 的 ArchiveScene、相机、灯光、阴影、AO／景深／SMAA 后处理与 renderer 生命周期；
- 原 GLB、材质、shader、空间阵列、开场波、idle、selection ripple、质量档和 reduced-motion 分支；
- 原 HTML／CSS 层级、DOM ID 与模块边界，只要它们在隔离启动界面内可以正常工作；
- 原动画节拍与镜头结果，不先根据“可能太重”主动删减。两个主要 GLB 和完整 Three.js 依赖应随启动 bundle 一起保留；只有实际接入后出现具体阻断，才针对该阻断做最窄调整。

#### 只做必要适配

1. 用独立 content mapping／overlay 把原界面里必须显示给玩家的项目名称、标题和标识映射为万象已经存在的 canonical 名称／素材；只有原文字无法从外部映射时才做最小字符串替换。不另外发明新文案、新世界观句子或新视觉隐喻。
2. 增加一个最薄的 host adapter：让启动 bundle 回报 `ready` 与 `complete`，接收一次退出／跳过请求，并在交接后释放输入和 renderer。
3. 调整资源 base path 与打包入口，使原项目作为自包含的启动 bundle 被万象加载；不把其 DOM、CSS、Three 依赖和场景类拆散后重写成 WebGAL／React 组件。
4. 让 Home 在原 3D 演出期间后台准备；Home visual-ready 后，由原场景的既有退出阶段或最小淡出接到 Home。WebGAL 的 `#ebg` 与 stock surface 在交接完成前保持不可见。

#### 偏白背景的 additive localization

本地化时保留原 stylesheet、Three scene 与 GLB，新增三个窄层即可：

- `wanxiang-startup-theme.css` 在原 CSS 之后加载，只覆盖页面底色、背景图／渐变、明暗、边缘压暗和现有 accent；不复制原布局和动效规则。
- `wanxiang-startup-theme.ts` 在原 scene 建立后追加 clear color、fog、environment 或材质色调映射；不改 wave、selection、camera、timeline 与 post-processing 算法。
- `wanxiang-startup-content.ts` 只持有现有万象名称、标识和背景素材映射；不写新的展示文案。

如果单纯更换背景资源或尾部 CSS 已能达到目标，就不再添加 scene theme adapter。只有实际画面表明白色来自 WebGL clear／fog／material 而非页面底层时，才启用对应的最小追加层。

紧耦合在这里不是重写的理由，反而说明最省工作的方式是保留完整 bundle 边界。万象当前主 web runtime 没有 `three`，也不要求把 Three 塞进它的依赖树；启动效果可以保留自己的原依赖和构建边界，只通过上述少量信号与主程序连接。

#### 不做的额外工作

- 不另写一套“类似”的轻量波面、相机、粒子或 2D 替代品；
- 不为了代码风格统一先重构参考项目；
- 不把现成场景拆成多个新的万象组件；
- 不因底色偏白而改动 3D 阵列、波动、镜头、模型或交互结构；
- 不在作者没有提供或现有 canonical source 没有对应项时创作替换文案；
- 不在实际接入证明某一资源确实造成问题前，预先删模型、减后处理或改变原镜头。

### 最小接入链

`native-cover → 原 RhineLabUI 启动 bundle → 原 3D 波场／档案场景 → Home 后台 ready → 原退出阶段／最小 crossfade → Home`

- **`native-cover`：** 只解决 Electron `show: true` 与 iframe／bundle 尚未产生第一帧之间的空档，视觉取自原启动界面的首帧，不另设计一套 splash。
- **原启动 bundle：** 保留参考项目自己的 HTML、CSS、Three.js、资源、BootSequence 与 ArchiveScene，以隔离层整体加载。
- **Home 后台 ready：** 仍需把 `performTimeSync` 与背景 decode／layout／人物或静态首帧分开；这是现有万象交接缺口，不是对原动效的再创作。
- **交接：** host 只消费 `ready／complete` 信号并控制两层可见性。启动 bundle 完成后释放事件与 renderer，Home 成为唯一交互层。

原项目已有 reduced-motion 和质量档，默认直接保留并接到万象对应偏好，不另造一套降级动画。异常路径只保证不露出 WebGAL 底层并能进入 Home；具体修剪只能由实际接入结果触发。

### owner 与 direct consumers 建议

这条链发生在 Home 之前，又决定 WebGAL stock surface 是否可见，因此不应塞进现有 Home 驻场合同。若进入实现，应先建立一个独立的“启动呈现与 Home 交接”稳定 owner，并由玩家 UI 总路由指向它；参考项目本体作为完整启动 bundle 保留，万象 owner 只持有它与主程序的接线。direct consumers 至少包括：

- `engine/packages/desktop/main.cjs`：窗口首次显示与 native cover；
- `engine/packages/webgal/index.html`：零依赖 boot shell 与 `#ebg` 边界；
- 独立 RhineLabUI 启动 bundle：原 HTML／CSS／Three／GLB／timeline／scene，加在原实现之后的万象 theme／content mapping，以及最薄 `ready／complete` adapter；
- `engine/packages/webgal/src/main.tsx`、`App.tsx`、`WanxiangRoot.tsx`：React shell、stock surface gate 与启动 bundle host；
- `WanxiangTerminal.tsx` 与 Home background／`HomeIdleMotion`：预挂载、视觉 ready 回执与最终交接。

本轮只形成源码诊断与推荐状态链，没有把这个建议写成产品合同，也没有修改运行代码、build、package、启动应用或进行实际视觉验收。

## 2026-09-19 核对：评估是否符合实际与美术风格

作者 2026-09-19 要求先看“行不行”、上文评估是否符合实际、是否符合美术风格，没问题才接入。本节由 root 只读核对写成；参考源码与万象产品源码均未修改。

### 参考项目本身：行

- 本目录 `npm ci`（26 个包，需 `--use-system-ca`，本机代理证书链所致）与 `npm run build`（tsc + vite，9 秒）均 exit 0。产物 `dist/` 41.9 MB、829 个文件：`index-*.js` 977 KB、`index-*.css` 663 KB（内嵌 fonts.css）、两只 GLB 3.34 MB + 3.57 MB、`sw.js` 39 KB，其余为 MiSans 子集 woff2。`public/` 33.7 MB 中 fonts 24.1 MB、assets 6.6 MB、audio 2.9 MB。
- `vite preview` 在 Cursor 内置浏览器（1920×1080、dpr 1.5）实际运行：WebGL 阵列渲染正常，入口门 → 开场 → 阵列 → 详情全链可操作；`REINITIALIZE` 可重放阵列开场波。本机没有观察到报错或空白帧。
- `node_modules/` 与 `dist/` 现留在本目录（两者都在上游 `.gitignore` 内），作者可用 `npm run preview` 自行观看。

### 上文评估中成立的部分

- 十二个源码级动效单元逐条在源码中找到对应实现：`archive-loop.ts::nearestOccurrence`／`scene.ts::rebaseCoordinates`；`archive-drag.ts` 双轨反投影；`motion.ts` 的 `archiveWave／settlingWave／idleWave／selectionWave／rippleEnvelope／returnStep`；`scene.ts` 的 `outgoing` 克隆交接；`main.ts::updateSelection` 与 460 ms rolling；`decryption.ts` 的 `clarity` 曲线与 `document-decryption.ts` 的逐行遮挡；`model-viewer.ts` 六组 `PARTS` 与 `spread／clarity` 双弹簧；`viewer-camera.ts` 球坐标插值与三种阻尼；`ui-transitions.ts` 的 `revision` 与 `getComputedStyle` 起点；`boot-motion.ts` 的 25 fps 帧轨；`theme-motion.ts` 的 origin 距离延迟；reduced motion 覆盖 16 个源文件。
- 万象启动链五条事实成立：`engine/packages/desktop/main.cjs` 第 897 行 `show: true`；`index.html` 第 142 行 `#ebg` 位于 `#root` 之外；`App.tsx` 同一提交挂载 stock surface 与 `WanxiangRoot`；`index.scss` 已有 `data-wx-react-ready／data-wx-shell-mounted／data-wx-terminal-open／webgal-stock-surface` 四道门；`WanxiangRoot.tsx` 第 308–311 行 `ready` 只随 `performTimeSync()` 结束，`.wx-boot-veil` 为静态遮罩；`HomeIdleMotion.tsx` 的 `data-motion-ready` 未向上层暴露；主 web runtime 无 `three` 依赖。
- “偏白底色可用追加层本地化”成立：项目自带亮／暗两套主题（`theme.css`、`theme-material.ts`），暗色阵列为蓝灰板体加琥珀色标签，与万象壳体 `#2A292D`、黄铜 `#B98F33` 的距离比亮色近得多。
- 第一部分“方法级映射”（博识智库选择链、天工书本交接、不可知域导航手感）不受本节影响，仍是纯方法参考。

### 上文评估低估或遗漏的部分

1. **入口手势。** `startup.ts::StartupGate` 在开场前强制等待一次点击（“点击进入 →”，兼作音频解锁）。实际运行中确认。`native-cover → 启动 bundle → 开场` 不是免手的；要么由 host adapter 自动进入（改动启动生命周期，超出“追加层”），要么玩家每次启动多一次点击。
2. **时长。** `boot-motion.ts` 以视频时间 5 s 为 app 时间零点，欢迎段在视频时间 26.92 s 结束，即开场约 21.9 s；`wallpaper-opening.ts::ARRAY_OPENING_END = 25.9` 表示阵列开场波再到约 25.9 s。每次启动 22–26 s 需要作者定政策（首次／每次／可跳过并记住）。开场内已有 `#skip`（ENTER SYSTEM）按钮与 Enter 键跳过。
3. **标识层不是字符串映射。** 卡带标签文字（`scene.ts` 第 756–769 行 `fillText`：“RHINE LAB, LLC.”“INTERNAL DATABASE”“R L / I S”“INFO”）确实是 CanvasTexture 绘制、可替换字符串；但 ∞ 商标是 `brand.ts` 的 SVG path，开场 9.16–19.48 s 的 Logo 笔画由 `boot-logo-tracks.ts` 沿 `bootMarkContour` 逐帧手调（frame 229–264 起的 draw／erase 位置），`boot-lettering-art.json`（29 KB）持有 “RHINE LAB / SYNTHESIZE INFORMATION / ANALYSIS OS” 字形动画。换成万象标识意味着重做这段轨迹，而不是 overlay。万象已有 canonical 标识 `content/art/branding/wx_logo.svg`（经纬圆＋八角星、“万象”“新维港校准录”“VANCOUVER COLLEGIUM · 1901”），因此不需要创作新文案，但需要为新轮廓重新采样轨迹。
4. **阵列 HUD 内容。** 开场结束即进入阵列，HUD 显示 40 份《明日方舟》莱茵生命档案（`content/archives.json`：X-001 莱茵生命、克丽斯腾／塞雷娅等）、“JOYCE MOORE / SESSION AUTHORIZED”“POWERED BY RHINE LAB”。作开屏用时要么隐藏整层 HUD，要么映射到真实万象内容；上文只提到“名称、标题和标识映射”，未估到这 40 条正文。
5. **宿主模式已存在但未被提及。** `vite.config.ts` 的 `--mode wallpaper` 已经把 `base` 改为 `./`、移除 PWA manifest、注入 host 脚本；`pwa.ts` 在该模式下不注册 service worker；`wallpaper.ts` 接收宿主 fps／paused。这是最接近“隔离启动 bundle”的现成变体，比默认 web 模式更适合作为万象启动 bundle 的基线；默认模式的 `sw.js` 在 Electron 内嵌时必须关掉。
6. **体量。** 启动 bundle 会给发行包增加约 42 MB，其中 24 MB 是 MiSans 子集字体（HUD 与开场字形依赖它）。上文只提到两只 GLB 与 Three 依赖。

### 与现行美术合同的比对

美术 authority 取 `docs/design/万象多主题美术与UI构图规范_2026-07-23.md` 与 `docs/design/年代计算多主题视觉规范_v1.md`（`docs/README.md` 与 `docs/current_truth.json` 当前指向）。

- **构图规范 §2.5**：“商标、原作命名及没有《万象》功能 owner 的对象不进入运行时。” RHINE LAB 字标、∞ 商标、“莱茵生命”“RHINE LAB, LLC.”“JOYCE MOORE”“POWERED BY RHINE LAB”与 40 份档案正文全部属于此类。开场 22 s 中约 10 s 是这枚商标的笔画演出，因此它不是边角文案，而是开场的主体。
- **年代计算 §1**：“若灰度截图、轮廓或图标组合仍能一眼被认成某一参考游戏，应视为转换不足并重做。” 本项目按 README 自述是“莱茵生命：访问”特别映像 5–40 s 的逐帧复刻；白底逐字输入、∞ 描边、半透明卡带阵列的斜向升起波，是原 PV 的识别轮廓，只改底色不改变灰度识别。
- **构图规范 §2.1／§2.3、年代计算 §5.4**：1901 材料语言为纸、黄铜、钢、木、玻璃、瓷釉、刻度、穿孔纸带、接线、机械计数器；参考项目是 2020 年代生物科技公司的极简终端（MiSans 大写字距 HUD、终端逐字输入、纯白半透明玻璃板体）。其中“成排档案盒／卡片目录抽屉”作为 1901 图书馆的物件是成立的，暗色主题加暖色材质（`theme-material.ts` 已有追加位）可以把板体读成深漆木／黄铜标签；但 HUD 字体、终端式开场文字与商标必须替换才能落进合同。
- **色调衔接**：万象 Home 是暗暖木质书房加黄铜；参考默认亮色为米白，直接接到 Home 会是一次亮→暗的硬切；暗色主题更接近，且 `年代计算` 同时给出纸面 `#EEE8DC` 与壳体 `#2A292D` 两组 token，两种走向都有合同依据，需作者选。
- **符合的部分**：确定性时间轴、空间波、选中交接、可中断过渡、reduced-motion 直接落终态（`年代计算 §8.1`）；三层材料（scene／glass／paper）在阵列＋标签＋正文里是可分辨的（`构图规范 §2.3`）。这些正是 09-12 第一部分推荐拆用的方法。
- **资产身份**：GLB、音频、MiSans 子集与任何进入运行时的图像都要先在 `content/art/asset_manifest.json` 登记来源与 runtime 路径（`构图规范 §4`）；上文未列入接入清单。

### 结论

- “行不行”：参考项目在本机可构建、可运行、结构与上文描述一致——行。
- “评估是否符合实际”：事实全部成立；适配量被低估，主要在标识层（轨迹重做而非映射）、入口手势、时长政策、HUD 内容、宿主模式基线与体量六处。
- “符合美术风格”：以原样（含商标、字标、莱茵生命内容、亮白米色）接入不符合两份现行合同；在作者 09-12 direct-reuse 决定之内，把“标识层替换＋暗暖主题＋HUD 隐藏或映射＋自动进入与可跳过”列为必要适配后可以符合。3D 阵列、波动、镜头、GLB、后处理与节拍不需要为此改动。
- “没问题的话可以接入”的条件按现状未满足；需要作者对上述适配范围做一次决定，见 `docs/modes/MEMO.md` 的 `modes.RHINELAB-REFERENCE-REASSESSMENT-20260919`。

### 本节证据边界

本机一次 build 与一次浏览器运行是 exit code 与肉眼观察，不是万象 verification；未测帧率、未测 Electron `file://` 载入、未试 `--mode wallpaper` 构建、未做任何万象页面验收；未修改本目录源码，未改万象产品源码。

## 2026-09-19 作者决定后的万象隔离启动

本节接续上面的原版评估，记录当前万象启动接线。上文原版的 build／浏览器观察只属于当时的原版；当前用法从 [`WANXIANG.md`](WANXIANG.md) 进入，启动与 Home 交接由主项目的[启动呈现与转场 owner](../../wanxiang-game/docs/modes/ui/启动呈现与转场.md)持有。本节不能扩大上文“只做必要适配”与“最小接入链”的授权范围。

### 已确定的方向与本次实现选择

作者已确定每次启动播放、直接点击动画跳过、不增加破坏画面的跳过按钮，并要求 HUD 换为真实万象信息；配色与 Home 衔接由执行者调整。当前范围沿上文的开场→Home 链，只保留必要适配。

本次采用单击跳过，Enter／Space／Escape 等价；手势由 `OpeningInteraction` 消费，加载期间开始的按压不补作跳过，结束演出的操作不穿透到下一画面的资料打开。配色通过既有 theme 入口取暗暖、纸面与黄铜方向。标识消费 canonical `wx_logo.svg`，HUD 消费真实目录；这两项不增加虚构人物、会话授权或玩家进度。

### 原流程的完整分段

`boot-motion.ts` 使用 app time 加 5 秒采样原视频帧；`main.ts` 再把阵列、抽出与详情接在后面。因此“启动品牌演出”和“单件资料选择演出”不是同一用途。

| 原流程段落 | 原参考源码位置与触发 | 万象当前边界 |
|---|---|---|
| 文字与标识、auth、scan、welcome | `bootMotion` 的启动时间轴，至 app time 约 21.9 | 每次启动的身份与场景交接；原科幻认证文字不成为万象功能事实 |
| 阵列起波与稳定 | 约 app time 21.9 至 `ARRAY_OPENING_END=25.9` | 开场完成，等宿主交给 Home |
| 默认单件抽出、镜头聚焦、正文显现 | 原普通流程在约 app time 26 开始抽出，到 35 落到详情 | 仅保留原参考功能，不进入万象玩家路径 |
| 360° 模型查看与六组拆解 | 详情中的 `model-viewer` 动作另行创建并打开 `ModelViewer` | 仅保留原参考功能，不进入万象玩家路径 |

原普通 web 路径保留 `StartupGate`，是否使用由该路径的声音／音乐设置决定；原完整流程与原重播从默认档案开始。万象专用入口自动进入，不使用该原入口门，从 app time 1.76 播到 `ARRAY_OPENING_END` 后收口到结束画面并锁定输入。

单击、键盘跳过与减少动态效果均沿同一开场完成入口。嵌入时只有 `wanxiangHost=startup`，由真实 Home 就绪完成交接；独立打开只停在开场结束画面。万象不提供完整重播、第二套讲义检索／阅读／收藏或模型查看入口。以上是源码定义，未把 app time 当作本机实测播放时长。

### 独立万象候选的真实内容与边界

- `scripts/sync-wanxiang.mjs` 从主项目全局 `content/lessons/lessonCatalogData.json` 读取 lesson ID、标题、课程、时长及 `assetPath`，再读取相应完整讲义；目录和正文投影不建立学习完成或权限状态。当前为三门课程、33 份讲义，栏目与数量随真实目录生成。
- Logo 与既有标识文字来自 `content/art/branding/wx_logo.svg`；标识与内容适配继续消费 canonical source。阵列、镜头与动效沿用原实现，暖色调整通过现有 theme／material 与万象样式消费者完成。
- `wanxiang` 模式使用相对资源路径及专用 5181 端口，端口占用会停止；命令先同步资料，再运行该模式。它不加载 Wallpaper Engine 工作台／宿主，也不注册 PWA。静态 bundle 的目标目录为 `release/wanxiang/`，本批没有构建产物可据此宣告。
- 独立入口的落点是不可操作的开场结束画面；游戏通过同源 startup adapter 接到 Home。真实目录继续供开场 HUD 使用，不建立第二资料系统；不连接 Save、天工教师或正式学习进度。

### 天工书本的适用范围

当前万象开场 HUD 的全局课程讲义不是天工教材。天工课程正文和有序单元由其[固定教材 manifest](../../wanxiang-game/docs/curriculum/tiangong_textbook/manifest.json)持有，Track／Phase 与 prerequisite 由 catalog／progress 持有，现有书组、书脊、封面和课堂关系由[天工 UI owner](../../wanxiang-game/docs/modes/ui/天工肇造界面.md)持有。本目录的三课程列不能据此替换天工地图或重定书本集合。

最适合天工的是一条真实对象交接：书组从书脊连续展开到封面，选中的真实 Phase 书本聚焦，获准进入课堂时用抽出／展开把视线交给内容，返回时沿同一关系收回。参考中的单一进度、中途反向和旧对象先对齐再回位，可以服务于这条链；需要保留当前二维自由平移、实际书本素材、完整标题、点击区、依赖线与真实前置门槛。课堂消息、正文、教师判断、Save 与学习进度继续由自己的 owner 管理。

这是候选复用映射，尚未制作天工转场，也没有建立新页面或母版。无限档案阵列、格点吸附、原 auth／scan 文案及六组科幻机械结构均不成为天工产品事实。普通课程选择与进入课堂也无需重新播放完整品牌启动段。

作者随后明确，可隐藏或标“未完待续”的两个位置，是原 wallpaper 工作台的“正在播放”和“专注计时”。本次选择隐藏：`wanxiang` 模式不创建整套 `Workbench`，两项入口均不显示，也不以“未完待续”承诺开发原作功能。该范围由[启动与转场 owner](../../wanxiang-game/docs/modes/ui/启动呈现与转场.md#壁纸工作台的两个入口)持有，不扩展成天工或所有 UI 的规则；未来奖励与方向继续从各自真实产品 owner 取得。

### 本批结果边界

本节依据当前授权范围与实际源码。此次回退仅有源码及接线读回，未执行 tests、build 或浏览器检查；没有视觉、交互、声音、性能或作者接收通过结论。原版已运行的记录继续保留在上节，不能用于替代当前万象开场或天工转场的结果。
