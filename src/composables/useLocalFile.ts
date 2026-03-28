import { ref, type Ref } from 'vue'

export function useLocalFile(markdownSource: Ref<string>) {
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const fileError = ref('')

  function openFileDialog() {
    fileInputRef.value?.click()
  }

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) {
      return
    }

    try {
      markdownSource.value = await file.text()
      fileError.value = ''
    } catch {
      fileError.value = '文件读取失败，请重新选择。'
    } finally {
      input.value = ''
    }
  }

  return {
    fileInputRef,
    fileError,
    openFileDialog,
    handleFileChange,
  }
}
