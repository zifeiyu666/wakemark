---
version: alpha
name: WakeMark-Vercel-style-design-system
description: >-
  Vercel 风格设计系统：黑白灰中性色 + Geist 字体 + 极简细边框 + 小圆角 + 低强度阴影。
  所有样式均以 CSS 变量（:root / .dark）为唯一事实来源，通过 Tailwind v4 语义化
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
  muted-foreground: "#525252"
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

# WakeMark Design System（Vercel 风格）

> **核心规则：本文件是全项目 UI 样式的唯一契约。所有新建界面必须消费本文档定义的
> 语义化 token，禁止写死任何固定的颜色、圆角、阴影、字号。**

## Overview

WakeMark 采用 Vercel 式极简美学：

- **中性黑白灰**：主操作是纯黑（暗色下反转为纯白），没有品牌彩色主色；彩色仅出现在
  图表、警示与少量强调处。
- **Geist 字体**：正文 `Geist`，代码 `Geist Mono`（见 `styles/globals.css` 的
  `--font-sans` / `--font-mono`）。
- **细边框代替重阴影**：界面层次主要靠 1px 边框（`{colors.hairline}`）与微妙的
  背景色阶（canvas → card → muted）表达，阴影保持低强度。
- **小圆角**：基准 `--radius: 0.5rem`，控件统一 `6px`（md），卡片 `12px`（xl）。
- **明暗双主题**：所有颜色以 CSS 变量定义在 `:root` 与 `.dark`，通过
  `@custom-variant dark (&:is(.dark *))` 切换，禁止为暗色单独写死颜色。

事实来源链（优先级从高到低）：

1. `styles/globals.css` 中的 `:root` / `.dark` CSS 变量（本文档即其映射）
2. `components/ui/*` shadcn 原语（`cva` variants）
3. 业务组件对 token class 的使用

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
| 弱化底 | `bg-muted` | `{colors.surface-muted}` | `#1d1d1d` | 骨架、次要区块底 |
| 次要底 | `bg-secondary` | `{colors.surface-secondary}` | `#222222` | secondary 按钮、hover 底 |
| 交互底 | `bg-accent` | `{colors.surface-accent}` | `#333333` | ghost/menu hover 底 |
| 弱化文字 | `text-muted-foreground` | `{colors.muted-foreground}` | `#a4a4a4` | 说明文字、占位符 |
| 边框 | `border-border` | `{colors.hairline}` | `#242424` | 全局默认边框 |
| 输入框边 | `border-input` | `{colors.input-border}` | `#333333` | 表单控件边框 |
| 聚焦环 | `ring-ring` | `{colors.ring}` | `#a4a4a4` | focus-visible |
| 危险 | `bg-destructive` / `text-destructive` | `{colors.danger}` | `#ff5b5b` | 删除、错误 |
| 图表 1/2 | `fill-chart-1` / `fill-chart-2` | `{colors.chart-accent-1}` / `{colors.chart-accent-2}` | — | 仅图表 |
| 营销强调 | `bg-highlight` / `text-highlight` | `{colors.highlight}` | `#c99b64` | 价格叙事等营销区块的暖铜强调色，文字用 `text-highlight-foreground`；在反色表面（`bg-foreground` 卡片/图表）上改用 `highlight-inverse` 保证对比度 |

规则：

- 全局已设 `* { border-color: var(--color-border) }`，裸写 `border` 即为
  `{colors.hairline}`，不要另指定边框颜色，除非语义需要（危险态用 `destructive`）。
- 需要半透明层次时用 token + 不透明度（如 `bg-primary/90`、`bg-accent/50`），
  不要引入新颜色。
- 暗色差异已由变量处理；仅在行为差异处使用 `dark:` 前缀（组件库已内置）。

## Typography

字体：`--font-sans: Geist`、`--font-mono: Geist Mono`、`--font-serif: Georgia`。
正文默认走 `--font-sans`，不需要重复声明字体族。

