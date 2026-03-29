import type { OutputPreferences, TableRenderMode } from '@/types/preferences'

interface TableData {
  headers: string[]
  rows: string[][]
}

interface RowContext {
  headers: string[]
  row: string[]
  preferences: OutputPreferences
}

const presetTemplates: Record<Exclude<TableRenderMode, 'dsl'>, string> = {
  simple: '{cols}',
  keyValue: '{pairs}',
}

export function renderTableRows(rows: string[][], preferences: OutputPreferences): string {
  if (!rows.length) {
    return ''
  }

  const tableData = createTableData(rows, preferences)
  const displayRows = tableData.rows.length
    ? tableData.rows
    : rows

  if (!displayRows.length) {
    return ''
  }

  const template = resolveTableTemplate(preferences)

  try {
    return displayRows
      .map((row) => renderRowTemplate(template, {
        headers: tableData.headers,
        row,
        preferences,
      }))
      .filter(Boolean)
      .join('\n')
  } catch {
    return renderSimpleRows(displayRows, preferences)
  }
}

function createTableData(rows: string[][], preferences: OutputPreferences): TableData {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0)

  if (!width) {
    return {
      headers: [],
      rows: [],
    }
  }

  const normalizedRows = rows.map((row) => padRow(row, width))

  if (!preferences.tableUseHeaderRow) {
    return {
      headers: createGeneratedHeaders(width),
      rows: normalizedRows,
    }
  }

  const [headerRow, ...dataRows] = normalizedRows

  return {
    headers: createUniqueHeaders(headerRow, width),
    rows: dataRows,
  }
}

function padRow(row: string[], width: number): string[] {
  return Array.from({ length: width }, (_, index) => row[index] ?? '')
}

function createGeneratedHeaders(width: number): string[] {
  return Array.from({ length: width }, (_, index) => `列${index + 1}`)
}

function createUniqueHeaders(row: string[], width: number): string[] {
  const used = new Map<string, number>()

  return Array.from({ length: width }, (_, index) => {
    const baseName = row[index]?.trim() || (index === 0 ? '' : `列${index + 1}`)
    const count = (used.get(baseName) ?? 0) + 1

    used.set(baseName, count)

    if (!baseName) {
      return ''
    }

    return count === 1 ? baseName : `${baseName} ${count}`
  })
}

function resolveTableTemplate(preferences: OutputPreferences): string {
  if (preferences.tableRenderMode === 'dsl') {
    return preferences.tableDslTemplate.trim() || presetTemplates.keyValue
  }

  return presetTemplates[preferences.tableRenderMode]
}

function renderRowTemplate(template: string, context: RowContext): string {
  const resolvedConditions = renderConditionalBlocks(template, context)

  return normalizeDslOutput(
    resolvedConditions.replace(/\{([^{}]+)\}/g, (match, rawExpression: string) => {
      const replacement = renderToken(rawExpression.trim(), context)
      return replacement ?? match
    }),
  )
}

function renderConditionalBlocks(template: string, context: RowContext): string {
  const conditionalPattern = /\{if:([^{}]+)\}([\s\S]*?)\{end\}/g
  let result = template

  while (conditionalPattern.test(result)) {
    conditionalPattern.lastIndex = 0
    result = result.replace(conditionalPattern, (_, rawSelector: string, inner: string) => {
      return hasSelectedValue(rawSelector.trim(), context)
        ? renderRowTemplate(inner, context)
        : ''
    })
  }

  return result
}

function hasSelectedValue(selector: string, context: RowContext): boolean {
  return resolveIndexes(selector, context.headers).some((index) => {
    return Boolean(context.row[index]?.trim())
  })
}

function renderToken(expression: string, context: RowContext): string | null {
  const [head, ...overrideParts] = expression.split('|')
  const [command, rawSelector = ''] = splitByFirstColon(head)
  const selector = rawSelector.trim()

  switch (command.trim()) {
    case 'col':
      return renderColumn(selector, context)
    case 'header':
      return renderHeader(selector, context)
    case 'kv':
      return renderKeyValue(selector, context, decodeEscapes(overrideParts[0] ?? ''))
    case 'cols':
      return renderColumns(selector, context, decodeEscapes(overrideParts[0] ?? ''))
    case 'pairs':
      return renderPairs(
        selector,
        context,
        decodeEscapes(overrideParts[0] ?? ''),
        decodeEscapes(overrideParts[1] ?? ''),
      )
    default:
      return null
  }
}

