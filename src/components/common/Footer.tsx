import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-6 px-4 border-t border-muted-foreground/10 bg-background text-center text-sm text-muted-foreground flex flex-col items-center">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a href="#" className="hover:underline">Terms of use</a>
        <span className="mx-1">&bull;</span>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <span className="mx-1">&bull;</span>
        <a href="#" className="hover:underline">Disclaimer</a>
        <span className="mx-1">&bull;</span>
        <a href="#" className="hover:underline">Responsible AI</a>
        <span className="mx-1">&bull;</span>
        <span>
          All rights reserved. Iris, a thing by 
          <a 
            href="https://neuralarc.ai" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-bold hover:underline ml-1"
          >
            NeuralArc
          </a>
        </span>
      </div>
    </footer>
  );
} 