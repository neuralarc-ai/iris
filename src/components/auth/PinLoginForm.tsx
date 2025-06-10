"use client";

import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    const newPin = [...pin];
    
    // Allow only single digit numeric input
    if (/^[0-9]$/.test(value) || value === '') {
      newPin[index] = value;
      setPin(newPin);
      setError(null);

      // Move to next input if a digit is entered
      if (value && index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setPin(Array(PIN_LENGTH).fill('')); // Reset PIN input
      inputRefs.current[0]?.focus(); // Focus on the first input
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center space-x-2">
        {pin.map((digit, index) => (
          <Input
            key={index}
            type="text" // Using text to better control input, but could be "tel" or "password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            ref={(el) => (inputRefs.current[index] = el)}
            className="w-12 h-14 text-center text-2xl font-mono border-2 focus:border-primary focus:ring-primary rounded-md shadow-sm"
            aria-label={`PIN digit ${index + 1}`}
            disabled={isLoading}
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
