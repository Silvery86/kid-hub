# Game Asset Image Specification

This document lists every image needed to replace emoji placeholders in the math and English games.
Each prompt below is **fully self-contained** — paste it as-is to generate one image.
The last line of every prompt specifies the exact filename to save the result as.

---

## Which Games Need Images

| Game | Route | Currently uses | Replace with |
|---|---|---|---|
| Đếm Sao (Counting Stars) | `/math` | 8 emoji objects repeated N times | Illustrated object cards |
| Word Explorer L1 (Letter Match) | `/english` | emoji beside blanked word | Vocabulary flashcard |
| Word Explorer L2 (Picture-Word) | `/english` | emoji as question prompt | Vocabulary flashcard |
| Word Safari | `/english` | emoji as question / answer choice | Vocabulary flashcard |
| Sound Hunt | `/english` | emoji as answer choice | Vocabulary flashcard |
| Number Ninja | `/math` | text only | **No images needed** |
| Alphabet Explorer | `/english` | letter text only | **No images needed** |
| Shape Quest | `/math` | SVG shapes | **No images needed** |

---

## File Structure

```
public/
  assets/
    games/
      english/
        words/           ← 61 vocabulary cards
          cat.webp
          dog.webp
          ...
      math/
        counting/        ← 4 unique + 4 copied from english/words/
          balloon.webp
          bee.webp
          candy.webp
          flower.webp
          apple.webp     ← copy from english/words/apple.webp
          duck.webp      ← copy from english/words/duck.webp
          fish.webp      ← copy from english/words/fish.webp
          star.webp      ← copy from english/words/star.webp
```

**Format:** WebP, 512 × 512 px, square crop.
**Shared files** (`apple`, `duck`, `fish`, `star`) — generate once in the English group, copy to `math/counting/`.

---

## Flashcard Style Lock

Every prompt below uses these exact rules — do not change them between images.

| Property | Value |
|---|---|
| Background colour | Warm cream `#FFF8F0` |
| Outline | Thick rounded black outline |
| Shading | Flat — no gradients, no shadows, no glow |
| Composition | Single object, large and centred, square frame |
| Art style | Flat cartoon / vector illustration |
| Text | None |
| Scenery | None |
| Age target | Children 6–8 years old |
| Output format | WebP, 512 × 512 px |

---

## Recommended Free Tools

| Tool | Notes |
|---|---|
| **Bing Image Creator** (bing.com/images/create) | Free · DALL-E 3 · Best quality for this style |
| **Ideogram.ai** | Free tier · Excellent flat cartoon output |
| **Adobe Firefly** | 25 free credits/month |
| **Canva AI** | Free tier available |

**Consistency tip:** Use the same tool for the entire set in one session.

---

## Summary Count

| Category | Files |
|---|---|
| Math / Counting (unique) | 4 (`balloon`, `bee`, `candy`, `flower`) |
| English vocabulary | 61 |
| Shared (`apple`, `duck`, `fish`, `star`) | 4 — generate once, copy to both folders |
| **Total to generate** | **65** |

---

## Asset Status (as of 2026-06-26)

All 65 images are generated and placed. ✅

### math/counting/ (8 files)

| File | Status |
|---|---|
| `apple.webp` | ✅ |
| `balloon.webp` | ✅ |
| `bee.webp` | ✅ |
| `candy.webp` | ✅ |
| `duck.webp` | ✅ |
| `fish.webp` | ✅ |
| `flower.webp` | ✅ |
| `star.webp` | ✅ |

### english/words/ (65 files)

