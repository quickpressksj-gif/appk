/**
 * QuickPress Partner (Merchant) High-Priority Order Siren & Sound Engine.
 *
 * Uses the Web Audio API to synthesize high-frequency restaurant/merchant
 * dispatch chimes (Zomato/Swiggy Merchant style repeating melody) + Hardware Vibration.
 * Requires 0 external mp3 dependencies and plays reliably in background/foreground.
 */

let audioCtx: AudioContext | null = null;
let sirenInterval: ReturnType<typeof setInterval> | null = null;
let isAudioActive = false;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
 * Plays a high-clarity 3-note merchant chime (e.g. 1046Hz -> 1318Hz -> 1568Hz / C6-E6-G6).
 */
export function playPartnerOrderChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [
      { freq: 1046.5, start: 0.0, duration: 0.12 }, // C6
      { freq: 1318.5, start: 0.14, duration: 0.12 }, // E6
      { freq: 1567.98, start: 0.28, duration: 0.28 }, // G6
      { freq: 2093.0, start: 0.58, duration: 0.4 }, // C7 climax
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.35, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });

    // Hardware vibration if supported & user has interacted with page
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        if (!navigator.userActivation || navigator.userActivation.hasBeenActive) {
          navigator.vibrate([300, 100, 300, 100, 500]);
        }
      } catch {
        // Ignore haptic errors
      }
    }
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}

/**
 * Starts continuous repeating merchant alert ring for incoming new orders.
 * Rings every 1.8 seconds until explicitly stopped.
 */
export function startPartnerOrderAlertRing(): void {
  if (isAudioActive) return;
  isAudioActive = true;

  // Immediate first ring
  playPartnerOrderChime();

  // Repeat every 1800ms
  sirenInterval = setInterval(() => {
    if (!isAudioActive) {
      if (sirenInterval) clearInterval(sirenInterval);
      return;
    }
    playPartnerOrderChime();
  }, 1800);
}

/**
 * Stops continuous repeating merchant alert ring.
 */
export function stopPartnerOrderAlertRing(): void {
  isAudioActive = false;
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // Ignore
    }
  }
}

/**
 * Positive tone when order is successfully accepted by partner.
 */
export function playPartnerOrderAcceptedTone(): void {
  stopPartnerOrderAlertRing();
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const chords = [
      { freq: 523.25, start: 0.0, duration: 0.15 }, // C5
      { freq: 659.25, start: 0.12, duration: 0.15 }, // E5
      { freq: 783.99, start: 0.24, duration: 0.35 }, // G5
    ];

    chords.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch {
    // Ignore
  }
}

/**
 * Interactive test function for testing sound & vibration in settings.
 */
export function testPartnerSoundAndVibration(): void {
  playPartnerOrderChime();
}
