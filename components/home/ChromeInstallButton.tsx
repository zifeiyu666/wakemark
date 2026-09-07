import { Button, buttonVariants } from "@/components/ui/button";
import { CHROME_WEB_STORE_URL } from "@/config/site";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { SiGooglechrome } from "react-icons/si";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export default function ChromeInstallButton({
  label,
  className,
  variant = "outline",
  size = "lg",
}: {
  label: string;
  className?: string;
  variant?: ButtonVariantProps["variant"];
  size?: ButtonVariantProps["size"];
}) {
  return (
    <Button asChild variant={variant} size={size} className={cn(className)}>
      <a
        href={CHROME_WEB_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <SiGooglechrome />
        {label}
      </a>
    </Button>
  );
}
