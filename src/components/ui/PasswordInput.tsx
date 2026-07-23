import { forwardRef, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/lib/i18n/useTranslation";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type" | "endAdornment">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const label = visible ? t.password.hide : t.password.show;

    return (
      <Input
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        className={`pe-12 ${props.className ?? ""}`}
        endAdornment={
          <button
            type="button"
            aria-label={label}
            aria-pressed={visible}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setVisible((current) => !current)}
            className="absolute end-1 top-1/2 flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 dark:hover:bg-zinc-700 dark:hover:text-white"
          >
            {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
        }
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
