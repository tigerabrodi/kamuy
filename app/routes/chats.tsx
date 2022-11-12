import type { LinksFunction } from '@remix-run/node'

import { Outlet } from '@remix-run/react'

import styles from './chats.css'

import { Plus, Search } from '~/icons'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export default function Chats() {
  return (
    <main className="chats">
      <div className="chats__items">
        <div className="chats__items-user">
          <h2>Johnny</h2>
          <button type="submit" aria-label="Create new chat">
            <Plus />
          </button>
        </div>

        <div className="chats__items-search">
          <Search />
          <input
            type="text"
            placeholder="Search for chats"
            aria-label="Search for chats"
          />
        </div>

        <div className="chats__items-chats">
          <p className="chats__items-chats-none">No chats yet.</p>
        </div>
      </div>

      <div className="chats__outlet-wrapper">
        <Outlet />
      </div>
    </main>
  )
}
