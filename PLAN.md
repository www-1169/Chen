# CZB Portfolio V1.1 视觉升级实施计划

基于 `CZB_Portfolio_Solo_Builder_V1.1_Final_Improvement_Prompt.md` 制定。

---

## 一、现状评估

当前 Portfolio 已完成：

- 单文件 HTML（约 1600+ 行，含 CSS/JS）
- 10 个主要 Section：Hero / Focus / About / Education / Skills / Project / Awards / Interests / Contact / Footer
- Dark / Light 主题切换
- 响应式布局 + 移动端汉堡菜单
- 滚动显示动画（IntersectionObserver）
- 返回顶部 + 导航高亮
- Project Modal（基础版）
- 真实证件照、GitHub、Star Assault 游戏嵌入

**主要问题：**

- 视觉偏静态，缺少动态空间感和艺术方向
- Hero 背景只是固定网格
- 各 Section 之间缺少过渡和统一的数字实验室氛围
- Star Assault 仍以 Icon 为主视觉，缺少真实游戏截图
- Skills 为普通卡片，缺少 Terminal 感
- 未拆分文件，后续维护成本高

---

## 二、升级原则

1. **不推倒重做**：保留所有内容、信息、结构和已有交互
2. **真实资料不变**：姓名、学校、奖项、GitHub、Star Assault 事实均不修改
3. **一个统一世界**：所有视觉效果共享同一套 Design Tokens
4. **性能优先**：requestAnimationFrame、CSS Transform、节流、移动端降级
5. **Accessibility 优先**：支持 `prefers-reduced-motion`，不破坏键盘导航
6. **轻量实现**：优先 Canvas + CSS + SVG + Vanilla JS，不引入大型框架

---

## 三、推荐文件结构

升级完成后，建议从单文件拆分为：

```
portfolio/
├── index.html
├── css/
│   ├── base.css          # 变量、重置、工具类
│   ├── layout.css        # 布局、导航、容器
│   ├── components.css    # 卡片、按钮、时间轴、Bento
│   ├── motion.css        # 动画、滚动效果、Micro Interactions
│   └── theme.css         # Dark / Light 主题
├── js/
│   ├── main.js           # 初始化、导航、主题
│   ├── motion.js         # Scroll Reveal、IntersectionObserver
│   ├── experiments.js    # Hero 粒子、Interactive Field
│   ├── cursor.js         # 桌面端光标效果
│   └── theme.js          # 主题切换
├── assets/
│   ├── portrait.png
│   └── screenshots/      # Star Assault 游戏截图
└── projects/
    └── star-assault/
```

> 如果拆分风险高，也可以在单文件内按逻辑分区，但会优先按模块化结构执行。

---

## 四、实施阶段

### Phase 0：基础准备

**目标**：建立稳定的改造基础，不改动视觉效果。

- [ ] 备份当前 `portfolio/index.html`
- [ ] 创建新的 CSS / JS 文件目录结构
- [ ] 将现有样式和脚本按模块拆分
- [ ] 验证拆分后页面功能 100% 正常
- [ ] 生成 Star Assault 游戏截图（从运行中的游戏截取）

**交付物**：

- 模块化的文件结构
- 与 V1.0 视觉一致但代码已拆分的 Portfolio

---

### Phase 1：Design Tokens & Global System

**目标**：建立统一的视觉系统。

- [ ] 更新 CSS 变量，对齐推荐 Design Tokens
- [ ] 添加全局 Digital Noise Texture（极低 opacity）
- [ ] 优化 Light Theme：Off-white + Graphite + Cyan + Deep Green
- [ ] 统一 Section 编号样式（`01 / FOCUS` 等）
- [ ] 添加章节过渡装饰（Horizontal Scan Line / Data Marker）
- [ ] 每个 Section 添加微妙的背景色深度变化

**交付物**：

- 统一的 Design System
- 各 Section 背景深度差异可见但不突兀

---

### Phase 2：Hero 升级（最高优先级）

**目标**：让 Hero 具有强烈的数字实验室空间感。

- [ ] 添加 `<canvas id="hero-canvas">` 动态背景
  - 缓慢移动的 Grid
  - 漂浮粒子
  - 微弱数据线和坐标
  - 极低对比度，不干扰文字
