import { ref } from 'vue'
import { useClipboard as useVueUseClipboard } from '@vueuse/core'

type CopyState = 'idle' | 'success' | 'error'

export function useClipboard() {
  const { copy, isSupported } = useVueUseClipboard()
  const copyState = ref<CopyState>('idle')
  const copyMessage = ref('')
  let resetTimer: number | undefined

  function scheduleReset() {
    window.clearTimeout(resetTimer)
    resetTimer = window.setTimeout(() => {
      copyState.value = 'idle'
      copyMessage.value = ''
    }, 1600)
  }

  async function copyText(value: string) {
    if (!value.trim()) {
      copyState.value = 'error'
      copyMessage.value = '没有可复制的内容'
      scheduleReset()
      return
    }

    try {
      if (!isSupported.value) {
        throw new Error('Clipboard API is not supported.')
      }

      await copy(value)
      copyState.value = 'success'
      copyMessage.value = '已复制'
    } catch {
      copyState.value = 'error'
      copyMessage.value = '复制失败'
    }

    scheduleReset()
  }

  return {
    copyState,
    copyMessage,
    copyText,
  }
}
