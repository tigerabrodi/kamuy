import type { FirebaseOptions } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'
import type { PropsWithChildren } from 'react'

import { initializeApp } from 'firebase/app'
import { signInWithCustomToken, getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { useContext } from 'react'
import { useEffect } from 'react'
import { createContext, useState } from 'react'

type FirebaseContextValue = {
  firebaseDb: Firestore | null
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null)

type FirebaseProviderParams = PropsWithChildren<{
  firebase: {
    options: FirebaseOptions
    userToken: string
  } | null
}>

export function FirebaseProvider({
  children,
  firebase,
}: FirebaseProviderParams) {
  const [firebaseDb, setFirebaseDb] =
    useState<FirebaseContextValue['firebaseDb']>(null)

  useEffect(() => {
    if (!firebase) {
      return
    }

    const initFirebaseDb = async () => {
      const app = initializeApp(firebase.options)
      const auth = getAuth(app)

      if (!auth.currentUser) {
        try {
          await signInWithCustomToken(auth, firebase.userToken)
        } catch (error) {
          console.error('Failed to authenticate user for REAL firestore', error)
        }

        if (!firebaseDb) {
          const db = initializeFirestore(app, {
            experimentalAutoDetectLongPolling: true,
            ignoreUndefinedProperties: true,
          })
          setFirebaseDb(db)
        }
      }
    }

    initFirebaseDb().catch((error) =>
      console.error('Failed to initialize firebase for REAL firestore', error)
    )
  }, [firebase, firebaseDb])

  return (
    <FirebaseContext.Provider value={{ firebaseDb }}>
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider')
  }
  return context
}
