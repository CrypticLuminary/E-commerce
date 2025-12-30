'use client';

/**
 * Loading Spinner Component - Minimalist Design
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full border-neutral-200 border-t-neutral-900 animate-spin`} 
        style={{ animationDuration: '0.6s' }}
      />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-neutral-500 animate-pulse-subtle">Loading...</p>
      </div>
    </div>
  );
}

export function ButtonLoading() {
  return <LoadingSpinner size="sm" className="mr-2" />;
}
