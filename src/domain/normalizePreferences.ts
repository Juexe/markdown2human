import type { OutputPreferences } from '@/types/preferences'
import { defaultOutputPreferences } from '@/domain/storage'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeTextPreference(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback
  }

  return value
}

export function normalizePreferences(raw: unknown): OutputPreferences {
  if (!isRecord(raw)) {
    return { ...defaultOutputPreferences }
  }

  return {
    unorderedListBullet: normalizeTextPreference(raw.unorderedListBullet, defaultOutputPreferences.unorderedListBullet),
    orderedListSuffix: normalizeTextPreference(raw.orderedListSuffix, defaultOutputPreferences.orderedListSuffix),
    tableSeparator: normalizeTextPreference(raw.tableSeparator, defaultOutputPreferences.tableSeparator),
    paragraphSpacing: normalizeTextPreference(raw.paragraphSpacing, defaultOutputPreferences.paragraphSpacing),
    quotePrefix: normalizeTextPreference(raw.quotePrefix, defaultOutputPreferences.quotePrefix),
    imageLabel: normalizeTextPreference(raw.imageLabel, defaultOutputPreferences.imageLabel),
    codeBlockLabel: normalizeTextPreference(raw.codeBlockLabel, defaultOutputPreferences.codeBlockLabel),
    preserveOrderedListNumber: typeof raw.preserveOrderedListNumber === 'boolean'
      ? raw.preserveOrderedListNumber
      : defaultOutputPreferences.preserveOrderedListNumber,
    preserveLinkUrl: typeof raw.preserveLinkUrl === 'boolean'
      ? raw.preserveLinkUrl
      : defaultOutputPreferences.preserveLinkUrl,
    preserveImageAlt: typeof raw.preserveImageAlt === 'boolean'
      ? raw.preserveImageAlt
      : defaultOutputPreferences.preserveImageAlt,
    preserveCodeBlock: typeof raw.preserveCodeBlock === 'boolean'
      ? raw.preserveCodeBlock
      : defaultOutputPreferences.preserveCodeBlock,
  }
}
