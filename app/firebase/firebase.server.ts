import type { ServiceAccount } from 'firebase-admin/app'

import {
  cert,
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  getApp as getAdminApp,
} from 'firebase-admin/app'
import { getAuth as adminGetAuth } from 'firebase-admin/auth'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

import { config } from './firebase-config.server'

import { once } from '~/utils'

const firebaseApp = once(() => {
  return getApps().length === 0 ? initializeApp(config) : getApp()
})

const firebaseAuth = once(() => {
  return getAuth(firebaseApp())
})

const firebaseDb = once(() => {
  return initializeFirestore(firebaseApp(), {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  })
})

const firebaseStorage = once(() => {
  return getStorage(firebaseApp())
})

const firebaseAdminApp = once(() => {
  const serviceAccount: ServiceAccount = {
    projectId: config.projectId,
    privateKey: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  }

  return getAdminApps().length === 0
    ? initializeAdminApp({
        credential: cert(serviceAccount),
      })
    : getAdminApp()
})

const firebaseAdminAuth = once(() => {
  return adminGetAuth(firebaseAdminApp())
})

export const getServerFirebase = once(() => {
  return {
    firebaseStorage: firebaseStorage(),
    firebaseAuth: firebaseAuth(),
    firebaseDb: firebaseDb(),
    firebaseAdminApp: firebaseAdminApp(),
    firebaseAdminAuth: firebaseAdminAuth(),
  }
})
