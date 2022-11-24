import type { DataFunctionArgs, LinksFunction } from '@remix-run/node'
import type { User } from '~/types/firebase'

import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useTransition,
} from '@remix-run/react'

import { ChatDetailPlaceholder } from './chats.$chatId'
import chatIdStyles from './chats.$chatId.css'
import chatsStyles from './chats.css'

import { Image } from '~/components'
import {
  getChatsForUserWithUid,
  getUserWithUid,
  createChatForUserWithId,
} from '~/firebase'
import { getServerFirebase } from '~/firebase/firebase.server'
import { useGetChatsForUserSubscription } from '~/hooks'
import { Plus, Search } from '~/icons'
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

export default function Chats() {
  const { user, initialUserChats } = useLoaderData<typeof loader>()
  const transition = useTransition()

  const { userChats } = useGetChatsForUserSubscription({
    user: user as User,
    initialUserChats,
  })

  const isRedirectingAfterSubmission =
    transition.state === 'loading' &&
    transition.submission?.action === '/chats' &&
    transition.type === 'actionRedirect'

  const isSubmittingANewChat =
    transition.state === 'submitting' &&
    transition.submission.formData.get(INTENT) === CREATE_NEW_CHAT

  const shouldShowChatPlaceholder =
    isSubmittingANewChat || isRedirectingAfterSubmission

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
                prefetch="intent"
              >
                <Image
                  chat={chat}
                  placeholderClassName="chats__items-chat-img-placeholder"
                />
                <p>{chat.name}</p>
              </Link>
            ))
          ) : (
            <p className="chats__items-chats-none">No chats yet.</p>
          )}
        </div>
      </div>

      <div className="chats__outlet-wrapper">
        {shouldShowChatPlaceholder ? <ChatDetailPlaceholder /> : <Outlet />}
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
