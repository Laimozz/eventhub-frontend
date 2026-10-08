import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../api/admin-api'

export function useAdminData<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [result, setResult] = useState<{ load: typeof load; revision: number; data?: T; error: string }>()
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).then(data => { if (!controller.signal.aborted) setResult({ load, revision, data, error: '' }) })
      .catch(cause => { if (!controller.signal.aborted) setResult({ load, revision, error: errorMessage(cause) }) })
    return () => controller.abort()
  }, [load, revision])
  const current = result?.load === load && result.revision === revision ? result : undefined
  return { data: current?.data, error: current?.error ?? '', loading: !current, reload }
}
