<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown, RotateCcw } from 'lucide-vue-next'
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
const showAdvancedSettings = ref(false)
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

const unorderedListBulletSuggestions = ['-', '*', '•', '·', '→', '✓']
const orderedListSuffixSuggestions = ['.', ')', '、', ':', '-']
const tableSeparatorSuggestions = [' | ', '  ', '\\t', ', ', ' ｜ ', ' / ']
const paragraphSpacingOptions = [
  { label: '紧凑', value: 'compact' },
  { label: '标准', value: 'normal' },
  { label: '宽松', value: 'relaxed' },
  { label: '更宽', value: 'wide' },
] as const
const quotePrefixSuggestions = ['> ', '｜ ', '引用：', '// ', '※ ']
const imageLabelSuggestions = ['图片：', '图：', 'Image:', 'Alt:', '']
const codeBlockLabelSuggestions = ['代码块', '代码', 'Snippet', 'Code', '源码']

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
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#f7f4ee_0%,#f5f7fb_55%,#ffffff_100%)]">
    <main class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <Card class="border-white/70 bg-white/80 shadow-sm backdrop-blur">
        <CardContent class="space-y-2 py-2">
          <div class="flex min-w-0 items-center gap-3">
            <p class="shrink-0 text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
              md2human
            </p>
            <span class="h-4 w-px shrink-0 bg-border" />
            <h1 class="min-w-0 truncate font-sans text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              把 Markdown 整理成更适合转发的纯文本
            </h1>
          </div>

          <div class="overflow-x-auto">
            <div class="flex min-w-max items-center gap-3">
              <CardTitle class="shrink-0 text-sm font-semibold">
                输出设置
              </CardTitle>
              <span class="h-4 w-px shrink-0 bg-border" />

              <div class="flex shrink-0 items-center gap-2">
                <Label for="unordered-list-bullet" class="shrink-0 text-xs text-muted-foreground">列表符号</Label>
                <Input
                  id="unordered-list-bullet"
                  v-model="preferences.unorderedListBullet"
                  class="h-8 w-20 bg-white/70 font-mono"
                  list="unordered-list-bullet-suggestions"
                  spellcheck="false"
                />
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <Label for="table-separator" class="shrink-0 text-xs text-muted-foreground">表格分隔</Label>
                <Input
                  id="table-separator"
                  v-model="preferences.tableSeparator"
                  class="h-8 w-24 bg-white/70 font-mono"
                  list="table-separator-suggestions"
                  spellcheck="false"
                />
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <Label for="paragraph-spacing" class="shrink-0 text-xs text-muted-foreground">段落间距</Label>
                <Select v-model="preferences.paragraphSpacing">
                  <SelectTrigger id="paragraph-spacing" class="h-8 w-24 bg-white/70 text-xs">
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

              <label class="flex shrink-0 items-center gap-2 rounded-md border bg-background/70 px-2.5 py-1.5">
                <p class="truncate text-xs font-medium">有序编号</p>
                <Switch v-model="preferences.preserveOrderedListNumber" />
              </label>

              <label class="flex shrink-0 items-center gap-2 rounded-md border bg-background/70 px-2.5 py-1.5">
                <p class="truncate text-xs font-medium">链接地址</p>
                <Switch v-model="preferences.preserveLinkUrl" />
              </label>

              <div class="min-w-4 flex-1" />

              <Button
                size="sm"
                variant="outline"
                @click="showAdvancedSettings = !showAdvancedSettings"
              >
                高级设置
                <ChevronDown class="transition-transform" :class="showAdvancedSettings ? 'rotate-180' : ''" />
              </Button>

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
          </div>

          <div v-if="showAdvancedSettings" class="overflow-x-auto border-t border-border/70 pt-2">
            <div class="flex min-w-max items-center gap-3">
              <div class="flex shrink-0 items-center gap-2">
                <Label for="ordered-list-suffix" class="shrink-0 text-xs text-muted-foreground">编号后缀</Label>
                <Input
                  id="ordered-list-suffix"
                  v-model="preferences.orderedListSuffix"
                  class="h-8 w-20 bg-white/70 font-mono"
                  list="ordered-list-suffix-suggestions"
                  spellcheck="false"
                />
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <Label for="quote-prefix" class="shrink-0 text-xs text-muted-foreground">引用前缀</Label>
                <Input
                  id="quote-prefix"
                  v-model="preferences.quotePrefix"
                  class="h-8 w-24 bg-white/70 font-mono"
                  list="quote-prefix-suggestions"
                  spellcheck="false"
                />
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <Label for="image-label" class="shrink-0 text-xs text-muted-foreground">图片标签</Label>
                <Input
                  id="image-label"
                  v-model="preferences.imageLabel"
                  class="h-8 w-24 bg-white/70 font-mono"
                  list="image-label-suggestions"
                  spellcheck="false"
                />
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <Label for="code-block-label" class="shrink-0 text-xs text-muted-foreground">代码标签</Label>
                <Input
                  id="code-block-label"
                  v-model="preferences.codeBlockLabel"
                  class="h-8 w-24 bg-white/70 font-mono"
                  list="code-block-label-suggestions"
                  spellcheck="false"
                />
              </div>

              <label class="flex shrink-0 items-center gap-2 rounded-md border bg-background/70 px-2.5 py-1.5">
                <p class="truncate text-xs font-medium">图片说明</p>
                <Switch v-model="preferences.preserveImageAlt" />
              </label>

              <label class="flex shrink-0 items-center gap-2 rounded-md border bg-background/70 px-2.5 py-1.5">
                <p class="truncate text-xs font-medium">代码块</p>
                <Switch v-model="preferences.preserveCodeBlock" />
              </label>
            </div>

            <datalist id="unordered-list-bullet-suggestions">
              <option
                v-for="option in unorderedListBulletSuggestions"
                :key="option"
                :value="option"
              />
            </datalist>
            <datalist id="ordered-list-suffix-suggestions">
              <option
                v-for="option in orderedListSuffixSuggestions"
                :key="option"
                :value="option"
              />
            </datalist>
            <datalist id="table-separator-suggestions">
              <option
                v-for="option in tableSeparatorSuggestions"
                :key="option"
                :value="option"
              />
            </datalist>
            <datalist id="quote-prefix-suggestions">
              <option
                v-for="option in quotePrefixSuggestions"
                :key="option"
                :value="option"
              />
            </datalist>
            <datalist id="image-label-suggestions">
              <option
                v-for="option in imageLabelSuggestions"
                :key="option"
                :value="option"
              />
            </datalist>
            <datalist id="code-block-label-suggestions">
              <option
                v-for="option in codeBlockLabelSuggestions"
                :key="option"
                :value="option"
              />
            </datalist>
          </div>
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
