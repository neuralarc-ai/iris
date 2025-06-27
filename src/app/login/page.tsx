"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PinLoginForm from "@/components/auth/PinLoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-md md:p-6">
        <CardHeader className="text-center w-full sm:items-center">
          <CardTitle className="text-3xl font-headline">
            <div className="flex mb-8 top-0">
              <Image
                src="/images/iris.svg"
                alt="Iris AI"
                width={60}
                height={60}
              />
            </div>
          </CardTitle>
          <CardDescription>
            Enter your 4-digit PIN to access Iris AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <PinLoginForm />
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm text-muted-foreground">
          <div className="flex gap-4 mt-4">
            <Link href="#" className="hover:text-primary transition-colors">
              Help
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
          <p className="mt-4">
            &copy; {new Date().getFullYear()} Iris AI. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
