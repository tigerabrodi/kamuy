import type { DataFunctionArgs, LinksFunction } from '@remix-run/node'

import { json } from '@remix-run/node'
import { Outlet, useLoaderData } from '@remix-run/react'

import styles from './chats.css'

import { getServerFirebase } from '~/firebase/firebase.server'
import { getUserWithUid } from '~/firebase/read.server'
import { Plus, Search } from '~/icons'
import { authGetSession } from '~/sessions/auth.server'
import { ACCESS_TOKEN } from '~/types'
import { getCookie } from '~/utils/getCookie'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export const loader = async ({ request }: DataFunctionArgs) => {
  const { firebaseAdminAuth } = getServerFirebase()

  const authSession = await authGetSession(getCookie(request))

  const token = authSession.get(ACCESS_TOKEN)

  try {
    const decodedToken = await firebaseAdminAuth.verifyIdToken(token)
    const user = await getUserWithUid(decodedToken.uid)
    return json({ user })
  } catch (error) {
    throw json({ error: 'You are unauthenticated.' }, { status: 401 })
  }
}

export default function Chats() {
  const { user } = useLoaderData<typeof loader>()

  return (
    <main className="chats">
      <div className="chats__items">
        <div className="chats__items-user">
          <h2>{user.username}</h2>
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
