import type { CSSProperties } from 'react'

interface FlashcardImageProps {
  /** Resolved image path from WORD_IMAGE / EMOJI_IMAGE / COUNTING_IMAGE. Undefined falls back to emoji. */
  src?: string
  /** Alt text for accessibility. Pass empty string for decorative images. */
  alt: string
  /** Original emoji — displayed when src is absent or undefined. */
  fallback: string
  className?: string
  style?: CSSProperties
}

export function FlashcardImage({ src, alt, fallback, className, style }: FlashcardImageProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        draggable={false}
      />
    )
  }
  return (
    <span className={className} style={style} aria-hidden={alt === '' ? 'true' : undefined}>
      {fallback}
    </span>
  )
}
