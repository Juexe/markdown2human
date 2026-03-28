export interface OutputPreferences {
  unorderedListBullet: '-' | '*' | '•'
  tableSeparator: 'pipe' | 'space' | 'tab'
  paragraphSpacing: 'compact' | 'normal' | 'relaxed'
  preserveOrderedListNumber: boolean
  preserveLinkUrl: boolean
  preserveImageAlt: boolean
  preserveCodeBlock: boolean
}

export interface StoredOutputPreferences {
  version: number
  data: OutputPreferences
}
