import type { LinksFunction } from '@remix-run/node'

import styles from './chats.$chatId.settings.css'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export default function Settings() {
  return <div>gello world</div>
}
