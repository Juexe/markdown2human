<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { OutputPreferences } from '@/types/preferences'
import {
  FolderOpen,
  Heading,
  ListTree,
  Quote,
  RotateCcw,
  Settings2,
  Sparkles,
} from 'lucide-vue-next'
import SettingHint from '@/components/SettingHint.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useClipboard } from '@/composables/useClipboard'
import { useLocalFile } from '@/composables/useLocalFile'
import { useMarkdownTransform } from '@/composables/useMarkdownTransform'
import { useOutputPreferences } from '@/composables/useOutputPreferences'
import { defaultOutputPreferences } from '@/domain/storage'

type TextPreferenceKey = keyof Pick<
  OutputPreferences,
  | 'unorderedListBullet'
  | 'orderedListSuffix'
  | 'tableSeparator'
  | 'quotePrefix'
  | 'imageLabel'
  | 'codeBlockLabel'
>

type BooleanPreferenceKey = keyof Pick<
  OutputPreferences,
  | 'preserveOrderedListNumber'
  | 'preserveLinkUrl'
  | 'preserveImageAlt'
  | 'preserveCodeBlock'
>

interface TextFieldConfig<K extends TextPreferenceKey = TextPreferenceKey> {
  id: string
  key: K
  label: string
  hint: string
  placeholder: string
}

interface ToggleFieldConfig<K extends BooleanPreferenceKey = BooleanPreferenceKey> {
  key: K
  label: string
  hint: string
  description: string
}

interface HeadingFieldGroup {
  title: string
  description: string
  prefixKey: keyof Pick<OutputPreferences, 'headingLevel1Prefix' | 'headingLevel2Prefix' | 'headingLevel3Prefix'>
  suffixKey: keyof Pick<OutputPreferences, 'headingLevel1Suffix' | 'headingLevel2Suffix' | 'headingLevel3Suffix'>
  dividerKey: keyof Pick<OutputPreferences, 'headingLevel1Divider' | 'headingLevel2Divider' | 'headingLevel3Divider'>
  hint: string
}

const markdownSource = ref('')
const outputText = ref('')
const settingsDialogOpen = ref(false)
const pasteState = ref<'idle' | 'success' | 'error'>('idle')
const pasteMessage = ref('')
let pasteResetTimer: number | undefined

const { preferences, resetPreferences } = useOutputPreferences()
const { transformedText, transformError } = useMarkdownTransform(markdownSource, preferences)
const localFile = useLocalFile(markdownSource)
const { copyState, copyMessage, copyText } = useClipboard()

watch(
  transformedText,
  (value) => {
    outputText.value = value
  },
  {
    immediate: true,
  },
)

const paragraphSpacingOptions = [
  { label: '紧凑', value: 'compact' },
  { label: '标准', value: 'normal' },
  { label: '宽松', value: 'relaxed' },
  { label: '更宽', value: 'wide' },
] as const

const settingHints = {
  unorderedListBullet: '无序列表项使用的前导符号，例如 -, *, •。',
  tableSeparator: '表格每列之间插入的分隔内容，可直接输入空格、逗号或 \\t。',
  paragraphSpacing: '控制段落块之间保留的空行数量。',
  orderedListSuffix: '有序列表数字后的后缀，例如 .、)、、。',
  preserveOrderedListNumber: '关闭后，有序列表会按无序列表符号输出。',
  preserveLinkUrl: '开启后，链接会输出为 文本 (URL)。',
  preserveImageAlt: '开启后，图片会输出 alt 文本或图片标签。',
  preserveCodeBlock: '关闭后，代码块整段忽略不输出。',
  headingLevel1Prefix: '一级标题正文前插入的内容，例如 《。',
  headingLevel1Suffix: '一级标题正文后插入的内容，例如 》。',
  headingLevel1Divider: '一级标题下方附加的分隔行，auto 表示按标题长度自动生成。',
  headingLevel2Prefix: '二级标题正文前插入的内容。',
  headingLevel2Suffix: '二级标题正文后插入的内容。',
  headingLevel2Divider: '二级标题下方附加的分隔行，留空则不输出。',
  headingLevel3Prefix: '三级标题正文前插入的内容。',
  headingLevel3Suffix: '三级标题正文后插入的内容。',
  headingLevel3Divider: '三级标题下方附加的分隔行，留空则不输出。',
  quotePrefix: '引用块每一行的前缀，例如 > 或 引用：。',
  imageLabel: '图片 alt 文本前的标签，留空则只输出 alt 文本。',
  codeBlockLabel: '代码块标题标签，例如 代码块、Snippet。',
} as const