| File | Status | File | Status | File | Status |
|---|---|---|---|---|---|
| `apple.webp` | ✅ | `frog.webp` | ✅ | `rice.webp` | ✅ |
| `ball.webp` | ✅ | `grape.webp` | ✅ | `rock.webp` | ✅ |
| `balloon.webp` | ✅ | `hat.webp` | ✅ | `rose.webp` | ✅ |
| `banana.webp` | ✅ | `igloo.webp` | ✅ | `seed.webp` | ✅ |
| `bear.webp` | ✅ | `jar.webp` | ✅ | `snow.webp` | ✅ |
| `bee.webp` | ✅ | `kite.webp` | ✅ | `soup.webp` | ✅ |
| `bell.webp` | ✅ | `kiwi.webp` | ✅ | `star.webp` | ✅ |
| `bike.webp` | ✅ | `leaf.webp` | ✅ | `sun.webp` | ✅ |
| `bird.webp` | ✅ | `lemon.webp` | ✅ | `tent.webp` | ✅ |
| `boat.webp` | ✅ | `lion.webp` | ✅ | `train.webp` | ✅ |
| `book.webp` | ✅ | `mango.webp` | ✅ | `tree.webp` | ✅ |
| `bread.webp` | ✅ | `melon.webp` | ✅ | `umbrella.webp` | ✅ |
| `bus.webp` | ✅ | `milk.webp` | ✅ | `van.webp` | ✅ |
| `cake.webp` | ✅ | `moon.webp` | ✅ | `whale.webp` | ✅ |
| `candy.webp` | ✅ | `nut.webp` | ✅ | `xray.webp` | ✅ |
| `car.webp` | ✅ | `orange.webp` | ✅ | `yoyo.webp` | ✅ |
| `cat.webp` | ✅ | `peach.webp` | ✅ | `zebra.webp` | ✅ |
| `cow.webp` | ✅ | `pig.webp` | ✅ | `flower.webp` | ✅ |
| `dog.webp` | ✅ | `plane.webp` | ✅ | `flag.webp` | ✅ |
| `doll.webp` | ✅ | `plum.webp` | ✅ | `duck.webp` | ✅ |
| `drum.webp` | ✅ | `queen.webp` | ✅ | `egg.webp` | ✅ |
| `fish.webp` | ✅ | `rain.webp` | ✅ | | |

---

## Implementation Plan

### Strategy

**No type changes. No generator changes.** All mapping lives in two new files:

1. `lib/data/gameImages.ts` — lookup tables: emoji → image path, word → image path
2. `components/ui/FlashcardImage.tsx` — `<img>` with emoji fallback if image missing

This keeps generators and question types untouched. The rendering layer does the swap.

---

### Step 1 — `lib/data/gameImages.ts` (new file)

Define two lookup maps used by all four games:

```ts
// English words: word string → /assets/games/english/words/{word}.webp
export const WORD_IMAGE: Record<string, string> = {
  cat: '/assets/games/english/words/cat.webp',
  dog: '/assets/games/english/words/dog.webp',
  // ... all 65 words
}

// Counting objects: emoji string → /assets/games/math/counting/{name}.webp
export const COUNTING_IMAGE: Record<string, string> = {
  '⭐': '/assets/games/math/counting/star.webp',
  '🍎': '/assets/games/math/counting/apple.webp',
  '🦆': '/assets/games/math/counting/duck.webp',
  '🌸': '/assets/games/math/counting/flower.webp',
  '🐝': '/assets/games/math/counting/bee.webp',
  '🍭': '/assets/games/math/counting/candy.webp',
  '🎈': '/assets/games/math/counting/balloon.webp',
  '🐠': '/assets/games/math/counting/fish.webp',
}

// English emoji → word → image path (for Word Safari, Sound Hunt, EnglishGame)
export const EMOJI_IMAGE: Record<string, string> = {
  '🐱': WORD_IMAGE.cat,
  '🐶': WORD_IMAGE.dog,
  '🐟': WORD_IMAGE.fish,
  // ... all WORD_BANK + PHONEME_BANK emojis
}
```

---

### Step 2 — `components/ui/FlashcardImage.tsx` (new file)

Shared image component used across all four games. Renders `<img>` when a path is available, falls back to the emoji span when not.

```tsx
interface FlashcardImageProps {
  src: string | undefined       // image path from WORD_IMAGE / EMOJI_IMAGE
  alt: string                   // word label for accessibility
  fallback: string              // original emoji — shown if src is absent
  className?: string
}

export function FlashcardImage({ src, alt, fallback, className }: FlashcardImageProps) {
  if (src) {
    return <img src={src} alt={alt} className={className} draggable={false} />
  }
  return <span className={className} aria-hidden="true">{fallback}</span>
}
```

---

### Step 3 — `components/games/CountingGame.tsx`

