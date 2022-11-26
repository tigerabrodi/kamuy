import type { CollectionReference } from 'firebase/firestore'
import type { Chat, Member } from '~/types/firebase'

import { collection, onSnapshot, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { CHATS_COLLECTION, MEMBERS_COLLECTION } from '~/firebase/constants'
import { useFirebase } from '~/providers/FirebaseProvider'
import { MemberSchema } from '~/types/firebase'

export function useGetMembersSubscription({
  initialMembers,
  chat,
}: {
  initialMembers: Array<Member>
  chat: Chat
}) {
  const firebaseContext = useFirebase()
  const [members, setMembers] = useState(initialMembers)

  useEffect(() => {
    if (firebaseContext?.firebaseDb) {
      const membersCollectionRef = collection(
        firebaseContext?.firebaseDb,
        `/${CHATS_COLLECTION}/${chat.id}/${MEMBERS_COLLECTION}`
      ) as CollectionReference<Member>

      const membersQuery = query(membersCollectionRef)

      const unSubscribe = onSnapshot(membersQuery, (membersSnapshot) => {
        const newMembers = membersSnapshot.docs.map((memberDoc) =>
          memberDoc.data()
        )

        setMembers(z.array(MemberSchema).parse(newMembers))
      })

      return () => {
        unSubscribe()
      }
    }
  }, [firebaseContext?.firebaseDb, chat.id])

  return { members }
}