- [ ] 桌面端：鼠标移动产生柔和光场和 Grid perspective shift
- [ ] 移动端：降低粒子数量，禁用鼠标效果
- [ ] 将 Portrait 升级为 CZB Identity Terminal
  - Corner Brackets
  - Scanning Line 动画
  - Status Indicator（ONLINE）
  - HUD Lines + Tiny Data Labels
  - 鼠标悬停时 1–3px Parallax
  - 绝不遮挡人脸
- [ ] Hero CTA 按钮添加 Micro Interaction（边框高亮、微光）

**交付物**：

- 具有动态空间感的 Hero
- CZB Identity Terminal 证件照 HUD

---

### Phase 3：全局滚动体验

**目标**：让滚动成为视觉体验的一部分。

- [ ] 建立 Scroll-driven 状态管理
- [ ] 根据当前 Section 动态调整背景粒子/网格的行为
- [ ] 添加 Section 进入视口时的过渡效果
- [ ] 保留核心 Scroll Reveal，但增强为更流畅的 stagger 动画

**交付物**：

- 滚动时背景系统会变化
- Section 进入有过渡感

---

### Phase 4：Current Focus / About / Education 升级

**目标**：将静态内容转化为动态模块。

- [ ] **Current Focus**：Dynamic Bento Grid
  - 4 个卡片（Carbon / Programming / AI / Sustainability）
  - Hover 时当前卡片扩大，其他轻微退让
  - 背景产生微弱光变化
  - 不允许布局剧烈跳动
- [ ] **About**：添加 Abstract Knowledge Graph
  - SVG / Canvas 节点和连线
  - 表示 Carbon × Technology × AI × Sustainability 的交叉关系
  - 只是视觉隐喻，不是真实数据可视化
- [ ] **Education**：Timeline 滚动激活
  - 线条逐渐绘制
  - 节点依次发光
  - 2026 激活，NOW 高亮，2030 保持 Future 状态

**交付物**：

- Bento Grid + Knowledge Graph + 动态时间轴

---

### Phase 5：Skills Terminal

**目标**：将 Skills 改造为 Tech Stack Terminal。

- [ ] 重新设计 Skills 为 Terminal 风格
- [ ] 使用真实能力标签（不伪造百分比）
- [ ] 添加 Typing Cursor / Terminal Prompt / System Status
- [ ] 分类展示：PROGRAMMING / TOOLS / AI
- [ ] 动画显示列表项

**交付物**：

- Terminal 风格的 Skills Section

---

### Phase 6：Star Assault 重点升级

**目标**：将 Star Assault 从项目卡片升级为 Featured Product / Case Study。

- [ ] 使用真实游戏截图作为项目主视觉
- [ ] 添加游戏预览区（可点击播放 Demo）
- [ ] 重新设计 Featured Project 布局
- [ ] Project Preview 添加 HUD 角标、扫描线、Hover 光扫效果
- [ ] 升级 Modal 为 Case Study 结构：
  - 01 / OVERVIEW
  - 02 / GAMEPLAY
  - 03 / SYSTEMS
  - 04 / TECHNOLOGY
  - 05 / INTERACTION
- [ ] Modal 内展示：
  - 游戏截图
  - Wave Progression 图表
  - Boss Phase 可视化
  - Upgrade Rarity 展示
- [ ] 不修改 Star Assault 游戏核心逻辑

**交付物**：

- 具有真实游戏视觉的 Featured Project
- 升级后的 Case Study Modal

---

### Phase 7：Interactive Technical Experiment

**目标**：加入一个纯视觉技术实验，展示 Creative Coding 能力。

- [ ] 在合适位置（建议在 About 后或 Interests 前）添加一个 Section
- [ ] 名称：`INTERACTIVE FIELD` 或 `EXPERIMENT / 00`
- [ ] 选择一个核心效果：
  - 推荐：鼠标响应的粒子场 + 光线 + 轻微 Grid distortion
- [ ] 限制：只做一个核心实验，不堆叠多种效果
- [ ] 移动端降低复杂度

**交付物**：

- 一个精致的技术视觉实验

---

### Phase 8：Awards / Interests 升级

**目标**：统一艺术化处理。

- [ ] **Awards**：Minimal Timeline + Glowing Nodes
  - 滚动进入时时间轴绘制
  - 节点激活，文字出现
  - 不使用 3D 奖杯或大面积金色
- [ ] **Interests**：Irregular Bento
  - 6 项兴趣不同大小
  - Photography 可加入淡图片纹理
  - 保持整体视觉统一

**交付物**：

- 动态 Awards Timeline
- 艺术化 Irregular Bento Interests

