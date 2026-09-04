---
version: alpha
name: WakeMark-design-system
description: >-
  双表面设计系统：产品 UI 是 Vercel 式黑白灰 + Geist + 细边框 + 小圆角；
  营销页以首页为范本，在同一套 token 上叠加绘图网格、大字阶、竖纹底与克制动效。
  所有样式以 CSS 变量（:root / .dark）为唯一事实来源，通过 Tailwind v4 语义化
  token class（bg-background / text-foreground / border-border 等）消费。
  组件层使用 components/ui 下的 shadcn 原语，禁止写死颜色、圆角、阴影等固定样式。
colors:
  primary: "#000000"
  on-primary: "#ffffff"
  ink: "#000000"
  canvas: "#fcfcfc"
  surface-card: "#ffffff"
  surface-popover: "#fcfcfc"
  surface-muted: "#f5f5f5"
  surface-secondary: "#ebebeb"
  surface-accent: "#ebebeb"
  muted-foreground: "#666666"
  hairline: "#e4e4e4"
  input-border: "#ebebeb"
  ring: "#000000"
  danger: "#e54b4f"
  on-danger: "#ffffff"
  chart-accent-1: "#ffae04"
  chart-accent-2: "#2d62ef"
  highlight: "#b9854c"
  on-highlight: "#ffffff"
  highlight-inverse: "#c99b64"
typography:
  display-xl:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.045em
  display-lg:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  heading-lg:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  heading-md:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  heading-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0px
  body-lg:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
  body-md:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
  body-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.01em
  kicker:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.25em
  button-md:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0px
  code-md:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
  stat-label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: 10px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.13em
rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: 36px
  button-primary-hover:
    backgroundColor: "rgba(0, 0, 0, 0.9)"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 36px
  button-primary-disabled:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 36px
  button-secondary:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: 36px
  button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: 36px
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: 36px
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: 36px
  text-input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: 36px
  text-input-focused:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 36px
  text-input-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 36px
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "24px"
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  popover:
    backgroundColor: "{colors.surface-popover}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "4px"
  skeleton:
    backgroundColor: "{colors.surface-muted}"
    textColor: "transparent"
    rounded: "{rounded.md}"
  separator:
    backgroundColor: "{colors.hairline}"
    size: 1px
---

# WakeMark Design System

> **核心规则：本文件是全项目 UI 样式的唯一契约。所有新建界面必须消费本文档定义的
> 语义化 token，禁止写死任何固定的颜色、圆角、阴影、字号。**
>
> 营销页以首页（`components/home/*` + `.home-grid-frame`）为唯一视觉范本。
> 新落地页、对比页、定价页先对齐首页节奏，再落到 token。

## Two surfaces

WakeMark 共用一套 CSS 变量，但有两套构图纪律。不要把仪表盘密度套到营销页，
也不要把首页的绘图网格套进 Dashboard。

| 表面 | 范围 | 气质 | 层次 |
|---|---|---|---|
| **产品 UI** | `dashboard`、设置、表单、对话框 | Vercel 式工具界面：紧凑、控件优先、边框分层 | `components/ui/*` |
| **营销页** | 首页、定价、对比页、roadmap、登录前后的落地 | 绘图纸 + 产品窗口：大字、竖纹、发丝线分区 | `components/home/*`、`.home-grid-frame` |

共享原则不变：中性黑白灰、Geist、细边框、明暗双主题、token 消费。

## Overview

- **中性黑白灰**：主操作是纯黑（暗色下反转为纯白），没有品牌彩色主色。彩色只出现在
  图表、警示、首页 Showcase 的浅蓝竖纹底、以及 pill 边框上那一条 teal→indigo 光带。
- **Geist 字体**：正文 `Geist`，代码与统计标签 `Geist Mono`（`--font-sans` /
  `--font-mono`）。
- **细边框代替重阴影**：产品 UI 靠 1px `{colors.hairline}` 与 canvas → card → muted
  色阶分层。营销页把同一条发丝线拉成整页绘图网格（左右轨 + 区块横线 + 交点 `+`）。
- **小圆角**：基准 `--radius: 0.5rem`。控件 `6px`（md），卡片 `12px`（xl）。
  营销网格与价格阶梯默认直角（`rounded-none`），只有 CTA / 浏览器窗口可以更大。
