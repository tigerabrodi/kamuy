import type { LinksFunction } from '@remix-run/node'

import styles from './chats.index.css'

import { KamuyChatsArt } from '~/icons'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export default function ChatsIndex() {
  return (
    <div className="chat__default">
      <KamuyChatsArt />
      <h1>Kamuy</h1>
      <p>
        Chat with multiple friends and stay connected with people all over the
        world.
      </p>
    </div>
  )
}