**What changes:** `ObjectGrid` renders N copies of a `<FlashcardImage>` instead of emoji spans.

**Before:**
```tsx
<span className="... text-3xl">{emoji}</span>
```

**After:**
```tsx
<FlashcardImage
  src={COUNTING_IMAGE[emoji]}
  alt=""
  fallback={emoji}
  className="h-12 w-12 portrait:h-16 portrait:w-16 object-contain"
/>
```

**Files:** `components/games/CountingGame.tsx` — ObjectGrid component only (~5 lines)

---

### Step 4 — `components/games/EnglishGame.tsx` (Word Explorer)

Two display locations to update:

**A. Letter Match (L1) — emoji beside the blanked word:**
```tsx
// Before
<div className="text-4xl ... ">{currentQuestion.imageUrl}</div>

// After
<FlashcardImage
  src={WORD_IMAGE[currentQuestion.correctAnswer]   // correctAnswer = the missing letter's word
       ?? EMOJI_IMAGE[currentQuestion.imageUrl ?? '']}
  alt={currentQuestion.correctAnswer}
  fallback={currentQuestion.imageUrl ?? ''}
  className="h-20 w-20 portrait:h-28 portrait:w-28 object-contain"
/>
```

**B. Picture-Word (L2) — emoji IS the question prompt:**
```tsx
// Before (prompt is the emoji)
<div className="text-4xl ...">{currentQuestion.prompt}</div>

// After
<FlashcardImage
  src={EMOJI_IMAGE[currentQuestion.prompt]}
  alt={currentQuestion.correctAnswer}
  fallback={currentQuestion.prompt}
  className="h-28 w-28 portrait:h-40 portrait:w-40 object-contain"
/>
```

**Files:** `components/games/EnglishGame.tsx` — 2 render locations (~10 lines)

---

### Step 5 — `components/games/WordSafariGame.tsx`

Two display locations:

**A. Prompt card — shows emoji (image-to-word mode):**
```tsx
// Before
<p style={{ fontSize: isWordToImage ? '3rem' : '7rem' }}>{currentQuestion.prompt}</p>

// After — when image-to-word, show image; when word-to-image, keep text
{!isWordToImage ? (
  <FlashcardImage
    src={EMOJI_IMAGE[currentQuestion.prompt]}
    alt={currentQuestion.correctAnswer}
    fallback={currentQuestion.prompt}
    className="h-32 w-32 portrait:h-44 portrait:w-44 object-contain"
  />
) : (
  <p className="text-[7rem] leading-none font-extrabold text-white select-none">
    {currentQuestion.prompt}
  </p>
)}
```

**B. Answer buttons — show emoji (word-to-image mode):**
```tsx
// Before
<KidButton ...>{choice}</KidButton>

// After — when isWordToImage, choice is an emoji; render as image inside button
<KidButton ...>
  {isWordToImage ? (
    <FlashcardImage
      src={EMOJI_IMAGE[choice]}
      alt={choice}
      fallback={choice}
      className="h-14 w-14 object-contain"
    />
  ) : choice}
</KidButton>
```

**Files:** `components/games/WordSafariGame.tsx` — 2 render locations (~15 lines)

---

### Step 6 — `components/games/SoundHuntGame.tsx`

**What changes:** Answer choice buttons show emoji — replace with `<FlashcardImage>`.

**Before:**
```tsx
<KidButton ...>{choice}</KidButton>
```

**After:**
```tsx
<KidButton ...>
  <FlashcardImage
    src={EMOJI_IMAGE[choice]}
    alt={choice}
    fallback={choice}
    className="h-14 w-14 object-contain"
  />
</KidButton>
```

**Files:** `components/games/SoundHuntGame.tsx` — 1 render location (~8 lines)

---

### Change Summary

| Step | File | Type | Lines changed |
|---|---|---|---|
| 1 | `lib/data/gameImages.ts` | New | ~100 |
| 2 | `components/ui/FlashcardImage.tsx` | New | ~15 |
| 3 | `components/games/CountingGame.tsx` | Edit | ~5 |
| 4 | `components/games/EnglishGame.tsx` | Edit | ~10 |
| 5 | `components/games/WordSafariGame.tsx` | Edit | ~15 |
| 6 | `components/games/SoundHuntGame.tsx` | Edit | ~8 |

