import { useEffect, useRef } from 'react'
import { STORAGE_ERROR_EVENT } from '../../services/storage/errors'
import { useToast } from '../ui'

/** Warns (at most once a minute) when the browser refuses to save study data. Renders nothing. */
export default function StorageErrorWatcher() {
  const { toast } = useToast()
  const last = useRef(0)
  useEffect(() => {
    const onError = () => {
      if (Date.now() - last.current < 60_000) return
      last.current = Date.now()
      toast.error('Không lưu được dữ liệu vào bộ nhớ trình duyệt (có thể đã đầy). Hãy vào Cài đặt, xuất file sao lưu ngay và giải phóng dung lượng.')
    }
    window.addEventListener(STORAGE_ERROR_EVENT, onError)
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onError)
  }, [toast])
  return null
}
