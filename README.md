# markdown2human

markdown2human 是一个极简的纯前端单页工具，用来把 Markdown 转成更适合聊天、转发和纯文本阅读的纯文本内容。

在线预览：
[GitHub Pages](https://juexe.github.io/markdown2human/)

## 适用场景

- 把 README、说明文档、会议纪要快速整理后发到聊天工具
- 将 Markdown 内容压平成更适合纯文本窗口阅读和转发的格式
- 在保留结构信息的前提下，减少 Markdown 语法对读者的干扰

## 功能特性

- 本地实时转换，不依赖服务端
- 支持标题、列表、引用、链接、图片说明、代码块、表格
- 支持从剪贴板粘贴或打开本地 `.md` / `.txt` 文件
- 支持一键复制转换结果
- 支持记住用户偏好设置
- 高级设置支持标题样式、列表符号、表格输出模式和 DSL

## 技术栈

- Vue 3
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn-vue
- @vueuse/core
- unified + remark-parse + remark-gfm

## 本地开发

```bash
pnpm install
pnpm dev
```

默认开发地址：

```text
http://localhost:5173
```

## 构建预览

```bash
pnpm build
pnpm preview
```

## GitHub Pages 部署

仓库内已配置 GitHub Actions：

- 推送到 `main` 分支后会自动执行安装、构建和 Pages 部署
- 支持手动触发 `workflow_dispatch`
- 构建产物来自 `pnpm build`

如果是首次部署，需要在 GitHub 仓库设置中确认：

```text
Settings -> Pages -> Build and deployment -> Source = GitHub Actions
```

## 项目结构

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
