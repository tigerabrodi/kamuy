import type { DataFunctionArgs } from '@remix-run/node'

import { json } from '@remix-run/node'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

import { CHAT_ID, MEMBER_INPUT_NAME } from './chats.$chatId.settings'

import { getServerFirebase, removeMemberFromChat } from '~/firebase'
import { authGetSession } from '~/sessions/auth.server'
import { ACCESS_TOKEN } from '~/types'
import { getCookie } from '~/utils/getCookie'

const FormSchema = zfd.formData(
  z.object({
    [CHAT_ID]: z.string(),
    [MEMBER_INPUT_NAME]: z.string(),
  })
)

export const action = async ({ request }: DataFunctionArgs) => {
  const { firebaseAdminAuth } = getServerFirebase()

  const [authSession, formData] = await Promise.all([
    authGetSession(getCookie(request)),
    request.formData(),
  ])

  const { chatId, memberId } = FormSchema.parse(formData)

  const token = authSession.get(ACCESS_TOKEN)

  try {
    await firebaseAdminAuth.verifySessionCookie(token)

    await removeMemberFromChat({ chatId, memberId })

    return json({})
  } catch (error) {
    throw json({ error: 'You are unauthenticated.' }, { status: 401 })
  }
}
