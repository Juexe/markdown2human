# markdown2human 技术设计文档

## 1. 文档目标

本文档基于 [product-requirements.md](/D:/Projects/Bun/markdown2human/docs/product-requirements.md) 和 [ui-design.md](/D:/Projects/Bun/markdown2human/docs/ui-design.md) 整理，但以当前讨论结论为准。两份上游文档仅作为弱参考，不机械继承其中的所有设计。

当前目标很明确：实现一个极简、纯前端、单页面的 Markdown 转纯文本工具，专注完成主流程，不为未来扩展预埋额外复杂度。

## 2. 设计原则

- 极简优先：只保留当前必须存在的技术点和交互
- KISS：避免多层抽象、避免未来预留式设计
- 单页优先：只有一个工作台页面，不引入多页面结构
- 本地优先：纯前端运行，不依赖服务端
- AST 优先：Markdown 直接解析为语法树后转换，避免 HTML 中转
- 用户自由优先：输出结果允许用户继续编辑，不做不必要限制

## 3. 技术选型

### 3.1 核心技术栈

- 运行环境：浏览器
- 包管理与脚本：`bun`
- 框架：`Vue 3`
- 语言：`TypeScript`
- 构建工具：`Vite`
- UI 组件：`shadcn-vue`
- 样式方案：`Tailwind CSS`
- 常用工具：`@vueuse/core`
- Markdown 解析：`unified` + `remark-parse`
- 本地存储：浏览器 `localStorage`

### 3.2 明确采用这些技术的原因

#### `Tailwind CSS`

保留 `Tailwind CSS`，不改用 `UnoCSS`。

原因：

- `shadcn-vue` 的官方用法、组件代码和样式约定天然围绕 Tailwind
- 当前目标是低摩擦落地，不希望为样式引擎兼容增加额外工作
- 对这个项目来说，优先保证 `shadcn-vue` 的接入稳定性比统一原子化引擎更重要

#### `@vueuse/core`

保留 `@vueuse/core`。

原因：

- 它能减少 `localStorage`、事件、一些浏览器 API 封装的样板代码
- 对这种小工具来说，减少重复代码本身就是在保持简单

#### `unified + remark-parse`

保留 AST 路线，不通过 HTML 中转。

原因：

- 这是一个“转换工具”，不是“渲染工具”
- AST 更适合做标题、列表、链接、表格、图片、代码块等结构化规则处理
- 避免引入 HTML 渲染、清洗、再提取文本等额外问题

### 3.3 明确不采用的技术点

- 不使用 `vue-router`
- 不使用 `Pinia`
- 不使用 `zod` 等 schema 库
- 不引入图标库，如 `lucide-vue-next`
- 不引入 `Toast` 作为全局反馈机制
- 当前 MVP 不引入测试框架作为必需依赖

原因统一为：这些技术点对当前单页极简工具不是必要项，引入后增加理解和维护成本，不符合当前范围。

## 4. 应用范围

### 4.1 当前功能范围

- 输入或粘贴 Markdown
- 打开本地 Markdown 或纯文本文件
- 自动转换为适合聊天场景的纯文本
- 调整少量输出样式
- 一键复制结果
- 展示简单关于信息
- 记住用户的配置偏好

### 4.2 明确不做的内容

- 不做多页面
- 不做服务端或云同步
- 不持久化用户输入正文
- 不支持拖拽导入
- 不提供加载示例
- 不做复杂主题系统
- 不做复杂排版器或终端级表格对齐

## 5. 总体架构

应用采用最简单的单页分层结构：

1. 视图层：Vue 组件负责渲染页面和收集交互
2. 状态层：组合式 API 管理输入、偏好、复制状态、关于弹层状态
3. 转换层：Markdown AST 解析与纯文本序列化
4. 持久化层：将用户配置写入 `localStorage`

架构重点不是“模块多”，而是“职责清楚”：

- 组件负责展示
- composable 负责状态和副作用
- 转换函数负责业务规则

## 6. 依赖建议

当前建议依赖尽量收敛为：

