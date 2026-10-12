import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/Layout'
import Landing from './pages/Landing'
import Translate from './pages/Translate'
import Recognize from './pages/Recognize'
import Result from './pages/Result'
import History from './pages/History'
import Explore from './pages/Explore'
import Auth from './pages/Auth'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route element={<AppLayout />}>
        <Route path="/translate" element={<Translate />} />
        <Route path="/recognize" element={<Recognize />} />
        <Route path="/result/:id" element={<Result />} />
        <Route path="/history" element={<History />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