- **明暗双主题**：颜色定义在 `:root` 与 `.dark`。唯一允许的全页反色块是首页底部
  CTA（`.cta-grid`），它在浅色站点上也是近黑底，当作一次有意识的 Color Block。

事实来源链（优先级从高到低）：

1. `styles/globals.css` 中的 `:root` / `.dark` CSS 变量（本文档即其映射）
2. 首页营销原语：`.home-grid-frame`、`.showcase-stripes`、`.cta-grid`、
   `.eyebrow-beam`（同文件后半段）
3. `components/ui/*` shadcn 原语（`cva` variants）
4. 业务组件对 token class 的使用

## Colors

颜色一律使用语义化 Tailwind class，禁止任意 hex / rgb / hsl 字面量：

| 语义 | Tailwind class | Light | Dark | 用途 |
|---|---|---|---|---|
| 主色 | `bg-primary` / `text-primary` | `{colors.primary}` | `#ffffff` | 主按钮、强调文字 |
| 主色前景 | `text-primary-foreground` | `{colors.on-primary}` | `#000000` | 主按钮文字 |
| 页面底色 | `bg-background` | `{colors.canvas}` | `#000000` | body、页面区块 |
| 正文 | `text-foreground` | `{colors.ink}` | `#ffffff` | 标题、正文 |
| 卡片 | `bg-card` | `{colors.surface-card}` | `#090909` | Card、浮层容器 |
| 弹层 | `bg-popover` | `{colors.surface-popover}` | `#121212` | Popover/Dropdown/Tooltip |
| 弱化底 | `bg-muted` | `{colors.surface-muted}` | `#1d1d1d` | 骨架、次要区块底、浏览器窗口铬 |
| 次要底 | `bg-secondary` | `{colors.surface-secondary}` | `#222222` | secondary 按钮、hover 底 |
| 交互底 | `bg-accent` | `{colors.surface-accent}` | `#333333` | ghost/menu hover 底 |
| 弱化文字 | `text-muted-foreground` | `{colors.muted-foreground}` | `#a4a4a4` | 说明文字、占位符 |
| 边框 | `border-border` | `{colors.hairline}` | `#242424` | 全局默认边框 |
| 输入框边 | `border-input` | `{colors.input-border}` | `#333333` | 表单控件边框 |
| 聚焦环 | `ring-ring` | `{colors.ring}` | `#a4a4a4` | focus-visible |
| 危险 | `bg-destructive` / `text-destructive` | `{colors.danger}` | `#ff5b5b` | 删除、错误 |
| 图表 1/2 | `fill-chart-1` / `fill-chart-2` | `{colors.chart-accent-1}` / `{colors.chart-accent-2}` | 橙不变 / `#2671f4` | 仅图表 |
| 营销强调 | `bg-highlight` / `text-highlight` | `{colors.highlight}` | `#c99b64` | 价格叙事等暖铜强调；反色表面上用 `highlight-inverse` |

营销页额外允许、且必须复用现成 class，不要再发明一套：

| 装饰 | 出处 | 用途 |
|---|---|---|
| Showcase 竖纹底 | `.showcase-stripes` | Hero/产品窗口舞台。浅蓝场 + 白色 8px 竖纹，顶部淡出 |
| 文案揭示点阵 | `.text-reveal-dots` | TextReveal 背景。16px 点距的绘图纸 |
| 绘图网格框 | `.home-grid-frame` | Showcase 以下所有营销 section 的左右轨 |
| 底部 CTA 场 | `.cta-grid` | 近黑底 + 两侧竖纹 + 流星。浅色站点上也保持暗场 |
| 边框光带 | `.eyebrow-beam` / `.pricing-current-beam` | teal→indigo 圆锥渐变沿 1px 边框旋转 |

规则：

- 全局已设 `* { border-color: var(--color-border) }`，裸写 `border` 即为
  `{colors.hairline}`，不要另指定边框颜色，除非语义需要（危险态用 `destructive`）。
- 需要半透明层次时用 token + 不透明度（如 `bg-primary/90`、`bg-muted/65`、
  `border-border/70`），不要引入新颜色。