**No changes to:** data types, question generators, game logic, scoring, or any other component.

---

### Key Decisions

| Decision | Rationale |
|---|---|
| Lookup table in lib/, not in generators | Generators stay pure and testable; images are a UI concern |
| Emoji fallback in FlashcardImage | Safe if an image is missing — game still works |
| EMOJI_IMAGE keyed by emoji char | Word Safari and Sound Hunt use emojis as data values; no type change needed |
| WORD_IMAGE keyed by word string | EnglishGame correctAnswer is the word — direct lookup, no emoji intermediary |

---
---

# Prompts

Each block = one image. The last line in every block tells you the exact filename to use when saving.

---

## Group 1 — Math: Counting Objects

Generate 4 unique files. Then **copy** `apple.webp`, `duck.webp`, `fish.webp`, `star.webp` from the English group into `math/counting/`.

---

```
Children's vocabulary flashcard illustration. A single round red inflated balloon with a short tied string hanging below it. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: balloon.webp
```

```
Children's vocabulary flashcard illustration. A single cute smiling bumblebee with yellow and black stripes, small wings spread out, facing forward. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: bee.webp
```

```
Children's vocabulary flashcard illustration. A single round colorful swirl lollipop candy on a white stick, swirl colors red, white and pink. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: candy.webp
```

```
Children's vocabulary flashcard illustration. A single cheerful pink daisy flower with a bright yellow round center and six petals, short green stem. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: flower.webp
```

---

## Group 2 — English: Animals (12 images)

---

```
Children's vocabulary flashcard illustration. A single cute orange tabby cat sitting upright and smiling, facing forward, white chest patch, striped tail curled around paws. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: cat.webp
```

```
Children's vocabulary flashcard illustration. A single cute golden brown puppy dog sitting and smiling, floppy ears, big round eyes, facing forward. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: dog.webp
```

```
Children's vocabulary flashcard illustration. A single cute orange tropical fish facing right, white stripe across body, round eye, small fins and fan tail. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: fish.webp
```

```
Children's vocabulary flashcard illustration. A single cute small blue bird perched on a short branch stub, round body, yellow beak, facing right. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: bird.webp
```

```
Children's vocabulary flashcard illustration. A single cute bright green frog sitting upright, very large round eyes, wide smile, front legs resting on knees, facing forward. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: frog.webp
```

```
Children's vocabulary flashcard illustration. A single cute bright yellow rubber duck facing slightly right, orange beak, round body, small wing bump. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: duck.webp
```

```
Children's vocabulary flashcard illustration. A single cute brown teddy bear sitting upright, arms stretched out wide, smiling, round ears, light beige tummy patch, facing forward. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: bear.webp
```

```
Children's vocabulary flashcard illustration. A single cute lion with a big round fluffy golden mane, smiling face, small nose, sitting upright facing forward. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: lion.webp
```

```
Children's vocabulary flashcard illustration. A single cute black and white dairy cow facing forward, big round eyes, pink nose, small horns, pink udder visible. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: cow.webp
```

```
Children's vocabulary flashcard illustration. A single cute pink pig facing forward, round pink snout with two nostrils, small curly tail, stubby legs, big eyes and smile. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: pig.webp
```

```
Children's vocabulary flashcard illustration. A single cute blue whale shown side view, smiling face, small eye, small spout of water from blowhole on top. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: whale.webp
```

```
Children's vocabulary flashcard illustration. A single cute zebra shown in side view, bold black and white vertical stripes, short mane, smiling face, four legs visible. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: zebra.webp
```

---

## Group 3 — English: Fruits (10 images)

---

```
Children's vocabulary flashcard illustration. A single shiny red apple with a small green leaf and short brown stem on top. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: apple.webp
```

```
Children's vocabulary flashcard illustration. A single curved yellow banana with a small brown tip at each end. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: banana.webp
```

```
Children's vocabulary flashcard illustration. A single ripe mango, oval shape, yellow-orange skin with a slight red blush, small green leaf on stem. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: mango.webp
```

```
Children's vocabulary flashcard illustration. A single round green honeydew melon, smooth pale green skin, whole fruit upright. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: melon.webp
```