| 层级 | 字号/行高 | Tailwind 写法 | 用途 |
|---|---|---|---|
| `{typography.display-lg}` | 40 / 1.1 / -0.02em | `text-4xl font-bold tracking-tight` | Hero 标题 |
| `{typography.heading-lg}` | 32 / 1.2 / -0.02em | `text-3xl font-bold tracking-tight` | 区块大标题 |
| `{typography.heading-md}` | 24 / 1.3 / -0.01em | `text-2xl font-semibold` | 卡片/页面标题 |
| `{typography.heading-sm}` | 18 / 1.4 | `text-lg font-semibold` | 小标题 |
| `{typography.body-lg}` | 16 / 1.6 | `text-base` | 引导段落 |
| `{typography.body-md}` | 14 / 1.6 | `text-sm` | 正文、控件文字（默认） |
| `{typography.body-sm}` | 13 / 1.5 | `text-[13px]` 或 `text-xs` | 辅助信息 |
| `{typography.caption}` | 12 / 1.4 | `text-xs font-medium` | Badge、说明 |
| `{typography.button-md}` | 14 / 500 | `text-sm font-medium` | 按钮、菜单项 |
| `{typography.code-md}` | 13 / 1.6 | `font-mono text-[13px]` | 代码、Kbd、数据 |

规则：

- 标题一律负字距（`tracking-tight`），正文保持 `0px`。
- Hero 渐变标题使用现有工具类 `title-gradient`（见 `styles/custom.utilities.css`），
  不要手写渐变文字。
- 默认正文尺寸为 `text-sm`（14px），这是全站基线，不要默认用 16px。

## Layout

- **间距刻度**：基于 `--spacing: 0.25rem`（Tailwind 默认 4px 步进）。使用刻度值：
  `{spacing.xxs}`(4) / `{spacing.xs}`(8) / `{spacing.sm}`(12) / `{spacing.md}`(16) /
  `{spacing.lg}`(24) / `{spacing.xl}`(32) / `{spacing.xxl}`(48) / `{spacing.section}`(96)。
  表单内部紧凑间距用 4/8，卡片内边距用 24，区块之间用 48~96。
- **容器**：使用内置 `container` 工具类——左右 `2rem` 内边距，`1400px` 封顶居中。
- **页面节奏**：营销页区块间距 `{spacing.section}`；应用内面板间距
  `{spacing.lg}`~`{spacing.xl}`。
- 栅格使用 Tailwind 原生 `grid`/`flex`，不引入其它布局库。

## Elevation & Depth

Vercel 风格的层次以边框优先，阴影克制：

| 层级 | 写法 | 用途 |
|---|---|---|
| 0 | `border` | 默认分隔，绝大多数卡片/列表/输入框只需要边框 |
| 1 | `shadow-xs` | 按钮、输入框的微阴影（`0 1px 2px / 0.09`） |
| 2 | `shadow-sm` | Card 默认（`{components.card}`） |
| 3 | `shadow-md`~`shadow-lg` | Dropdown、Dialog 等浮层 |
| 4 | `shadow-xl` 及以上 | 仅模态遮罩等特殊场景 |

规则：优先加边框而不是加阴影；禁止自定义 `shadow-[...]` 任意值。

## Shapes

圆角刻度由 `--radius: 0.5rem` 推导：

| Token | 值 | Tailwind | 用途 |
|---|---|---|---|
| `{rounded.none}` | 0px | `rounded-none` | — |
| `{rounded.xs}` | 2px | — | Kbd 等极小元素 |
| `{rounded.sm}` | 4px | `rounded-sm` | 小徽标、代码块行内元素 |
| `{rounded.md}` | 6px | `rounded-md` | 按钮、输入框、下拉项（默认） |
| `{rounded.lg}` | 8px | `rounded-lg` | Popover、Dialog |
| `{rounded.xl}` | 12px | `rounded-xl` | Card、大容器 |
| `{rounded.full}` | 9999px | `rounded-full` | Badge、头像、胶囊按钮 |

规则：禁止 `rounded-[Npx]` 任意值；同一层级组件圆角必须一致。

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

### Input / 表单 —— `{components.text-input}`

入口：`components/ui/input.tsx`、`textarea.tsx`、`field.tsx`、`label.tsx`：

- 高度 `h-9`、边框 `border-input`、圆角 `{rounded.md}`、占位符
  `text-muted-foreground`。
- `{components.text-input-focused}`：`focus-visible:border-ring + ring-ring/50 + ring-[3px]`。
- `{components.text-input-disabled}`：`disabled:opacity-50 cursor-not-allowed`。
- 错误态：`aria-invalid:ring-destructive/20 aria-invalid:border-destructive`，
  通过 `aria-invalid` 触发，不要手写红色边框。

