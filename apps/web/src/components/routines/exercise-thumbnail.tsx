import { cn } from '@/lib/utils';

interface ExerciseThumbnailProps {
  imageUrl: string | null;
  className?: string;
}

export function ExerciseThumbnail({ imageUrl, className }: ExerciseThumbnailProps) {
  if (!imageUrl) {
    return (
      <div className={cn('flex items-center justify-center rounded-lg bg-slate-100 shrink-0', className)}>
        <span className="material-symbols-outlined text-slate-500" aria-hidden="true">fitness_center</span>
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-lg bg-slate-100 bg-center bg-cover shrink-0', className)}
      style={{ backgroundImage: `url('${imageUrl}')` }}
    />
  );
}
