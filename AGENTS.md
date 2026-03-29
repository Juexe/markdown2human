# AGENTS.md

## 项目定位

markdown2human 是一个极简的纯前端单页工具，用来把 Markdown 转成更适合聊天、转发和纯文本阅读的内容。

当前目标是保持实现直接、依赖克制、交互简单，不为未来扩展提前增加复杂度。

## 当前技术栈

- 运行环境：`node`
- 包管理：`pnpm`
- 框架：`Vue 3`
- 语言：`TypeScript`
- 构建工具：`Vite`
- UI 组件：`shadcn-vue`
- 样式：`Tailwind CSS v4`
- 常用工具：`@vueuse/core`
- Markdown 解析：`unified + remark-parse + remark-gfm`

## UI 约束

- UI 组件完全使用使用 `shadcn-vue`
- 充分使用 `shadcn-vue` 相关生态，如 `class-variance-authority`、`clsx`、`tailwind-merge`、`lucide-vue-next`
- 组件充分使用已有 [components](https://shadcn-vue.com/docs/components)，非必要不自己造轮子
- 使用 [shadcn-vue CLI](https://shadcn-vue.com/docs/cli) 管理组件，例如 `pnpm dlx shadcn-vue@latest add [component]`
- 优化 UI 体验是第一位的，保持第一层信息简洁，但不舍弃任何功能，在第二层、三层中补全高级功能，以便高级用户使用
- 保持页面简单干净，非必要不要放置多余的说明文字，必要的话使用 [tooltip](https://shadcn-vue.com/docs/components/tooltip) 和 [hoverCard](https://shadcn-vue.com/docs/components/hover-card)
- 轻量提示信息使用 [sonner](https://shadcn-vue.com/docs/components/sonner)，而不是 `toast`

## 代码组织

当前目录结构以单页工具为核心：

```text
src/
├─ App.vue
├─ main.ts
├─ components/ui/
├─ composables/
├─ domain/
├─ lib/
├─ styles/
└─ types/
```

职责约束：

- `App.vue` 负责主工作台编排
- `components/ui` 放 `shadcn-vue` 基础组件
- `composables` 放状态和副作用
- `domain` 放纯业务逻辑，尤其是 Markdown 转换和配置归一化
- `types` 放共享类型

## Markdown 转换规则

- 标题、列表、引用、链接、图片说明、代码块、表格都在支持范围内
- 转换失败时优先回退到可用文本，不允许 UI 崩溃
- 对转换逻辑的修改优先放在 `src/domain/transformMarkdownToText.ts`

## 修改代码时的要求

- 业务逻辑尽量保持纯函数
- 涉及配置项时，同步更新：
  - `src/types/preferences.ts`
  - `src/domain/storage.ts`
  - `src/domain/normalizePreferences.ts`
  - 对应 UI

## 验证要求

- 每次完成任务后，如果改动不大，不用运行检查命令
- 除非改动面较大，则运行一次 `pnpm build`
