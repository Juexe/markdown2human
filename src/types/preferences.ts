export interface OutputPreferences {
  unorderedListBullet: string
  orderedListSuffix: string
  tableSeparator: string
  paragraphSpacing: string
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
