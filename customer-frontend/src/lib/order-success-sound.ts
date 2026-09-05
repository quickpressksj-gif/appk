/**
 * QuickPress Sonic Order Confirmation Sound Engine (Rapido / Uber / Swiggy style).
 *
 * Synthesizes a crisp, cheerful, modern dual-tone ascending acoustic chime
 * using the Web Audio API without requiring any external mp3 network assets.
 * Also triggers precise tactile haptic vibrations on supported mobile devices.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays Rapido-style instant ascending double-ping confirmation chime:
 * 1. Warm initial ping at 880Hz (A5)
 * 2. Harmonic bloom at 1318.5Hz (E6)
 * 3. Triumphant high shimmer at 1760Hz (A6)
 */
export function playOrderPlacedSonicChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonic sound layer 1 — Futuristic energetic ping
    const pings = [
      { freq: 880.0, start: 0.0, duration: 0.14, gain: 0.35 },
      { freq: 1318.51, start: 0.10, duration: 0.18, gain: 0.40 },
      { freq: 1760.0, start: 0.22, duration: 0.45, gain: 0.45 },
    ];

    pings.forEach(({ freq, start, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);

      gainNode.gain.setValueAtTime(0.001, now + start);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + start + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });

    // Harmonic sound layer 2 — Soft sparkle chime underneath
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(523.25, now); // C5
    subOsc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3); // Sweep up to C6
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.5);

    // Haptic vibration feedback (double tap pattern)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        if (!navigator.userActivation || navigator.userActivation.hasBeenActive) {
          navigator.vibrate([120, 60, 220]);
        }
      } catch {
        // Ignore haptics errors gracefully
      }
    }
  } catch (e) {
    console.debug("[Audio] Order sound playback notice:", e);
  }
}
