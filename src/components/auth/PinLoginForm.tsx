"use client";

import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const PIN_LENGTH = 4;

export default function PinLoginForm() {
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
      });
      setPin(Array(PIN_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
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
    <form onSubmit={handleSubmit} className="space-y-6 bg-white w-full flex flex-col items-center justify-center" ref={formRef}>
      <div className="flex justify-center space-x-1 sm:space-x-2">
        {pin.map((digit, index) => (
          <Input
            key={index}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={index === 0 ? handlePaste : undefined}
            ref={(el) => { inputRefs.current[index] = el; }}
            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-mono border-border focus:ring-ring rounded-md"
            aria-label={`PIN digit ${index + 1}`}
            disabled={isLoading}
            autoComplete="off"
          />
        ))}
      </div>
      {error && <p className="text-sm text-center text-destructive">{error}</p>}
      <Button type="submit" className="w-[250px] h-12 text-lg" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Login"}
      </Button>
    </form>
  );
}

    