---

### Phase 9：Micro Interactions & Cursor

**目标**：提升精致感和交互反馈。

- [ ] 按钮 Hover：边框高亮、微光、1–2px 移动
- [ ] 链接 Hover：下划线扫过动画
- [ ] 卡片 Hover：背景偏移、边框高亮
- [ ] Portrait Hover：HUD Scanning 效果
- [ ] Project Hover：截图光扫效果
- [ ] 桌面端：Small Cursor Ring + Cursor-following Glow
  - 不影响点击
  - 移动端关闭

**交付物**：

- 全局 Micro Interaction 系统
- 桌面端光标效果

---

### Phase 10：Loading Screen（可选）

**目标**：增强第一印象。

- [ ] 添加 `CZB DIGITAL LAB INITIALIZING...` 加载屏
- [ ] 最大 800–1200ms
- [ ] 不阻塞用户
- [ ] 再次访问可跳过
- [ ] reduced-motion 兼容

> 如果评估后认为会影响体验，可直接省略。

**交付物**：

- 可选的加载屏

---

### Phase 11：Mobile Performance Optimization

**目标**：确保移动端流畅。

- [ ] 降低 Hero 粒子数量
- [ ] 禁用光标效果
- [ ] 禁用复杂 Parallax
- [ ] 保留核心 Scroll Animation
- [ ] 测试 375 / 390 / 768 / 1024 / 1440px
- [ ] 确保无横向滚动
- [ ] 必要时自动进入 Performance Mode

**交付物**：

- 移动端优化后的版本

---

### Phase 12：Accessibility Audit

**目标**：保证可访问性。

- [ ] 测试 `prefers-reduced-motion: reduce`
- [ ] 关闭/降低：粒子、光标、Parallax、扫描动画
- [ ] 保留内容、导航、键盘交互、Focus State
- [ ] 测试键盘导航全部路径
- [ ] 测试 Modal Focus Trap

**交付物**：

- 通过 Accessibility 检查

---

### Phase 13：Performance Audit

**目标**：确保不卡顿。

- [ ] 所有动画使用 requestAnimationFrame
- [ ] IntersectionObserver 控制动画触发
- [ ] 页面不可见时暂停非必要动画
- [ ] 检查无高频 Layout / Reflow
- [ ] 检查无内存泄漏
- [ ] 测试低端设备性能

**交付物**：

- 性能达标的 Portfolio

---

### Phase 14：Final Visual Polish

**目标**：整体打磨。

- [ ] 统一所有颜色、间距、字体
- [ ] 检查所有 Section 是否属于同一视觉世界
- [ ] 检查 Light Theme 一致性
- [ ] 检查所有 Hover / Focus 状态
- [ ] 最终截图对比 V1.0
- [ ] 生成最终 zip 压缩包

**交付物**：

- V1.1 Final Portfolio

---

## 五、实施顺序建议

由于这是大型改造，建议按以下里程碑交付：

| 里程碑 | 包含 Phase | 目标 |
|--------|-----------|------|
| M1 | Phase 0–2 | 完成文件拆分 + Hero 动态升级 |
| M2 | Phase 3–5 | 完成全局滚动 + Focus / About / Education / Skills |
| M3 | Phase 6–7 | 完成 Star Assault 升级 + Interactive Experiment |
| M4 | Phase 8–10 | 完成 Awards / Interests / Micro Interactions / Cursor |
| M5 | Phase 11–14 | 完成 Mobile / A11y / Performance / Polish |

---

## 六、风险点

1. **Star Assault 截图**：需要实际运行游戏并截取高质量画面
2. **文件拆分**：拆分过程中可能引入路径错误，需要逐步验证
3. **性能失控**：粒子 + 光标 + 滚动动画同时运行可能卡顿，需严格控制
4. **移动端适配**：动态效果在移动端容易出布局问题
5. **Light Theme**：动态效果在 Light Theme 下可能对比度不足

---

## 七、下一步决策

请确认：

1. **是否按此计划执行？**
2. **是否接受文件拆分？**（推荐，但会增加工作量）
3. **是否保留单文件结构？**（更快，但可维护性差）
4. **从哪个里程碑开始？**（建议 M1：Hero 升级）
5. **是否需要先生成 Star Assault 游戏截图？**
6. **Loading Screen 是否要？**（推荐省略，避免拖慢首屏）

确认后，我将开始第一阶段实施。
