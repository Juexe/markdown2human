import type { OutputPreferences, TableRenderMode } from '@/types/preferences'
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

function normalizeTableRenderMode(value: unknown): TableRenderMode {
  return value === 'simple' || value === 'keyValue' || value === 'lead' || value === 'dsl'
    ? value
    : defaultOutputPreferences.tableRenderMode
}

export function normalizePreferences(raw: unknown): OutputPreferences {
  if (!isRecord(raw)) {
    return { ...defaultOutputPreferences }
  }

  return {
    unorderedListBullet: normalizeTextPreference(raw.unorderedListBullet, defaultOutputPreferences.unorderedListBullet),
    orderedListSuffix: normalizeTextPreference(raw.orderedListSuffix, defaultOutputPreferences.orderedListSuffix),
    tableSeparator: normalizeTextPreference(raw.tableSeparator, defaultOutputPreferences.tableSeparator),
    tableRenderMode: normalizeTableRenderMode(raw.tableRenderMode),
    tableDslTemplate: normalizeTextPreference(raw.tableDslTemplate, defaultOutputPreferences.tableDslTemplate),
    tablePairSeparator: normalizeTextPreference(raw.tablePairSeparator, defaultOutputPreferences.tablePairSeparator),
    tableKeyValueSeparator: normalizeTextPreference(raw.tableKeyValueSeparator, defaultOutputPreferences.tableKeyValueSeparator),
    tableRowSuffix: normalizeTextPreference(raw.tableRowSuffix, defaultOutputPreferences.tableRowSuffix),
    tableUseHeaderRow: typeof raw.tableUseHeaderRow === 'boolean'
      ? raw.tableUseHeaderRow
      : defaultOutputPreferences.tableUseHeaderRow,
    tableSkipEmptyCells: typeof raw.tableSkipEmptyCells === 'boolean'
      ? raw.tableSkipEmptyCells
      : defaultOutputPreferences.tableSkipEmptyCells,
    paragraphSpacing: normalizeTextPreference(raw.paragraphSpacing, defaultOutputPreferences.paragraphSpacing),
    headingLevel1Prefix: normalizeTextPreference(raw.headingLevel1Prefix, defaultOutputPreferences.headingLevel1Prefix),
    headingLevel1Suffix: normalizeTextPreference(raw.headingLevel1Suffix, defaultOutputPreferences.headingLevel1Suffix),
    headingLevel1Divider: normalizeTextPreference(raw.headingLevel1Divider, defaultOutputPreferences.headingLevel1Divider),
    headingLevel2Prefix: normalizeTextPreference(raw.headingLevel2Prefix, defaultOutputPreferences.headingLevel2Prefix),
    headingLevel2Suffix: normalizeTextPreference(raw.headingLevel2Suffix, defaultOutputPreferences.headingLevel2Suffix),
    headingLevel2Divider: normalizeTextPreference(raw.headingLevel2Divider, defaultOutputPreferences.headingLevel2Divider),
    headingLevel3Prefix: normalizeTextPreference(raw.headingLevel3Prefix, defaultOutputPreferences.headingLevel3Prefix),
    headingLevel3Suffix: normalizeTextPreference(raw.headingLevel3Suffix, defaultOutputPreferences.headingLevel3Suffix),
    headingLevel3Divider: normalizeTextPreference(raw.headingLevel3Divider, defaultOutputPreferences.headingLevel3Divider),
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