### Card —— `{components.card}`

入口：`components/ui/card.tsx`。`bg-card` + `border` + `rounded-xl` + `py-6 shadow-sm`，
内容区 `px-6`。标题 `font-semibold`，描述 `text-muted-foreground text-sm`。
不要自行重写卡片容器样式。

### Badge —— `{components.badge}`

入口：`components/ui/badge.tsx`。`rounded-full` + `px-2 py-0.5 text-xs`。
状态色语义：默认/强调用 `default`（黑底白字），次要用 `secondary`，
危险用 `destructive`，中性描边用 `outline`。

### 浮层（Popover / Dropdown / Dialog / Sheet / Tooltip）

- Popover/菜单：`bg-popover` + `border` + `rounded-lg` + `shadow-md`，
  内边距 `p-1`，菜单项 hover `bg-accent`。
- Dialog：`bg-card`（暗色 `#090909`）+ `rounded-lg` + `shadow-lg`，遮罩
  `bg-black/50`。
- 进入/退出动画使用已配置的 `tailwindcss-animate`，不要自定义 keyframes。

### 其它

- 骨架屏 `{components.skeleton}`：`bg-muted animate-pulse`。
- 分隔线 `{components.separator}`：1px `{colors.hairline}`（`Separator` 组件）。
- 表格：`border-b` 分隔行，表头 `text-muted-foreground text-sm`，
  行 hover `bg-muted/50`。
- 侧边栏使用 `--sidebar-*` 一组变量（`bg-sidebar`、`border-sidebar-border` 等），
  不要混用普通 `background`/`border`。

## Do's and Don'ts

**Do**

- ✅ 新建任何 UI 前，先查 `components/ui/` 是否已有原语；有则必须复用。
- ✅ 颜色只写语义 class：`bg-background`、`text-foreground`、`border-border`、
  `bg-primary/90`、`text-muted-foreground`。
- ✅ 圆角只用 `rounded-sm/md/lg/xl/full`；阴影只用 `shadow-xs~2xl` 刻度。
- ✅ 用 `cn()`（`@/lib/utils`）合并样式，保留 `data-slot`。
- ✅ 暗色模式通过现有 `--dark` 变量自动生效，必要时用组件库内置的 `dark:` 变体。
- ✅ 交互状态必须完整：hover / focus-visible / disabled / aria-invalid。

**Don't**

- ❌ 禁止任意值字面量：`bg-[#1a1a1a]`、`text-[13px]`（正文刻度例外见上表）、
  `rounded-[13px]`、`shadow-[0_4px_20px_rgba(...)]`、`border-[0.5px]`。
- ❌ 禁止绕过 token 直接写 CSS 变量或 `style={{}}` 内联颜色。
- ❌ 禁止手写按钮/输入框/卡片/弹层等价物，禁止复制粘贴一大段重复的
  组件样式串（应抽成 cva variant 或新原语）。
- ❌ 禁止引入第三方样式库或新的颜色体系。
- ❌ 禁止为暗色模式单独定义一套颜色值，一切差异收敛到 `.dark` 变量。

## Responsive Behavior

- 移动优先，断点沿用 Tailwind 默认（sm 640 / md 768 / lg 1024 / xl 1280）。
- 控件文字在移动端可 `text-base`、桌面 `md:text-sm`（Input 原语已如此），
  防止 iOS 缩放。
- `container` 在 1400px 封顶；营销区块内边距在移动端降为 `px-4`/`px-6`。
- 触控目标不小于 32px（`h-8` 是允许的极限，默认用 `h-9`）。

## Known Gaps

- `needs-design-decision`：缺少语义化 `success` / `warning` / `info` 色。
  当前只有 `destructive`；图表色 `{colors.chart-accent-1}`（橙）与
  `{colors.chart-accent-2}`（蓝）不应挪用作状态色，需设计师确认后补充变量。
- `needs-design-decision`：`globals.css` 中残留 `--main` / `--color-1~5`（彩虹动画色）
  两套装饰色，仅允许在 `rainbow-button` 等装饰组件使用，不纳入语义体系。
- Typography 各层级为按 Vercel 惯例推断（likely），代码中无集中字阶定义；
  以 `components/ui` 现有用法为准逐步收敛。
