export type TableRenderMode = 'simple' | 'keyValue' | 'dsl'
export type ParagraphSpacing = 'compact' | 'normal' | 'relaxed'

export interface OutputPreferences {
  unorderedListBullet: string
  orderedListSuffix: string
  tableSeparator: string
  tableRenderMode: TableRenderMode
  tableDslTemplate: string
  tablePairSeparator: string
  tableFirstPairSeparator: string
  tableKeyValueSeparator: string
  tableRowSuffix: string
  tableUseHeaderRow: boolean
  tableSkipEmptyCells: boolean
  paragraphSpacing: ParagraphSpacing
  headingLevel1Prefix: string
  headingLevel1Suffix: string
  headingLevel1Divider: string
  headingLevel2Prefix: string
  headingLevel2Suffix: string
  headingLevel2Divider: string
  headingLevel3Prefix: string
  headingLevel3Suffix: string
  headingLevel3Divider: string
  quotePrefix: string
  imageLabel: string
  codeBlockLabel: string
  preserveOrderedListNumber: boolean
  preserveLinkUrl: boolean
  preserveImageAlt: boolean
  preserveCodeBlock: boolean
}

export interface StoredOutputPreferences {
  version: number
  data: OutputPreferences
}
