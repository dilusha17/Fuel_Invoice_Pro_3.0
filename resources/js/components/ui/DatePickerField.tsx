import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerFieldProps {
  label?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="floating-input-wrapper">
      {label && <label className="floating-label text-xs top-3 translate-y-0 text-primary font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "floating-input peer w-full justify-between text-left font-normal min-h-[60px] pt-6 pb-2 px-4 hover:bg-primary/15 transition-colors",
              !value && "text-muted-foreground",
              className
            )}
          >
            <span>
              {value ? format(value, "PPP") : placeholder}
            </span>
            <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-card border border-border shadow-elevated rounded-xl z-50"
          align="start"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
