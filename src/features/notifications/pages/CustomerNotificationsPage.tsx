import { CustomerHeader } from '../../customer/components/CustomerHeader'
import { CustomerFooter } from '../../customer/components/CustomerFooter'
import { NotificationsPage } from './NotificationsPage'
import styles from './NotificationsPage.module.css'

export function CustomerNotificationsPage() {
  return <div className={styles.customerLayout}>
    <CustomerHeader />
    <main className={styles.customerContent}><NotificationsPage standalone /></main>
    <CustomerFooter />
  </div>
}
