import * as React from "react";
import { Check, ChevronDown, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  onAddNew?: () => void;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

const SearchableSelect = React.forwardRef<HTMLButtonElement, SearchableSelectProps>(
  ({ options, value, onChange, placeholder = "Select...", label, onAddNew, className, disabled = false, searchable = true }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const filteredOptions = searchable
      ? options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()))
      : options;

    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div className="floating-input-wrapper">
        <Popover open={open && !disabled} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={ref}
              type="button"
              disabled={disabled}
              className={cn(
                "floating-input peer w-full text-left flex items-center justify-between",
                !selectedOption && "text-muted-foreground",
                selectedOption && "has-value",
                disabled && "opacity-50 cursor-not-allowed",
                className
              )}
              aria-expanded={open}
            >
              <span className={cn(!selectedOption && "opacity-0")}>
                {selectedOption?.label || placeholder}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </PopoverTrigger>
          {label && <label className="floating-label">{label}</label>}
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card border border-border shadow-elevated rounded-xl overflow-hidden z-50" align="start">
            {searchable && (
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 pr-4 py-2 bg-secondary/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left",
                      option.value === value
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary"
                    )}
                    onClick={() => {
                      onChange?.(option.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        option.value === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </button>
                ))
              )}
            </div>
            {onAddNew && (
              <div className="p-2 border-t border-border">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  onClick={() => {
                    onAddNew();
                    setOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add new
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";

export { SearchableSelect };
