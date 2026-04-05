"use client"

import ReactMarkdown from 'react-markdown'

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className}>
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        strong: ({ children }) => <span className="font-semibold text-white">{children}</span>,
        em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold text-white mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold text-white mb-1">{children}</h3>,
      }}
    >
      {children}
    </ReactMarkdown>
    </div>
  )
}
