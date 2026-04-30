"use client";

import { motion } from 'motion/react';
import Image from 'next/image';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export default function Loading({ text = "Carregando...", fullScreen = true }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-[60vh] w-full' : 'h-full w-full'} gap-4 p-4`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          repeat: Infinity, 
          duration: 1.5, 
          ease: "linear" 
        }}
        className="relative w-16 h-16"
      >
        <Image 
          src="/ufreela.svg" 
          alt="Carregamento uFreela"
          fill
          priority
          className="object-contain drop-shadow-sm"
        />
      </motion.div>
      <span className="text-lg font-medium text-muted-foreground animate-pulse">
        {text}
      </span>
    </div>
  );
}