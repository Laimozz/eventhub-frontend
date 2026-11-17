import { BrowserRouter } from 'react-router'
import { AuthProvider } from './app/AuthProvider'
import { NotificationsProvider } from './app/NotificationsProvider'
import { AppRouter } from './app/AppRouter'
import { AiChatbot } from './features/chatbot/components/AiChatbot'

export default function App() {
  return <BrowserRouter><AuthProvider><NotificationsProvider><AppRouter /><AiChatbot /></NotificationsProvider></AuthProvider></BrowserRouter>
}
