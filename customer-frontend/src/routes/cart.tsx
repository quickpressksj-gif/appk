import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "Cart — QuickPress" }],
  }),
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-white text-zinc-900 p-4 font-sans">
      <div className="mx-auto max-w-md">
        <header className="flex items-center gap-3 pb-4 border-b border-zinc-200">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate({ to: "/home" })}
            className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-base font-black tracking-tight text-zinc-900">Cart</h1>
        </header>

        <div className="py-20 text-center text-zinc-500">
          <p className="text-sm font-bold text-zinc-700">Clean Starter Cart Page</p>
          <p className="text-xs text-zinc-400 mt-1">Ready for custom implementation from scratch.</p>
        </div>
      </div>
    </main>
  );
}
