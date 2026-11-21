/**
 * A mailto: link. Mail programs and browsers cut very long links, so the body is shortened (with a note) rather than
 * being silently dropped. Line breaks become CRLF, as RFC 6068 asks.
 */
export function mailtoLink(to: string, subject: string, body: string, maxBody = 1500): string {
  const text = body.length > maxBody ? `${body.slice(0, maxBody)}\n[...nội dung dài đã được cắt bớt]` : body
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text.replace(/\r?\n/g, '\r\n'))}`
}
