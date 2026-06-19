import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center relative items-center h-7",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between px-1",
        button_previous: cn(
          "inline-flex size-7 items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        ),
        button_next: cn(
          "inline-flex size-7 items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-8 text-center text-[0.75rem] font-medium text-muted-foreground",
        week: "flex w-full mt-1",
        day: cn(
          "relative flex-1 p-0 text-center text-sm",
          "[&:has([data-selected])]:bg-accent",
          "[&:has([data-range-start])]:rounded-l-md [&:has([data-range-end])]:rounded-r-md",
          "[&:has([data-range-start][data-range-end])]:rounded-md",
        ),
        day_button: cn(
          "inline-flex size-8 items-center justify-center rounded-md p-0 text-sm font-normal transition-colors",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          "aria-selected:bg-transparent",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside: "[&>button]:text-muted-foreground [&>button]:opacity-40",
        disabled: "[&>button]:text-muted-foreground [&>button]:opacity-40",
        range_start:
          "rounded-l-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground",
        range_end:
          "rounded-r-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground",
        range_middle:
          "bg-accent [&>button]:text-foreground [&>button]:hover:bg-accent",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
