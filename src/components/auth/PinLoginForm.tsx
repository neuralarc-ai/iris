"use client";

import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const PIN_LENGTH = 4;

export default function PinLoginForm({ onError }: { onError?: () => void } = {}) {
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null); // Ref for the form

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    const newPin = [...pin];

    if (/^[0-9]$/.test(value) || value === '') {
      newPin[index] = value;
      setPin(newPin);
      setError(null);

      if (value && index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  useEffect(() => {
    const currentPin = pin.join('');
    if (currentPin.length === PIN_LENGTH && !isLoading) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    setError(null);

    const enteredPin = pin.join('');
    if (enteredPin.length !== PIN_LENGTH) {
      setError(`PIN must be ${PIN_LENGTH} digits.`);
      return;
    }

    const success = await login(enteredPin);
    if (!success) {
      setError('Invalid PIN. Please try again.');
      toast({
        title: "Login Failed",
        description: "Invalid PIN. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
      setTimeout(() => {
        setPin(Array(PIN_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        if (onError) onError();
      }, 120);
      return;
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (pasteData.length > 0) {
      const newPin = Array(PIN_LENGTH).fill('');
      for (let i = 0; i < pasteData.length; i++) {
        newPin[i] = pasteData[i];
      }
      setPin(newPin);
      const firstEmptyIndex = newPin.findIndex(digit => digit === '');
      const focusIndex = (firstEmptyIndex === -1 || firstEmptyIndex >= PIN_LENGTH) ? PIN_LENGTH - 1 : firstEmptyIndex;
      setTimeout(() => {
         inputRefs.current[Math.min(focusIndex, PIN_LENGTH -1)]?.focus();
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-transparent w-full flex flex-col items-center justify-center" ref={formRef}>
      <div className="flex justify-center space-x-1 sm:space-x-2">
        {pin.map((digit, index) => (
          <div key={index} className="relative">
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              ref={(el) => { inputRefs.current[index] = el; }}
              className="w-[45px] h-[58px] sm:w-[65px] sm:h-[78px] text-center text-3xl font-mono rounded-[8px] border-none outline-none focus:ring-2 focus:ring-white/60 bg-transparent backdrop-blur-[13px] text-white mix-blend-plus-lighter z-10 relative"
              style={{
                boxShadow: `inset 1.89px 0.65px 3.88px 0px #FFFFFF2E, inset 3.12px 1.07px 7.75px 0px #FFFFFF00, 2px 3px 3.04px 0px #00000012`,
                WebkitBoxShadow: `inset 1.89px 0.65px 3.88px 0px #FFFFFF2E, inset 3.12px 1.07px 7.75px 0px #FFFFFF00, 2px 3px 3.04px 0px #00000012`,
                mixBlendMode: 'plus-lighter',
                color: 'transparent',
                textShadow: digit ? '0 0 0 #fff' : 'none',
              }}
              aria-label={`PIN digit ${index + 1}`}
              disabled={isLoading}
              autoComplete="off"
            />
            <span className="pointer-events-none absolute inset-0 rounded-[8px]" style={{
              padding: '0px',
              background: 'conic-gradient(from 135deg, #FFFFFF66 0deg, #FFFFFF00 90deg, #FFFFFF66 180deg, #FFFFFF00 270deg, #FFFFFF66 360deg)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              zIndex: 1,
            }} />
          </div>
        ))}
      </div>
    </form>
  );
}

    