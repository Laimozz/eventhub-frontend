import { useEffect, useState } from 'react'
import { getEvent } from '../api/event-api'
import { eventError } from '../event-form'
import type { EventDetail } from '../types/event'

export function useEvent(eventId: string | undefined) {
  const [reload, setReload] = useState(0)
  const key = `${eventId}:${reload}`
  const id = Number(eventId)
  const valid = Number.isSafeInteger(id) && id > 0 && id <= 2147483647
  const [result, setResult] = useState<{ key: string; event: EventDetail | null; error: string } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    if (!valid) return
    getEvent(id, controller.signal).then(event => { if (!controller.signal.aborted) setResult({ key, event, error: '' }) })
      .catch(cause => { if (!controller.signal.aborted) setResult({ key, event: null, error: eventError(cause) }) })
    return () => controller.abort()
  }, [id, key, valid])
  return { event: result?.key === key ? result.event : null,
    setEvent: (event: EventDetail) => setResult({ key, event, error: '' }),
    loading: valid && result?.key !== key,
    error: !valid ? 'Mã sự kiện không hợp lệ.' : result?.key === key ? result.error : '',
    retry: () => setReload(value => value + 1) }
}
