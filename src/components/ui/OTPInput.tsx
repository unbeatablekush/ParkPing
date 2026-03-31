"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 6, value, onChange, disabled }: OTPInputProps) {
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const arr = new Array(length).fill("");
  const valueArr = value.split("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (valueArr.length > 0) {
        onChange(value.slice(0, -1));
        setActive(Math.max(0, valueArr.length - 1));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // only digits
    if (!val) return;

    if (value.length < length) {
      const newVal = value + val.slice(-1);
      onChange(newVal);
      setActive(Math.min(length - 1, newVal.length));
    }
  };

  // Sync active state when value is fully typed somehow (paste)
  useEffect(() => {
    setActive(Math.min(length - 1, value.length));
  }, [value, length]);

  return (
    <div className={cn("flex gap-2 justify-center", disabled && "opacity-50 pointer-events-none")}>
      <input
        ref={inputRef}
        type="tel"
        pattern="[0-9]*"
        className="absolute opacity-0 top-0 left-0 hover:cursor-default pointer-events-none h-0 w-0"
        value=""
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={length}
      />
      {arr.map((_, i) => {
        const char = valueArr[i] || "";
        const isActive = active === i;

        return (
          <div
            key={i}
            onClick={() => {
              if (disabled) return;
              setActive(Math.min(value.length, length - 1));
              inputRef.current?.focus();
            }}
            className={cn(
              "w-12 h-14 border-2 rounded-xl flex items-center justify-center text-xl font-bold cursor-text transition-colors duration-200",
              isActive ? "border-primary ring-4 ring-primary/20" : "border-gray-200",
              char ? "bg-white text-gray-900 border-gray-300" : "bg-gray-50 text-transparent"
            )}
          >
            {char || "0"}
          </div>
        );
      })}
    </div>
  );
}
