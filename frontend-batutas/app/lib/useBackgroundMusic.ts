import { useEffect, useRef, useState } from "react";

/* Source lives in public/ — served at the site root. */
const TRACK = "/battle-music.mp3";
const DEFAULT_VOLUME = 0.35;
const MUTED_KEY = "batutas:muted";

/* Users who ask the OS to reduce motion generally want a calmer experience;
   start quiet for them unless they have made an explicit choice. */
function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/* Single source of truth for "should the track be audible right now": only
   when the page wants it (active) and the tab is in the foreground. */
function canPlay(active: boolean): boolean {
  return active && !document.hidden;
}

/* Read the saved mute preference; fall back to the reduced-motion default. */
function loadMuted(): boolean {
  try {
    const saved = localStorage.getItem(MUTED_KEY);
    if (saved !== null) return saved === "1";
    return prefersReducedMotion();
  } catch {
    return false;
  }
}

/* Persist an explicit mute choice. Only called on user action so we never
   store a preference the player never made. */
function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
  } catch {}
}

/**
 * Loops a background track for the game page.
 *
 * @param active Play only while true (e.g. wallet connected on the right chain);
 *               pauses when false.
 * @returns muted state and a toggle for the UI control.
 */
export function useBackgroundMusic(active: boolean): {
  muted: boolean;
  toggleMute: () => void;
} {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false); // a user gesture has unlocked autoplay
  const activeRef = useRef(active); // latest `active` for event handlers
  const [muted, setMuted] = useState(false);

  activeRef.current = active;

  // Create (or reuse) the single audio element. Reusing the ref across a
  // remount — e.g. React StrictMode's double-invoke in dev — avoids spawning a
  // second element. Cleanup pauses but keeps the element for reuse.
  useEffect(() => {
    const audio = audioRef.current ?? new Audio(TRACK);
    audio.loop = true;
    audio.volume = DEFAULT_VOLUME;
    audioRef.current = audio;
    return () => {
      audio.pause();
    };
  }, []);

  // Single playback controller: the track is audible only after a user gesture
  // has unlocked autoplay and while canPlay() holds. Re-runs on `active`
  // changes and reads live state from refs. play() may reject under autoplay
  // policy, so swallow it.
  useEffect(() => {
    if (!audioRef.current) return;
    const sync = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (unlockedRef.current && canPlay(activeRef.current)) audio.play().catch(() => {});
      else audio.pause();
    };
    const onGesture = () => {
      unlockedRef.current = true;
      sync();
    };
    sync();
    document.addEventListener("pointerdown", onGesture);
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("pointerdown", onGesture);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [active]);

  // Restore the saved preference after mount (kept out of the initial state to
  // avoid an SSR/client hydration mismatch on the toggle button).
  useEffect(() => {
    setMuted(loadMuted());
  }, []);

  // Keep the element's muted flag in sync with state. Persistence lives in
  // toggleMute so we only store an explicit user choice (never the initial
  // default), keeping the reduced-motion fallback live for new visitors.
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const toggleMute = () =>
    setMuted((m) => {
      const next = !m;
      saveMuted(next); // persist only the explicit user choice
      return next;
    });

  return { muted, toggleMute };
}
