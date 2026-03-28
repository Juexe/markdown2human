<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useClipboard } from '@/composables/useClipboard'
import { useLocalFile } from '@/composables/useLocalFile'
import { useMarkdownTransform } from '@/composables/useMarkdownTransform'
import { useOutputPreferences } from '@/composables/useOutputPreferences'
import { defaultOutputPreferences } from '@/domain/storage'

const markdownSource = ref('')
const outputText = ref('')
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

const listBulletOptions = [
  { label: '- 短横线', value: '-' },
  { label: '* 星号', value: '*' },
  { label: '• 圆点', value: '•' },
] as const

const tableSeparatorOptions = [
  { label: '竖线分隔', value: 'pipe' },
  { label: '空格分隔', value: 'space' },
  { label: 'Tab 分隔', value: 'tab' },
] as const

const paragraphSpacingOptions = [
  { label: '紧凑', value: 'compact' },
  { label: '标准', value: 'normal' },
  { label: '宽松', value: 'relaxed' },
] as const

const copyButtonLabel = computed(() => {
  if (copyState.value === 'success') {
    return '已复制'
  }

  if (copyState.value === 'error') {
    return '复制失败'
  }

  return '复制'
})

const helperMessage = computed(() => localFile.fileError.value || transformError.value || (copyState.value === 'error' ? copyMessage.value : ''))

function clearMarkdown() {
  markdownSource.value = ''
}

function restoreDefaultPreferences() {
  if (JSON.stringify(preferences.value) === JSON.stringify(defaultOutputPreferences)) {
    return
  }

  resetPreferences()
}
</script>