- `vue`
- `typescript`
- `vite`
- `@vueuse/core`
- `shadcn-vue`
- `tailwindcss`
- `unified`
- `remark-parse`

说明：

- `class-variance-authority`、`clsx`、`tailwind-merge` 如果作为 `shadcn-vue` 配套依赖出现，可以接受
- 但业务层不围绕这些依赖做复杂变体系统

## 7. 页面结构

整个应用只有一个页面，即主工作台。

### 7.1 页面分区

- 顶部控制区：输出样式设置、关于入口
- 主工作区：左侧输入、右侧输出
- 关于弹层：展示产品说明

### 7.2 布局策略

- 桌面端：左右双栏，输入与输出并排
- 窄屏：上下排列，先输入后输出

页面重点是清晰传达“左边输入 Markdown，右边得到结果”的关系，不引入其他层级。

## 8. 组件设计

### 8.1 组件树

```text
App
├─ TopToolbar
│  ├─ OutputSettingsBar
│  └─ AboutDialogTrigger
├─ Workspace
│  ├─ MarkdownPanel
│  │  ├─ OpenFileButton
│  │  ├─ ClearButton
│  │  └─ Textarea
│  └─ OutputPanel
│     ├─ CopyButton
│     ├─ StatusText
│     └─ Textarea
└─ AboutDialog
```

### 8.2 UI 组件映射

基于 `shadcn-vue` 使用以下基础组件：

- `Button`
- `Textarea`
- `Label`
- `Select`
- `Switch`
- `Dialog`
- `Card`
- `Separator`

说明：

- 不使用图标按钮，全部采用纯文本按钮
- 不使用 Toast，所有状态反馈都在按钮文案或区域文本中完成

## 9. 目录结构建议

```text
src/
├─ App.vue
├─ main.ts
├─ components/
│  ├─ TopToolbar.vue
│  ├─ OutputSettingsBar.vue
│  ├─ MarkdownPanel.vue
│  ├─ OutputPanel.vue
│  └─ AboutDialog.vue
├─ composables/
│  ├─ useOutputPreferences.ts
│  ├─ useMarkdownTransform.ts
│  ├─ useLocalFile.ts
│  └─ useClipboard.ts
├─ domain/
│  ├─ transformMarkdownToText.ts
│  ├─ parseMarkdown.ts
│  ├─ normalizePreferences.ts
│  └─ storage.ts
├─ types/
│  └─ preferences.ts
└─ styles/
   └─ index.css
```

说明：

- 不单独拆 `router.ts`
- 不单独引入全局 store 目录
- 文件结构围绕当前真实模块组织，不做未来页面预埋

## 10. 数据模型

### 10.1 输出配置

```ts
export interface OutputPreferences {
  unorderedListBullet: '-' | '*' | '•'
  tableSeparator: 'pipe' | 'space' | 'tab'
  paragraphSpacing: 'compact' | 'normal' | 'relaxed'
  preserveOrderedListNumber: boolean
  preserveLinkUrl: boolean
  preserveImageAlt: boolean
  preserveCodeBlock: boolean
}
```

### 10.2 默认值

```ts
export const defaultOutputPreferences: OutputPreferences = {
  unorderedListBullet: '-',
  tableSeparator: 'pipe',
  paragraphSpacing: 'normal',
  preserveOrderedListNumber: true,
  preserveLinkUrl: true,
  preserveImageAlt: true,
  preserveCodeBlock: true,
}
```

### 10.3 存储结构

只持久化用户配置，不持久化正文。

- Key：`markdown2human:preferences`

值结构建议：

```json
{
  "version": 1,
  "data": {
    "unorderedListBullet": "-",
    "tableSeparator": "pipe",
    "paragraphSpacing": "normal",
    "preserveOrderedListNumber": true,
    "preserveLinkUrl": true,
    "preserveImageAlt": true,
    "preserveCodeBlock": true
  }
}
```

## 11. 状态管理

### 11.1 状态来源

不引入 `Pinia`，全部状态由 `App.vue` 和 composable 管理。