```
Children's vocabulary flashcard illustration. A single bright yellow lemon, oval shape with a small pointed tip at each end and a tiny green leaf. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: lemon.webp
```

```
Children's vocabulary flashcard illustration. A single bunch of round purple grapes clustered together on a short green vine stem with a small curling tendril. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: grape.webp
```

```
Children's vocabulary flashcard illustration. A single round peach, pink-orange skin with a slight crease line down the middle, small green leaf on top. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: peach.webp
```

```
Children's vocabulary flashcard illustration. A single round dark purple plum, smooth skin, small stem on top with a tiny green leaf. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: plum.webp
```

```
Children's vocabulary flashcard illustration. A single whole brown oval kiwi fruit, fuzzy brown skin, slightly flattened at top and bottom, upright. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: kiwi.webp
```

```
Children's vocabulary flashcard illustration. A single round bright orange citrus fruit with a small green leaf and short stem on top, slightly textured peel surface. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: orange.webp
```

---

## Group 4 — English: Food & Drink (7 images)

---

```
Children's vocabulary flashcard illustration. A single white oval egg standing upright, smooth shell. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: egg.webp
```

```
Children's vocabulary flashcard illustration. A single brown peanut in its shell, elongated shape with two bumps and pointed ends, visible texture lines on the shell. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: nut.webp
```

```
Children's vocabulary flashcard illustration. A single slice of layered birthday cake, two layers of yellow sponge with pink cream filling, pink frosting on top, one lit candle. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: cake.webp
```

```
Children's vocabulary flashcard illustration. A single tall glass of white milk, clear glass showing the white liquid inside. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: milk.webp
```

```
Children's vocabulary flashcard illustration. A single round golden-brown loaf of bread with a scored cross on top, sitting upright. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: bread.webp
```

```
Children's vocabulary flashcard illustration. A single white ceramic bowl filled with steamed white rice, viewed from a slightly elevated angle. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: rice.webp
```

```
Children's vocabulary flashcard illustration. A single white ceramic bowl of vegetable soup with visible carrot and green pieces, two small steam wisps rising from the surface. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: soup.webp
```

---

## Group 5 — English: Vehicles (7 images)

---

```
Children's vocabulary flashcard illustration. A single cute red toy car shown in side view, two round black wheels, rounded body, small window. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: car.webp
```

```
Children's vocabulary flashcard illustration. A single cute yellow school bus shown in side view, flat front face, four round black wheels, row of rectangular windows. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: bus.webp
```

```
Children's vocabulary flashcard illustration. A single cute wooden sailboat shown in side view, brown hull, single white triangular sail on a mast, tiny flag on top. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: boat.webp
```

```
Children's vocabulary flashcard illustration. A single cute red bicycle shown in side view, two round black-rimmed wheels, simple frame, handlebars, seat, no rider. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: bike.webp
```

```
Children's vocabulary flashcard illustration. A single cute red steam train locomotive shown in side view, round smokestack, small cabin, three visible wheels, smoke puff from chimney. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: train.webp
```

```
Children's vocabulary flashcard illustration. A single cute white passenger airplane shown in side view, round windows along fuselage, two wings, tail fin, facing right. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: plane.webp
```

```
Children's vocabulary flashcard illustration. A single cute blue delivery van shown in side view, boxy body, flat front face, two round black wheels, small rectangular side window. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: van.webp
```

---

## Group 6 — English: Toys & Play (5 images)

---

```
Children's vocabulary flashcard illustration. A single classic black and white soccer ball, round with the standard hexagonal panel pattern. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: ball.webp
```

```
Children's vocabulary flashcard illustration. A single colorful diamond-shaped kite divided into four colored sections (red, blue, yellow, green), two ribbon bows on the tail string below. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: kite.webp
```

```
Children's vocabulary flashcard illustration. A single red toy snare drum with gold rim, white drumhead on top, two wooden drumsticks resting crossed on top. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: drum.webp
```

```
Children's vocabulary flashcard illustration. A single cute Russian matryoshka nesting doll, rounded shape, red and yellow painted floral pattern on the body, painted smiling face. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: doll.webp
```

