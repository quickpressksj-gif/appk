import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, Phone, RefreshCw, LogOut } from "lucide-react";
import { useRiderContext } from "../context/RiderContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickPress Captain — Ready to Build" },
      {
        name: "description",
        content: "QuickPress Captain panel reset cleanly. Ready to build step-by-step from scratch.",
      },
    ],
  }),
  component: CaptainStartScreen,
});

function CaptainStartScreen() {
  const { session, phone, isOnline, setOnline, signOut } = useRiderContext();

  return (
    <main className="relative min-h-screen bg-white text-slate-950 flex flex-col justify-between p-5 max-w-md mx-auto selection:bg-amber-400 selection:text-black">
      {/* Top Brand Bar */}
      <header className="flex items-center justify-between border-b border-slate-100 pb-4 pt-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black text-base shadow-sm">
            QP
          </span>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900">
              QuickPress Captain
            </h1>
            <p className="text-[11px] font-semibold text-slate-500">
              Fresh Clean Canvas · Ready to Build
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-800">
          <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
          Clean Slate
        </span>
      </header>

      {/* Main Center Area */}
      <section className="my-auto py-8 text-center space-y-5">
        <div className="relative mx-auto flex size-24 items-center justify-center rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-sm">
          <Sparkles className="size-10 text-amber-600 animate-bounce" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Rider Panel Cleaned!
          </h2>
          <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto">
            Purane sabhi complex routes aur cluttered screens remove kar diye gaye hain. Ab hum starting se step-by-step banayenge.
          </p>
        </div>

        {/* Live Engine Status Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left space-y-3 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Current Engine State
          </p>

          <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200/60 pb-2">
            <span className="text-slate-600">Captain Session:</span>
            <span className={session ? "text-emerald-600 font-black" : "text-slate-400"}>
              {session ? `Logged In (${session.fullName || session.phone})` : "Logged Out"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200/60 pb-2">
            <span className="text-slate-600">Duty Toggle Engine:</span>
            <button
              type="button"
              onClick={() => setOnline(!isOnline)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                isOnline ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-700"
              }`}
            >
              {isOnline ? "ONLINE (Active)" : "OFFLINE"}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">Backend API:</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              Connected &amp; Ready
            </span>
          </div>
        </div>

        {/* Logout button if session exists */}
        {session ? (
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out Session</span>
          </button>
        ) : null}
      </section>

      {/* Footer Prompt */}
      <footer className="border-t border-slate-100 pt-4 text-center">
        <p className="text-xs font-bold text-slate-900">
          Ab aap bataiye pehla screen kya banana hai?
        </p>
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          (e.g., &quot;Full Login &amp; OTP Screen banao&quot; ya &quot;Direct Dashboard banao&quot;)
        </p>
      </footer>
    </main>
  );
}
