import type {
  BlockContent,
  Break,
  Code,
  Content,
  Heading,
  Html,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  Table,
  TableCell,
  TableRow,
  Text,
} from 'mdast'
import type { OutputPreferences } from '@/types/preferences'
import { parseMarkdown } from '@/domain/parseMarkdown'

const blockGapAliasMap: Record<string, number> = {
  compact: 2,
  tight: 2,
  normal: 3,
  relaxed: 4,
  loose: 4,
  wide: 5,
}

export function transformMarkdownToText(markdown: string, preferences: OutputPreferences): string {
  if (!markdown.trim()) {
    return ''
  }

  const tree = parseMarkdown(markdown)
  const blockGap = resolveBlockGap(preferences.paragraphSpacing)
  const blocks = renderBlocks(tree.children, preferences, blockGap)

  return blocks
    .join(blockGap)
    .replace(/\n{7,}/g, '\n\n\n\n\n\n')
    .trim()
}

export function fallbackMarkdownToText(markdown: string): string {
  return markdown.replace(/\r\n/g, '\n').trim()
}

function renderBlocks(children: Root['children'] | BlockContent[], preferences: OutputPreferences, blockGap: string): string[] {
  return children
    .map((child) => renderBlock(child, preferences, blockGap))
    .filter((value): value is string => Boolean(value))
}

function renderBlock(node: Content, preferences: OutputPreferences, blockGap: string): string {
  switch (node.type) {
    case 'heading':
      return renderHeading(node, preferences)
    case 'paragraph':
      return renderParagraph(node, preferences)
    case 'list':
      return renderList(node, preferences, 0)
    case 'blockquote':
      return prefixLines(renderBlocks(node.children, preferences, blockGap).join(blockGap), decodeEscapes(preferences.quotePrefix))
    case 'code':
      return renderCodeBlock(node, preferences)
    case 'table':
      return renderTable(node, preferences)
    case 'thematicBreak':
      return '---'
    case 'html':
      return renderHtml(node)
    default:
      if ('children' in node) {
        return renderBlocks(node.children as BlockContent[], preferences, blockGap).join(blockGap)
      }

      return ''
  }
}

function renderHeading(node: Heading, preferences: OutputPreferences): string {
  const text = normalizeInlineText(renderInline(node.children))

  if (!text) {
    return ''
  }

  return formatHeading(text, node.depth, preferences)
}

function renderParagraph(node: Paragraph, preferences: OutputPreferences): string {
  return normalizeInlineText(renderInline(node.children, preferences))
}

function renderList(node: List, preferences: OutputPreferences, level: number): string {
  const startIndex = node.start ?? 1

  return node.children
    .map((item, index) => renderListItem(item, preferences, level, node.ordered ? startIndex + index : null))
    .filter(Boolean)
    .join('\n')
}

function renderListItem(
  node: ListItem,
  preferences: OutputPreferences,
  level: number,
  orderedIndex: number | null,
): string {
  const baseIndent = '  '.repeat(level)
  const nestedIndent = '  '.repeat(level + 1)
  const marker = orderedIndex !== null && preferences.preserveOrderedListNumber
    ? `${orderedIndex}${formatOrderedListSuffix(preferences.orderedListSuffix)} `
    : `${formatListBullet(preferences.unorderedListBullet)} `
  const lines: string[] = []
  let hasLeadingLine = false

  const appendWithMarker = (content: string) => {
    const contentLines = content.split('\n')

    contentLines.forEach((line) => {
      if (!hasLeadingLine) {
        lines.push(`${baseIndent}${marker}${line}`.trimEnd())
        hasLeadingLine = true
        return
      }

      lines.push(`${nestedIndent}${line}`.trimEnd())
    })
  }

  node.children.forEach((child) => {
    if (child.type === 'paragraph') {
      const paragraph = renderParagraph(child, preferences)

      if (paragraph) {
        appendWithMarker(paragraph)
      }

      return
    }

    if (child.type === 'list') {
      if (!hasLeadingLine) {
        lines.push(`${baseIndent}${marker}`.trimEnd())
        hasLeadingLine = true
      }

      lines.push(renderList(child, preferences, level + 1))
      return
    }

    const content = renderBlock(child, preferences, '\n\n')

    if (content) {
      appendWithMarker(content)
    }
  })

  if (!hasLeadingLine) {
    lines.push(`${baseIndent}${marker}`.trimEnd())
  }

  return lines.join('\n')
}

function renderCodeBlock(node: Code, preferences: OutputPreferences): string {
  if (!preferences.preserveCodeBlock) {
    return ''
  }

  const label = normalizeLabel(preferences.codeBlockLabel, '代码块')
  const blockTitle = node.lang ? `[${label}: ${node.lang}]` : `[${label}]`
  const value = node.value.trimEnd()

  return value ? `${blockTitle}\n${value}` : blockTitle
}

