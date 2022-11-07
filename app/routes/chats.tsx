import type { LinksFunction } from '@remix-run/node'

import styles from './chats.css'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export default function Chats() {
  return <div>Hello world</div>
}
