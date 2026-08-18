import { useCallback, useEffect, useRef, useState } from "react";

/** Resend countdown used by the OTP verification screen. */
export function useOtpCountdown(seconds = 45) {
  const [remaining, setRemaining] = useState(seconds);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const restart = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, canResend: remaining === 0, restart };
}
