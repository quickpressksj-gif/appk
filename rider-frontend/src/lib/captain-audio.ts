/**
 * Web Audio API synthesized sounds & haptic feedback for Delivery Captains on bikes.
 * Zero external audio assets needed — works offline and in any mobile browser!
 */

let activeAudioCtx: AudioContext | null = null;
let activeSirenOsc1: OscillatorNode | null = null;
let activeSirenOsc2: OscillatorNode | null = null;
let activeSirenInterval: any = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!activeAudioCtx || activeAudioCtx.state === "closed") {
      activeAudioCtx = new AudioCtx();
    }
    if (activeAudioCtx.state === "suspended") {
      void activeAudioCtx.resume();
    }
    return activeAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Trigger bike phone vibration (if supported by device)
 */
export function triggerHaptic(pattern: number | number[] = [100, 50, 100]) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Loud pulsing siren for incoming order dispatch.
 * Alerts the rider even while on bike in noisy traffic!
 */
export function playOrderAlertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopOrderAlertSound();
  triggerHaptic([300, 150, 300, 150, 500]);

  let toggle = false;
  const playPulse = () => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(toggle ? 880 : 660, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);

      osc.start();
      osc.stop(ctx.currentTime + 0.28);
      toggle = !toggle;
    } catch {
      /* ignore */
    }
  };

  playPulse();
  activeSirenInterval = setInterval(playPulse, 450);
}

/**
 * Stop the incoming order siren immediately.
 */
export function stopOrderAlertSound() {
  if (activeSirenInterval) {
    clearInterval(activeSirenInterval);
    activeSirenInterval = null;
  }
  if (activeSirenOsc1) {
    try {
      activeSirenOsc1.stop();
    } catch {}
    activeSirenOsc1 = null;
  }
  if (activeSirenOsc2) {
    try {
      activeSirenOsc2.stop();
    } catch {}
    activeSirenOsc2 = null;
  }
}

/**
 * Sound chime when duty is toggled ON / OFF.
 */
export function playDutyToggleSound(isOnline: boolean) {
  const ctx = getAudioContext();
  if (!ctx) return;
  triggerHaptic(isOnline ? [80, 40, 120] : [150]);

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    if (isOnline) {
      // Ascending pleasant arpeggio (Going Online)
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5
    } else {
      // Descending tone (Going Offline)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440.0, ctx.currentTime + 0.25);
    }

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    /* ignore */
  }
}

/**
 * Triumphant chord chime for order pickup or delivery completed!
 */
export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  triggerHaptic([100, 60, 100, 60, 200]);

  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.4);

      osc.start(ctx.currentTime + index * 0.08);
      osc.stop(ctx.currentTime + index * 0.08 + 0.4);
    });
  } catch {
    /* ignore */
  }
}