核心状态包括：

- `markdownSource`：当前输入内容
- `outputPreferences`：用户配置
- `transformedText`：转换后的纯文本
- `copyState`：`idle | success | error`
- `copyMessage`：复制结果提示文案
- `aboutDialogOpen`：关于弹层状态
- `transformError`：转换失败时的提示信息

### 11.2 数据流

```text
输入内容变化
-> 更新 markdownSource
-> 立即执行转换
-> 更新 transformedText
-> 输出区同步刷新
```

```text
配置变化
-> 更新 outputPreferences
-> 写入 localStorage
-> 立即重新转换
-> 输出区同步刷新
```

### 11.3 状态策略

- 首版不做防抖
- 输入变化即刻转换
- 输出区使用 `Textarea`，不限制编辑
- 用户可以在结果区继续人工微调

## 12. 本地存储策略

### 12.1 存储范围

只存以下内容：

- 无序列表符号
- 表格分隔方式
- 段落间距
- 是否保留有序列表编号
- 是否保留链接地址
- 是否保留图片说明
- 是否保留代码块

### 12.2 明确不存储

- 输入 Markdown 正文
- 输出结果正文
- 文件名
- 复制历史

原因：

- 避免把用户文本意外保留在本地
- 保持工具行为可预测

### 12.3 配置校验

不引入 `zod`。

采用手写归一化函数：

- 读取原始值
- 判断是否为合法字段
- 非法值回退默认值
- 与默认配置合并

这种方式对当前只有少量字段的配置模型更直接，也更容易维护。

## 13. 文件导入设计

### 13.1 支持方式

首版只支持“打开文件”。

不支持：

- 拖拽导入
- 批量文件导入

### 13.2 交互流程

1. 用户点击“打开”
2. 触发隐藏的文件选择器
3. 用户选择文件
4. 使用 `File.text()` 读取内容
5. 将内容写入 `markdownSource`
6. 自动刷新输出结果

### 13.3 支持类型

- `.md`
- `.markdown`
- `.txt`
- `text/markdown`
- `text/plain`

## 14. 复制反馈设计

### 14.1 复制方式

优先使用浏览器 Clipboard API。

### 14.2 反馈方式

不使用 Toast。

复制反馈采用更简单的方式：

- 默认按钮文案：`复制`
- 成功后短暂显示：`已复制`
- 失败时显示：`复制失败`

必要时在输出区头部或下方补一行简短提示文本。

这种方式对极简工具更合适，也能减少额外状态接线和 UI 容器。

## 15. Markdown 转换方案

### 15.1 核心原则

转换目标不是“删掉 Markdown 符号”，而是“输出一份适合聊天场景阅读和转发的纯文本”。

所以处理流程必须是：

```text
Markdown 字符串
-> 解析为 AST
-> 按节点类型执行纯文本序列化
-> 拼接最终结果
```

不采用：

```text
Markdown
-> HTML
-> 再从 HTML 提取文字
```

### 15.2 为什么必须使用 AST

- HTML 中转会带来额外的结构损耗和处理成本
- HTML 渲染本身不是当前需求
- 直接处理 AST 能更精确地控制标题、列表、表格、链接、图片、代码块等规则

### 15.3 节点处理规则

#### 标题

- 不保留 Markdown `#`
- 保留标题文本
- 一级标题使用简单 ASCII 分隔线强调
- 二三级标题保留标题文本并在前面留空行

示例：

```text
Project Intro
=============
```

#### 段落

- 原样输出文字内容
- 段落间距由 `paragraphSpacing` 控制

规则：

- `compact`：段落之间 1 个空行
- `normal`：段落之间 2 个空行
- `relaxed`：段落之间 3 个空行

#### 无序列表

- 统一使用配置中的列表符号
- 保留层级缩进

示例：

```text
- 第一项
- 第二项
  - 子项
```

#### 有序列表

- `preserveOrderedListNumber = true` 时保留编号
- 为 `false` 时按无序列表输出

#### 引用

- 保留引用内容
- 使用 `> ` 作为前缀，维持阅读线索

