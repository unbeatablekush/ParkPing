"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CooldownTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
}

export function CooldownTimer({ initialSeconds, onComplete }: CooldownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      if (onComplete) onComplete();
      return;
    }

    const timer = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onComplete]);

  if (seconds <= 0) return null;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg px-4 py-2 mt-4">
      <Clock className="w-4 h-4" />
      <span>Try again in {minutes}:{remainingSeconds.toString().padStart(2, "0")}</span>
    </div>
  );
}