const baseTextFields = [
  {
    id: 'unordered-list-bullet',
    key: 'unorderedListBullet',
    label: '列表符号',
    hint: settingHints.unorderedListBullet,
    placeholder: '-',
  },
  {
    id: 'ordered-list-suffix',
    key: 'orderedListSuffix',
    label: '编号后缀',
    hint: settingHints.orderedListSuffix,
    placeholder: '.',
  },
  {
    id: 'table-separator',
    key: 'tableSeparator',
    label: '表格分隔',
    hint: settingHints.tableSeparator,
    placeholder: ' | ',
  },
] as const satisfies readonly TextFieldConfig[]

const toggleFields = [
  {
    key: 'preserveOrderedListNumber',
    label: '有序编号',
    hint: settingHints.preserveOrderedListNumber,
    description: '关闭后统一按无序列表输出。',
  },
  {
    key: 'preserveLinkUrl',
    label: '链接地址',
    hint: settingHints.preserveLinkUrl,
    description: '决定是否保留链接原始 URL。',
  },
  {
    key: 'preserveImageAlt',
    label: '图片说明',
    hint: settingHints.preserveImageAlt,
    description: '图片节点保留 alt 文本或图片标签。',
  },
  {
    key: 'preserveCodeBlock',
    label: '代码块',
    hint: settingHints.preserveCodeBlock,
    description: '控制代码块整段是否出现在结果中。',
  },
] as const satisfies readonly ToggleFieldConfig[]

const mediaTextFields = [
  {
    id: 'quote-prefix',
    key: 'quotePrefix',
    label: '引用前缀',
    hint: settingHints.quotePrefix,
    placeholder: '> ',
  },
  {
    id: 'image-label',
    key: 'imageLabel',
    label: '图片标签',
    hint: settingHints.imageLabel,
    placeholder: '图片：',
  },
  {
    id: 'code-block-label',
    key: 'codeBlockLabel',
    label: '代码标签',
    hint: settingHints.codeBlockLabel,
    placeholder: '代码块',
  },
] as const satisfies readonly TextFieldConfig[]

const headingGroups = [
  {
    title: '一级标题',
    description: '适合文档主标题或文章标题。',
    prefixKey: 'headingLevel1Prefix',
    suffixKey: 'headingLevel1Suffix',
    dividerKey: 'headingLevel1Divider',
    hint: `${settingHints.headingLevel1Prefix} ${settingHints.headingLevel1Suffix} ${settingHints.headingLevel1Divider}`,
  },
  {
    title: '二级标题',
    description: '适合章节标题或段落分组。',
    prefixKey: 'headingLevel2Prefix',
    suffixKey: 'headingLevel2Suffix',
    dividerKey: 'headingLevel2Divider',
    hint: `${settingHints.headingLevel2Prefix} ${settingHints.headingLevel2Suffix} ${settingHints.headingLevel2Divider}`,
  },
  {
    title: '三级标题',
    description: '适合更细粒度的小节标题。',
    prefixKey: 'headingLevel3Prefix',
    suffixKey: 'headingLevel3Suffix',
    dividerKey: 'headingLevel3Divider',
    hint: `${settingHints.headingLevel3Prefix} ${settingHints.headingLevel3Suffix} ${settingHints.headingLevel3Divider}`,
  },
] as const satisfies readonly HeadingFieldGroup[]

const preferenceKeys = Object.keys(defaultOutputPreferences) as Array<keyof OutputPreferences>

const isDefaultPreferences = computed(
  () => JSON.stringify(preferences.value) === JSON.stringify(defaultOutputPreferences),
)

const changedPreferencesCount = computed(
  () => preferenceKeys.filter((key) => preferences.value[key] !== defaultOutputPreferences[key]).length,
)

const copyButtonLabel = computed(() => {
  if (copyState.value === 'success') return '已复制'
  if (copyState.value === 'error') return '复制失败'
  return '复制'
})

const pasteButtonLabel = computed(() => {
  if (pasteState.value === 'success') return '已粘贴'
  if (pasteState.value === 'error') return '粘贴失败'
  return '粘贴'
})

