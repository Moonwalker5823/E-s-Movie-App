import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type Variant = "spray" | "ghost";

interface BaseProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
  focusable?: boolean;
}

interface ButtonProps extends BaseProps {
  onClick?: () => void;
  type?: "button" | "submit";
}
interface LinkProps extends BaseProps {
  to: string;
}
interface AnchorProps extends BaseProps {
  href: string;
  external?: boolean;
}

const cls = (variant: Variant, extra?: string) =>
  `${variant === "spray" ? "btn-spray" : "btn-ghost"} ${extra || ""}`;

/** Internal route button. */
export function LinkButton({ to, variant = "ghost", className, children, focusable = true }: LinkProps) {
  return (
    <Link to={to} data-focusable={focusable || undefined} className={cls(variant, className)}>
      {children}
    </Link>
  );
}

/** External link button (opens the streaming service, YouTube, etc.). */
export function AnchorButton({
  href,
  variant = "ghost",
  className,
  children,
  focusable = true,
  external = true,
}: AnchorProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      data-focusable={focusable || undefined}
      className={cls(variant, className)}
    >
      {children}
    </a>
  );
}

/** Action button. */
export default function Button({
  onClick,
  type = "button",
  variant = "ghost",
  className,
  children,
  focusable = true,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      data-focusable={focusable || undefined}
      className={cls(variant, className)}
    >
      {children}
    </button>
  );
}
