import type { LinksFunction } from '@remix-run/node'

import { Dialog } from '@headlessui/react'
import { Form, Link, useFetcher, useNavigate } from '@remix-run/react'

import styles from './chats.$chatId.settings.css'

import { Close, DefaultChat, Delete, Plus } from '~/icons'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

const BACK_ROUTE = '..'

const PARTICIPANT_INPUT_NAME = 'participantId'

export default function Settings() {
  const navigate = useNavigate()
  const fetcher = useFetcher()

  return (
    <Dialog
      open={true}
      onClose={() => navigate(BACK_ROUTE)}
      className="settings"
    >
      <Dialog.Panel className="settings__panel">
        <div className="settings__panel-header">
          <Link to={BACK_ROUTE} aria-label="Close">
            <Close />
          </Link>
          <Dialog.Title as="h1">Settings</Dialog.Title>

          <Form>
            <button aria-label="Delete chat">
              <Delete />
            </button>
          </Form>
        </div>

        <div className="settings__panel-main">
          <input type="file" className="sr-only" id="image" accept="image/*" />

          <label htmlFor="image">
            <DefaultChat />
            <span className="sr-only">Upload image</span>
          </label>

          <h2>Untitled</h2>

          <p>11 participants</p>
        </div>

        <div className="settings__panel-participants">
          <h3>Participants</h3>
          <Link to="./participants" aria-label="Add new participant">
            <Plus />
          </Link>

          <ul>
            <li>
              <h4>~ Tiger Abrodi</h4>
              <p>tigerabrodi@gmail.com</p>

              <fetcher.Form method="post">
                <input
                  type="hidden"
                  name={PARTICIPANT_INPUT_NAME}
                  value="TODO"
                />

                <button aria-label="Remove participant CHANGE">
                  <Close />
                </button>
              </fetcher.Form>
            </li>
          </ul>
        </div>
      </Dialog.Panel>
    </Dialog>
  )
}