const helperMessage = computed(
  () => localFile.fileError.value
    || transformError.value
    || (pasteState.value === 'error' ? pasteMessage.value : '')
    || (copyState.value === 'error' ? copyMessage.value : ''),
)

function schedulePasteReset() {
  window.clearTimeout(pasteResetTimer)
  pasteResetTimer = window.setTimeout(() => {
    pasteState.value = 'idle'
    pasteMessage.value = ''
  }, 1600)
}

async function pasteMarkdown() {
  try {
    if (!navigator.clipboard?.readText) {
      throw new Error('Clipboard API is not supported.')
    }

    const clipboardText = await navigator.clipboard.readText()

    if (!clipboardText.trim()) {
      throw new Error('剪贴板没有可粘贴的内容')
    }

    markdownSource.value = clipboardText
    pasteState.value = 'success'
    pasteMessage.value = ''
  } catch (error) {
    pasteState.value = 'error'
    pasteMessage.value = error instanceof Error && error.message === '剪贴板没有可粘贴的内容'
      ? error.message
      : '读取剪贴板失败'
  }

  schedulePasteReset()
}

function restoreDefaultPreferences() {
  if (!isDefaultPreferences.value) {
    resetPreferences()
  }
}

function labelClass() {
  return 'flex items-center gap-1 text-xs text-muted-foreground'
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f6efe3_0%,#f8f7f4_38%,#ffffff_100%)]">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(216,177,100,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(86,120,167,0.14),transparent_36%)]" />

    <Dialog v-model:open="settingsDialogOpen">
      <main class="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header class="flex min-w-0 items-center gap-3 px-1">
          <p class="shrink-0 text-xs font-medium tracking-[0.28em] text-muted-foreground uppercase">md2human</p>
          <span class="h-4 w-px shrink-0 bg-border/80" />
          <h1 class="min-w-0 truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            把 Markdown 整理成更适合聊天、转发和纯文本阅读的内容
          </h1>
        </header>

        <Card class="border-white/70 bg-white/86 shadow-sm backdrop-blur">
          <CardHeader class="gap-3">
            <div class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-1">
                <CardTitle class="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles class="size-4 text-muted-foreground" />
                  快速设置
                </CardTitle>
                <CardDescription class="text-xs leading-5">
                  高频设置直接放在工作台上，适合边看结果边微调。更细的标题样式、媒体标签和保留策略统一放在高级面板里。
                </CardDescription>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-xs leading-5 text-muted-foreground">已偏离默认设置 {{ changedPreferencesCount }} 项</p>
                <Button size="sm" variant="outline" @click="settingsDialogOpen = true">
                  <Settings2 />
                  高级设置
                </Button>
                <Button :disabled="isDefaultPreferences" size="sm" variant="ghost" @click="restoreDefaultPreferences">
                  <RotateCcw />
                  恢复默认
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div class="space-y-1.5 rounded-xl border border-border/70 bg-background/75 p-3">
              <Label for="quick-paragraph-spacing" :class="labelClass()">
                <span>段落间距</span>
                <SettingHint :text="settingHints.paragraphSpacing" />
              </Label>
              <Select v-model="preferences.paragraphSpacing">
                <SelectTrigger id="quick-paragraph-spacing" class="h-9 bg-white/70 text-xs">
                  <SelectValue placeholder="段落间距" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in paragraphSpacingOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5 rounded-xl border border-border/70 bg-background/75 p-3">
              <Label for="quick-unordered-list-bullet" :class="labelClass()">
                <span>列表符号</span>
                <SettingHint :text="settingHints.unorderedListBullet" />
              </Label>
              <Input
                id="quick-unordered-list-bullet"
                v-model="preferences.unorderedListBullet"
                class="h-9 bg-white/70 font-mono"
                placeholder="-"
                spellcheck="false"
              />
            </div>

            <label class="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/75 px-3 py-3">
              <div class="min-w-0 space-y-1">
                <p class="flex items-center gap-1 text-xs font-medium text-foreground">
                  <span>链接地址</span>
                  <SettingHint :text="settingHints.preserveLinkUrl" />
                </p>
                <p class="text-xs leading-5 text-muted-foreground">转发时是否保留原始 URL</p>
              </div>
              <Switch v-model="preferences.preserveLinkUrl" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/75 px-3 py-3">
              <div class="min-w-0 space-y-1">
                <p class="flex items-center gap-1 text-xs font-medium text-foreground">
                  <span>代码块</span>
                  <SettingHint :text="settingHints.preserveCodeBlock" />
                </p>
                <p class="text-xs leading-5 text-muted-foreground">控制代码块整段是否输出</p>
              </div>
              <Switch v-model="preferences.preserveCodeBlock" />
            </label>
          </CardContent>
        </Card>

        <section class="grid flex-1 gap-4 xl:grid-cols-2">
          <Card class="flex min-h-[30rem] flex-col border-white/70 bg-white/88 shadow-sm backdrop-blur">
            <CardHeader class="gap-2 py-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="space-y-1">
                  <CardTitle class="text-sm font-semibold">Markdown</CardTitle>
                  <CardDescription class="text-xs leading-5">
                    支持直接粘贴、打开本地文件，输入越长越能看出设置项的效果。
                  </CardDescription>
                </div>
                <div class="flex gap-2">
                  <Button variant="outline" size="sm" @click="localFile.openFileDialog">
                    <FolderOpen />
                    打开
                  </Button>
                  <Button variant="outline" size="sm" @click="pasteMarkdown">
                    {{ pasteButtonLabel }}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent class="flex flex-1 flex-col pt-0 pb-3">
              <input
                :ref="localFile.fileInputRef"
                accept=".md,.markdown,.txt,text/markdown,text/plain"
                class="hidden"
                type="file"
                @change="localFile.handleFileChange"
              >
              <Textarea
                v-model="markdownSource"
                class="min-h-[24rem] flex-1 resize-none bg-white/72 font-mono text-sm leading-6"
                placeholder="# 会议纪要&#10;&#10;- 已完成事项&#10;- 待跟进事项"
              />
            </CardContent>
          </Card>

          <Card class="flex min-h-[30rem] flex-col border-white/70 bg-[#f8f7f3]/92 shadow-sm backdrop-blur">
            <CardHeader class="gap-2 py-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="space-y-1">
                  <CardTitle class="text-sm font-semibold">转换结果</CardTitle>
                  <CardDescription class="text-xs leading-5">
                    右侧结果会实时响应设置变化，适合边调规则边确认最终纯文本观感。
                  </CardDescription>
                </div>
                <Button size="sm" @click="copyText(outputText)">
                  {{ copyButtonLabel }}
                </Button>
              </div>
            </CardHeader>
            <CardContent class="flex flex-1 flex-col gap-2 pt-0 pb-3">
              <Textarea
                v-model="outputText"
                class="min-h-[24rem] flex-1 resize-none bg-white/88 font-mono text-sm leading-6"
                placeholder="转换结果会显示在这里"
              />
              <p
                v-if="helperMessage"
                class="rounded-lg bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground"
              >
                {{ helperMessage }}
              </p>
            </CardContent>
          </Card>
        </section>

        <footer class="pb-1 text-xs leading-5 text-muted-foreground">
          <p>
            转换在浏览器本地完成，只保存设置偏好到
            <code class="rounded bg-white/70 px-1 py-0.5 text-[11px] text-foreground">localStorage</code>。
          </p>
          <p>md2human v1.0.0 by Juexe</p>
        </footer>
      </main>

      <DialogScrollContent class="max-w-6xl overflow-hidden border-white/70 bg-[#fbfaf6] p-0 shadow-2xl">
        <DialogHeader class="border-b border-border/60 bg-white/88 px-6 py-5 backdrop-blur">
          <div class="space-y-2">
            <DialogTitle class="flex items-center gap-2 text-base font-semibold">
              <Settings2 class="size-4" />
              输出设置
            </DialogTitle>
            <DialogDescription class="max-w-3xl text-sm leading-6">
              这里放完整的输出规则。主界面只展示最常改的几个入口，其余细节按标题、结构和媒体格式分组管理，方便后续继续扩展。
            </DialogDescription>
          </div>
        </DialogHeader>

        <div class="px-6 py-6">
          <div class="space-y-6">
            <section class="space-y-4">
              <div class="space-y-1">
                <h2 class="flex items-center gap-2 text-sm font-semibold">
                  <ListTree class="size-4 text-muted-foreground" />
                  结构规则
                </h2>
                <p class="text-xs leading-5 text-muted-foreground">
                  先控制段落节奏、列表样式和表格展开方式，这些是最先影响阅读密度的设置。
                </p>
              </div>

              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-1.5 rounded-xl border border-border/70 bg-white/78 p-3 xl:col-span-1">
                  <Label for="paragraph-spacing" :class="labelClass()">
                    <span>段落间距</span>
                    <SettingHint :text="settingHints.paragraphSpacing" />
                  </Label>
                  <Select v-model="preferences.paragraphSpacing">
                    <SelectTrigger id="paragraph-spacing" class="h-9 bg-background/80 text-xs">
                      <SelectValue placeholder="段落间距" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in paragraphSpacingOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div
                  v-for="field in baseTextFields"
                  :key="field.id"
                  class="space-y-1.5 rounded-xl border border-border/70 bg-white/78 p-3"
                >
                  <Label :for="field.id" :class="labelClass()">
                    <span>{{ field.label }}</span>
                    <SettingHint :text="field.hint" />
                  </Label>
                  <Input
                    :id="field.id"
                    v-model="preferences[field.key]"
                    class="h-9 bg-background/80 font-mono"
                    :placeholder="field.placeholder"
                    spellcheck="false"
                  />
                </div>
              </div>

              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label
                  v-for="field in toggleFields"
                  :key="field.key"
                  class="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-white/78 px-3 py-3"
                >
                  <div class="min-w-0 space-y-1">
                    <p class="flex items-center gap-1 text-xs font-medium text-foreground">
                      <span>{{ field.label }}</span>
                      <SettingHint :text="field.hint" />
                    </p>
                    <p class="text-xs leading-5 text-muted-foreground">{{ field.description }}</p>
                  </div>
                  <Switch v-model="preferences[field.key]" />
                </label>
              </div>
            </section>

            <Separator />

            <section class="space-y-4">
              <div class="space-y-1">
                <h2 class="flex items-center gap-2 text-sm font-semibold">
                  <Heading class="size-4 text-muted-foreground" />
                  标题样式
                </h2>
                <p class="text-xs leading-5 text-muted-foreground">
                  每个层级都单独成卡片，后面增加更多标题策略时可以继续沿这个结构扩展。
                </p>
              </div>

              <div class="grid gap-3 xl:grid-cols-3">
                <div
                  v-for="group in headingGroups"
                  :key="group.title"
                  class="space-y-3 rounded-2xl border border-border/70 bg-white/78 p-4"
                >
                  <div class="space-y-1">
                    <p class="flex items-center gap-1 text-sm font-semibold text-foreground">
                      <span>{{ group.title }}</span>
                      <SettingHint :text="group.hint" class="size-5" />
                    </p>
                    <p class="text-xs leading-5 text-muted-foreground">{{ group.description }}</p>
                  </div>

                  <div class="grid gap-2 sm:grid-cols-3">
                    <Input
                      v-model="preferences[group.prefixKey]"
                      aria-label="标题前缀"
                      class="h-9 bg-background/80 font-mono"
                      placeholder="前缀"
                      spellcheck="false"
                    />
                    <Input
                      v-model="preferences[group.suffixKey]"
                      aria-label="标题后缀"
                      class="h-9 bg-background/80 font-mono"
                      placeholder="后缀"
                      spellcheck="false"
                    />
                    <Input
                      v-model="preferences[group.dividerKey]"
                      aria-label="标题分隔线"
                      class="h-9 bg-background/80 font-mono"
                      placeholder="分隔线"
                      spellcheck="false"
                    />
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section class="space-y-4">
              <div class="space-y-1">
                <h2 class="flex items-center gap-2 text-sm font-semibold">
                  <Quote class="size-4 text-muted-foreground" />
                  引用、图片与代码
                </h2>
                <p class="text-xs leading-5 text-muted-foreground">
                  这组设置通常是高级用户才会动的细节，因此单独放在第三层信息区，避免干扰主工作流。
                </p>
              </div>

              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div
                  v-for="field in mediaTextFields"
                  :key="field.id"
                  class="space-y-1.5 rounded-xl border border-border/70 bg-white/78 p-3"
                >
                  <Label :for="field.id" :class="labelClass()">
                    <span>{{ field.label }}</span>
                    <SettingHint :text="field.hint" />
                  </Label>
                  <Input
                    :id="field.id"
                    v-model="preferences[field.key]"
                    class="h-9 bg-background/80 font-mono"
                    :placeholder="field.placeholder"
                    spellcheck="false"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogScrollContent>
    </Dialog>
  </div>
</template>
