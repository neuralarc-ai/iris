"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import PinLoginForm from '@/components/auth/PinLoginForm';
import Logo from '@/components/common/Logo';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8">
        <Logo textSize="text-3xl" iconSize={30}/>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Welcome Back</CardTitle>
          <CardDescription>Enter your 6-digit PIN to access Iris AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <PinLoginForm />
          <Alert variant="destructive" className="mt-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              This PIN is your secret key. Do not share it with anyone.
              Access is restricted to authorized personnel only.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm text-muted-foreground">
          <div className="flex gap-4 mt-4">
            <Link href="#" className="hover:text-primary transition-colors">Help</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          <p className="mt-4">&copy; {new Date().getFullYear()} Iris AI. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
