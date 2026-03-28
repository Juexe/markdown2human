import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import type { OutputPreferences } from '@/types/preferences'
import { normalizePreferences } from '@/domain/normalizePreferences'
import {
  createStoredOutputPreferences,
  defaultOutputPreferences,
  OUTPUT_PREFERENCES_STORAGE_KEY,
  OUTPUT_PREFERENCES_STORAGE_VERSION,
} from '@/domain/storage'

export function useOutputPreferences() {
  const storedPreferences = useStorage(
    OUTPUT_PREFERENCES_STORAGE_KEY,
    createStoredOutputPreferences(),
  )

  const preferences = ref<OutputPreferences>(
    normalizePreferences(
      storedPreferences.value.version === OUTPUT_PREFERENCES_STORAGE_VERSION
        ? storedPreferences.value.data
        : defaultOutputPreferences,
    ),
  )

  watch(
    preferences,
    (value) => {
      storedPreferences.value = createStoredOutputPreferences(value)
    },
    {
      deep: true,
      immediate: true,
    },
  )

  function resetPreferences() {
    preferences.value = { ...defaultOutputPreferences }
  }

  return {
    preferences,
    resetPreferences,
  }
}
