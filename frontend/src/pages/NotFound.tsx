import { Link } from 'react-router-dom'
import { EmptyState } from '../components/Bits'

export default function NotFound() {
  return <EmptyState title="This page doesn’t exist" text="The address may be mistyped or the page may have moved."><Link to="/" className="btn primary">Go to LEXIA</Link></EmptyState>
}
