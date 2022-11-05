import type { FieldValue } from 'firebase/firestore'
import type { Timestamp } from '~/types/firebase'

export function getTimestamp(timestamp: Timestamp | FieldValue): Timestamp {
  if (timestamp && 'seconds' in timestamp) {
    return timestamp
  }

  return getCurrentTimestamp()
}

export function getCurrentTimestamp(): Timestamp {
  return {
    seconds: Math.round(Date.now() / 1000),
    nanoseconds: 0,
  }
}

export function getDateWithTimestamp(firebaseDate: Timestamp) {
  return new Date(firebaseDate.seconds * 1000).toISOString().slice(0, 10)
}

export function getExtensionOfFile(file: File) {
  return file.type.split('/')[1]
}
