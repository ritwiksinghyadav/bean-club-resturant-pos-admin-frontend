import * as React from 'react';
import { Eye, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ViewButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onView?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ViewButton = React.forwardRef<HTMLButtonElement, ViewButtonProps>(
  ({ className, onView, onClick, children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (onView) {
        onView(e);
      }
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <Button
        ref={ref}
        variant='ghost'
        size='sm'
        className={cn(
          'text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 border-primary/10 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <Eye className='h-3.5 w-3.5 shrink-0' />
        <span>{children || 'View'}</span>
        <ChevronRight className='h-3 w-3 shrink-0' />
      </Button>
    );
  }
);

ViewButton.displayName = 'ViewButton';
