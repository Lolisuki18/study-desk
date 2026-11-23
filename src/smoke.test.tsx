// @vitest-environment jsdom
/**
 * Smoke tests: render every page the way the app does and click through the risky spots.
 *
 * The unit tests cover logic only. Crashes such as "Rendered fewer hooks than expected" (a page that returns early
 * before a later hook) only happen when a component is actually rendered and its state changes, so they need a real
 * render. A page that throws is caught by the error boundary, which shows role="alert"; a healthy page never does.
 */
import 'fake-indexeddb/auto'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { ProgressProvider } from './features/learning/ProgressContext'
import * as db from './services/storage/db'

beforeAll(() => {
  // browser APIs jsdom does not have
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null })) as never
  window.scrollTo = (() => {}) as never
  Element.prototype.scrollIntoView = () => {}
  window.HTMLElement.prototype.scrollTo = (() => {}) as never
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(window as never as Record<string, unknown>).ResizeObserver ??= Observer
  ;(window as never as Record<string, unknown>).IntersectionObserver ??= Observer
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => cleanup())

const mount = async (path: string) => {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </MemoryRouter>,
  )
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Đang nạp dữ liệu|Đang tải trang/), { timeout: 20000 })
  return view
}
const noCrash = () => expect(screen.queryByRole('alert'), 'a page crashed: ' + (screen.queryByRole('alert')?.textContent ?? '')).toBeNull()
const click = (el: Element | null) => {
  expect(el).not.toBeNull()
  fireEvent.click(el!)
}
const button = (text: string | RegExp) => screen.getAllByRole('button').find((b) => (typeof text === 'string' ? b.textContent?.includes(text) : text.test(b.textContent ?? '')))

const ROUTES = [
  '/',
  '/collections',
  '/collections/cnxhkh-mln131-full',
  '/import',
  '/timeline',
  '/survival',
  '/drill?subject=L%E1%BB%8Bch%20s%E1%BB%AD%20%C4%90%E1%BA%A3ng&chapter=Ch%C6%B0%C6%A1ng%201',
  '/drill',
  '/flashcards',
  '/flashcards/lich-su-dang-chuong-1',
  '/quiz',
  '/quiz/lich-su-dang-chuong-1',
  '/review',
  '/today',
  '/exam',
  '/mistakes',
  '/search',
  '/statistics',
  '/settings',
  '/feedback',
  '/collections/khong-co-bo-nay',
  '/duong-dan-khong-ton-tai',
]

describe('every page renders', () => {
  it.each(ROUTES)('%s', async (path) => {
    await mount(path)
    noCrash()
    expect(document.body.textContent!.length).toBeGreaterThan(100)
  }, 30000)
})

describe('risky interactions', () => {
  it('opens and closes the Cram list on a collection page (it once blanked the app)', async () => {
    await mount('/collections/cnxhkh-mln131-full')
    click(button('Lướt nhanh') ?? null)
    noCrash()
    expect(document.body.textContent).toContain('Chế độ lướt nhanh')
    click(screen.getByLabelText('Quay lại'))
    noCrash()
    expect(document.body.textContent).toContain('Học thẻ ghi nhớ')
  }, 30000)

  it('opens the Cram list inside a flashcard session and goes back', async () => {
    await mount('/flashcards/lich-su-dang-chuong-1')
    click(screen.getByTitle(/Cram Mode/))
    noCrash()
    expect(document.body.textContent).toContain('Chế độ lướt nhanh')
  }, 30000)

  it('starts a redo run from the wrong-answer notebook (a hook after an early return crashed this)', async () => {
    const now = new Date().toISOString()
    await db.putProgress([
      { key: 'lich-su-dang-chuong-1::q-001', collectionId: 'lich-su-dang-chuong-1', itemId: 'q-001', status: 'unknown', review: false, correct: 0, incorrect: 2, level: 1, lastResult: 'incorrect', lastStudied: now, nextReview: now },
      { key: 'lich-su-dang-chuong-1::q-002', collectionId: 'lich-su-dang-chuong-1', itemId: 'q-002', status: 'unknown', review: false, correct: 0, incorrect: 1, level: 1, lastResult: 'incorrect', lastStudied: now, nextReview: now },
    ])
    await mount('/mistakes')
    noCrash()
    click(button('Ôn bằng thẻ') ?? null)
    noCrash()
  }, 30000)

  it('starts a drill on a weak chapter', async () => {
    await mount('/drill?subject=L%E1%BB%8Bch%20s%E1%BB%AD%20%C4%90%E1%BA%A3ng&chapter=Ch%C6%B0%C6%A1ng%201')
    noCrash()
    click(button('Bắt đầu luyện') ?? null)
    noCrash()
    expect(document.body.textContent).toContain('1 / 20')
  }, 30000)

  it('starts a Survival run', async () => {
    await mount('/survival')
    click(button('Bắt đầu thử thách') ?? null)
    noCrash()
    expect(document.body.textContent).toContain('Điểm')
  }, 30000)

  it('opens the quiz setup and starts a quiz', async () => {
    await mount('/quiz/lich-su-dang-chuong-1')
    click(button(/^Bắt đầu/) ?? null)
    noCrash()
  }, 30000)
})

describe('feedback page', () => {
  it('offers the contact email and builds a mail link from the message', async () => {
    await mount('/feedback')
    noCrash()
    expect(document.body.textContent).toContain('leninh2004@gmail.com')
    const compose = screen.getByText('Mở thư để gửi').closest('a')!
    expect(compose.getAttribute('aria-disabled')).toBe('true') // nothing typed yet
    fireEvent.change(screen.getByLabelText('Nội dung'), { target: { value: 'Câu 5 sai đáp án' } })
    const href = screen.getByText('Mở thư để gửi').closest('a')!.getAttribute('href')!
    expect(href.startsWith('mailto:leninh2004@gmail.com?')).toBe(true)
    expect(decodeURIComponent(href)).toContain('Câu 5 sai đáp án')
  }, 30000)
})

describe('error boundary', () => {
  // React and ErrorBoundary log the deliberate throws below; keep the test output readable.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a recovery card instead of a blank page when a component throws', () => {
    const Bomb = () => {
      throw new Error('nổ thử')
    }
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    const alert = screen.getByRole('alert')
    expect(within(alert).getByText(/nổ thử/)).toBeTruthy()
    expect(within(alert).getByText(/Tải lại ứng dụng/)).toBeTruthy()
  })

  it('tries again when the reset key changes', () => {
    let boom = true
    const Maybe = () => {
      if (boom) throw new Error('lỗi một lần')
      return <p>đã ổn</p>
    }
    const { rerender } = render(
      <ErrorBoundary resetKey="a">
        <Maybe />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    boom = false
    rerender(
      <ErrorBoundary resetKey="b">
        <Maybe />
      </ErrorBoundary>,
    )
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('đã ổn')).toBeTruthy()
  })
})
