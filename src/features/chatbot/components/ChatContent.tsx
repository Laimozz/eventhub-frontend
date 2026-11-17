import { Fragment } from 'react'
import { Link } from 'react-router'

// Render a small, safe Markdown subset. Model output never becomes raw HTML.
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\s)]+\))/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (link) {
      const path = link[2]
      return /^\/(customer|organizer|staff|admin)(\/[^\s\\]*)?$/.test(path)
        ? <Link key={index} to={path}>{link[1]}</Link>
        : <Fragment key={index}>{link[1]}</Fragment>
    }
    return <Fragment key={index}>{part}</Fragment>
  })
}

export function ChatContent({ text }: { text: string }) {
  return <>{text.split(/\n{2,}/).map((block, index) => {
    const lines = block.split('\n')
    if (lines.every(line => /^\s*[-*] /.test(line))) {
      return <ul key={index}>{lines.map((line, item) => <li key={item}>{inline(line.replace(/^\s*[-*] /, ''))}</li>)}</ul>
    }
    if (lines.every(line => /^\s*\d+[.)] /.test(line))) {
      return <ol key={index}>{lines.map((line, item) => <li key={item}>{inline(line.replace(/^\s*\d+[.)] /, ''))}</li>)}</ol>
    }
    return <p key={index}>{lines.map((line, item) => <Fragment key={item}>{item > 0 && <br />}{inline(line.replace(/^#{1,6} /, ''))}</Fragment>)}</p>
  })}</>
}
