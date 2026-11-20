import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  message: string | null;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn('bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg', className)}
    >
      {message}
    </div>
  );
}
