import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getCategories, getPublicEvents } from '../api/event-api'
import { utcDate } from '../booking-display'
import { customerEventState } from '../event-sales'
import type { CategoryResponse, PublicEventSummaryResponse } from '../types/event'
import styles from './SearchAutocomplete.module.css'

const DEFAULT_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDhSXTRRyZK0qU08BcTHIs1ZcZysBHO7DmoQnucdkQ4W_XrY9lv-dc5zheHQM5AIJeEBlY6Qz1nsCDWGc_QvT5QbiTYJ5yYYLtAKoLhGGXsvYglN6ysEFtwPij9SRSGZEyj6hsy4dcWsoHN38q11kXYGBuoMQje_YQJWxSVXJW63xMQtSSCpM08a50QAL3TbdslblqhFk76F6IrmWAwxVa07rDJ6kBWWBH9g6xLt60R603Le4Hjo36p'

const RECENT_KEY = 'eh_recent_searches'

// Trending keyword
const TRENDING_KEYWORDS = [
  'Âm nhạc',
  'Live Concert',
  'Hội thảo',
  'Acoustic',
  'Hà Nội',
  'TP. Hồ Chí Minh',
]

interface SearchAutocompleteProps {
  placeholder?: string
}

export function SearchAutocomplete({
  placeholder = 'Tìm kiếm sự kiện, nghệ sĩ, địa điểm...',
}: SearchAutocompleteProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const listboxId = useId()

  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [events, setEvents] = useState<PublicEventSummaryResponse[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with searchParams if changed from outside
  useEffect(() => {
    const currentParam = searchParams.get('search') || ''
    setQuery(currentParam)
  }, [searchParams])

  // Load categories and recent searches on mount
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))

    try {
      const saved = localStorage.getItem(RECENT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 6))
        }
      }
    } catch {
      // ignore JSON error
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  // Save term to recent searches
  const saveRecentSearch = (term: string) => {
    const cleaned = term.trim()
    if (!cleaned) return
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== cleaned.toLowerCase())
      const updated = [cleaned, ...filtered].slice(0, 6)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      } catch {
        // storage quota exceeded or disabled
      }
      return updated
    })
  }

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation()
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToRemove)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_KEY)
    } catch {
      // ignore
    }
  }

  // Filter matched categories
  const matchedCategories = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return []
    return categories.filter((cat) => cat.name.toLowerCase().includes(trimmed)).slice(0, 4)
  }, [categories, query])

  // Execute API Search
  const performSearch = (searchTerm: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const trimmed = searchTerm.trim()
    if (!trimmed) {
      setEvents([])
      setTotalElements(0)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    setIsLoading(true)

    getPublicEvents({ search: trimmed, size: 5 }, controller.signal)
      .then((res) => {
        setEvents(res.content || [])
        setTotalElements(res.totalElements || 0)
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setEvents([])
          setTotalElements(0)
          setIsLoading(false)
        }
      })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setIsOpen(true)
    setActiveIndex(-1)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(val)
    }, 250)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    if (query.trim()) {
      performSearch(query)
    }
  }

  const handleClear = () => {
    setQuery('')
    setEvents([])
    setTotalElements(0)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const submitExploreSearch = (searchVal: string) => {
    const val = searchVal.trim()
    if (val) saveRecentSearch(val)
    setIsOpen(false)
    const params = new URLSearchParams(searchParams)
    params.delete('page')
    if (val) {
      params.set('search', val)
    } else {
      params.delete('search')
    }
    navigate(`/customer/explore?${params.toString()}`)
  }

  const handleSelectEvent = (event: PublicEventSummaryResponse) => {
    saveRecentSearch(event.name)
    setIsOpen(false)
    navigate(`/customer/events/${event.id}`)
  }

  const handleSelectCategory = (cat: CategoryResponse) => {
    saveRecentSearch(cat.name)
    setIsOpen(false)
    const params = new URLSearchParams(searchParams)
    params.delete('page')
    params.delete('search')
    params.set('categoryId', String(cat.id))
    navigate(`/customer/explore?${params.toString()}`)
  }

  // Keyboard navigation items list
  interface NavItem {
    type: 'recent' | 'trending' | 'category' | 'event' | 'all'
    data?: any
  }

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = []
    const trimmed = query.trim()
    if (!trimmed) {
      recentSearches.forEach((s) => items.push({ type: 'recent', data: s }))
      TRENDING_KEYWORDS.forEach((t) => items.push({ type: 'trending', data: t }))
      categories.slice(0, 4).forEach((c) => items.push({ type: 'category', data: c }))
    } else {
      matchedCategories.forEach((c) => items.push({ type: 'category', data: c }))
      events.forEach((ev) => items.push({ type: 'event', data: ev }))
      items.push({ type: 'all', data: trimmed })
    }
    return items
  }, [query, recentSearches, categories, matchedCategories, events])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      setActiveIndex((prev) => (prev + 1 < navItems.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : navItems.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isOpen && activeIndex >= 0 && activeIndex < navItems.length) {
        const item = navItems[activeIndex]
        if (item.type === 'event') {
          handleSelectEvent(item.data)
        } else if (item.type === 'category') {
          handleSelectCategory(item.data)
        } else if (item.type === 'recent' || item.type === 'trending') {
          setQuery(item.data)
          submitExploreSearch(item.data)
        } else {
          submitExploreSearch(query)
        }
      } else {
        submitExploreSearch(query)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  // Highlight matching text helper
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escaped})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className={styles.highlight}>
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  const formatEventDate = (isoString: string) => {
    try {
      const d = utcDate(isoString)
      const timeZone = 'Asia/Ho_Chi_Minh'
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone })
      const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone })
      return `${time} • ${date}`
    } catch {
      return isoString
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined || price === 0) return 'Miễn phí'
    return `Từ ${new Intl.NumberFormat('vi-VN').format(price)} ₫`
  }

  const isQueryEmpty = !query.trim()

  return (
    <div className={styles.searchContainer} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={styles.searchInput}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
        />
        <div className={styles.actionIcons}>
          {isLoading && <div className={styles.spinner} title="Đang tìm kiếm..." />}
          {query && !isLoading && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className={styles.popup} id={listboxId} role="listbox">
          <div className={styles.popupScrollable}>
            {isQueryEmpty ? (
              <>
                {/* RECENT SEARCHES */}
                {recentSearches.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionTitle}>
                        <span className="material-symbols-outlined">history</span>
                        Tìm kiếm gần đây
                      </span>
                      <button
                        type="button"
                        className={styles.clearAllBtn}
                        onClick={clearAllRecent}
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    <div className={styles.recentList}>
                      {recentSearches.map((term, idx) => {
                        const isCurrentActive = activeIndex === idx
                        return (
                          <div
                            key={term}
                            id={`${listboxId}-option-${idx}`}
                            role="option"
                            aria-selected={isCurrentActive}
                            className={`${styles.recentChip} ${isCurrentActive ? styles.recentChipActive : ''
                              }`}
                            onClick={() => {
                              setQuery(term)
                              submitExploreSearch(term)
                            }}
                          >
                            <span className={`material-symbols-outlined ${styles.recentChipIcon}`}>
                              schedule
                            </span>
                            <span>{term}</span>
                            <button
                              type="button"
                              className={styles.recentChipRemove}
                              onClick={(e) => removeRecentSearch(e, term)}
                              aria-label={`Xóa ${term} khỏi lịch sử`}
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {recentSearches.length > 0 && <div className={styles.sectionDivider} />}

                {/* TRENDING KEYWORDS */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitle}>
                      <span className="material-symbols-outlined">trending_up</span>
                      Xu hướng tìm kiếm
                    </span>
                  </div>
                  <div className={styles.trendingGrid}>
                    {TRENDING_KEYWORDS.map((kw, idx) => {
                      const itemIdx = recentSearches.length + idx
                      const isCurrentActive = activeIndex === itemIdx
                      return (
                        <button
                          type="button"
                          key={kw}
                          id={`${listboxId}-option-${itemIdx}`}
                          role="option"
                          aria-selected={isCurrentActive}
                          className={`${styles.trendingTag} ${isCurrentActive ? styles.trendingTagActive : ''
                            }`}
                          onClick={() => {
                            setQuery(kw)
                            submitExploreSearch(kw)
                          }}
                        >
                          <span className={`material-symbols-outlined ${styles.trendingTagIcon}`}>
                            local_fire_department
                          </span>
                          <span>{kw}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {categories.length > 0 && (
                  <>
                    <div className={styles.sectionDivider} />
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <span className={styles.sectionTitle}>
                          <span className="material-symbols-outlined">category</span>
                          Thể loại nổi bật
                        </span>
                      </div>
                      <div className={styles.categoryPills}>
                        {categories.slice(0, 5).map((cat, idx) => {
                          const itemIdx = recentSearches.length + TRENDING_KEYWORDS.length + idx
                          const isCurrentActive = activeIndex === itemIdx
                          return (
                            <button
                              type="button"
                              key={cat.id}
                              id={`${listboxId}-option-${itemIdx}`}
                              role="option"
                              aria-selected={isCurrentActive}
                              className={`${styles.categoryPill} ${isCurrentActive ? styles.categoryPillActive : ''
                                }`}
                              onClick={() => handleSelectCategory(cat)}
                            >
                              <span className={`material-symbols-outlined ${styles.categoryPillIcon}`}>
                                confirmation_number
                              </span>
                              <span>{cat.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* MATCHED CATEGORIES */}
                {matchedCategories.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionTitle}>
                        <span className="material-symbols-outlined">category</span>
                        Danh mục phù hợp
                      </span>
                    </div>
                    <div className={styles.categoryPills}>
                      {matchedCategories.map((cat, idx) => {
                        const isCurrentActive = activeIndex === idx
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            id={`${listboxId}-option-${idx}`}
                            role="option"
                            aria-selected={isCurrentActive}
                            className={`${styles.categoryPill} ${isCurrentActive ? styles.categoryPillActive : ''
                              }`}
                            onClick={() => handleSelectCategory(cat)}
                          >
                            <span className={`material-symbols-outlined ${styles.categoryPillIcon}`}>
                              category
                            </span>
                            <span>{renderHighlightedText(cat.name, query)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {matchedCategories.length > 0 && events.length > 0 && (
                  <div className={styles.sectionDivider} />
                )}

                {/* MATCHED EVENTS */}
                {events.length > 0 ? (
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionTitle}>
                        <span className="material-symbols-outlined">event</span>
                        Sự kiện gợi ý ({events.length})
                      </span>
                    </div>
                    <div className={styles.eventList}>
                      {events.map((ev, idx) => {
                        const itemIdx = matchedCategories.length + idx
                        const isCurrentActive = activeIndex === itemIdx
                        const state = customerEventState(ev)

                        let statusClass = styles.statusOnSale
                        if (ev.salesStatus === 'SOLD_OUT') statusClass = styles.statusSoldOut
                        else if (ev.status === 'APPROVED' && ev.salesStatus === 'NOT_ON_SALE')
                          statusClass = styles.statusUpcoming
                        else if (ev.status === 'COMPLETED' || ev.salesStatus === 'SALES_ENDED')
                          statusClass = styles.statusEnded

                        return (
                          <div
                            key={ev.id}
                            id={`${listboxId}-option-${itemIdx}`}
                            role="option"
                            aria-selected={isCurrentActive}
                            className={`${styles.eventItem} ${isCurrentActive ? styles.eventItemActive : ''
                              }`}
                            onClick={() => handleSelectEvent(ev)}
                          >
                            <img
                              src={ev.thumbnailImageUrl || DEFAULT_IMAGE}
                              alt={ev.name}
                              className={styles.eventThumb}
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = DEFAULT_IMAGE
                              }}
                            />
                            <div className={styles.eventInfo}>
                              <div className={styles.eventName} title={ev.name}>
                                {renderHighlightedText(ev.name, query)}
                              </div>
                              <div className={styles.eventMeta}>
                                <span className={styles.metaItem}>
                                  <span className="material-symbols-outlined">schedule</span>
                                  {formatEventDate(ev.startTime)}
                                </span>
                                {ev.city && (
                                  <span className={styles.metaItem}>
                                    <span className="material-symbols-outlined">location_on</span>
                                    {ev.city}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={styles.eventRight}>
                              <span className={styles.priceBadge}>
                                {formatPrice(ev.startingPrice)}
                              </span>
                              <span className={`${styles.statusPill} ${statusClass}`}>
                                {state.salesLabel || 'Đang bán'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : !isLoading && matchedCategories.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <span className="material-symbols-outlined text-[28px]">search_off</span>
                    </div>
                    <div className={styles.emptyTitle}>Không tìm thấy sự kiện nào</div>
                    <div className={styles.emptyDesc}>
                      Không có kết quả phù hợp với từ khóa "<strong>{query}</strong>". Thử tìm kiếm
                      theo địa điểm, thể loại hoặc xem tất cả sự kiện.
                    </div>
                    <button
                      type="button"
                      className={styles.emptyExploreBtn}
                      onClick={() => {
                        setIsOpen(false)
                        navigate('/customer/explore')
                      }}
                    >
                      Khám phá tất cả sự kiện
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* FOOTER: VIEW ALL RESULTS */}
          {!isQueryEmpty && (
            <div className={styles.popupFooter}>
              <button
                type="button"
                id={`${listboxId}-option-${navItems.length - 1}`}
                role="option"
                aria-selected={activeIndex === navItems.length - 1}
                className={`${styles.viewAllBtn} ${activeIndex === navItems.length - 1 ? styles.viewAllBtnActive : ''
                  }`}
                onClick={() => submitExploreSearch(query)}
              >
                <span>
                  Xem tất cả {totalElements > 0 ? `${totalElements} ` : ''}kết quả cho "
                  <strong>{query}</strong>"
                </span>
                <span className={styles.enterKey}>Enter ↵</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