function renderTable(node: Table, preferences: OutputPreferences): string {
  const separator = resolveSeparator(preferences.tableSeparator)

  return node.children
    .map((row) => renderTableRow(row, preferences, separator))
    .filter(Boolean)
    .join('\n')
}

function renderTableRow(row: TableRow, preferences: OutputPreferences, separator: string): string {
  return row.children
    .map((cell) => renderTableCell(cell, preferences))
    .join(separator)
}

function renderTableCell(cell: TableCell, preferences: OutputPreferences): string {
  return normalizeInlineText(renderInline(cell.children, preferences))
}

function renderHtml(node: Html): string {
  return normalizeInlineText(node.value.replace(/<[^>]+>/g, ' '))
}

function renderInline(children: PhrasingContent[], preferences?: OutputPreferences): string {
  return children
    .map((child) => renderInlineNode(child, preferences))
    .join('')
}

function renderInlineNode(node: PhrasingContent, preferences?: OutputPreferences): string {
  switch (node.type) {
    case 'text':
      return renderText(node)
    case 'link':
      return renderLink(node, preferences)
    case 'image':
      return renderImage(node, preferences)
    case 'inlineCode':
      return renderInlineCode(node)
    case 'strong':
    case 'emphasis':
    case 'delete':
      return renderInline(node.children, preferences)
    case 'break':
      return renderBreak(node)
    case 'html':
      return renderHtml(node)
    default:
      if ('children' in node) {
        return renderInline(node.children as PhrasingContent[], preferences)
      }

      return ''
  }
}

function renderText(node: Text): string {
  return node.value
}

function renderLink(node: Link, preferences?: OutputPreferences): string {
  const label = normalizeInlineText(renderInline(node.children, preferences))
  const url = node.url.trim()

  if (!preferences?.preserveLinkUrl) {
    return label || url
  }

  if (!label || label === url) {
    return url
  }

  return `${label} (${url})`
}

function renderImage(node: Image, preferences?: OutputPreferences): string {
  if (!preferences?.preserveImageAlt) {
    return ''
  }

  const alt = node.alt?.trim()
  const label = preferences.imageLabel.trim()

  if (!alt) {
    return label.replace(/[:：\s]+$/g, '') || '图片'
  }

  return label ? joinLabelAndValue(label, alt) : alt
}

function renderInlineCode(node: InlineCode): string {
  return node.value
}

function renderBreak(_: Break): string {
  return '\n'
}

function prefixLines(value: string, prefix: string): string {
  if (!prefix) {
    return value
  }

  return value
    .split('\n')
    .map((line) => line ? `${prefix}${line}` : prefix.trimEnd())
    .join('\n')
}

function normalizeInlineText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function resolveBlockGap(value: string): string {
  const normalized = value.trim().toLowerCase()
  const parsed = Number.parseInt(normalized, 10)
  const count = Number.isFinite(parsed)
    ? clamp(parsed + 1, 2, 6)
    : (blockGapAliasMap[normalized] ?? blockGapAliasMap.normal)

  return '\n'.repeat(count)
}

function resolveSeparator(value: string): string {
  return decodeEscapes(value) || ' | '
}

function formatListBullet(value: string): string {
  return decodeEscapes(value).trim() || '-'
}

function formatOrderedListSuffix(value: string): string {
  return decodeEscapes(value) || '.'
}

function normalizeLabel(value: string, fallback: string): string {
  return value.trim() || fallback
}

function joinLabelAndValue(label: string, value: string): string {
  if (/[：:>\]\)\s]$/.test(label)) {
    return `${label}${value}`
  }

  return `${label} ${value}`
}

function decodeEscapes(value: string): string {
  return value
    .replace(/\\t/g, '\t')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function formatHeading(text: string, depth: Heading['depth'], preferences: OutputPreferences): string {
  const headingDepth: 1 | 2 | 3 = depth >= 3 ? 3 : (depth as 1 | 2)
  const prefix = decodeEscapes(getHeadingPreference(preferences, headingDepth, 'prefix')).trim()
  const suffix = decodeEscapes(getHeadingPreference(preferences, headingDepth, 'suffix')).trim()
  const divider = resolveHeadingDivider(getHeadingPreference(preferences, headingDepth, 'divider'), text)
  const content = `${prefix}${text}${suffix}`.trim()

  return divider ? `${content}\n${divider}` : content
}

function getHeadingPreference(
  preferences: OutputPreferences,
  level: 1 | 2 | 3,
  type: 'prefix' | 'suffix' | 'divider',
): string {
  const key = `headingLevel${level}${capitalize(type)}` as keyof OutputPreferences
  return preferences[key] as string
}

function resolveHeadingDivider(value: string, text: string): string {
  const divider = decodeEscapes(value).trim()

  if (!divider) {
    return ''
  }

  if (divider.toLowerCase() === 'auto') {
    return '='.repeat(Math.max(text.length, 3))
  }

  return divider
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
