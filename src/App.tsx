import { BrowserRouter } from 'react-router'
import { AuthProvider } from './app/AuthProvider'
import { AppRouter } from './app/AppRouter'

export default function App() {
  return <BrowserRouter><AuthProvider><AppRouter /></AuthProvider></BrowserRouter>
}
