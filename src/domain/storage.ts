import type { OutputPreferences, StoredOutputPreferences } from '@/types/preferences'

export const OUTPUT_PREFERENCES_STORAGE_KEY = 'markdown2human:preferences'
export const OUTPUT_PREFERENCES_STORAGE_VERSION = 1

export const defaultOutputPreferences: OutputPreferences = {
  unorderedListBullet: '-',
  tableSeparator: 'pipe',
  paragraphSpacing: 'normal',
  preserveOrderedListNumber: true,
  preserveLinkUrl: true,
  preserveImageAlt: true,
  preserveCodeBlock: true,
}

export function createStoredOutputPreferences(
  data: OutputPreferences = defaultOutputPreferences,
): StoredOutputPreferences {
  return {
    version: OUTPUT_PREFERENCES_STORAGE_VERSION,
    data: { ...data },
  }
}
