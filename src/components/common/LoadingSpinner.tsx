import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  className,
  fullPage = false,
}) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 style={{ width: size, height: size }} className={cn('animate-spin text-primary', className)} />
      </div>
    );
  }
  return (
    <Loader2 style={{ width: size, height: size }} className={cn('animate-spin text-primary', className)} />
  );
};
