
"use client";

import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const PIN_LENGTH = 6;

export default function PinLoginForm() {
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login } = useAuth();
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
      } else if (value && index === PIN_LENGTH - 1) {
        // If it's the last digit and it's filled, try to submit
        // We need to ensure the state is updated before calling handleSubmit
        // So we use a microtask (setTimeout with 0ms) or useEffect
      }
    }
  };

  useEffect(() => {
    const currentPin = pin.join('');
    if (currentPin.length === PIN_LENGTH && !isLoading) {
      // Check if all inputs are filled and not already loading
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]); // Rerun when pin state changes


  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Allow navigation with arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent default if called by form submission
    if (isLoading) return; // Prevent multiple submissions

    setError(null);
    setIsLoading(true);

    const enteredPin = pin.join('');
    if (enteredPin.length !== PIN_LENGTH) {
      setError('PIN must be 6 digits.');
      setIsLoading(false);
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
    // On success, the useAuth hook handles navigation, so we just need to ensure loading is false
    setIsLoading(false);
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
      // Focus on the next empty input or the last input if paste filled them all
      const firstEmptyIndex = newPin.findIndex(digit => digit === '');
      const focusIndex = (firstEmptyIndex === -1 || firstEmptyIndex >= PIN_LENGTH) ? PIN_LENGTH - 1 : firstEmptyIndex;
      
      // Delay focus slightly to allow state to update and inputs to re-render
      setTimeout(() => {
         inputRefs.current[Math.min(focusIndex, PIN_LENGTH -1)]?.focus();
      }, 0);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
      <div className="flex justify-center space-x-1 sm:space-x-2">
        {pin.map((digit, index) => (
          <Input
            key={index}
            type="tel" // Use "tel" for numeric keypad on mobile
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={index === 0 ? handlePaste : undefined} // Allow paste only on the first input
            ref={(el) => (inputRefs.current[index] = el)}
            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-mono border-2 focus:border-primary focus:ring-primary rounded-md shadow-sm"
            aria-label={`PIN digit ${index + 1}`}
            disabled={isLoading}
            autoComplete="off"
          />
        ))}
      </div>
      {error && <p className="text-sm text-center text-destructive">{error}</p>}
      <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Login"}
      </Button>
    </form>
  );
}

    