- 暗色差异已由变量处理；仅在行为差异处使用 `dark:` 前缀。
- Showcase 浅蓝场与 CTA 近黑场是首页已注册的装饰，其它页面复用 class，
  不要复制一份 `bg-[#…]`。
- FAQ、Changelog、定价卡里现存的 `text-gray-600`、`bg-[#eaf0ff]`、
  `emerald-50` 是历史债，新代码不要跟。弱化文字用 `text-muted-foreground`，
  小标签用 `bg-muted` + `text-foreground` 或 `highlight`。

## Typography

字体：`--font-sans: Geist`、`--font-mono: Geist Mono`、`--font-serif: Georgia`。
正文默认走 `--font-sans`，不需要重复声明字体族。Georgia 不用于界面，只作
`font-serif` 回退。

### 产品 UI 字阶

| 层级 | 字号/行高 | Tailwind 写法 | 用途 |
|---|---|---|---|
| `{typography.heading-lg}` | 32 / 1.2 / -0.02em | `text-3xl font-bold tracking-tight` | 页面大标题 |
| `{typography.heading-md}` | 24 / 1.3 / -0.01em | `text-2xl font-semibold` | 卡片/页面标题 |
| `{typography.heading-sm}` | 18 / 1.4 | `text-lg font-semibold` | 小标题 |
| `{typography.body-lg}` | 16 / 1.6 | `text-base` | 引导段落 |
| `{typography.body-md}` | 14 / 1.6 | `text-sm` | 正文、控件文字（产品默认） |
| `{typography.body-sm}` | 13 / 1.5 | `text-[13px]` | 辅助信息 |
| `{typography.caption}` | 12 / 1.4 | `text-xs font-medium` | Badge、说明 |
| `{typography.button-md}` | 14 / 500 | `text-sm font-medium` | 按钮、菜单项 |
| `{typography.code-md}` | 13 / 1.6 | `font-mono text-[13px]` | 代码、Kbd、数据 |

### 营销页字阶（以首页为准）

| 层级 | 写法 | 用途 |
|---|---|---|
| `{typography.display-xl}` | `text-4xl sm:text-5xl md:text-6xl font-medium leading-[1.08] tracking-[-0.045em]` | 底部 CTA、全幅宣言 |
| Hero 标题 | `text-lg md:text-6xl font-semibold` + `title-gradient` | 首屏一句价值主张，桌面最多两行 |
| 区块标题 | `text-2xl md:text-4xl font-medium leading-[1.1] tracking-tight` | Features / Changelog。副句用同号 `text-muted-foreground` 接在后面 |
| FAQ 标题 | `text-lg md:text-5xl font-semibold` + `title-gradient` | 居中区块标题 |
| 引导段 | `text-base md:text-lg leading-relaxed text-muted-foreground` | Hero / CTA 副文，桌面 `max-w-xl`～`max-w-2xl` |
| `{typography.kicker}` | `text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground/70` | 平台条、FAQ eyebrow。全页最多约每 3 个 section 用一次 |
| `{typography.stat-label}` | `font-mono text-[10px] font-medium uppercase tracking-[0.13em]` | Problem 数字下的单位标签 |
| 统计数字 | `text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.065em]` | Problem 大数字 |

规则：

- 标题一律负字距。产品用 `tracking-tight`；营销大标题可以到 `-0.045em`～`-0.065em`。
- Hero / 居中区块标题使用工具类 `title-gradient`（`styles/custom.utilities.css`）：
  浅色是 `text-foreground/90`，暗色是上白下灰的纵向裁切渐变。
  **在 `.home-grid-frame` 内 `title-gradient` 被关掉**，网格里的标题用实色
  `text-foreground`，需要层次时把后半句设为 `text-muted-foreground`（见 Changelog）。
- 产品默认正文是 `text-sm`（14px）。营销副文可以用 `text-base` / `md:text-lg`。
- 不要用衬线做标题强调，不要把某个词换成 Georgia。强调用同族 `font-medium` 或颜色层次。

## Layout

- **间距刻度**：基于 `--spacing: 0.25rem`。使用
  `{spacing.xxs}`(4) / `{spacing.xs}`(8) / `{spacing.sm}`(12) / `{spacing.md}`(16) /
  `{spacing.lg}`(24) / `{spacing.xl}`(32) / `{spacing.xxl}`(48) / `{spacing.section}`(96)。
  表单内部 4/8，卡片内边距 24，产品区块 48～96。
