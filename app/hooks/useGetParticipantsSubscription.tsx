import type { CollectionReference } from 'firebase/firestore'
import type { Chat, Participant } from '~/types/firebase'

import { collection, onSnapshot, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { CHATS_COLLECTION, PARTICIPANTS_COLLECTION } from '~/firebase/constants'
import { useFirebase } from '~/providers/FirebaseProvider'
import { ParticipantSchema } from '~/types/firebase'

export function useGetParticipantsSubscription({
  initialParticipants,
  chat,
}: {
  initialParticipants: Array<Participant>
  chat: Chat
}) {
  const firebaseContext = useFirebase()
  const [participants, setParticipants] = useState(initialParticipants)

  useEffect(() => {
    if (firebaseContext?.firebaseDb) {
      const participantsCollectionRef = collection(
        firebaseContext?.firebaseDb,
        `/${CHATS_COLLECTION}/${chat.id}/${PARTICIPANTS_COLLECTION}`
      ) as CollectionReference<Participant>

      const participantsQuery = query(participantsCollectionRef)

      const unsubscribe = onSnapshot(
        participantsQuery,
        (participantsSnapshot) => {
          const newParticipants = participantsSnapshot.docs.map(
            (participantDoc) => participantDoc.data()
          )
          setParticipants(z.array(ParticipantSchema).parse(newParticipants))
        }
      )

      return unsubscribe
    }
  }, [firebaseContext?.firebaseDb, chat.id])

  return { participants }
}
