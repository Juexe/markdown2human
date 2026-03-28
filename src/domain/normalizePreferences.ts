import type { OutputPreferences } from '@/types/preferences'
import { defaultOutputPreferences } from '@/domain/storage'

const unorderedListBullets = new Set<OutputPreferences['unorderedListBullet']>(['-', '*', '•'])
const tableSeparators = new Set<OutputPreferences['tableSeparator']>(['pipe', 'space', 'tab'])
const paragraphSpacings = new Set<OutputPreferences['paragraphSpacing']>(['compact', 'normal', 'relaxed'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function normalizePreferences(raw: unknown): OutputPreferences {
  if (!isRecord(raw)) {
    return { ...defaultOutputPreferences }
  }

  return {
    unorderedListBullet: unorderedListBullets.has(raw.unorderedListBullet as OutputPreferences['unorderedListBullet'])
      ? (raw.unorderedListBullet as OutputPreferences['unorderedListBullet'])
      : defaultOutputPreferences.unorderedListBullet,
    tableSeparator: tableSeparators.has(raw.tableSeparator as OutputPreferences['tableSeparator'])
      ? (raw.tableSeparator as OutputPreferences['tableSeparator'])
      : defaultOutputPreferences.tableSeparator,
    paragraphSpacing: paragraphSpacings.has(raw.paragraphSpacing as OutputPreferences['paragraphSpacing'])
      ? (raw.paragraphSpacing as OutputPreferences['paragraphSpacing'])
      : defaultOutputPreferences.paragraphSpacing,
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
