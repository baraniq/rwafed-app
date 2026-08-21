import React from "react";
import { haptic } from "../lib/haptics";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  onPress,
  onClick,
  variant = "primary",
  size = "md",
  children,
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    haptic.light();
    if (onPress) {
      onPress();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const variantStyles = {
    primary:
      "bg-[#4A5D4E] hover:bg-[#3D4D40] active:bg-[#324035] text-white shadow-sm shadow-[#4A5D4E]/20 border border-[#4A5D4E]/30",
    secondary:
      "bg-[#E6E0D8] hover:bg-[#DCD5CB] active:bg-[#D0C8BD] text-[#4A5D4E] font-semibold border border-[#D4CEBE]/60 shadow-sm",
    outline:
      "bg-white hover:bg-[#F1EFEC] active:bg-[#E6E0D8] text-[#4A5D4E] border border-[#E6E0D8] shadow-sm",
    gold:
      "bg-[#D4E2D5] hover:bg-[#C5D7C6] active:bg-[#B7CBB8] text-black font-semibold border border-[#B8CEBA] shadow-sm",
    ghost:
      "bg-transparent hover:bg-[#F1EFEC] active:bg-[#E6E0D8] text-[#8C7E6E] hover:text-black",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white shadow-sm border border-rose-500/30",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2.5 text-sm rounded-2xl gap-2",
    lg: "px-6 py-3 text-base rounded-2xl gap-2.5",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default AppButton;
