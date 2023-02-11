import type {
  DataFunctionArgs,
  LinksFunction,
  MetaFunction,
  Session,
} from '@remix-run/node'

import Overpass400 from '@fontsource/overpass/400.css'
import Overpass500 from '@fontsource/overpass/500.css'
import Overpass600 from '@fontsource/overpass/600.css'
import Overpass700 from '@fontsource/overpass/700.css'
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
import { FirebaseProvider } from './providers/FirebaseProvider'
import styles from './root.css'
import { authGetSession } from './sessions/auth.server'
import {
  validationCommitSession,
  validationGetSession,
} from './sessions/validationStates.server'
import {
  ACCESS_TOKEN,
  SET_COOKIE,
  VALIDATION_STATE_ERROR,
  VALIDATION_STATE_SUCCESS,
} from './types'
import { FirebaseOptionsSchema } from './types/firebase'
import { getCookie } from './utils/getCookie'

function getValidationTexts(validationSession: Session) {
  const validationSessionErrorText =
    z
      .string()
      .optional()
      .parse(validationSession.get(VALIDATION_STATE_ERROR)) ?? null
  const validationSessionSuccessText =
    z
      .string()
      .optional()
      .parse(validationSession.get(VALIDATION_STATE_SUCCESS)) ?? null

  return { validationSessionErrorText, validationSessionSuccessText }
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Kamuy',
  description: 'A chat app inspired by WhatsApp Web',
  viewport: 'width=device-width,initial-scale=1',
  keywords: 'remix,chat,whatsapp,web,react,typescript,css,firebase,chatapp',
  'og:title': 'Kamuy',
  'og:type': 'website',
  'og:url': 'http://kamuy.vercel.app/',
  'og:image':
    'https://user-images.githubusercontent.com/49603590/204720308-83885cc4-a20e-4103-86d9-46142755ee3a.png',
  'og:card': 'summary_large_image',
  'og:creator': '@tabrodi',
  'og:site': 'http://kamuy.vercel.app/',
  'og:description': 'A chat app inspired by WhatsApp Web',
  'twitter:image':
    'https://user-images.githubusercontent.com/49603590/204720308-83885cc4-a20e-4103-86d9-46142755ee3a.png',
  'twitter:card': 'summary_large_image',
  'twitter:creator': '@tabrodi',
  'twitter:title': 'Kamuy',
  'twitter:description': 'A chat app inspired by WhatsApp Web',
})

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: styles },
    { rel: 'stylesheet', href: navigationStyles },
    { rel: 'stylesheet', href: Overpass400 },
    { rel: 'stylesheet', href: Overpass500 },
    { rel: 'stylesheet', href: Overpass600 },
    { rel: 'stylesheet', href: Overpass700 },
  ]
}

export const loader = async ({ request }: DataFunctionArgs) => {
  const { firebaseAdminAuth, firebaseDb } = getServerFirebase()

  const options = FirebaseOptionsSchema.parse(firebaseDb.app.options)

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
    const decodedToken = await firebaseAdminAuth.verifySessionCookie(token)
    const isInsideChatRoutes = pathname.startsWith('/chats')

    const userToken = await firebaseAdminAuth.createCustomToken(
      decodedToken.uid
    )

    if (isInsideChatRoutes) {
      return json(
        { ...validationTextsData, firebase: { options, userToken } },
        sessionHeaders
      )
    } else {
      return redirect('/chats', sessionHeaders)
    }
  } catch (error) {
    const isOnLoginPage = pathname === '/login'
    if (isOnLoginPage) {
      return json({ ...validationTextsData, firebase: null }, sessionHeaders)
    } else {
      return redirect('/login', sessionHeaders)
    }
  }
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>()

  const { validationSessionErrorText, validationSessionSuccessText, firebase } =
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
        <FirebaseProvider firebase={firebase}>
          <Toaster position="top-center" toastOptions={{ duration: 500 }} />
          <Navigation />
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </FirebaseProvider>
      </body>
    </html>
  )
}
