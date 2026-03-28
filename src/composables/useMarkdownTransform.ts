import { ref, watch, type Ref } from 'vue'
import type { OutputPreferences } from '@/types/preferences'
import { fallbackMarkdownToText, transformMarkdownToText } from '@/domain/transformMarkdownToText'

export function useMarkdownTransform(
  markdownSource: Ref<string>,
  preferences: Ref<OutputPreferences>,
) {
  const transformedText = ref('')
  const transformError = ref('')

  watch(
    [markdownSource, preferences],
    ([markdown, currentPreferences]) => {
      try {
        transformedText.value = transformMarkdownToText(markdown, currentPreferences)
        transformError.value = ''
      } catch {
        transformedText.value = fallbackMarkdownToText(markdown)
        transformError.value = markdown
          ? '部分内容未按预期解析，已回退为原始文本。'
          : ''
      }
    },
    {
      deep: true,
      immediate: true,
    },
  )

  return {
    transformedText,
    transformError,
  }
}
