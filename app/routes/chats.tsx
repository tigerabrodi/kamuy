import type { DataFunctionArgs, LinksFunction } from '@remix-run/node'
import type { CollectionReference } from 'firebase/firestore'
import type { Chat } from '~/types/firebase'

import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useTransition,
} from '@remix-run/react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { ChatDetailPlaceholder } from './chats.$chatId'
import chatIdStyles from './chats.$chatId.css'
import chatsStyles from './chats.css'

import {
  getChatsForUserWithUid,
  getUserWithUid,
  createChatForUserWithId,
} from '~/firebase'
import { CHATS_COLLECTION, CREATED_AT, OWNER_ID } from '~/firebase/constants'
import { getServerFirebase } from '~/firebase/firebase.server'
import { Plus, Search, DefaultChat } from '~/icons'
import { useFirebase } from '~/providers/FirebaseProvider'
import { authGetSession } from '~/sessions/auth.server'
import { ACCESS_TOKEN, INTENT } from '~/types'
import { getCookie } from '~/utils/getCookie'

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: chatsStyles },
    { rel: 'stylesheet', href: chatIdStyles },
  ]
}

const CREATE_NEW_CHAT = 'Create new chat'
export const IS_NEWLY_CREATED = 'isNewlyCreated'

export const loader = async ({ request }: DataFunctionArgs) => {
  const { firebaseAdminAuth } = getServerFirebase()

  const authSession = await authGetSession(getCookie(request))
  const token = authSession.get(ACCESS_TOKEN)

  try {
    const { uid } = await firebaseAdminAuth.verifySessionCookie(token)

    const [user, initialUserChats] = await Promise.all([
      getUserWithUid(uid),
      getChatsForUserWithUid(uid),
    ])

    return json({ user, initialUserChats })
  } catch (error) {
    throw json({ error: 'You are unauthenticated.' }, { status: 401 })
  }
}

function shouldShowDefaultChatImg(chat: Chat) {
  return chat.imageUrl === ''
}

export default function Chats() {
  const { user, initialUserChats } = useLoaderData<typeof loader>()
  const transition = useTransition()
  const firebaseContext = useFirebase()
  const [userChats, setUserChats] = useState(initialUserChats)

  const isSubmittingCreateNewChat =
    transition.state === 'submitting' &&
    transition.submission.formData.get(INTENT) === CREATE_NEW_CHAT

  useEffect(() => {
    if (firebaseContext?.firebaseDb) {
      const chatsRef = collection(
        firebaseContext?.firebaseDb,
        CHATS_COLLECTION
      ) as CollectionReference<Chat>

      const chatsQuery = query<Chat>(
        chatsRef,
        where(OWNER_ID, '==', user.id),
        orderBy(CREATED_AT, 'desc')
      )

      const unsubscribe = onSnapshot(chatsQuery, (chatsSnapshot) => {
        const chats = chatsSnapshot.docs.map((doc) => doc.data())
        setUserChats(chats)
      })

      return unsubscribe
    }
  }, [firebaseContext?.firebaseDb, user.id])

  return (
    <main className="chats">
      <div className="chats__items">
        <div className="chats__items-user">
          <h2>{user.username}</h2>
          <Form method="post">
            <button
              type="submit"
              aria-label="Create new chat"
              name={INTENT}
              value={CREATE_NEW_CHAT}
            >
              <Plus />
            </button>

            <input type="hidden" name="chatId" value="kdljgkghdgfjk" />
          </Form>
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
          {userChats.length > 0 ? (
            userChats.map((chat) => (
              <Link
                key={chat.id}
                to={`/chats/${chat.id}`}
                aria-label={`${chat.name} chat`}
              >
                {shouldShowDefaultChatImg(chat) ? (
                  <DefaultChat />
                ) : (
                  <img src={chat.imageUrl} alt="" />
                )}
                <p>{chat.name}</p>
              </Link>
            ))
          ) : (
            <p className="chats__items-chats-none">No chats yet.</p>
          )}
        </div>
      </div>

      <div className="chats__outlet-wrapper">
        {isSubmittingCreateNewChat ? <ChatDetailPlaceholder /> : <Outlet />}
      </div>
    </main>
  )
}

export const action = async ({ request }: DataFunctionArgs) => {
  const { firebaseAdminAuth } = getServerFirebase()

  const authSession = await authGetSession(getCookie(request))

  const token = authSession.get(ACCESS_TOKEN)

  try {
    const { uid } = await firebaseAdminAuth.verifySessionCookie(token)
    const chat = await createChatForUserWithId(uid)

    return redirect(`/chats/${chat.id}?${IS_NEWLY_CREATED}=true`)
  } catch (error) {
    throw json({ error: 'You are unauthenticated.' }, { status: 401 })
  }
}
