import { useCallback, useEffect, useState } from 'react'
import { getBooking } from '../api/booking-api'
import { bookingError, utcDate } from '../booking-display'
import type { BookingDetail } from '../types/booking'

export function useBooking(id: number | null) {
  const [data, setData] = useState<BookingDetail | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion(value => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    let timer: number | undefined
    setData(null)
    setError('')
    if (!id) { setError('Mã booking không hợp lệ.'); setLoading(false); return }
    setLoading(true)
    const bookingId = id
    async function fetchBooking() {
      try {
        const result = await getBooking(bookingId, controller.signal)
        if (controller.signal.aborted) return
        setData(result)
        if (result.status === 'PENDING' || result.status === 'PAYMENT_CONFIRMING') {
          timer = window.setTimeout(fetchBooking, 5000)
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(bookingError(cause))
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void fetchBooking()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [id, version])
  return { data, error, loading, reload }
}

export function useHoldTime(expiresAt?: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  return expiresAt ? Math.max(0, Math.ceil((utcDate(expiresAt).getTime() - now) / 1000)) : 0
}
