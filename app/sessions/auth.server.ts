import { createCookieSessionStorage } from '@remix-run/node'

import { ONE_YEAR } from '~/types'

export const authSession = createCookieSessionStorage({
  cookie: {
    name: 'fb:token',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: ['tacos'],
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_YEAR,
  },
})

export const {
  getSession: authGetSession,
  commitSession: authCommitSession,
  destroySession: authDestroySession,
} = authSession
