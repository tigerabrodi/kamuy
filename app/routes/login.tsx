import type { ActionFunction, LinksFunction } from '@remix-run/node'

import { json } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { Form, useTransition } from '@remix-run/react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

import styles from './login.css'

import { Spinner } from '~/components/Spinner'
import { createUserWithUserData, getServerFirebase } from '~/firebase'
import { authCommitSession, authGetSession } from '~/sessions/auth.server'
import {
  validationCommitSession,
  validationGetSession,
} from '~/sessions/validationStates.server'
import {
  ACCESS_TOKEN,
  FIVE_DAYS_IN_MILLISECONDS,
  SET_COOKIE,
  VALIDATION_STATE_ERROR,
  VALIDATION_STATE_SUCCESS,
} from '~/types'
import { getCookie } from '~/utils/getCookie'

const USERNAME_PLACEHOLDER = 'johnl123'
const EMAIL_PLACEHOLDER = 'john@gmail.com'

const SIGNED_IN_SUCCESS_MESSAGE = 'Signed in successfully!'
const SIGNED_UP_SUCCESS_MESSAGE = 'Signed up successfully!'
const SOMETHING_WENT_WRONG_MESSAGE =
  'Something went wrong, please fill in the values again!'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export default function Login() {
  const transition = useTransition()

  return (
    <main className="login">
      {transition.state === 'submitting' && (
        <Spinner label="signing in" class="login__spinner" />
      )}

      <h1>Sign In</h1>
      <p>
        If your account doesn’t exist, we'll create one, otherwise you just sign
        in.
      </p>
      <Form method="post">
        <div className="login__group">
          <label htmlFor="email">Email</label>
          <input
            type="text"
            id="email"
            name="email"
            placeholder={EMAIL_PLACEHOLDER}
            required
          />
        </div>

        <div className="login__group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder={USERNAME_PLACEHOLDER}
            required
          />
        </div>

        <div className="login__group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            min={6}
            required
          />
        </div>

        <button type="submit">Sign In</button>
      </Form>
    </main>
  )
}

const FormSchema = zfd.formData(
  z.object({
    email: z.string().email(),
    username: z.string(),
    password: z.string().min(6),
  })
)

export const action: ActionFunction = async ({ request }) => {
  const { firebaseAuth, firebaseAdminAuth } = getServerFirebase()

  const [formData, validationSession, authSession] = await Promise.all([
    request.formData(),
    validationGetSession(getCookie(request)),
    authGetSession(getCookie(request)),
  ])

  const { email, username, password } = FormSchema.parse(formData)

  try {
    const { user } = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    )

    authSession.set(
      ACCESS_TOKEN,
      await firebaseAdminAuth.createSessionCookie(await user.getIdToken(), {
        expiresIn: FIVE_DAYS_IN_MILLISECONDS,
      })
    )
    validationSession.flash(VALIDATION_STATE_SUCCESS, SIGNED_IN_SUCCESS_MESSAGE)

    const [authCommittedSession, validationCommitedSession] = await Promise.all(
      [
        authCommitSession(authSession),
        validationCommitSession(validationSession),
      ]
    )

    return redirect('/chats', {
      headers: [
        [SET_COOKIE, authCommittedSession],
        [SET_COOKIE, validationCommitedSession],
      ],
    })
  } catch (error) {
    try {
      const { user } = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      )

      const [token] = await Promise.all([
        firebaseAdminAuth.createSessionCookie(await user.getIdToken(), {
          expiresIn: FIVE_DAYS_IN_MILLISECONDS,
        }),
        createUserWithUserData({ email, username, id: user.uid, chats: [] }),
      ])

      authSession.set(ACCESS_TOKEN, token)
      validationSession.flash(
        VALIDATION_STATE_SUCCESS,
        SIGNED_UP_SUCCESS_MESSAGE
      )

      const [authCommittedSession, validationCommitedSession] =
        await Promise.all([
          authCommitSession(authSession),
          validationCommitSession(validationSession),
        ])

      return redirect('/chats', {
        headers: [
          [SET_COOKIE, authCommittedSession],
          [SET_COOKIE, validationCommitedSession],
        ],
      })
    } catch (error) {
      validationSession.flash(
        VALIDATION_STATE_ERROR,
        SOMETHING_WENT_WRONG_MESSAGE
      )

      return json(
        {},
        {
          headers: {
            [SET_COOKIE]: await validationCommitSession(validationSession),
          },
        }
      )
    }
  }
}
