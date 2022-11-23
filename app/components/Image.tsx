import type { Chat } from '~/types/firebase'

import { useState } from 'react'

import { DefaultChat } from '~/icons'
import { shouldShowDefaultChatImg } from '~/utils'

type ImageProps = {
  chat: Chat
  imgClassName?: string
  placeholderClassName?: string
  defaultChatClassName?: string
}

export function Image({
  chat,
  imgClassName,
  placeholderClassName,
  defaultChatClassName,
}: ImageProps) {
  const [hasLoadedImage, setHasLoadedImage] = useState(false)

  function onLoadImage() {
    setHasLoadedImage(true)
  }

  return shouldShowDefaultChatImg(chat) ? (
    <DefaultChat className={defaultChatClassName} />
  ) : (
    <>
      <img
        src={chat.imageUrl}
        alt=""
        onLoad={onLoadImage}
        className={hasLoadedImage ? imgClassName : 'sr-only'}
      />
      <div className={hasLoadedImage ? 'sr-only' : placeholderClassName} />
    </>
  )
}
