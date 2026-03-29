import type { OutputPreferences, StoredOutputPreferences } from '@/types/preferences'

export const OUTPUT_PREFERENCES_STORAGE_KEY = 'markdown2human:preferences'
export const OUTPUT_PREFERENCES_STORAGE_VERSION = 3

export const defaultOutputPreferences: OutputPreferences = {
  unorderedListBullet: '·',
  orderedListSuffix: '.',
  tableSeparator: ' | ',
  tableRenderMode: 'keyValue',
  tableDslTemplate: '{cols:1}: {pairs:2..}。',
  tablePairSeparator: '，',
  tableFirstPairSeparator: '(',
  tableKeyValueSeparator: '：',
  tableRowSuffix: ')',
  tableUseHeaderRow: true,
  tableSkipEmptyCells: true,
  paragraphSpacing: 'normal',
  headingLevel1Prefix: '《',
  headingLevel1Suffix: '》',
  headingLevel1Divider: '',
  headingLevel2Prefix: '【',
  headingLevel2Suffix: '】',
  headingLevel2Divider: '',
  headingLevel3Prefix: '//',
  headingLevel3Suffix: '',
  headingLevel3Divider: '',
  quotePrefix: '',
  imageLabel: '',
  codeBlockLabel: '',
  preserveOrderedListNumber: true,
  preserveLinkUrl: true,
  preserveImageAlt: false,
  preserveCodeBlock: false,
}

export function createStoredOutputPreferences(
  data: OutputPreferences = defaultOutputPreferences,
): StoredOutputPreferences {
  return {
    version: OUTPUT_PREFERENCES_STORAGE_VERSION,
    data: { ...data },
  }
}