function renderColumn(selector: string, context: RowContext): string {
  const index = resolveFirstIndex(selector, context.headers)

  if (index === null) {
    return ''
  }

  return context.row[index] ?? ''
}

function renderHeader(selector: string, context: RowContext): string {
  const index = resolveFirstIndex(selector, context.headers)

  if (index === null) {
    return ''
  }

  return context.headers[index] ?? ''
}

function renderKeyValue(selector: string, context: RowContext, customKeyValueSeparator: string): string {
  const index = resolveFirstIndex(selector, context.headers)

  if (index === null) {
    return ''
  }

  return formatKeyValue(index, context, customKeyValueSeparator)
}

function renderColumns(selector: string, context: RowContext, customSeparator: string): string {
  const separator = customSeparator || resolveSimpleSeparator(context.preferences)

  return joinColumns(
    resolveIndexes(selector, context.headers)
    .map((index) => context.row[index] ?? '')
    .filter((value) => value || !context.preferences.tableSkipEmptyCells),
    separator,
  )
}

function renderPairs(
  selector: string,
  context: RowContext,
  customPairSeparator: string,
  customKeyValueSeparator: string,
): string {
  const pairSeparator = customPairSeparator || resolvePairSeparator(context.preferences)

  return resolveIndexes(selector, context.headers)
    .map((index) => formatKeyValue(index, context, customKeyValueSeparator))
    .filter(Boolean)
    .join(pairSeparator)
}

function formatKeyValue(index: number, context: RowContext, customKeyValueSeparator = ''): string {
  const key = context.headers[index] ?? `列${index + 1}`
  const value = context.row[index] ?? ''

  if (!value && context.preferences.tableSkipEmptyCells) {
    return ''
  }

  if (!key) {
    return value
  }

  const separator = customKeyValueSeparator || resolveKeyValueSeparator(context.preferences)
  return `${key}${separator}${value}`
}

function resolveIndexes(selector: string, headers: string[]): number[] {
  if (!headers.length) {
    return []
  }

  if (!selector) {
    return headers.map((_, index) => index)
  }

  if (selector.endsWith('..')) {
    const startIndex = resolveFirstIndex(selector.slice(0, -2).trim(), headers)

    if (startIndex === null) {
      return []
    }

    return headers.slice(startIndex).map((_, offset) => startIndex + offset)
  }

  const singleIndex = resolveFirstIndex(selector, headers)
  return singleIndex === null ? [] : [singleIndex]
}

function resolveFirstIndex(selector: string, headers: string[]): number | null {
  if (!headers.length) {
    return null
  }

  if (!selector) {
    return 0
  }

  if (/^\d+$/.test(selector)) {
    const index = Number.parseInt(selector, 10) - 1
    return index >= 0 && index < headers.length ? index : null
  }

  const exactIndex = headers.findIndex((header) => header === selector)

  if (exactIndex >= 0) {
    return exactIndex
  }

  const lowerCaseSelector = selector.toLowerCase()
  const insensitiveIndex = headers.findIndex((header) => header.toLowerCase() === lowerCaseSelector)

  return insensitiveIndex >= 0 ? insensitiveIndex : null
}

function renderSimpleRows(rows: string[][], preferences: OutputPreferences): string {
  return rows
    .map((row) => joinColumns(row, resolveSimpleSeparator(preferences)).trim())
    .filter(Boolean)
    .join('\n')
}

function resolveSimpleSeparator(preferences: OutputPreferences): string {
  return decodeEscapes(preferences.tableSeparator)
}

function resolvePairSeparator(preferences: OutputPreferences): string {
  return decodeEscapes(preferences.tablePairSeparator)
}

function resolveKeyValueSeparator(preferences: OutputPreferences): string {
  return decodeEscapes(preferences.tableKeyValueSeparator)
}

function joinColumns(values: string[], separator: string): string {
  if (!values.length) {
    return ''
  }

  return values.join(separator)
}

function splitByFirstColon(value: string): [string, string] {
  const separatorIndex = value.indexOf(':')

  if (separatorIndex < 0) {
    return [value, '']
  }

  return [
    value.slice(0, separatorIndex),
    value.slice(separatorIndex + 1),
  ]
}

function decodeEscapes(value: string): string {
  return value
    .replace(/\\t/g, '\t')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
}

function normalizeDslOutput(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
