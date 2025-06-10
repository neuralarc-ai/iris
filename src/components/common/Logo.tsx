
import React from 'react';
// import { Eye } from 'lucide-react'; // Icon removed as per request

interface LogoProps {
  className?: string;
  iconSize?: number; // Kept for potential future use, but icon is removed
  textSize?: string;
}

const Logo: React.FC<LogoProps> = ({ className, textSize = "text-2xl" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* <Eye size={iconSize} className="text-primary mr-2" /> Icon removed */}
      <span className={`font-headline font-bold ${textSize} text-foreground`}>
        IRIS AI
      </span>
    </div>
  );
};

export default Logo;

    