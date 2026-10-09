import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getPublicEvents } from '../api/event-api'
import type { PublicEventSummaryResponse } from '../types/event'
import { EventCard } from '../components/EventCard'
import { CustomerHeader } from '../components/CustomerHeader'
import styles from './HomePage.module.css'

export function HomePage() {
  const [events, setEvents] = useState<PublicEventSummaryResponse[]>([])

  useEffect(() => {
    // Fetch a larger set to fill multiple rows (4 per row * 3 rows = 12 events)
    getPublicEvents({ size: 12 }).then((res) => setEvents(res.content))
  }, [])

  return (
    <div className={styles.page}>
      <CustomerHeader />
      
      <main className={styles.main}>
        {/* HERO SECTION */}
        <section className={styles.heroSection}>
          <div className={styles.heroBg1}></div>
          <div className={styles.heroBg2}></div>
          
          <div className={styles.heroContainer}>
            <div className={styles.heroCard}>
              <div 
                className={styles.heroImage} 
                style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDhSXTRRyZK0qU08BcTHIs1ZcZysBHO7DmoQnucdkQ4W_XrY9lv-dc5zheHQM5AIJeEBlY6Qz1nsCDWGc_QvT5QbiTYJ5yYYLtAKoLhGGXsvYglN6ysEFtwPij9SRSGZEyj6hsy4dcWsoHN38q11kXYGBuoMQje_YQJWxSVXJW63xMQtSSCpM08a50QAL3TbdslblqhFk76F6IrmWAwxVa07rDJ6kBWWBH9g6xLt60R603Le4Hjo36p')` }}
              >
                <div className={styles.overlayBottom}></div>
                <div className={styles.overlayLeft}></div>
                
                <div className={styles.heroContent}>
                  {/* Tag nổi bật */}
                  <div className={styles.tags}>
                    <span className={styles.tagHot}>
                      <span className={styles.dotPulse}></span>
                      Sự kiện hot nhất tuần
                    </span>
                    <span className={styles.tagExclusive}>
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Bán vé độc quyền TicketBox
                    </span>
                  </div>
                  
                  {/* Tên sự kiện */}
                  <div className={styles.titleGroup}>
                    <p className={styles.tourName}>Mega Live Tour 2025</p>
                    <h1 className={styles.mainTitle}>
                      LUMINOUS SOUND FESTIVAL 2025
                    </h1>
                  </div>
                  
                  {/* Thời gian & Địa điểm */}
                  <div className={styles.eventInfo}>
                    <div className={styles.infoItem}>
                      <span className="material-symbols-outlined">schedule</span>
                      <span>20:00 • Thứ 7, 26/04/2025</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className="material-symbols-outlined">location_on</span>
                      <span>Sân vận động Quân khu 7, TP. Hồ Chí Minh</span>
                    </div>
                  </div>
                  
                  {/* Giá vé & Nút */}
                  <div className={styles.actionGroup}>
                    <div className={styles.priceInfo}>
                      <span className={styles.priceLabel}>Giá vé chỉ từ</span>
                      <span className={styles.priceValue}>450.000 VNĐ</span>
                    </div>
                    <div className={styles.buttons}>
                      <Link to="/customer/explore" className={styles.btnPrimary}>
                        <span>Khám phá ngay</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </Link>
                      <button className={styles.btnBookmark} title="Lưu sự kiện">
                        <span className="material-symbols-outlined">bookmark_add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Carousel navigation tabs */}
              <div className={styles.carouselNav}>
                <div className={styles.tabs}>
                  <span className={styles.tabsLabel}>Sự kiện tiêu điểm:</span>
                  <button className={styles.tabActive}>
                    <span className={styles.tabDot}></span>
                    Luminous Sound Festival
                  </button>
                  <button className={styles.tabItem}>Anh Trai Say Hi - Live Concert</button>
                  <button className={styles.tabItem}>Hà Anh Tuấn - Chân Trời Rực Rỡ</button>
                </div>
                <div className={styles.carouselControls}>
                  <button className={styles.controlBtn}>
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <span className={styles.pageIndicator}>01 / 03</span>
                  <button className={styles.controlBtn}>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SỰ KIỆN NỔI BẬT */}
        <section className={styles.featuredSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.sectionSubtitle}>
                  <span className={styles.subtitleDot}></span>
                  Tuyển chọn đặc sắc
                </div>
                <h2 className={styles.sectionTitle}>Sự kiện nổi bật</h2>
              </div>
              
              {/* Filter Tabs */}
              <div className={styles.filterTabs}>
                <button className={styles.filterTabActive}>Tất cả TP</button>
                <button className={styles.filterTab}>TP. Hồ Chí Minh</button>
                <button className={styles.filterTab}>Hà Nội</button>
                <button className={styles.filterTab}>Đà Nẵng</button>
              </div>
            </div>
            
            <div className={styles.grid}>
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