- **产品容器**：`container`（左右 `2rem`，`1400px` 封顶居中）。
- **营销容器**：Showcase 以下包在 `.home-grid-frame` 里。框宽 `1440px`，左右各留
  `25px` 让竖轨露出来；`≥1490px` 时框居中。section 内容常用
  `px-6 sm:px-10 md:px-14` 或 `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`。
- 栅格使用 Tailwind 原生 `grid`/`flex`。营销分区优先 `divide-x` / `divide-y` /
  `border-b`，不要先做成三张等大圆角卡片。

## Marketing page language

首页是营销表面的规范实现。新营销页按这个故事结构搭，而不是再发明一屏居中三卡片。

### 页面骨架

```
BG1（固定、z-[-1]，顶部一圈很淡的径向光）
Showcase（sticky 舞台：Hero 文案叠在产品窗口上，下滚后文案淡出、侧卡入场）
main.home-grid-frame
  Problem        发丝线三栏数字
  Features       全视口横带：上标题 / 下产品演示
  TextReveal     点阵底 + 逐词显现
  PricingLock    直角阶梯 + 当前档边框光带
  Changelog      发丝线时间格 + 底部刻度条
  FAQ            居中标题 + 虚线 Accordion
  CTA            暗场 Color Block，撑满网格（-mx-[25px]）
```

对比页、定价页可以减 section，但不要换气质：仍用 `.home-grid-frame`，
仍用发丝线分区，仍用 `FeatureBadge` + `title-gradient` 做页眉。

### Hero（居中宣言，叠在 Showcase 上）

首页 Hero **居中**是刻意的：它是宣言，不是工具页。结构锁死为四件套：

1. `FeatureBadge`（`.eyebrow-beam` 胶囊，左边黑底小 label）
2. 一句标题（桌面 `md:text-6xl`，最多两行）
3. 一段副文（`max-w-xl`，`text-muted-foreground`）
4. 一颗主 CTA（`Button size="lg"`，`h-11 md:h-12`，桌面可拉满 `max-w-sm`）

平台 logo 条放在 CTA **下面**，用 `{typography.kicker}` 作说明。未上线的平台
`text-muted-foreground/50`，hover 才亮到 `text-foreground`；当前平台用实色
`text-foreground`。不要把 logo 墙塞进标题和 CTA 之间。

顶内边距：`pt-16 lg:pt-24`，超宽屏才 `2xl:pt-40`。不要再加大，避免标题掉到视口中腰。

### Showcase（产品即视觉）

- 舞台高度 `h-[140vh]`，内层 `sticky top-0 h-screen`。滚动只作触发，不当 scrubber。
- 未卷入：Hero 实色，中心 `BrowserFrame` 大窗口。
- 卷入：Hero `opacity + blur(14px)` 退出；中心窗口上移并缩小；左右 demo 卡从下方淡入。
- 缓动统一 `[0.22, 1, 0.36, 1]`（约 0.5～0.8s）。`prefers-reduced-motion` 下关掉
  边框光带和流星；新动效必须同样降级。
- 产品预览用 **真组件**（`ChatAiDemo` 等）塞进 `BrowserFrame`，或用实拍截图 +
  `.feature-backdrop-fade`。禁止用 div 搭假仪表盘。
- `BrowserFrame`：`bg-muted` 铬 + 交通灯 + 可选地址 pill；内容是内嵌圆角卡片。
  窗口阴影是营销页唯一允许的大投影
  （`shadow-[0_24px_70px_-24px_rgb(0_0_0/0.28)]`）。产品 UI 不要学这一档。

### 绘图网格（`.home-grid-frame`）

- 左右 `1px` 竖轨，每个 `section` 底边一条横线，最后一块 CTA 去掉底边。
- `md+` 在横竖交点放 11px Geist Mono 的 `+`。
- 暗色轨色是 `zinc-700` 量级（`rgb(63 63 70 / 0.9)`），已写在 class 里。
- 新 section 必须是 **frame 的直接子元素** `<section>`，否则交点和底边不会接上。
- 需要通栏暗场时，像 CTA 那样 `-mx-[25px] w-[calc(100%+50px)]` 吃掉内缩，让暗块
  顶到竖轨外侧。