```
Children's vocabulary flashcard illustration. A single classic yo-yo toy, two round red discs connected in the middle, short white string wrapped around the axle and hanging below. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: yoyo.webp
```

---

## Group 7 — English: Nature & Weather (12 images)

---

```
Children's vocabulary flashcard illustration. A single bright yellow sun with a round centre face showing a cheerful smile, eight wavy rays extending outward. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: sun.webp
```

```
Children's vocabulary flashcard illustration. A single yellow crescent moon facing right, with a small sleepy face (closed eyes, gentle smile) on its inner curve. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: moon.webp
```

```
Children's vocabulary flashcard illustration. A single bright yellow five-pointed star with a cute happy face (dot eyes, smile) in the centre. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: star.webp
```

```
Children's vocabulary flashcard illustration. A single dark grey rain cloud with five blue teardrop raindrops falling below it in a neat row. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: rain.webp
```

```
Children's vocabulary flashcard illustration. A single white six-pointed snowflake with symmetrical branching arms and small diamond tips, light blue accent lines on the arms. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: snow.webp
```

```
Children's vocabulary flashcard illustration. A single round green oak tree with a dense circular leafy canopy on a short straight brown trunk. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: tree.webp
```

```
Children's vocabulary flashcard illustration. A single bright green maple leaf with a pointed lobed outline and visible central vein lines. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: leaf.webp
```

```
Children's vocabulary flashcard illustration. A single red rose flower with a rounded layered bloom, two small green leaves on a short stem below. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: rose.webp
```

```
Children's vocabulary flashcard illustration. A single cheerful pink daisy with six rounded petals and a bright yellow circular centre, short green stem. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: flower.webp
```

```
Children's vocabulary flashcard illustration. A single brown teardrop-shaped sunflower seed, pointed at one end, flat at the other, with a pale striped pattern on the shell. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: seed.webp
```

```
Children's vocabulary flashcard illustration. A single smooth rounded grey river rock, slightly irregular oval shape. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: rock.webp
```

```
Children's vocabulary flashcard illustration. A single open umbrella viewed from a slight angle above, canopy divided into alternating red and yellow panels, curved black handle at the bottom. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: umbrella.webp
```

---

## Group 8 — English: Objects & Stationery (6 images)

---

```
Children's vocabulary flashcard illustration. A single classic black top hat with a wide flat brim and a red ribbon band around the base of the crown. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: hat.webp
```

```
Children's vocabulary flashcard illustration. A single open hardcover book viewed from a slight angle, left page blue, right page yellow, colourful spine, pages fanning slightly. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: book.webp
```

```
Children's vocabulary flashcard illustration. A single golden school bell, wide at the bottom with a small looped handle at the top and a visible clapper inside. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: bell.webp
```

```
Children's vocabulary flashcard illustration. A single simple red rectangular flag on a white vertical pole, flag waving slightly to the right. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: flag.webp
```

```
Children's vocabulary flashcard illustration. A single green A-frame camping tent viewed from the front-side, triangular shape, small door opening in the centre. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: tent.webp
```

```
Children's vocabulary flashcard illustration. A single clear glass mason jar with a silver metal screw-on lid, cylindrical body with slightly wider shoulders. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: jar.webp
```

---

## Group 9 — English: Phonics-Only Extras (3 images)

`van.webp`, `yoyo.webp`, `jar.webp` are already covered in Groups 5, 6, and 8. Generate these 3 new ones only.

---

```
Children's vocabulary flashcard illustration. A single cute cartoon queen character bust, wearing a large golden crown and a purple robe, smiling face. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: queen.webp
```

```
Children's vocabulary flashcard illustration. A single white dome-shaped igloo built from stacked rounded ice blocks, small arched entrance opening at the front. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no background scenery, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: igloo.webp
```

```
Children's vocabulary flashcard illustration. A single cartoon x-ray image of a child's hand skeleton shown on a dark navy rectangular card, white bone outlines, five fingers visible, held upright. Flat cartoon art style, thick rounded black outlines, bright saturated colors, warm cream background #FFF8F0, object large and centered in a square frame, no text, no shadows, no gradients, clean and simple design for kids aged 6–8, 512x512 px.
Save as: xray.webp
```
