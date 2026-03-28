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

const blockGapMap: Record<OutputPreferences['paragraphSpacing'], string> = {
  compact: '\n\n',
  normal: '\n\n\n',
  relaxed: '\n\n\n\n',
}

const tableSeparatorMap: Record<OutputPreferences['tableSeparator'], string> = {
  pipe: ' | ',
  space: '  ',
  tab: '\t',
}

export function transformMarkdownToText(markdown: string, preferences: OutputPreferences): string {
  if (!markdown.trim()) {
    return ''
  }

  const tree = parseMarkdown(markdown)
  const blockGap = blockGapMap[preferences.paragraphSpacing]
  const blocks = renderBlocks(tree.children, preferences, blockGap)

  return blocks
    .join(blockGap)
    .replace(/\n{5,}/g, '\n\n\n\n')
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
      return renderHeading(node)
    case 'paragraph':
      return renderParagraph(node, preferences)
    case 'list':
      return renderList(node, preferences, 0)
    case 'blockquote':
      return prefixLines(renderBlocks(node.children, preferences, blockGap).join(blockGap), '> ')
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

function renderHeading(node: Heading): string {
  const text = normalizeInlineText(renderInline(node.children))

  if (!text) {
    return ''
  }

  if (node.depth === 1) {
    return `${text}\n${'='.repeat(Math.max(text.length, 3))}`
  }

  return text
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
    ? `${orderedIndex}. `
    : `${preferences.unorderedListBullet} `
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

  const label = node.lang ? `[代码块: ${node.lang}]` : '[代码块]'
  const value = node.value.trimEnd()

  return value ? `${label}\n${value}` : label
}

function renderTable(node: Table, preferences: OutputPreferences): string {
  const separator = tableSeparatorMap[preferences.tableSeparator]

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

  return node.alt?.trim() ? `图片：${node.alt.trim()}` : '图片'
}

function renderInlineCode(node: InlineCode): string {
  return node.value
}

function renderBreak(_: Break): string {
  return '\n'
}

function prefixLines(value: string, prefix: string): string {
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
