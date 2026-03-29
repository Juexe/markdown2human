import type { OutputPreferences, StoredOutputPreferences } from '@/types/preferences'

export const OUTPUT_PREFERENCES_STORAGE_KEY = 'markdown2human:preferences'
export const OUTPUT_PREFERENCES_STORAGE_VERSION = 1

export const defaultOutputPreferences: OutputPreferences = {
  unorderedListBullet: '-',
  orderedListSuffix: '.',
  tableSeparator: ' | ',
  tableRenderMode: 'simple',
  tableDslTemplate: '{pairs}',
  tablePairSeparator: '，',
  tableKeyValueSeparator: '：',
  tableRowSuffix: '',
  tableUseHeaderRow: true,
  tableSkipEmptyCells: true,
  paragraphSpacing: 'normal',
  headingLevel1Prefix: '',
  headingLevel1Suffix: '',
  headingLevel1Divider: '',
  headingLevel2Prefix: '',
  headingLevel2Suffix: '',
  headingLevel2Divider: '',
  headingLevel3Prefix: '',
  headingLevel3Suffix: '',
  headingLevel3Divider: '',
  quotePrefix: '> ',
  imageLabel: '图片：',
  codeBlockLabel: '代码块',
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
