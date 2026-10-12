import { splitNewsParagraphs } from '@/app/news/news'
import { cn } from '@/app/common/utils'

export function NewsContent({ content, className }: { content: string; className?: string }) {
  const paragraphs = splitNewsParagraphs(content)

  if (paragraphs.length === 0) {
    return <p className="text-muted-foreground">ไม่มีเนื้อหา</p>
  }

  return (
    <div className={cn('news-article-prose', className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  )
}
