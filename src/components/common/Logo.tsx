import React from 'react';
import { Eye } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

const Logo: React.FC<LogoProps> = ({ className, iconSize = 24, textSize = "text-2xl" }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Eye size={iconSize} className="text-primary" />
      <span className={`font-headline font-bold ${textSize} text-foreground`}>
        Iris AI
      </span>
    </div>
  );
};

export default Logo;
