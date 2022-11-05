import { Link } from '@remix-run/react'

import navigationStyles from './Navigation.css'

import { Kamuy } from '~/icons'

export { navigationStyles }

export function Navigation() {
  return (
    <nav className="navigation">
      <Link to="/" prefetch="intent" aria-label="Kamuy">
        <Kamuy />
      </Link>
    </nav>
  )
}
