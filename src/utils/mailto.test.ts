import { describe, expect, it } from 'vitest'
import { mailtoLink } from './mailto'

describe('mailtoLink', () => {
  const parse = (link: string) => {
    const [head, query] = link.split('?')
    const params = new URLSearchParams(query)
    return { to: head.replace('mailto:', ''), subject: params.get('subject'), body: params.get('body') }
  }

  it('encodes the subject and body so they read back exactly', () => {
    const l = parse(mailtoLink('a@b.vn', 'Góp ý: câu 5 & đáp án?', 'Dòng 1\nDòng 2 có dấu tiếng Việt'))
    expect(l.to).toBe('a@b.vn')
    expect(l.subject).toBe('Góp ý: câu 5 & đáp án?')
    expect(l.body).toBe('Dòng 1\r\nDòng 2 có dấu tiếng Việt')
  })

  it('shortens a very long body and says so', () => {
    const l = parse(mailtoLink('a@b.vn', 's', 'x'.repeat(5000), 100))
    expect(l.body!.length).toBeLessThan(200)
    expect(l.body).toContain('cắt bớt')
  })

  it('leaves a short body alone', () => {
    expect(parse(mailtoLink('a@b.vn', 's', 'ngắn')).body).toBe('ngắn')
  })
})
