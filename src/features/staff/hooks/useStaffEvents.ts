import { useEffect, useMemo, useState } from 'react'
import { getMyAssignedEvents } from '../api/staff-api'
import type { StaffAssignedEventDto, StaffFilterState } from '../types/staff'

function parseDateToYmd(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isEventToday(dateStr: string): boolean {
  if (!dateStr) return false
  const target = new Date(dateStr)
  if (isNaN(target.getTime())) return false
  const now = new Date()
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  )
}

export function isEventTomorrow(dateStr: string): boolean {
  if (!dateStr) return false
  const target = new Date(dateStr)
  if (isNaN(target.getTime())) return false
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return (
    target.getFullYear() === tomorrow.getFullYear() &&
    target.getMonth() === tomorrow.getMonth() &&
    target.getDate() === tomorrow.getDate()
  )
}

const initialFilters: StaffFilterState = {
  search: '',
  selectedDate: '',
  statusFilter: 'ALL',
  organizer: '',
}

export function useStaffEvents() {
  const [rawEvents, setRawEvents] = useState<StaffAssignedEventDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<StaffFilterState>(initialFilters)

  async function loadEvents() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyAssignedEvents()
      setRawEvents(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách sự kiện được phân công'
      setError(message)
      setRawEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  // Danh sách các nhà tổ chức độc nhất từ danh sách sự kiện
  const organizers = useMemo(() => {
    const set = new Set<string>()
    rawEvents.forEach(e => {
      if (e.organizerName && e.organizerName.trim()) {
        set.add(e.organizerName.trim())
      }
    })
    return Array.from(set).sort()
  }, [rawEvents])

  // Tìm kiếm Realtime kiểu Ctrl+F trên FE và lọc theo ngày, trạng thái, nhà tổ chức
  const filteredEvents = useMemo(() => {
    const searchLower = filters.search.trim().toLowerCase()

    return rawEvents.filter(event => {
      // 1. Tìm kiếm Realtime (Ctrl + F) theo tên, địa điểm, thành phố, BTC
      if (searchLower) {
        const matchesName = event.eventName.toLowerCase().includes(searchLower)
        const matchesCity = event.venueCity?.toLowerCase().includes(searchLower) || false
        const matchesAddress = event.venueAddress?.toLowerCase().includes(searchLower) || false
        const matchesOrganizer = event.organizerName?.toLowerCase().includes(searchLower) || false
        if (!matchesName && !matchesCity && !matchesAddress && !matchesOrganizer) {
          return false
        }
      }

      // 2. Lọc theo ngày được chọn (So khớp ngày YYYY-MM-DD)
      if (filters.selectedDate) {
        const eventYmd = parseDateToYmd(event.startTime)
        if (eventYmd !== filters.selectedDate) {
          return false
        }
      }

      // 3. Lọc theo trạng thái sự kiện
      if (filters.statusFilter !== 'ALL') {
        if (event.eventStatus !== filters.statusFilter) {
          return false
        }
      }

      // 4. Lọc theo nhà tổ chức (Select dropdown)
      if (filters.organizer && event.organizerName !== filters.organizer) {
        return false
      }

      return true
    })
  }, [rawEvents, filters])

  function resetFilters() {
    setFilters(initialFilters)
  }

  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    Boolean(filters.selectedDate) ||
    filters.statusFilter !== 'ALL' ||
    Boolean(filters.organizer)

  return {
    rawEvents,
    filteredEvents,
    organizers,
    loading,
    error,
    reload: loadEvents,
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    totalCount: rawEvents.length,
  }
}
