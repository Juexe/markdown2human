import type { Root } from 'mdast'
import { unified } from 'unified'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'

const processor = unified().use(remarkParse).use(remarkGfm)

export function parseMarkdown(markdown: string): Root {
  return processor.parse(markdown) as Root
}
