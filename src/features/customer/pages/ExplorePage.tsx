import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { getPublicEvents, getCategories } from '../api/event-api'
import type { PublicEventSummaryResponse, CategoryResponse } from '../types/event'
import { EventCard } from '../components/EventCard'
import { CustomerHeader } from '../components/CustomerHeader'
import styles from './ExplorePage.module.css'

type Filters = { city: string; categoryId: number | 'all'; timeFilter: string; fromDate: string; toDate: string }
const pageSize = 12

function readFilters(params: URLSearchParams): Filters {
  const category = Number(params.get('categoryId'))
  return {
    city: params.get('city') || 'all',
    categoryId: Number.isSafeInteger(category) && category > 0 ? category : 'all',
    timeFilter: ['today', 'this_week', 'this_month', 'custom'].includes(params.get('time') || '') ? params.get('time')! : 'all',
    fromDate: params.get('fromDate') || '',
    toDate: params.get('toDate') || '',
  }
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryKey = searchParams.toString()
  const applied = readFilters(searchParams)
  const requestedPage = Number(searchParams.get('page'))
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0
  const [events, setEvents] = useState<PublicEventSummaryResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [draft, setDraft] = useState(() => ({ ...applied, queryKey }))
  // URL changes (including Back/Forward) replace the filter draft without copying state in an effect.
  const filters = draft.queryKey === queryKey ? draft : { ...applied, queryKey }
  const { city, categoryId, timeFilter, fromDate, toDate } = filters
  function changeFilters(patch: Partial<Filters>) { setDraft({ ...filters, ...patch }) }
  const setCity = (value: string) => changeFilters({ city: value })
  const setCategoryId = (value: number | 'all') => changeFilters({ categoryId: value })
  const setTimeFilter = (value: string) => changeFilters({ timeFilter: value })
  const searchString = searchParams.get('search') || undefined

  // On mount, load categories
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  // Derived dates based on timeFilter (UTC)
  const effectiveDates = useMemo(() => {
    const toLocalIso = (date: Date) => date.toISOString().replace('Z', '')

    if (applied.timeFilter === 'custom') {
      const from = new Date(`${applied.fromDate}T00:00:00+07:00`)
      const to = new Date(`${applied.toDate}T23:59:59.999+07:00`)
      return {
        from: Number.isNaN(from.getTime()) ? undefined : toLocalIso(from),
        to: Number.isNaN(to.getTime()) ? undefined : toLocalIso(to),
      }
    }
    
    if (applied.timeFilter === 'all') return { from: undefined, to: undefined }

    const now = new Date()
    if (applied.timeFilter === 'today') {
      const start = new Date(now.setHours(0, 0, 0, 0))
      const end = new Date(now.setHours(23, 59, 59, 999))
      return { from: toLocalIso(start), to: toLocalIso(end) }
    }
    if (applied.timeFilter === 'this_week') {
      const first = now.getDate() - now.getDay() // Sunday
      const start = new Date(now.setDate(first))
      start.setHours(0,0,0,0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23,59,59,999)
      return { from: toLocalIso(start), to: toLocalIso(end) }
    }
    if (applied.timeFilter === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return { from: toLocalIso(start), to: toLocalIso(end) }
    }
    return { from: undefined, to: undefined }
  }, [applied.timeFilter, applied.fromDate, applied.toDate])

  // Fetch events when filters change
  useEffect(() => {
    const controller = new AbortController()
    async function fetchEvents() {
      setLoading(true)
      setError('')
      try {
        const response = await getPublicEvents({
          page,
          size: pageSize,
          categoryId: applied.categoryId === 'all' ? undefined : applied.categoryId,
          city: applied.city === 'all' ? undefined : applied.city,
          fromDate: effectiveDates.from,
          toDate: effectiveDates.to,
          search: searchString
        }, controller.signal)
        if (controller.signal.aborted) return
        const lastPage = Math.max(0, response.totalPages - 1)
        if (page > lastPage) {
          setSearchParams(previous => {
            const next = new URLSearchParams(previous)
            if (lastPage) next.set('page', String(lastPage))
            else next.delete('page')
            return next
          }, { replace: true })
          return
        }
        setEvents(response.content)
        setTotalElements(response.totalElements)
        setTotalPages(response.totalPages)
      } catch {
        if (!controller.signal.aborted) setError('Không thể tải danh sách sự kiện. Vui lòng thử lại.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void fetchEvents()
    return () => controller.abort()
  }, [applied.categoryId, applied.city, effectiveDates, searchString, page, revision, setSearchParams])

  // Sync to URL when applying filters
  const applyFilters = () => {
    const params = new URLSearchParams()
    if (city !== 'all') params.set('city', city)
    if (categoryId !== 'all') params.set('categoryId', categoryId.toString())
    if (timeFilter !== 'all') params.set('time', timeFilter)
    if (timeFilter === 'custom') {
      if (fromDate) params.set('fromDate', fromDate)
      if (toDate) params.set('toDate', toDate)
    }
    if (searchString) {
      params.set('search', searchString)
    }
    setSearchParams(params)
  }

  const resetFilters = () => {
    const params = new URLSearchParams()
    if (searchString) params.set('search', searchString)
    setDraft({ city: 'all', categoryId: 'all', timeFilter: 'all', fromDate: '', toDate: '', queryKey: params.toString() })
    setSearchParams(params)
  }

  function removeFilter(key: string) {
    const next = new URLSearchParams(searchParams)
    next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function changePage(nextPage: number) {
    if (nextPage < 0 || nextPage >= totalPages || loading) return
    const next = new URLSearchParams(searchParams)
    if (nextPage) next.set('page', String(nextPage))
    else next.delete('page')
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const categoryName = applied.categoryId !== 'all' ? categories.find(c => c.id === applied.categoryId)?.name : null

  return (
    <div className={styles.page}>
      <CustomerHeader />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.layout}>
            {/* Sidebar Bộ Lọc */}
            <aside className={styles.sidebar}>
              <div className={styles.filterCard}>
                <div className={styles.filterHeader}>
                  <div className={styles.filterTitleGroup}>
                    <span className="material-symbols-outlined text-primary">tune</span>
                    <h3>Bộ lọc</h3>
                  </div>
                  <button className={styles.resetBtn} onClick={resetFilters}>
                    <span className="material-symbols-outlined">restart_alt</span>
                    Đặt lại
                  </button>
                </div>
                
                {/* Thời gian */}
                <div className={styles.filterSection}>
                  <span className={styles.sectionLabel}>
                    <span className="material-symbols-outlined">calendar_month</span>
                    Thời gian
                  </span>
                  <div className={styles.timeGrid}>
                    <label className={styles.timeOption}>
                      <input type="radio" name="time" checked={timeFilter === 'all'} onChange={() => setTimeFilter('all')} />
                      <span className={styles.timeLabel}>Tất cả</span>
                    </label>
                    <label className={styles.timeOption}>
                      <input type="radio" name="time" checked={timeFilter === 'today'} onChange={() => setTimeFilter('today')} />
                      <span className={styles.timeLabel}>Hôm nay</span>
                    </label>
                    <label className={styles.timeOption}>
                      <input type="radio" name="time" checked={timeFilter === 'this_week'} onChange={() => setTimeFilter('this_week')} />
                      <span className={styles.timeLabel}>Tuần này</span>
                    </label>
                    <label className={styles.timeOption}>
                      <input type="radio" name="time" checked={timeFilter === 'this_month'} onChange={() => setTimeFilter('this_month')} />
                      <span className={styles.timeLabel}>Tháng này</span>
                    </label>
                  </div>
                  <div className={styles.dateRange}>
                    <span className={styles.dateRangeText}>Hoặc chọn khoảng ngày cụ thể:</span>
                    <div className={styles.dateInputs}>
                      <div>
                        <label>Từ ngày</label>
                        <input type="date" value={fromDate} onChange={e => changeFilters({ fromDate: e.target.value, timeFilter: 'custom' })} />
                      </div>
                      <div>
                        <label>Đến ngày</label>
                        <input type="date" value={toDate} onChange={e => changeFilters({ toDate: e.target.value, timeFilter: 'custom' })} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.divider}></div>

                {/* Thể loại */}
                <div className={styles.filterSection}>
                  <span className={styles.sectionLabel}>
                    <span className="material-symbols-outlined">category</span>
                    Thể loại
                  </span>
                  <div className={styles.categoryList}>
                    <label className={styles.categoryItem}>
                      <div className={styles.checkboxGroup}>
                        <input type="radio" name="category" checked={categoryId === 'all'} onChange={() => setCategoryId('all')} />
                        <span>Tất cả</span>
                      </div>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat.id} className={styles.categoryItem}>
                        <div className={styles.checkboxGroup}>
                          <input type="radio" name="category" checked={categoryId === cat.id} onChange={() => setCategoryId(cat.id)} />
                          <span>{cat.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.divider}></div>

                {/* Thành phố */}
                <div className={styles.filterSection}>
                  <label className={styles.sectionLabel}>
                    <span className="material-symbols-outlined">location_on</span>
                    Thành phố
                  </label>
                  <div className={styles.selectWrapper}>
                    <select className={styles.select} value={city} onChange={e => setCity(e.target.value)}>
                      <option value="all">Tất cả thành phố</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                    </select>
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>

                {/* Nút tác vụ */}
                <div className={styles.filterActions}>
                  <button className={styles.applyBtn} onClick={applyFilters}>
                    <span className="material-symbols-outlined" aria-hidden="true">check</span>
                    Áp dụng bộ lọc
                  </button>
                  <button className={styles.clearBtn} onClick={resetFilters}>
                    <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </aside>

            {/* Event Grid Section */}
            <section className={styles.content}>
              <div className={styles.resultsHeader}>
                <div className={styles.resultsTitle}>
                  <h1>Kết quả tìm kiếm</h1>
                  <p>Tìm thấy <span>{totalElements}</span> sự kiện</p>
                </div>
                <div className={styles.sortWrapper}>
                  <span>Sắp xếp:</span>
                  <div className={styles.selectWrapper}>
                    <select className={styles.select}>
                      <option>Mới nhất</option>
                      {/* Note: The backend API doesn't support custom sorting by price yet according to endpoints.md */}
                    </select>
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.activeFilters}>
                {applied.categoryId !== 'all' || applied.city !== 'all' || searchString ? <span>Đang chọn:</span> : null}
                {searchString && (
                  <div className={styles.chip}>
                    <span className="material-symbols-outlined">search</span>
                    Từ khóa: {searchString}
                    <button aria-label="Xóa từ khóa" onClick={() => removeFilter('search')}><span className="material-symbols-outlined">close</span></button>
                  </div>
                )}
                {applied.categoryId !== 'all' && categoryName && (
                  <div className={styles.chip}>
                    <span className="material-symbols-outlined">music_note</span>
                    {categoryName}
                    <button aria-label="Xóa bộ lọc thể loại" onClick={() => removeFilter('categoryId')}><span className="material-symbols-outlined">close</span></button>
                  </div>
                )}
                {applied.city !== 'all' && (
                  <div className={styles.chip}>
                    <span className="material-symbols-outlined">location_on</span>
                    {applied.city}
                    <button aria-label="Xóa bộ lọc thành phố" onClick={() => removeFilter('city')}><span className="material-symbols-outlined">close</span></button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className={styles.loading}>Đang tải danh sách sự kiện...</div>
              ) : error ? (
                <div className={styles.empty} role="alert"><p>{error}</p><button className={styles.applyBtn} onClick={() => setRevision(value => value + 1)}>Thử lại</button></div>
              ) : events.length > 0 ? (
                <div className={styles.grid}>
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  <h3>Không tìm thấy sự kiện nào</h3>
                  <p>Vui lòng thử lại với bộ lọc khác.</p>
                </div>
              )}
              {!error && totalPages > 1 && <nav className={styles.pagination} aria-label="Phân trang sự kiện">
                <button disabled={loading || page === 0} onClick={() => changePage(page - 1)}>Trang trước</button>
                <span role="status">Trang {page + 1} / {totalPages}</span>
                <button disabled={loading || page + 1 >= totalPages} onClick={() => changePage(page + 1)}>Trang sau</button>
              </nav>}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