### 区块布局家族（同一页不要重复）

每种家族在一页里最多用一次：

| 家族 | 首页出处 | 做法 |
|---|---|---|
| 发丝线多栏 | Problem | `grid` + `divide-x/y`，无卡片、无圆角。数字靠上，说明靠下 |
| 全视口横带 | Features | `min-h-[100svh]`，上半标题区，下半 `bg-muted/65` 演示区 |
| 点阵文案 | TextReveal | `.text-reveal-dots`，一句话，不要再塞 CTA |
| 直角阶梯 | PricingLock | 选中档用 `.pricing-current-beam`（直角光带），未选中降低透明度 |
| 刻度时间格 | Changelog | `changelog-ticks` 底部 10px 竖刻度，hover 才亮右侧强调 |
| 居中问答 | FAQ | 短 eyebrow + 大标题 + `border` Accordion，item 用 `border-dashed` |
| 暗场收口 | CTA | `.cta-grid`，白字 + `text-zinc-400` 量级副文（用 token：`text-white` /
  `text-zinc-400` 仅允许出现在这个暗场内） |

禁止把 Features 做成三列等大图标卡。禁止连续三节都是「左图右文 / 右图左文」。

### 营销 CTA

- 主按钮走 `Button` 原语（黑底）。Hero 用 `size="lg"`。
- 网格里的次按钮：`rounded-xl border border-border bg-background`，hover
  `border-foreground/30 bg-muted`，`:active` 用 `translate-y-px`。
- 暗场 CTA（仅 `.cta-grid`）：深灰描边按钮，`h-12 rounded-xl`，文案不超过三个词，
  桌面不换行。
- 一页一个主转化意图。Hero「登录 / 开始」和底部「去定价」可以并存，因为意图不同。
  不要再放第三个「Get started」。

## Elevation & Depth

产品 UI：边框优先，阴影克制。

| 层级 | 写法 | 用途 |
|---|---|---|
| 0 | `border` | 默认分隔，绝大多数卡片/列表/输入框只需要边框 |
| 1 | `shadow-xs` | 按钮、输入框的微阴影 |
| 2 | `shadow-sm` | Card 默认 |
| 3 | `shadow-md`～`shadow-lg` | Dropdown、Dialog |
| 4 | `shadow-xl` 及以上 | 仅模态等特殊场景 |

营销页例外（不要扩散到产品 UI）：

- 产品窗口：`BrowserFrame` 的大投影。
- 绘图网格、点阵、竖纹：用线与底纹分层，不要给 section 再加 `shadow-sm`。
- Changelog / Problem / Pricing 格子：零阴影，只靠 `border` 与 hover `bg-muted/30`。

禁止在产品 UI 里自定义 `shadow-[...]`。营销窗口阴影已经收口到 `BrowserFrame`。

## Shapes

圆角刻度由 `--radius: 0.5rem` 推导：

| Token | 值 | Tailwind | 用途 |
|---|---|---|---|
| `{rounded.none}` | 0px | `rounded-none` | 营销网格、价格阶梯、FAQ 外框 |
| `{rounded.xs}` | 2px | — | Kbd |
| `{rounded.sm}` | 4px | `rounded-sm` | 小徽标、行内代码 |
| `{rounded.md}` | 6px | `rounded-md` | 按钮、输入框、下拉项（产品默认） |
| `{rounded.lg}` | 8px | `rounded-lg` | Popover、Dialog、Changelog eyebrow |
| `{rounded.xl}` | 12px | `rounded-xl` | Card、营销次按钮、紧凑 BrowserFrame |
| `{rounded.full}` | 9999px | `rounded-full` | Badge、头像、`FeatureBadge` |

规则：禁止 `rounded-[Npx]`。同一层组件圆角必须一致。营销网格是直角系统，
不要把 `rounded-xl` 卡片丢进 `.home-grid-frame` 的分栏里。

## Motion

营销动效只服务四件事：层次、叙事、反馈、状态切换。能用 CSS 就不要上 JS。

