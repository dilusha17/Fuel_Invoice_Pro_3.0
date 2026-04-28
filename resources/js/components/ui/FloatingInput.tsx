import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, icon, type = "text", ...props }, ref) => {
    const [hasValue, setHasValue] = React.useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== "");
      props.onChange?.(e);
    };

    return (
      <div className="floating-input-wrapper group">
        <input
          type={type}
          className={cn(
            "floating-input peer",
            icon && "pr-12",
            hasValue && "has-value",
            className
          )}
          ref={ref}
          placeholder=" "
          {...props}
          onChange={handleChange}
        />
        <label className="floating-label">{label}</label>
        {icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
