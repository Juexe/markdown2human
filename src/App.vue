<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown, CircleHelp, RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const markdownSource = ref('')
const outputText = ref('')
const showSettings = ref(true)
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

const isDefaultPreferences = computed(
  () => JSON.stringify(preferences.value) === JSON.stringify(defaultOutputPreferences),
)

const copyButtonLabel = computed(() => {
  if (copyState.value === 'success') {
    return '已复制'
  }

  if (copyState.value === 'error') {
    return '复制失败'
  }

  return '复制'
})

const pasteButtonLabel = computed(() => {
  if (pasteState.value === 'success') {
    return '已粘贴'
  }

  if (pasteState.value === 'error') {
    return '粘贴失败'
  }

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
  if (isDefaultPreferences.value) {
    return
  }

  resetPreferences()
}

function labelClass() {
  return 'flex items-center gap-1 text-xs text-muted-foreground'
}
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#f7f4ee_0%,#f5f7fb_55%,#ffffff_100%)]">
    <main class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div class="flex min-w-0 items-center gap-3 px-1">
        <p class="shrink-0 text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
          md2human
        </p>
        <span class="h-4 w-px shrink-0 bg-border" />
        <h1 class="min-w-0 truncate font-sans text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          把 Markdown 整理成更适合转发的纯文本
        </h1>
      </div>

      <Card class="border-white/70 bg-white/80 shadow-sm backdrop-blur">
        <CardHeader class="gap-0 py-3">
          <div class="flex items-center justify-between gap-3">
            <button
              class="flex min-w-0 items-center gap-2 text-left"
              type="button"
              @click="showSettings = !showSettings"
            >
              <ChevronDown class="size-4 shrink-0 transition-transform" :class="showSettings ? 'rotate-0' : '-rotate-90'" />
              <CardTitle class="truncate text-sm font-semibold">
                输出设置
              </CardTitle>
            </button>

            <Button
              :disabled="isDefaultPreferences"
              size="icon-sm"
              title="恢复默认设置"
              variant="outline"
              @click="restoreDefaultPreferences"
            >
              <RotateCcw />
              <span class="sr-only">恢复默认设置</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent v-if="showSettings" class="space-y-4 pt-0">
          <section class="space-y-2">
            <p class="text-xs font-medium text-muted-foreground">
              基础设置
            </p>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div class="space-y-1.5">
                <Label for="unordered-list-bullet" :class="labelClass()">
                  <span>列表符号</span>
                  <CircleHelp class="size-3.5" :title="settingHints.unorderedListBullet" />
                </Label>
                <Input
                  id="unordered-list-bullet"
                  v-model="preferences.unorderedListBullet"
                  class="h-8 bg-white/70 font-mono"
                  spellcheck="false"
                />
              </div>

              <div class="space-y-1.5">
                <Label for="table-separator" :class="labelClass()">
                  <span>表格分隔</span>
                  <CircleHelp class="size-3.5" :title="settingHints.tableSeparator" />
                </Label>
                <Input
                  id="table-separator"
                  v-model="preferences.tableSeparator"
                  class="h-8 bg-white/70 font-mono"
                  spellcheck="false"
                />
              </div>

              <div class="space-y-1.5">
                <Label for="paragraph-spacing" :class="labelClass()">
                  <span>段落间距</span>
                  <CircleHelp class="size-3.5" :title="settingHints.paragraphSpacing" />
                </Label>
                <Select v-model="preferences.paragraphSpacing">
                  <SelectTrigger id="paragraph-spacing" class="h-8 bg-white/70 text-xs">
                    <SelectValue placeholder="段落间距" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in paragraphSpacingOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-1.5">
                <Label for="ordered-list-suffix" :class="labelClass()">
                  <span>编号后缀</span>
                  <CircleHelp class="size-3.5" :title="settingHints.orderedListSuffix" />
                </Label>
                <Input
                  id="ordered-list-suffix"
                  v-model="preferences.orderedListSuffix"
                  class="h-8 bg-white/70 font-mono"
                  spellcheck="false"
                />
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label class="flex items-center justify-between gap-2 rounded-md border bg-background/70 px-3 py-2">
                <p class="flex items-center gap-1 truncate text-xs font-medium">
                  <span>有序编号</span>
                  <CircleHelp class="size-3.5 shrink-0 text-muted-foreground" :title="settingHints.preserveOrderedListNumber" />
                </p>
                <Switch v-model="preferences.preserveOrderedListNumber" />
              </label>

              <label class="flex items-center justify-between gap-2 rounded-md border bg-background/70 px-3 py-2">
                <p class="flex items-center gap-1 truncate text-xs font-medium">
                  <span>链接地址</span>
                  <CircleHelp class="size-3.5 shrink-0 text-muted-foreground" :title="settingHints.preserveLinkUrl" />
                </p>
                <Switch v-model="preferences.preserveLinkUrl" />
              </label>

              <label class="flex items-center justify-between gap-2 rounded-md border bg-background/70 px-3 py-2">
                <p class="flex items-center gap-1 truncate text-xs font-medium">
                  <span>图片说明</span>
                  <CircleHelp class="size-3.5 shrink-0 text-muted-foreground" :title="settingHints.preserveImageAlt" />
                </p>
                <Switch v-model="preferences.preserveImageAlt" />
              </label>

              <label class="flex items-center justify-between gap-2 rounded-md border bg-background/70 px-3 py-2">
                <p class="flex items-center gap-1 truncate text-xs font-medium">
                  <span>代码块</span>
                  <CircleHelp class="size-3.5 shrink-0 text-muted-foreground" :title="settingHints.preserveCodeBlock" />
                </p>
                <Switch v-model="preferences.preserveCodeBlock" />
              </label>
            </div>
          </section>

          <section class="space-y-2 pt-1">
            <p class="text-xs font-medium text-muted-foreground">
              标题格式
            </p>
            <div class="grid gap-3 xl:grid-cols-3">
              <div class="space-y-2 rounded-md border bg-background/70 p-3">
                <p class="flex items-center gap-1 text-xs font-medium">
                  <span>一级标题</span>
                  <CircleHelp class="size-3.5 text-muted-foreground" :title="`${settingHints.headingLevel1Prefix} ${settingHints.headingLevel1Suffix} ${settingHints.headingLevel1Divider}`" />
                </p>
                <div class="grid gap-2 sm:grid-cols-3">
                  <Input
                    v-model="preferences.headingLevel1Prefix"
                    aria-label="一级标题前缀"
                    class="h-8 bg-white/70 font-mono"
                    placeholder="前缀"
                    title="一级标题前缀"
                    spellcheck="false"
                  />
                  <Input
                    v-model="preferences.headingLevel1Suffix"
                    aria-label="一级标题后缀"
                    class="h-8 bg-white/70 font-mono"
                    placeholder="后缀"
                    title="一级标题后缀"
                    spellcheck="false"
                  />
                  <Input
                    v-model="preferences.headingLevel1Divider"
                    aria-label="一级标题分隔行"
                    class="h-8 bg-white/70 font-mono"
                    placeholder="分隔行"
                    title="一级标题分隔行"
                    spellcheck="false"
                  />
                </div>
              </div>

              <div class="space-y-2 rounded-md border bg-background/70 p-3">
                <p class="flex items-center gap-1 text-xs font-medium">
                  <span>二级标题</span>
                  <CircleHelp class="size-3.5 text-muted-foreground" :title="`${settingHints.headingLevel2Prefix} ${settingHints.headingLevel2Suffix} ${settingHints.headingLevel2Divider}`" />
                </p>
                <div class="grid gap-2 sm:grid-cols-3">
                  <Input
                    v-model="preferences.headingLevel2Prefix"
                    aria-label="二级标题前缀"
                    class="h-8 bg-white/70 font-mono"
                    placeholder="前缀"
                    title="二级标题前缀"
                    spellcheck="false"
                  />
                  <Input
                    v-model="preferences.headingLevel2Suffix"
                    aria-label="二级标题后缀"
                    class="h-8 bg-white/70 font-mono"
                    placeholder="后缀"
                    title="二级标题后缀"
                    spellcheck="false"
                  />
                  <Input
                    v-model="preferences.headingLevel2Divider"
                    aria-label="二级标题分隔行"
                    class="h-8 bg-white/70 font-mono"
                    placeholder="分隔行"
                    title="二级标题分隔行"
                    spellcheck="false"
                  />
                </div>
              </div>

              <div class="space-y-2 rounded-md border bg-background/70 p-3">
                <p class="flex items-center gap-1 text-xs font-medium">
                  <span>三级标题</span>
                  <CircleHelp class="size-3.5 text-muted-foreground" :title="`${settingHints.headingLevel3Prefix} ${settingHints.headingLevel3Suffix} ${settingHints.headingLevel3Divider}`" />
                </p>
                <div class="grid gap-2 sm:grid-cols-3">
                  <Input
                    v-model="preferences.headingLevel3Prefix"
                    aria-label="三级标题前缀"
                    class="h-8 bg-white/70 font-mono"
                    placeholder="前缀"
                    title="三级标题前缀"
                    spellcheck="false"
                  />
                  <Input
                    v-model="preferences.headingLevel3Suffix"
                    aria-label="三级标题后缀"
                    class="h-8 bg-white/70 font-mono"
                    placeholder="后缀"
                    title="三级标题后缀"
                    spellcheck="false"
                  />
                  <Input
                    v-model="preferences.headingLevel3Divider"
                    aria-label="三级标题分隔行"
                    class="h-8 bg-white/70 font-mono"
                    placeholder="分隔行"
                    title="三级标题分隔行"
                    spellcheck="false"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="space-y-2 pt-1">
            <p class="text-xs font-medium text-muted-foreground">
              其他格式
            </p>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div class="space-y-1.5">
                <Label for="quote-prefix" :class="labelClass()">
                  <span>引用前缀</span>
                  <CircleHelp class="size-3.5" :title="settingHints.quotePrefix" />
                </Label>
                <Input
                  id="quote-prefix"
                  v-model="preferences.quotePrefix"
                  class="h-8 bg-white/70 font-mono"
                  spellcheck="false"
                />
              </div>

              <div class="space-y-1.5">
                <Label for="image-label" :class="labelClass()">
                  <span>图片标签</span>
                  <CircleHelp class="size-3.5" :title="settingHints.imageLabel" />
                </Label>
                <Input
                  id="image-label"
                  v-model="preferences.imageLabel"
                  class="h-8 bg-white/70 font-mono"
                  spellcheck="false"
                />
              </div>

              <div class="space-y-1.5">
                <Label for="code-block-label" :class="labelClass()">
                  <span>代码标签</span>
                  <CircleHelp class="size-3.5" :title="settingHints.codeBlockLabel" />
                </Label>
                <Input
                  id="code-block-label"
                  v-model="preferences.codeBlockLabel"
                  class="h-8 bg-white/70 font-mono"
                  spellcheck="false"
                />
              </div>
            </div>
          </section>
        </CardContent>
      </Card>

      <section class="grid flex-1 gap-4 xl:grid-cols-2">
        <Card class="flex min-h-[26rem] flex-col border-white/70 bg-white/85 shadow-sm backdrop-blur">
          <CardHeader class="gap-0 py-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <CardTitle class="truncate text-sm font-semibold">Markdown</CardTitle>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" @click="localFile.openFileDialog">
                  打开
                </Button>
                <Button variant="outline" size="sm" @click="pasteMarkdown">
                  {{ pasteButtonLabel }}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent class="flex flex-1 flex-col pt-1 pb-1">
            <input
              :ref="localFile.fileInputRef"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              class="hidden"
              type="file"
              @change="localFile.handleFileChange"
            >
            <Textarea
              v-model="markdownSource"
              class="min-h-[22rem] flex-1 resize-none bg-white/70 font-mono text-sm leading-5.5"
              placeholder="# 会议纪要&#10;&#10;- 已完成事项&#10;- 待跟进事项"
            />
          </CardContent>
        </Card>

        <Card class="flex min-h-[26rem] flex-col border-white/70 bg-slate-50/90 shadow-sm backdrop-blur">
          <CardHeader class="gap-0 py-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <CardTitle class="truncate text-sm font-semibold">转换结果</CardTitle>
              <Button size="sm" @click="copyText(outputText)">
                {{ copyButtonLabel }}
              </Button>
            </div>
          </CardHeader>
          <CardContent class="flex flex-1 flex-col gap-2 pt-1 pb-1">
            <Textarea
              v-model="outputText"
              class="min-h-[22rem] flex-1 resize-none bg-white/85 font-mono text-sm leading-5.5"
              placeholder="转换结果会显示在这里"
            />
            <p
              v-if="helperMessage"
              class="truncate text-xs text-muted-foreground"
            >
              {{ helperMessage }}
            </p>
          </CardContent>
        </Card>
      </section>

      <footer class="pb-1 text-xs leading-5 text-muted-foreground">
        <p>
          转换在浏览器本地完成，只保存设置偏好到
          <code class="rounded bg-white/70 px-1 py-0.5 text-[11px] text-foreground">localStorage</code>.
        </p>
        <p>
          md2human v1.0.0 by Juexe
        </p>
      </footer>
    </main>
  </div>
</template>
