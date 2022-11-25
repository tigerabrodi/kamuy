import type { LinksFunction } from '@remix-run/node'

import styles from './chats.$chatId.settings.members.css'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export default function ChatSettingsMember() {
  return (
    <div>
      <h1>Members</h1>
    </div>
  )
}
