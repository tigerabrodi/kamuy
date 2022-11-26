import type { DataFunctionArgs } from '@remix-run/node'
import type { CollectionReference, DocumentReference } from 'firebase/firestore'
import type { Chat, User } from '~/types/firebase'

import { json } from '@remix-run/node'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

import { CHAT_ID, MEMBER } from './chats.$chatId.settings.members'

import { getServerFirebase } from '~/firebase'
import { CHATS_COLLECTION, USERS_COLLECTION } from '~/firebase/constants'
import { authGetSession } from '~/sessions/auth.server'
import { ACCESS_TOKEN } from '~/types'
import { ChatSchema } from '~/types/firebase'
import { getCookie } from '~/utils/getCookie'

const EMAIL = 'email'
const USERNAME = 'username'

const FormSchema = zfd.formData(
  z.object({
    [MEMBER]: z.string(),
    [CHAT_ID]: z.string(),
  })
)

export const action = async ({ request }: DataFunctionArgs) => {
  const { firebaseAdminAuth, firebaseDb } = getServerFirebase()

  const [authSession, formData] = await Promise.all([
    authGetSession(getCookie(request)),
    request.formData(),
  ])

  const { memberInput, chatId } = FormSchema.parse(formData)

  const chatDoc = doc(
    firebaseDb,
    `/${CHATS_COLLECTION}/${chatId}`
  ) as DocumentReference<Chat>
  const chatSnapshot = await getDoc(chatDoc)
  const chat = ChatSchema.parse(chatSnapshot.data())

  const token = authSession.get(ACCESS_TOKEN)

  try {
    await firebaseAdminAuth.verifySessionCookie(token)
    const isMemberInputEmail = z.string().email().safeParse(memberInput).success
    const whereQuery = isMemberInputEmail ? EMAIL : USERNAME

    const usersRef = collection(
      firebaseDb,
      USERS_COLLECTION
    ) as CollectionReference<User>

    const usersQuery = query(usersRef, where(whereQuery, '==', memberInput))

    const usersSnapshot = await getDocs(usersQuery)
    const user = usersSnapshot.docs[0]?.data()
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 })
    }

    const isUserAlreadyMember = chat.memberIds.includes(user.id)
    if (isUserAlreadyMember) {
      return json(
        { error: 'User is already a member of the chat.' },
        { status: 400 }
      )
    }

    return json({ user })
  } catch (error) {
    throw json({ error: 'You are unauthenticated.' }, { status: 401 })
  }
}
