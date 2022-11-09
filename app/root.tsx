import type {
  DataFunctionArgs,
  LinksFunction,
  MetaFunction,
  Session,
} from '@remix-run/node'

import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import { useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { z } from 'zod'

import { Navigation, navigationStyles } from './components'
import { getServerFirebase } from './firebase/firebase.server'
import { getUserWithUid } from './firebase/read.server'
import styles from './root.css'
import { authGetSession } from './sessions/auth.server'
import {
  validationCommitSession,
  validationGetSession,
} from './sessions/validationStates.server'
import { ACCESS_TOKEN, SET_COOKIE, validationStates } from './types'
import { getCookie } from './utils/getCookie'

function getValidationTexts(validationSession: Session) {
  const validationSessionErrorText =
    z
      .string()
      .optional()
      .parse(validationSession.get(validationStates.error)) ?? null
  const validationSessionSuccessText =
    z
      .string()
      .optional()
      .parse(validationSession.get(validationStates.success)) ?? null

  return { validationSessionErrorText, validationSessionSuccessText }
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Kamuy',
  description: 'A chat app inspired by WhatsApp Web',
  viewport: 'width=device-width,initial-scale=1',
})

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: styles },
    { rel: 'stylesheet', href: navigationStyles },
  ]
}

export const loader = async ({ request }: DataFunctionArgs) => {
  const { firebaseAdminAuth } = getServerFirebase()

  const validationSession = await validationGetSession(getCookie(request))
  const validationTextsData = getValidationTexts(validationSession)

  const authSession = await authGetSession(getCookie(request))

  const token = authSession.get(ACCESS_TOKEN)

  const pathname = new URL(request.url).pathname

  const sessionHeaders = {
    headers: {
      [SET_COOKIE]: await validationCommitSession(validationSession),
    },
  }

  try {
    const decodedToken = await firebaseAdminAuth.verifyIdToken(token)
    const isInsideChatRoutes = pathname.startsWith('/chats')

    if (isInsideChatRoutes) {
      const user = await getUserWithUid(decodedToken.uid)
      return json({ ...validationTextsData, user }, sessionHeaders)
    } else {
      return redirect('/chats', sessionHeaders)
    }
  } catch (error) {
    const isOnLoginPage = pathname === '/login'
    if (isOnLoginPage) {
      return json(validationTextsData, sessionHeaders)
    } else {
      return redirect('/login', sessionHeaders)
    }
  }
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>()

  const { validationSessionErrorText, validationSessionSuccessText } =
    loaderData

  useEffect(() => {
    if (validationSessionErrorText) {
      toast.error(validationSessionErrorText)
    }

    if (validationSessionSuccessText) {
      toast.success(validationSessionSuccessText)
    }

    // Necessary to have the `loaderData` here otherwise the effect won't re-run if the validation texts contain the same strings since string is a primitive type
  }, [loaderData, validationSessionErrorText, validationSessionSuccessText])

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Toaster position="top-center" toastOptions={{ duration: 500 }} />
        <Navigation />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
