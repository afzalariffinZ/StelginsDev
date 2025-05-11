import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Logo({ size = 'medium', className }: LogoProps) {
  const sizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-4xl',
  };

  const heartSize = {
    small: 18,
    medium: 24,
    large: 36,
  };

  return (
    <div className={cn('flex items-center gap-2 font-bold', sizeClasses[size], className)}>
      <Heart size={heartSize[size]} className="text-primary" fill="currentColor" />
      <span>Stelggin</span>
    </div>
  );
}