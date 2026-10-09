import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { getPublicEvents, getCategories } from '../api/event-api'
import type { PublicEventSummaryResponse, CategoryResponse } from '../types/event'
import { EventCard } from '../components/EventCard'
import { CustomerHeader } from '../components/CustomerHeader'
import styles from './ExplorePage.module.css'

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Data states
  const [events, setEvents] = useState<PublicEventSummaryResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [totalElements, setTotalElements] = useState(0)

  // Filter states (initialized from URL if available)
  const [city, setCity] = useState(searchParams.get('city') || 'all')
  const [categoryId, setCategoryId] = useState<number | 'all'>(
    searchParams.has('categoryId') ? Number(searchParams.get('categoryId')) : 'all'
  )
  const [timeFilter, setTimeFilter] = useState(searchParams.get('time') || 'all') // all, today, this_week, this_month, custom
  const [fromDate, setFromDate] = useState(searchParams.get('fromDate') || '')
  const [toDate, setToDate] = useState(searchParams.get('toDate') || '')
  
  // Extract search term from URL
  const searchString = searchParams.get('search') || undefined

  // On mount, load categories
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  // Derived dates based on timeFilter (UTC)
  const effectiveDates = useMemo(() => {
    // Helper function to get ISO string without 'Z' for Spring LocalDateTime
    const toLocalIso = (date: Date) => date.toISOString().replace('Z', '')

    if (timeFilter === 'custom') {
      return {
        from: fromDate ? toLocalIso(new Date(fromDate)) : undefined,
        to: toDate ? toLocalIso(new Date(toDate)) : undefined
      }
    }
    
    if (timeFilter === 'all') return { from: undefined, to: undefined }

    const now = new Date()
    if (timeFilter === 'today') {
      const start = new Date(now.setHours(0, 0, 0, 0))
      const end = new Date(now.setHours(23, 59, 59, 999))
      return { from: toLocalIso(start), to: toLocalIso(end) }
    }
    if (timeFilter === 'this_week') {
      const first = now.getDate() - now.getDay() // Sunday
      const start = new Date(now.setDate(first))
      start.setHours(0,0,0,0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23,59,59,999)
      return { from: toLocalIso(start), to: toLocalIso(end) }
    }
    if (timeFilter === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return { from: toLocalIso(start), to: toLocalIso(end) }
    }
    return { from: undefined, to: undefined }
  }, [timeFilter, fromDate, toDate])

  // Fetch events when filters change
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        const response = await getPublicEvents({
          size: 12, // Default size for explore page
          categoryId: categoryId === 'all' ? undefined : categoryId,
          city: city === 'all' ? undefined : city,
          fromDate: effectiveDates.from,
          toDate: effectiveDates.to,
          search: searchString
        })
        setEvents(response.content)
        setTotalElements(response.totalElements)
      } catch (error) {
        console.error('Lỗi khi tải danh sách sự kiện:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [categoryId, city, effectiveDates, searchString])

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
    setCity('all')
    setCategoryId('all')
    setTimeFilter('all')
    setFromDate('')
    setToDate('')
    const params = new URLSearchParams()
    if (searchString) params.set('search', searchString)
    setSearchParams(params)
  }

  const removeCityFilter = () => {
    setCity('all')
    applyFilters()
  }

  const removeCategoryFilter = () => {
    setCategoryId('all')
    applyFilters()
  }

  const categoryName = categoryId !== 'all' ? categories.find(c => c.id === categoryId)?.name : null

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
                        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setTimeFilter('custom'); }} />
                      </div>
                      <div>
                        <label>Đến ngày</label>
                        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setTimeFilter('custom'); }} />
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
                    <span className="material-symbols-outlined">check</span>
                    Áp dụng bộ lọc
                  </button>
                  <button className={styles.clearBtn} onClick={resetFilters}>
                    <span className="material-symbols-outlined">close</span>
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
                {categoryId !== 'all' || city !== 'all' || searchString ? <span>Đang chọn:</span> : null}
                {searchString && (
                  <div className={styles.chip}>
                    <span className="material-symbols-outlined">search</span>
                    Từ khóa: {searchString}
                    <button onClick={() => {
                      const params = new URLSearchParams(searchParams)
                      params.delete('search')
                      setSearchParams(params)
                    }}><span className="material-symbols-outlined">close</span></button>
                  </div>
                )}
                {categoryId !== 'all' && categoryName && (
                  <div className={styles.chip}>
                    <span className="material-symbols-outlined">music_note</span>
                    {categoryName}
                    <button onClick={removeCategoryFilter}><span className="material-symbols-outlined">close</span></button>
                  </div>
                )}
                {city !== 'all' && (
                  <div className={styles.chip}>
                    <span className="material-symbols-outlined">location_on</span>
                    {city}
                    <button onClick={removeCityFilter}><span className="material-symbols-outlined">close</span></button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className={styles.loading}>Đang tải danh sách sự kiện...</div>
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
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
