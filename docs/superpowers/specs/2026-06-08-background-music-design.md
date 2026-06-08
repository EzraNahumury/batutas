# Background Music for the Game Page — Design

**Date:** 2026-06-08
**Scope:** Frontend only (`frontend-batutas`). No smart-contract changes — contract is live on Celo Mainnet.

## Goal

Add looping background music to the BATUTAS game page so playing *feels* like a game, plus a
mute/unmute control so the player stays in charge of the sound.

## Decisions

| Topic | Decision |
|---|---|
| Where music plays | Whole game page (`/app`), the entire time the player is connected — through shuffle, commit, securing, reveal, and result. Not on the landing page. |
| How it starts | Unmuted, but begins on the player's **first tap** anywhere on the page (browsers block autoplay with sound until a user gesture). |
| Mute control | Icon button in the game-page header (top bar), next to the balance / MiniPay chip. |
| Track | `ihor_koliako-final-battle-trailer-music-217488.mp3.mpeg`, looped. |
| Volume | ~0.35 default so it sits under the UI, never blasts. |

## Architecture

Three units, each with one job.

### 1. Asset — `public/battle-music.mp3`
Copy the source file from `D:\Downloads\...mp3.mpeg` into the Next.js `public/` folder, renamed to
a clean `battle-music.mp3`. Next serves `public/` at the site root, so the audio `src` is
`/battle-music.mp3`.

### 2. Hook — `app/lib/useBackgroundMusic.ts`
Owns audio lifecycle and exposes a tiny control surface.

```ts
function useBackgroundMusic(active: boolean): { muted: boolean; toggleMute: () => void }
```

- Creates one `HTMLAudioElement` (`new Audio('/battle-music.mp3')`) on mount, `loop = true`,
  `volume = 0.35`.
- **Autoplay-safe start:** registers a one-time `pointerdown` listener on `document`; the first tap
  calls `audio.play()`. Removed after it fires.
- **`active` gate:** `active = isConnected && !wrongChain`. When `active` and the user has interacted,
  play; when not active, pause. (Player on the connect / wrong-chain gate hears nothing.)
- **Mute persistence:** `muted` initialised from `localStorage["batutas:muted"]`; `toggleMute`
  flips it, writes it back, and sets `audio.muted`. Preference survives reloads.
- **Cleanup:** on unmount, pause the audio and remove the listener.
- All `localStorage` / DOM access guarded for SSR (the page is already a client component, but the
  hook reads storage lazily inside effects).

### 3. Icons — `app/components/icons.tsx`
Add `SpeakerOn` and `SpeakerOff` following the existing 24×24 `currentColor` line-icon style.

### Wiring — `app/app/page.tsx`
- Call `useBackgroundMusic(isConnected && !wrongChain)` at the top of the component, before the
  early `return`s (Rules of Hooks).
- Render a mute button in the existing `<header>`, to the left of the MiniPay chip / `ConnectButton`.
  Icon = `muted ? SpeakerOff : SpeakerOn`; `aria-label` = `muted ? "Unmute music" : "Mute music"`.
  Reuse the existing `glass` round-button styling for visual consistency.

## Data flow

```
first pointerdown ──▶ audio.play()
isConnected && !wrongChain ──▶ active ──▶ play / pause
mute button click ──▶ toggleMute ──▶ audio.muted + localStorage
```

## Playback gating (revised)

Playback is allowed only when **both** the page wants it and the tab is visible:
`canPlay(active) = active && !document.hidden`. Every play decision — the active
effect and the visibility handler — goes through this single predicate, so the
track never starts in a backgrounded tab (e.g. when the wallet connection
resolves while the tab is hidden).

## Mute persistence (revised)

The preference is written to `localStorage` **only inside `toggleMute`** — i.e.
only when the user explicitly flips the control. Mount-time state restoration
(`loadMuted`) never writes. This means a visitor who never touches the toggle
has nothing stored, so `loadMuted`'s `prefers-reduced-motion` fallback keeps
applying on every load until they make an explicit choice.

## Error handling

- `audio.play()` returns a promise that can reject (autoplay policy, no source). Swallow the
  rejection — playback simply retries on the next gesture; never throw into the UI.
- Missing/blocked `localStorage` wrapped in try/catch (matches the existing `saveRound` pattern).

## Testing / verification

No automated FE test harness in the project. Verify manually + by build:
- `npm run build` clean.
- Music starts on first tap, loops, audible at sane volume.
- Mute toggles instantly; icon + aria-label reflect state; preference persists across reload.
- No sound on connect / wrong-chain gates; resumes when connected.
- Reduced motion / SSR: no hydration warnings, no autoplay errors in console.

## Out of scope (YAGNI)

- Per-state music changes (different track while revealing).
- Volume slider.
- Sound effects for win/lose/draw.
- Music on the landing page.

## Delivery — 15 commits across 5 PRs (merge each before the next)

| PR | Branch | Commits |
|---|---|---|
| 1 — asset + icons + spec | `feat/music-1-asset` | 1 add music asset · 2 add SpeakerOn/SpeakerOff icons · 3 add this design spec |
| 2 — hook | `feat/music-2-hook` | 4 scaffold `useBackgroundMusic` (audio/loop/volume) · 5 persist mute to localStorage · 6 start-on-first-tap |
| 3 — wire game page | `feat/music-3-wire` | 7 mount hook on game page · 8 gate playback to connected+chain · 9 pause/cleanup on unmount |
| 4 — mute button UI | `feat/music-4-button` | 10 add header mute button · 11 icon + aria reflect state · 12 polish hover/focus |
| 5 — polish + docs | `feat/music-5-polish` | 13 sensible volume / reduced-motion guard · 14 update PROGRESS + README · 15 final cleanup + verify build |

Each PR: branch off latest `main`, push, open PR, merge, then start the next.
