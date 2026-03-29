export type TableRenderMode = 'simple' | 'keyValue' | 'dsl'

export interface OutputPreferences {
  unorderedListBullet: string
  orderedListSuffix: string
  tableSeparator: string
  tableRenderMode: TableRenderMode
  tableDslTemplate: string
  tablePairSeparator: string
  tableKeyValueSeparator: string
  tableUseHeaderRow: boolean
  tableSkipEmptyCells: boolean
  paragraphSpacing: string
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
