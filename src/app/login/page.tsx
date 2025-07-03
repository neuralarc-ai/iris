"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import PinLoginForm from "@/components/auth/PinLoginForm";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [shake, setShake] = useState(false);

  const handlePinError = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <>
      <style jsx global>{`
        footer {
          display: none !important;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="min-h-screen flex flex-col items-center justify-center p-4 bg-[url('/images/login-screen-bg.png')] bg-cover bg-center bg-no-repeat"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { opacity: 1, y: 0 }}
          transition={shake ? { duration: 0.5, ease: 'easeInOut' } : { duration: 0.6, ease: 'easeOut' }}
        >
          <Card className="w-full max-w-[478px] shadow-[5px_5px_14px_0_#2B252145] md:p-6 sm:min-h-[700px] bg-[url('/images/login-card-bg.png')] bg-cover bg-center bg-no-repeat border-none flex flex-col justify-center relative overflow-visible rounded-3xl">
            <div className="absolute top-6 right-4 z-10">
              <Image src="/images/neuralarc-logo.svg" alt="NeuralArc Logo" width={104} height={32} priority className="object-contain w-auto h-auto"/>
            </div>
            <CardContent className="flex flex-col justify-center flex-1 px-0">
              <div className="flex flex-col w-full">
                <div className="mt-2">
                  <div className="text-left ml-4 text-xl font-ligt text-white">welcome to</div>
                  <div className="w-full flex justify-center">
                    <span className="text-[92px] font-bold text-white tracking-tight leading-none text-center">
                      86/c
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start w-full mt-2">
                  <PinLoginForm onError={handlePinError} />
                  <div className="mt-2 ml-14 text-white/90 text-lg font-medium tracking-tight">Enter Security PIN</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}