| 模式 | 实现 | 何时用 |
|---|---|---|
| 边框光带 | `.eyebrow-beam` / `.pricing-current-beam`，4s 线性无限 | Hero 胶囊、当前价格档。一页最多两处 |
| Showcase 编排 | `motion/react`，sticky + 阈值触发 | 仅首页舞台 |
| 流星 | `.cta-grid-meteors` | 仅底部 CTA |
| 刻度 hover | `.changelog-ticks::after` opacity | Changelog 卡片 |
| 文案揭示 | `TextReveal` | 一页一次 |
| 按钮按压 | `active:translate-y-px` 或 `scale-[0.98]` | 所有可点控件 |

硬规则：

- 只动画 `transform` / `opacity` / `filter`。
- `prefers-reduced-motion: reduce` 时关掉无限循环（光带、流星）。
- 新代码不要用 `window.addEventListener("scroll")` 驱动编排；首页 Showcase 这处
  是历史实现，重构时应换成 Motion `useScroll` 或 `ScrollTrigger`。
- 一页最多一条横向 marquee。首页目前没有 marquee，保持这样。

## Components

所有组件优先直接使用 `components/ui/*` 原语，并通过 `cn()` 叠加 token class 微调。
禁止绕过原语手写等价控件。

### Button —— `{components.button-primary}` 等

入口：`components/ui/button.tsx`。变体（`default` / `secondary` / `outline` /
`ghost` / `destructive` / `link`）与尺寸（`h-8` / `h-9` / `h-10`）均已内置：

- 主按钮 `{components.button-primary}`：`bg-primary`，hover 为
  `{components.button-primary-hover}`（`bg-primary/90`）。
- 禁用态 `{components.button-primary-disabled}`：`disabled:opacity-50 + pointer-events-none`，
  由原语统一处理，不要自己写禁用样式。
- 焦点态：`focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`。
- 图标尺寸固定 `size-4`；按钮内文字 `{typography.button-md}`。
- **不要用 `<a>`/`<div>` + 手写样式造按钮**；需要链接样式用 `asChild` 或 `variant="link"`。
  营销页里只有 `.cta-grid` 内的暗场按钮可以是独立 `<Link>` 样式，不要复制到别处。

### Input / 表单 —— `{components.text-input}`

入口：`components/ui/input.tsx`、`textarea.tsx`、`field.tsx`、`label.tsx`：

- 高度 `h-9`、边框 `border-input`、圆角 `{rounded.md}`、占位符
  `text-muted-foreground`。
- `{components.text-input-focused}`：`focus-visible:border-ring + ring-ring/50 + ring-[3px]`。
- `{components.text-input-disabled}`：`disabled:opacity-50 cursor-not-allowed`。
- 错误态：`aria-invalid:ring-destructive/20 aria-invalid:border-destructive`，
  通过 `aria-invalid` 触发，不要手写红色边框。
- Label 在输入框上方，错误文案在下方。不要用 placeholder 当 label。

### Card —— `{components.card}`

入口：`components/ui/card.tsx`。`bg-card` + `border` + `rounded-xl` + `py-6 shadow-sm`，
内容区 `px-6`。标题 `font-semibold`，描述 `text-muted-foreground text-sm`。
营销网格里的分区 **不是 Card**，不要套这层。

### Badge —— `{components.badge}`

入口：`components/ui/badge.tsx`。`rounded-full` + `px-2 py-0.5 text-xs`。
状态色：强调用 `default`（黑底白字），次要用 `secondary`，危险用 `destructive`，
中性描边用 `outline`。营销页的 `FeatureBadge` 是独立胶囊，不要用 `Badge` 冒充。

### FeatureBadge

入口：`components/shared/FeatureBadge.tsx`。营销页眉唯一允许的 eyebrow 组件。
左侧 `bg-primary` 小 pill + 右侧说明 + 可选箭头。全页不要再手写第二套胶囊。

### 浮层（Popover / Dropdown / Dialog / Sheet / Tooltip）

- Popover/菜单：`bg-popover` + `border` + `rounded-lg` + `shadow-md`，
  内边距 `p-1`，菜单项 hover `bg-accent`。
- Dialog：`bg-card` + `rounded-lg` + `shadow-lg`，遮罩 `bg-black/50`。
- 进入/退出动画使用已配置的 `tailwindcss-animate`，不要自定义 keyframes。

### 其它

