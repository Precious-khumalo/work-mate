import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ label, size = 'md' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className={`${sizes[size]} text-primary-600 animate-spin`} />
      {label && <p className="text-sm text-gray-500 font-medium">{label}</p>}
    </div>
  );
}

export function ButtonSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}
