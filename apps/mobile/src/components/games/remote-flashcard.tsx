// remote-flashcard.tsx — renders a game flashcard image served from the web origin,
// cached on device by expo-image (memory + disk). Falls back to the emoji when the
// manifest has no image for it. Native counterpart of the web FlashcardImage.
import { Text } from 'react-native'
import { Image } from 'expo-image'
import { countingImagePath, emojiImagePath } from '@kid-hub/assets'

import { mediaUrl } from '@/lib/web-origin'

export function RemoteFlashcard({
  emoji,
  kind = 'emoji',
  size,
}: {
  emoji: string
  /** Which manifest to resolve against — Word Safari/Sound Hunt ('emoji') vs Counting ('counting'). */
  kind?: 'emoji' | 'counting'
  size: number
}) {
  const path = kind === 'counting' ? countingImagePath(emoji) : emojiImagePath(emoji)

  if (!path) {
    return <Text style={{ fontSize: size, lineHeight: size * 1.1 }}>{emoji}</Text>
  }

  return (
    <Image
      source={{ uri: mediaUrl(path) }}
      style={{ width: size, height: size }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={150}
      accessibilityLabel={emoji}
    />
  )
}
