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
  const [muted, setMuted] = useState(false);

  // Create the single audio element once.
  useEffect(() => {
    const audio = new Audio(TRACK);
    audio.loop = true;
    audio.volume = DEFAULT_VOLUME;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Play while active, pause otherwise. play() may reject under autoplay
  // policy before the first gesture — that is expected, so swallow it.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (active) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [active]);

  // Restore the saved preference after mount (kept out of the initial state to
  // avoid an SSR/client hydration mismatch on the toggle button).
  useEffect(() => {
    setMuted(loadMuted());
  }, []);

  // Autoplay-safe start: browsers block play() with sound until the user
  // interacts. While active, the first tap anywhere kicks off playback; the
  // listener removes itself once it has fired.
  useEffect(() => {
    if (!active) return;
    const start = () => {
      audioRef.current?.play().catch(() => {});
    };
    document.addEventListener("pointerdown", start, { once: true });
    return () => document.removeEventListener("pointerdown", start);
  }, [active]);

  // Pause while the tab is hidden; resume when it returns (if still active).
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) audio.pause();
      else if (active) audio.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [active]);

  // Keep the element's muted flag in sync with state and persist the choice.
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
    try {
      localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
    } catch {}
  }, [muted]);

  const toggleMute = () => setMuted((m) => !m);

  return { muted, toggleMute };
}
