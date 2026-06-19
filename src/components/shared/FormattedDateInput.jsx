import { useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function FormattedDateInput({ value, onChange, className }) {
  const inputRef = useRef(null);
  return (
    <div
      className={cn(
        'relative flex h-8 cursor-pointer items-center rounded-lg border border-input bg-transparent px-2.5 text-sm select-none hover:bg-accent/50 transition-colors',
        className
      )}
      onClick={() => inputRef.current?.showPicker?.()}
    >
      <span className={value ? '' : 'text-muted-foreground'}>
        {value ? format(parseISO(value), 'dd-MMMM-yyyy') : 'Select date'}
      </span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={onChange}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
      />
    </div>
  );
}
