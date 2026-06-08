import { useEffect, useRef, useState } from "react";

/* Source lives in public/ — served at the site root. */
const TRACK = "/battle-music.mp3";
const DEFAULT_VOLUME = 0.35;

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

  // Keep the element's muted flag in sync with state.
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const toggleMute = () => setMuted((m) => !m);

  return { muted, toggleMute };
}
