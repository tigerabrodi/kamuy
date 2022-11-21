import type { LinksFunction } from '@remix-run/node'

import { Dialog } from '@headlessui/react'
import { useNavigate } from '@remix-run/react'

import styles from './chats.$chatId.settings.css'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

const BACK_ROUTE = '..'

export default function Settings() {
  const navigate = useNavigate()

  return (
    <Dialog
      open={true}
      onClose={() => navigate(BACK_ROUTE)}
      className="settings"
    >
      <Dialog.Panel className="settings__panel">
        <Dialog.Title className="sr-only">Deactivate account</Dialog.Title>
      </Dialog.Panel>
    </Dialog>
  )
}