<template>
  <Dialog>
    <div class="min-h-screen bg-[linear-gradient(180deg,#f7f4ee_0%,#f5f7fb_55%,#ffffff_100%)]">
      <main class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="space-y-2">
            <p class="text-sm font-medium tracking-[0.24em] text-muted-foreground uppercase">
              Markdown2Human
            </p>
            <div class="space-y-1">
              <h1 class="font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                把 Markdown 整理成更适合转发的纯文本
              </h1>
              <p class="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                左侧输入原文，右侧自动生成可复制结果。设置只保存在本地，不会保存你的正文内容。
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Button
              variant="outline"
              @click="restoreDefaultPreferences"
            >
              恢复默认
            </Button>
            <DialogTrigger as-child>
              <Button variant="outline">
                关于
              </Button>
            </DialogTrigger>
          </div>
        </section>

        <Card class="border-white/70 bg-white/80 shadow-sm backdrop-blur">
          <CardHeader class="gap-2">
            <CardTitle class="text-base">
              输出设置
            </CardTitle>
            <CardDescription>
              只保留高频项，修改后立即刷新结果。
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid gap-4 lg:grid-cols-3">
              <div class="space-y-2">
                <Label for="unordered-list-bullet">无序列表符号</Label>
                <Select v-model="preferences.unorderedListBullet">
                  <SelectTrigger id="unordered-list-bullet" class="w-full">
                    <SelectValue placeholder="选择列表符号" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in listBulletOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="table-separator">表格分隔方式</Label>
                <Select v-model="preferences.tableSeparator">
                  <SelectTrigger id="table-separator" class="w-full">
                    <SelectValue placeholder="选择表格分隔方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in tableSeparatorOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="paragraph-spacing">段落间距</Label>
                <Select v-model="preferences.paragraphSpacing">
                  <SelectTrigger id="paragraph-spacing" class="w-full">
                    <SelectValue placeholder="选择段落间距" />
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
            </div>

            <Separator />

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label class="flex items-center justify-between gap-4 rounded-lg border bg-background/70 px-4 py-3">
                <div class="space-y-1">
                  <p class="text-sm font-medium">保留有序列表编号</p>
                  <p class="text-xs text-muted-foreground">关闭后按无序列表输出</p>
                </div>
                <Switch v-model="preferences.preserveOrderedListNumber" />
              </label>

              <label class="flex items-center justify-between gap-4 rounded-lg border bg-background/70 px-4 py-3">
                <div class="space-y-1">
                  <p class="text-sm font-medium">保留链接地址</p>
                  <p class="text-xs text-muted-foreground">显示为 文本 (URL)</p>
                </div>
                <Switch v-model="preferences.preserveLinkUrl" />
              </label>

              <label class="flex items-center justify-between gap-4 rounded-lg border bg-background/70 px-4 py-3">
                <div class="space-y-1">
                  <p class="text-sm font-medium">保留图片说明</p>
                  <p class="text-xs text-muted-foreground">不保留图片本体</p>
                </div>
                <Switch v-model="preferences.preserveImageAlt" />
              </label>

              <label class="flex items-center justify-between gap-4 rounded-lg border bg-background/70 px-4 py-3">
                <div class="space-y-1">
                  <p class="text-sm font-medium">保留代码块</p>
                  <p class="text-xs text-muted-foreground">关闭后整块忽略</p>
                </div>
                <Switch v-model="preferences.preserveCodeBlock" />
              </label>
            </div>
          </CardContent>
        </Card>

        <section class="grid flex-1 gap-6 xl:grid-cols-2">
          <Card class="flex min-h-[28rem] flex-col border-white/70 bg-white/85 shadow-sm backdrop-blur">
            <CardHeader class="gap-3">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="space-y-1">
                  <CardTitle>Markdown</CardTitle>
                  <CardDescription>
                    粘贴内容或打开本地文件。
                  </CardDescription>
                </div>
                <div class="flex gap-2">
                  <Button
                    variant="outline"
                    @click="localFile.openFileDialog"
                  >
                    打开
                  </Button>
                  <Button
                    variant="outline"
                    @click="clearMarkdown"
                  >
                    清空
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent class="flex flex-1 flex-col">
              <input
                :ref="localFile.fileInputRef"
                accept=".md,.markdown,.txt,text/markdown,text/plain"
                class="hidden"
                type="file"
                @change="localFile.handleFileChange"
              >
              <Textarea
                v-model="markdownSource"
                class="min-h-[24rem] flex-1 resize-none bg-white/70 font-mono text-sm leading-6"
                placeholder="# 会议纪要&#10;&#10;- 已完成事项&#10;- 待跟进事项"
              />
            </CardContent>
          </Card>

          <Card class="flex min-h-[28rem] flex-col border-white/70 bg-slate-50/90 shadow-sm backdrop-blur">
            <CardHeader class="gap-3">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="space-y-1">
                  <CardTitle>转换结果</CardTitle>
                  <CardDescription>
                    自动生成后仍可继续手工修改。
                  </CardDescription>
                </div>
                <Button @click="copyText(outputText)">
                  {{ copyButtonLabel }}
                </Button>
              </div>
            </CardHeader>
            <CardContent class="flex flex-1 flex-col gap-3">
              <Textarea
                v-model="outputText"
                class="min-h-[24rem] flex-1 resize-none bg-white/85 font-mono text-sm leading-6"
                placeholder="转换结果会显示在这里"
              />
              <p
                v-if="helperMessage"
                class="text-sm text-muted-foreground"
              >
                {{ helperMessage }}
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>

    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>关于 Markdown2Human</DialogTitle>
        <DialogDescription>
          这是一个纯前端单页工具，用来把 Markdown 快速整理成更适合聊天、转发和纯文本窗口阅读的结果。
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>
          转换在浏览器本地完成，不依赖服务端。应用只会把你的输出偏好保存在
          <code class="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">localStorage</code>
          里，不会持久化正文内容。
        </p>
        <p>
          当前版本聚焦标题、列表、引用、链接、图片说明、代码块和表格的基础文本化输出，目标是得到一份可直接复制和继续修改的文本结果。
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>
