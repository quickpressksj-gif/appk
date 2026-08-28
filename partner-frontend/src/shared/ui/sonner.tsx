import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === "undefined") {
    return null;
  }

  return (
    <Sonner
      position="top-center"
      duration={2200}
      visibleToasts={2}
      closeButton={false}
      richColors
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans !rounded-full !py-2.5 !px-4 !shadow-[0_12px_32px_rgba(0,0,0,0.18)] !border !backdrop-blur-xl transition-all duration-300 text-xs font-black tracking-tight",
          success:
            "!bg-gradient-to-r !from-emerald-600 !to-emerald-500 !text-white !border-emerald-400/50 !shadow-[0_10px_35px_rgba(16,185,129,0.4)]",
          error:
            "!bg-gradient-to-r !from-rose-600 !to-rose-500 !text-white !border-rose-400/50 !shadow-[0_10px_35px_rgba(244,63,94,0.4)]",
          info:
            "!bg-gradient-to-r !from-zinc-900 !to-zinc-800 !text-white !border-zinc-700 !shadow-lg",
          warning:
            "!bg-gradient-to-r !from-amber-500 !to-amber-400 !text-black !border-amber-300 !shadow-[0_10px_35px_rgba(245,158,11,0.4)]",
          title: "!text-xs !font-black !tracking-tight",
          description: "!text-[11px] !opacity-90 !font-semibold",
        },
      }}
      {...props}
    />
  );
}
