import { useState } from 'react';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';
import { CalendarRange, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Last 7 days', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: 'Last 30 days', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: 'This month', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: 'Last 90 days', getValue: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { label: 'This year', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

function formatRange(from, to) {
  if (!from) return 'Pick a date range';
  if (!to || from.toDateString() === to.toDateString()) return format(from, 'd MMM yyyy');
  return `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`;
}

export default function DateRangePicker({ value, onChange, className }) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState(value ?? { from: undefined, to: undefined });

  const handleSelect = (range) => {
    setSelecting(range ?? { from: undefined, to: undefined });
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
      setOpen(false);
    }
  };

  const handlePreset = (preset) => {
    const range = preset.getValue();
    setSelecting(range);
    onChange(range);
    setOpen(false);
  };

  const handleOpenChange = (next) => {
    if (next) setSelecting(value ?? { from: undefined, to: undefined });
    setOpen(next);
  };

  const displayRange = value ?? { from: undefined, to: undefined };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-8 justify-start gap-2 pl-2.5 pr-2 text-left font-normal',
            !displayRange.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarRange className="size-4 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{formatRange(displayRange.from, displayRange.to)}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="end"
        sideOffset={6}
      >
        <div className="flex">
          <div className="border-r border-border py-3 px-2 flex flex-col gap-0.5 min-w-[130px]">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePreset(preset)}
                className="w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted hover:text-foreground text-muted-foreground"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="p-2">
            <Calendar
              mode="range"
              selected={selecting}
              onSelect={handleSelect}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
              initialFocus
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