- 骨架屏 `{components.skeleton}`：`bg-muted animate-pulse`。
- 分隔线 `{components.separator}`：1px `{colors.hairline}`。
- 表格：`border-b` 分隔行，表头 `text-muted-foreground text-sm`，
  行 hover `bg-muted/50`。不要给每一行同时加 `border-t` 和 `border-b`。
- 侧边栏使用 `--sidebar-*` 一组变量，不要混用普通 `background`/`border`。
- 背景：营销页用 `BG1`，不要再叠加第二层全屏渐变。

## Do's and Don'ts

**Do**

- 新建任何 UI 前，先查 `components/ui/` 是否已有原语；营销页再查
  `FeatureBadge`、`BrowserFrame`、`.home-grid-frame`。
- 颜色只写语义 class：`bg-background`、`text-foreground`、`border-border`、
  `bg-primary/90`、`text-muted-foreground`。
- 圆角只用 `rounded-none/sm/md/lg/xl/full`；产品阴影只用 `shadow-xs~2xl` 刻度。
- 用 `cn()` 合并样式，保留 `data-slot`。
- 暗色模式走现有变量。营销装饰 class 已带 `.dark` 分支。
- 交互状态必须完整：hover / focus-visible / disabled / aria-invalid / active。
- 新营销页先抄首页的 section 家族，再改文案。

**Don't**

- 禁止任意值字面量：`bg-[#1a1a1a]`、`rounded-[13px]`、
  `shadow-[0_4px_20px_rgba(...)]`、`border-[0.5px]`。`text-[13px]` /
  `text-[10px]` 只允许出现在上表已登记的层级。
- 禁止绕过 token 直接写 CSS 变量或 `style={{}}` 内联颜色（交通灯红黄绿除外，
  已收口在 `BrowserFrame`）。
- 禁止手写按钮/输入框/卡片/弹层等价物。
- 禁止引入第三方样式库或新的颜色体系。
- 禁止为暗色模式单独定义一套颜色值。
- 禁止 AI 紫光、三列等大功能卡、div 假截图、装饰性滚动提示（`Scroll ↓`）、
  章节编号 eyebrow（`01 / Features`）、以及把 `text-gray-*` 当正文色。
- 禁止在营销页中段突然切到浅米色或彩色大底。唯一反色块是 `.cta-grid`。

## Responsive Behavior

- 移动优先，断点沿用 Tailwind 默认（sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536）。
- 控件文字在移动端可 `text-base`、桌面 `md:text-sm`（Input 原语已如此），
  防止 iOS 缩放。
- `container` 在 1400px 封顶；`.home-grid-frame` 在 1440px 封顶。
- 营销区块移动端内边距 `px-4` / `px-6`。非对称网格在 `<768px` 必须收成单列。
- Hero / Features 高度用 `min-h-[100svh]` / `min-h-[100dvh]`，不要用 `h-screen`
  当首屏（Showcase 内层 sticky 舞台是例外，它需要精确贴视口）。
- 触控目标不小于 32px（`h-8` 是极限，默认 `h-9`；营销主 CTA 用 `h-11` / `h-12`）。
- Showcase 侧卡只在 `xl+` 出现；小屏只保留中心窗口，不要硬挤三栏。

## Known Gaps

- `needs-design-decision`：缺少语义化 `success` / `warning` / `info` 色。
  当前只有 `destructive`；图表色不应挪用作状态色。定价折扣绿
  （`emerald-50`）和 Changelog 蓝 pill（`#eaf0ff` / `#3467d6`）待收敛到正式 token。
- `needs-design-decision`：`globals.css` / `custom.utilities.css` 中残留
  `--main` / `--color-1~5`（彩虹动画色），仅允许在 `rainbow-button` 等装饰组件使用。
- Showcase 仍用 `window` scroll 监听；后续应迁到 Motion `useScroll`。
- FAQ 描述仍可能写 `text-gray-600`；新代码用 `text-muted-foreground`。
- `.cta-grid` 内按钮和副文仍写死 `zinc-*`。保留在暗场内可以，不要扩散。
- Features 的 `badgeColor` hex 是旧字段，新功能不要再传色值。
- Typography 产品字阶仍以 `components/ui` 用法为准逐步收敛；营销字阶以首页
  现网为准，本文已对齐。
