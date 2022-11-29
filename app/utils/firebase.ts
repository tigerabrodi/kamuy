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
  const fullDateAsString = new Date(
    firebaseDate.seconds * 1000
  ).toLocaleString()

  const fullDateAsStringSplitted = fullDateAsString.split(',')

  const dayDate = fullDateAsStringSplitted[0]
  const time = fullDateAsStringSplitted[1].slice(1)
  const timePeriod = time.split(' ')[1]
  const timeWithoutSeconds = time.split(':')[0] + ':' + time.split(':')[1]

  return `${dayDate} ${timeWithoutSeconds}${timePeriod}` // 2021-08-01 12:00 AM
}

export function getExtensionOfFile(file: File) {
  return file.type.split('/')[1]
}
