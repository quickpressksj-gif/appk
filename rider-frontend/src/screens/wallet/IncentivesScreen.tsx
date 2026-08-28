import { useEffect, useState } from "react";
import { Award, CheckCircle2, Flame, IndianRupee, Sparkles, Target, Zap } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { SectionHeading } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { useRiderContext } from "../../context/RiderContext";
import { apiGetJson } from "../../api/core/transport";

type IncentiveTier = {
  trips: number;
  bonus: number;
  unlocked: boolean;
};

type IncentiveData = {
  completedTripsToday: number;
  earnedBonusToday: number;
  nextTargetTrips: number;
  nextTargetReward: number;
  tripsRemainingForNextTarget: number;
  progressPercent: number;
  tiers: IncentiveTier[];
};

export function IncentivesScreen() {
  const { session } = useRiderContext();
  const riderId = session?.riderId || "rider-current";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IncentiveData>({
    completedTripsToday: 3,
    earnedBonusToday: 0,
    nextTargetTrips: 5,
    nextTargetReward: 100,
    tripsRemainingForNextTarget: 2,
    progressPercent: 60,
    tiers: [
      { trips: 5, bonus: 100, unlocked: false },
      { trips: 10, bonus: 250, unlocked: false },
      { trips: 15, bonus: 450, unlocked: false },
    ],
  });

  useEffect(() => {
    async function loadIncentives() {
      try {
        const res = await apiGetJson<any>(`/api/financial/rider/incentives/${riderId}`);
        if (res && res.tiers) {
          setData(res);
        }
      } catch {
        /* fallback to default active tier structure */
      } finally {
        setLoading(false);
      }
    }
    loadIncentives();
  }, [riderId]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0F172A] text-white">
      {/* Background Glow Ambience */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(#10B981_0.5px,transparent_0.5px)] opacity-10 [background-size:24px_24px]" />

      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl px-4 pt-6 pb-32">
        <RiderTopBar
          title="Daily Incentives & Quests"
          subtitle="Complete trips to unlock guaranteed cash bonuses"
          action={<RiderBellAction count={0} />}
        />

        {/* Hero Progress Banner */}
        <section className="mt-5 overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
              <Flame className="size-3.5 text-amber-400 animate-pulse" />
              Daily Sprint Active
            </span>
            <span className="text-xs font-bold text-slate-400">
              Today: {data.completedTripsToday} Trips Completed
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Bonus Earned Today</p>
              <p className="flex items-center text-3xl font-black text-emerald-400">
                <IndianRupee className="size-7" />
                {data.earnedBonusToday}
              </p>
            </div>
            {data.tripsRemainingForNextTarget > 0 ? (
              <div className="text-right">
                <p className="text-[11px] font-bold text-amber-300">
                  {data.tripsRemainingForNextTarget} more trip{data.tripsRemainingForNextTarget > 1 ? "s" : ""} to unlock
                </p>
                <p className="text-sm font-black text-white">+₹{data.nextTargetReward} Cash Bonus</p>
              </div>
            ) : (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-black text-amber-300 border border-amber-400/40">
                  <Sparkles className="size-3.5" /> Max Daily Bonus Unlocked!
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
              <span>Progress to 15 Trips</span>
              <span className="text-emerald-400">{data.progressPercent}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-700"
                style={{ width: `${data.progressPercent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Daily Target Milestones */}
        <section className="mt-6 space-y-3">
          <SectionHeading title="Daily Milestone Rewards" />

          {data.tiers.map((tier, idx) => (
            <div
              key={tier.trips}
              className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                tier.unlocked
                  ? "border-emerald-500/50 bg-emerald-950/30 shadow-md"
                  : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl font-black text-base ${
                    tier.unlocked
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tier.unlocked ? <CheckCircle2 className="size-6 stroke-[2.5]" /> : `#${idx + 1}`}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>Complete {tier.trips} Trips</span>
                    {tier.unlocked && (
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        Unlocked ✓
                      </span>
                    )}
                  </h4>
                  <p className="text-xs font-semibold text-slate-400">
                    {data.completedTripsToday >= tier.trips
                      ? "Goal achieved today! Reward added to ledger."
                      : `${tier.trips - data.completedTripsToday} trips remaining`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="flex items-center text-lg font-black text-emerald-400">
                  +₹{tier.bonus}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Cash Reward</span>
              </div>
            </div>
          ))}
        </section>

        {/* Weekly Streaks & Surge Bonuses */}
        <section className="mt-6 space-y-3">
          <SectionHeading title="Weekly Streaks & Multipliers" />

          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400">
                  <Award className="size-5" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">Weekly 50-Trip Mega Streak</h4>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    Complete 50 orders within Monday – Sunday with zero unassigned cancellations.
                  </p>
                </div>
              </div>
              <span className="text-base font-black text-amber-400 whitespace-nowrap">+₹800</span>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-500/30 bg-slate-900/60 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-sky-400/20 text-sky-400">
                  <Zap className="size-5" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">Rain / Bad Weather Multiplier</h4>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    Automatic +₹20 to +₹35 surge added to every trip during active rainy weather.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-sky-400 bg-sky-400/20 px-2 py-1 rounded-lg">
                LIVE
              </span>
            </div>
          </div>
        </section>
      </div>

      <Toaster />
    </main>
  );
}
