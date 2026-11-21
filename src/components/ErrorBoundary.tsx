import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Copy, Home, Mail, RefreshCw, RotateCcw } from 'lucide-react'
import { FEEDBACK_EMAIL } from '../config'
import { mailtoLink } from '../utils/mailto'

interface Props {
  children: ReactNode
  /** when this value changes (e.g. the route) a shown error is cleared and the children are tried again */
  resetKey?: string
  /** true for the outermost boundary: it fills the screen because nothing else is left to show */
  fatal?: boolean
}

interface State {
  error: Error | null
  info: string
  copied: boolean
}

/**
 * Catches errors thrown while rendering so one broken page cannot blank the whole app.
 * Study progress lives in IndexedDB, not in the page, so it is safe whatever happens here.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '', copied: false }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, copied: false }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info: info.componentStack ?? '' })
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null, info: '', copied: false })
  }

  private report = () => {
    const { error, info } = this.state
    return [`Trang: ${location.hash || '/'}`, `Lỗi: ${error?.name}: ${error?.message}`, '', error?.stack ?? '', '', 'Thành phần:', info.trim()].join('\n')
  }

  private copy = async () => {
    try {
      await navigator.clipboard.writeText(this.report())
      this.setState({ copied: true })
    } catch {
      /* no clipboard: the details are on screen */
    }
  }

  render() {
    const { error, copied } = this.state
    if (!error) return this.props.children

    const btn =
      'inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors'
    return (
      <div role="alert" className={this.props.fatal ? 'flex min-h-screen items-center justify-center bg-bg p-5' : 'py-8'}>
        <div className="mx-auto max-w-xl rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertTriangle size={28} />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-ink">{this.props.fatal ? 'Ứng dụng gặp lỗi' : 'Trang này gặp lỗi'}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Tiến độ học của bạn vẫn an toàn trong trình duyệt. Hãy thử tải lại trang; nếu lỗi lặp lại, bấm "Sao chép chi tiết lỗi" để gửi cho người sửa.
          </p>

          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            {error.name}: {error.message}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {!this.props.fatal && (
              <button onClick={() => this.setState({ error: null, info: '' })} className={`${btn} border-ink bg-ink text-white hover:opacity-90`}>
                <RotateCcw size={15} /> Thử lại trang này
              </button>
            )}
            <button onClick={() => location.reload()} className={`${btn} border-line bg-card text-ink hover:bg-slate-50 dark:hover:bg-slate-800`}>
              <RefreshCw size={15} /> Tải lại ứng dụng
            </button>
            <a href="#/" onClick={() => this.setState({ error: null, info: '' })} className={`${btn} border-line bg-card text-ink hover:bg-slate-50 dark:hover:bg-slate-800`}>
              <Home size={15} /> Về Tổng quan
            </a>
            <button onClick={this.copy} className={`${btn} border-line bg-card text-muted hover:text-ink`}>
              <Copy size={15} /> {copied ? 'Đã sao chép' : 'Sao chép chi tiết lỗi'}
            </button>
            <a href={mailtoLink(FEEDBACK_EMAIL, `[Góc học tập] Báo lỗi: ${error.message.slice(0, 60)}`, this.report())} className={`${btn} border-line bg-card text-muted hover:text-ink`}>
              <Mail size={15} /> Gửi lỗi qua email
            </a>
          </div>
        </div>
      </div>
    )
  }
}
