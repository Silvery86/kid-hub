# Asset Management — Design Document

## Goal

Replace hardcoded image paths in `lib/data/gameImages.ts` with a single database table
that manages **all app media** (images, audio, video). The table stores a `local_path`
that works today and an optional `cloud_url` that the app will prefer once assets are
uploaded to a CDN.

Resolution rule (the only rule the app ever applies):

```
url = asset.cloud_url ?? asset.local_path
```

---

## Scope

| Today | Future |
|---|---|
| 73 game images (WebP) | Pronunciation audio for every vocabulary word |
| — | Short video clips ("apple" being bitten, etc.) |
| — | App-level images (avatars, achievement badges) |

---

## Database Schema

### Enum: `AssetType`

```prisma
enum AssetType {
  IMAGE
  AUDIO
  VIDEO
}
```

### Model: `Asset`

```prisma
model Asset {
  id          String    @id @default(cuid())

  // ── Identity ──────────────────────────────────────────────────
  namespace   String    @db.VarChar(60)   // e.g. "game.english.words"
  name        String    @db.VarChar(60)   // e.g. "apple"

  // ── Type ──────────────────────────────────────────────────────
  assetType   AssetType @default(IMAGE)

  // ── Storage ───────────────────────────────────────────────────
  localPath   String    @db.VarChar(300)  // relative to /public, e.g. "/assets/games/english/words/apple.webp"
  cloudUrl    String?   @db.VarChar(500)  // CDN URL; null = not uploaded yet

  // ── Metadata (optional, informational) ───────────────────────
  mimeType    String?   @db.VarChar(40)   // "image/webp" | "audio/mpeg" | "video/mp4"
  altText     String?   @db.VarChar(120)  // For images: screen-reader label
  label       String?   @db.VarChar(60)   // Display / TTS label ("Apple", "Banana")
  widthPx     Int?                        // For images only
  heightPx    Int?                        // For images only
  durationMs  Int?                        // For audio / video only

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // One asset per (namespace, name, assetType) — a word can have both an IMAGE and AUDIO
  @@unique([namespace, name, assetType])
  @@index([namespace])
  @@map("assets")
}
```

---

## Namespace Taxonomy

Namespaces are dot-separated paths. This keeps related assets groupable with a single
`WHERE namespace = '...'` query and leaves room to add new groups without schema changes.

| Namespace | Content | Count today |
|---|---|---|
| `game.english.words` | Vocabulary flashcard images | 65 |
| `game.math.counting` | Counting object images | 8 |
| `app.avatar` | Kid/parent avatar images | 0 (future) |
| `app.badge` | Achievement badge images | 0 (future) |

---

## URL Resolution

A single utility in `lib/assets.ts` (no DB knowledge) handles resolution:

```ts
// Returns the URL the app should use to render an asset.
// Callers never touch localPath or cloudUrl directly.
export function resolveAssetUrl(asset: { localPath: string; cloudUrl: string | null }): string {
  return asset.cloudUrl ?? asset.localPath
}
```

All components and hooks call `resolveAssetUrl(asset)` — never read `.localPath` or `.cloudUrl` directly.
When we flip to cloud, we populate `cloud_url` in the DB; no code changes needed.

---

## Service Layer

A dedicated `AssetService` lives at `server/services/asset.service.ts`.

```ts
// Get a single asset (throws if not found)
getAsset(namespace: string, name: string, type?: AssetType): Promise<Asset>

// Get all assets in a namespace (used to replace WORD_IMAGE / COUNTING_IMAGE maps)
getAssetsByNamespace(namespace: string, type?: AssetType): Promise<Asset[]>
```

The service caches results in memory for the lifetime of the process — 73 small records
is cheap to hold. Cache is invalidated on `updatedAt` change (future: webhook from CDN).

---

## Seeding Plan

A seed script (`prisma/seed/assets.ts`) will be the source of truth for the initial 73 images.
It reads the known file list (derived from `lib/data/gameImages.ts`) and upserts each row.

```ts
// Example rows
{ namespace: 'game.english.words', name: 'apple',   localPath: '/assets/games/english/words/apple.webp',   mimeType: 'image/webp', widthPx: 512, heightPx: 512, label: 'Apple' }
{ namespace: 'game.math.counting', name: 'balloon',  localPath: '/assets/games/math/counting/balloon.webp', mimeType: 'image/webp', widthPx: 512, heightPx: 512, label: 'Balloon' }
```

Note: `apple`, `duck`, `fish`, `star` exist in **both** namespaces as separate rows
because `localPath` differs. They are not shared; they can have separate `cloud_url`s.

---

## Migration from Hardcoded Maps

Current state: `lib/data/gameImages.ts` exports `WORD_IMAGE`, `COUNTING_IMAGE`, `EMOJI_IMAGE`.

After this table is live:

1. Games call `AssetService.getAssetsByNamespace('game.english.words')` at page load
   (server component) and pass the resolved map as a prop.
2. `WORD_IMAGE` and `COUNTING_IMAGE` are deprecated and eventually deleted.
3. `FlashcardImage` component signature stays identical — it still receives a `src` string,
   just one that came from `resolveAssetUrl()` instead of a hardcoded constant.

---

## Future: Audio & Video

When audio assets are added (e.g., pronunciation of "apple"):

```ts
// Same namespace + name, different assetType
{ namespace: 'game.english.words', name: 'apple', assetType: 'AUDIO',
  localPath: '/assets/games/english/audio/apple.mp3', mimeType: 'audio/mpeg', durationMs: 800 }
```

The `@@unique([namespace, name, assetType])` constraint lets a single vocabulary word
have an IMAGE, AUDIO, and VIDEO row without collision.

The `resolveAssetUrl` utility works identically for all types — callers just pass the row.

---

## Open Questions for PM Review

1. **Cache TTL** — Should the in-process asset cache be invalidated on a timer, or is
   "restart to pick up new cloud URLs" acceptable for a single-household app?

2. **Shared files** — `apple.webp` currently lives in both `english/words/` and `math/counting/`
   as a physical copy. Should the DB reflect this (two rows, one `localPath` each) or
   should we deduplicate to one file and one row? Two rows is simpler; one file saves ~80 KB.

3. **Parent UI** — Is there a planned admin page to upload cloud URLs per asset, or will
   cloud URL population be done via a script / direct DB update?

4. **Scope of first implementation** — Should the first migration cover only game images
   (the 73 existing files), or include app-level assets (avatars, badges) from the start?
