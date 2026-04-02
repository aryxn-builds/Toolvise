"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarContextValue {
  showFallback: boolean;
  setShowFallback: (show: boolean) => void;
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null);

function useAvatarContext() {
  const context = React.useContext(AvatarContext);
  if (!context) {
    throw new Error("Avatar components must be used within an Avatar provider");
  }
  return context;
}

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [showFallback, setShowFallback] = React.useState(true);

  return (
    <AvatarContext.Provider value={{ showFallback, setShowFallback }}>
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  );
});
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, alt, ...props }, ref) => {
  const { setShowFallback } = useAvatarContext();

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      onLoad={() => setShowFallback(false)}
      onError={() => setShowFallback(true)}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { showFallback } = useAvatarContext();

  if (!showFallback) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 flex h-full w-full items-center justify-center rounded-full bg-neutral-lightest text-text-secondary font-semibold font-sans",
        className
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
