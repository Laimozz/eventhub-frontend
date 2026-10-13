import { BrowserRouter } from 'react-router'
import { AuthProvider } from './app/AuthProvider'
import { NotificationsProvider } from './app/NotificationsProvider'
import { AppRouter } from './app/AppRouter'

export default function App() {
  return <BrowserRouter><AuthProvider><NotificationsProvider><AppRouter /></NotificationsProvider></AuthProvider></BrowserRouter>
}
