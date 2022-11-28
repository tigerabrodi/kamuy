import type { DataFunctionArgs } from '@remix-run/node'
import type { Message, Timestamp } from '~/types/firebase'

import { json } from '@remix-run/node'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { v4 } from 'uuid'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

import { CHAT_ID, MESSAGE, OWNER_USERNAME } from './chats.$chatId'

import { getServerFirebase } from '~/firebase'
import { CHATS_COLLECTION, MESSAGES_COLLECTION } from '~/firebase/constants'
import { authGetSession } from '~/sessions/auth.server'
import { ACCESS_TOKEN } from '~/types'
import { getCookie } from '~/utils/getCookie'

const FormSchema = zfd.formData(
  z.object({
    [MESSAGE]: z.string(),
    [OWNER_USERNAME]: z.string(),
    [CHAT_ID]: z.string(),
  })
)

export const action = async ({ request }: DataFunctionArgs) => {
  const { firebaseAdminAuth, firebaseDb } = getServerFirebase()

  const [authSession, formData] = await Promise.all([
    authGetSession(getCookie(request)),
    request.formData(),
  ])

  const { message, ownerUsername, chatId } = FormSchema.parse(formData)

  const token = authSession.get(ACCESS_TOKEN)

  try {
    const decodedToken = await firebaseAdminAuth.verifySessionCookie(token)

    const newMessage: Message = {
      id: v4(),
      createdAt: serverTimestamp() as unknown as Timestamp,
      text: message,
      owner: {
        id: decodedToken.uid,
        username: ownerUsername,
      },
    }

    const messageDoc = doc(
      firebaseDb,
      `/${CHATS_COLLECTION}/${chatId}/${MESSAGES_COLLECTION}/${newMessage.id}`
    )

    await setDoc(messageDoc, newMessage)

    return json({}, { status: 201 })
  } catch (error) {
    throw json({ error: 'You are unauthenticated.' }, { status: 401 })
  }
}