#### 链接

- 始终保留链接文本
- `preserveLinkUrl = true` 时输出 `文本 (URL)`
- 为 `false` 时仅输出文本

#### 图片

- 不保留图片本体
- `preserveImageAlt = true` 时输出 `图片：说明文字`
- 为 `false` 时忽略图片节点

#### 行内代码

- 保留文字内容
- 不保留反引号

#### 代码块

- `preserveCodeBlock = true` 时保留代码
- 在代码块前增加简单说明
- 为 `false` 时整块忽略

建议格式：

```text
[代码块: ts]
const a = 1
console.log(a)
```

#### 表格

表格属于当前 MVP 范围，必须支持基础文本化输出。

规则：

- 表头和数据行逐行输出
- 不做复杂列宽对齐
- 列分隔符由 `tableSeparator` 决定

分隔方式：

- `pipe`：`列1 | 列2 | 列3`
- `space`：`列1  列2  列3`
- `tab`：`列1\t列2\t列3`

#### 分隔线

- 输出为 `---`

#### 粗体、斜体

- 去掉 Markdown 标记，只保留文字内容

### 15.4 错误处理

- 转换失败时不允许页面崩溃
- 优先输出尽可能可用的纯文本结果
- 同时在界面中显示一行简短错误提示

## 16. 视觉实现

### 16.1 视觉方向

整体维持轻量、清晰、工具化，而不是做成内容平台。

方向包括：

- 浅色背景
- 简单层次
- 干净文本区
- 控件少而明确

### 16.2 样式边界

- 基于 `Tailwind CSS` 和 `shadcn-vue`
- 不额外设计复杂视觉系统
- 不引入图标来补语义
- 不做复杂动效

### 16.3 结果区策略

输出区也使用 `Textarea`。

原因：

- 用户复制前可能希望手工微调
- 不应人为限制用户的最后一步编辑自由

## 17. composable 设计

### 17.1 `useOutputPreferences`

职责：

- 提供默认配置
- 从 `localStorage` 读取配置
- 归一化并合并默认值
- 在配置变化时回写到 `localStorage`

### 17.2 `useMarkdownTransform`

职责：

- 接收 Markdown 字符串和配置
- 输出转换结果
- 捕获转换过程异常
- 提供错误提示状态

### 17.3 `useLocalFile`

职责：

- 管理文件选择器
- 读取本地文件文本内容
- 将内容交给页面状态

### 17.4 `useClipboard`

职责：

- 复制输出结果
- 返回成功或失败状态
- 驱动按钮文案切换

## 18. 实施顺序

### 第一阶段：基础工程

- 初始化 `bun + Vue 3 + TypeScript + Vite`
- 集成 `Tailwind CSS`
- 接入 `shadcn-vue`

### 第二阶段：页面骨架

- 完成单页面布局
- 完成顶部设置区
- 完成输入区、输出区、关于弹层

### 第三阶段：核心功能

- 实现文件打开
- 实现配置持久化
- 实现复制反馈
- 实现 Markdown AST 转纯文本

### 第四阶段：收尾

- 调整交互细节
- 优化移动端排布
- 补充少量边界处理

## 19. 后续增强项

这些不属于当前 MVP，但后续可以考虑：

- 拖拽导入
- 更多 Markdown 节点支持
- 更细的标题格式策略
- 更精细的表格对齐策略
- 自动保存草稿
- 测试体系

## 20. 最终结论

当前项目应采用“极简单页工具”的技术路线：

- 单页面，不用 `vue-router`
- 原生组合式状态，不用 `Pinia`
- `TypeScript` 保留
- `Tailwind CSS + shadcn-vue` 保留
- `@vueuse/core` 保留
- Markdown 转换使用 `unified + remark-parse` 的 AST 路线
- 配置仅存 `localStorage`
- 不持久化正文
- 不引入图标库、Toast、测试框架作为 MVP 必需项

这个版本的设计更贴近当前产品真实范围，也更符合“简单、直接、低维护成本”的目标。
