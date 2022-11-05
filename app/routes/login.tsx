import type { ActionFunction, LinksFunction } from '@remix-run/node'
import type { FirebaseError } from 'firebase/app'

import { redirect } from '@remix-run/node'
import { Form } from '@remix-run/react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

import styles from './login.css'

import { getServerFirebase } from '~/firebase/firebase.server'
import { authCommitSession, authGetSession } from '~/sessions/auth.server'
import { validationGetSession } from '~/sessions/validationStates.server'
import { ACCESS_TOKEN, SET_COOKIE, validationStates } from '~/types'
import { getCookie } from '~/utils/getCookie'

const USERNAME_PLACEHOLDER = 'johnl123'
const EMAIL_PLACEHOLDER = 'john@gmail.com'

const SIGNED_IN_SUCCESS_MESSAGE = 'Signed in successfully!'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export default function Login() {
  return (
    <main className="login">
      <h1>Sign In</h1>
      <p>
        If your account doesn’t exist, we'll create one, otherwise you just sign
        in.
      </p>
      <Form>
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
  const { email, username, password } = FormSchema.parse(
    await request.formData()
  )

  const { firebaseAuth } = getServerFirebase()

  const validationSession = await validationGetSession(getCookie(request))
  const authSession = await authGetSession(getCookie(request))

  try {
    const { user } = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    )

    const token = await user.getIdToken()

    authSession.set(ACCESS_TOKEN, token)
    validationSession.flash(validationStates.error, SIGNED_IN_SUCCESS_MESSAGE)

    return redirect('/chats', {
      headers: {
        [SET_COOKIE]: await authCommitSession(authSession),
      },
    })
  } catch (error) {
    const firebaseError = error as FirebaseError

    console.log(firebaseError)

    // Check if the user exists through email, username can be duplicated, if so, throw an error, because incorrect password perhaps

    // if the user doesn't exist, create a new user
  }
}
