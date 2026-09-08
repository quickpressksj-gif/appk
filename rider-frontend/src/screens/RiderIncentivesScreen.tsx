import { useNavigate } from "@tanstack/react-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Compass,
  Flame,
  Gift,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchRiderIncentives,
  type RiderIncentivesResponse,
} from "../api/rider/rider-incentives-api";
import { RiderBottomNav } from "../components/RiderBottomNav";
import { triggerHaptic } from "../lib/captain-audio";

type TabKey = "milestones" | "quests" | "streak" | "calculator";

export function RiderIncentivesScreen() {
  const navigate = useNavigate();
  const [data, setData] = useState<RiderIncentivesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("milestones");

  // Calculator state
  const [calcTrips, setCalcTrips] = useState<number>(10);

  // Time to midnight countdown
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft("00h 00m");
        return;
      }
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchRiderIncentives();
      setData(res);
      if (isRefresh) {
        triggerHaptic();
        toast.success("Incentives & Targets Updated 🎯");
      }
    } catch {
      toast.error("Unable to load latest incentives");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dynamic calculation for simulator
  const calculatedEarnings = useMemo(() => {
    const trips = Math.max(0, calcTrips);
    const avgFarePerTrip = 42; // ₹42 avg fare
    const baseFare = trips * avgFarePerTrip;

    let milestoneBonus = 0;
    if (trips >= 15) milestoneBonus = 450;
    else if (trips >= 10) milestoneBonus = 250;
    else if (trips >= 5) milestoneBonus = 100;

    let surgeAndQuests = 0;
    if (trips >= 5) surgeAndQuests += 100; // Peak quest
    if (trips >= 8) surgeAndQuests += 50;  // 5-star rating quest

    const total = baseFare + milestoneBonus + surgeAndQuests;
    const effectivePerTrip = trips > 0 ? Math.round(total / trips) : 0;

    return {
      trips,
      baseFare,
      milestoneBonus,
      surgeAndQuests,
      total,
      effectivePerTrip,
    };
  }, [calcTrips]);

  const completedToday = data?.completedToday ?? 8;
  const totalIncentives = data?.totalIncentivesEarnedToday ?? 340;
  const milestones = data?.milestones ?? [];
  const quests = data?.specialQuests ?? [];
  const surgeZones = data?.surgeZones ?? [];
  const weeklyStreak = data?.weeklyStreak;

  // Next target calculation
  const nextMilestone = data?.nextMilestone;

  return (
    <div className="relative flex flex-col w-full h-[100dvh] max-w-md mx-auto bg-white shadow-xl overflow-hidden text-slate-800 select-none font-sans">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
              <span>Incentives & Targets</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Resets in: {timeLeft || "01h 45m"}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="p-2 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-full active:scale-95 transition-all"
          aria-label="Refresh Incentives"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
        </button>
      </header>

      {/* 2. Scrollable Body */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-28">
        {/* HERO CARD: Daily Target Overview */}
        <section className="relative rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/60 border border-emerald-200/80 p-4 shadow-sm overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Today's Bonus Unlocked</span>
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{totalIncentives.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {completedToday} deliveries completed today
              </p>
            </div>

            <div className="flex flex-col items-end">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-emerald-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Next Goal Callout Box */}
          {nextMilestone && (
            <div className="mt-3.5 p-3 bg-white/95 rounded-2xl border border-amber-200/90 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {nextMilestone.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Do <span className="font-bold text-amber-600">{nextMilestone.ridesRemaining} more rides</span> to reach ₹{nextMilestone.totalReward} (+₹{nextMilestone.rewardDifference})!
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                🎯 {nextMilestone.ridesRemaining} left
              </span>
            </div>
          )}

          {/* Stepper Progress Line */}
          <div className="mt-4 pt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
              <span>0 Rides</span>
              <span className={completedToday >= 5 ? "text-emerald-700" : ""}>5 (₹100)</span>
              <span className={completedToday >= 10 ? "text-emerald-700 font-bold" : "text-amber-700"}>10 (₹250)</span>
              <span className={completedToday >= 15 ? "text-emerald-700" : ""}>15 (₹450)</span>
            </div>
            
            {/* Multi-step progress bar */}
            <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.round((completedToday / 15) * 100))}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-2 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tier 1 Reached (₹100)
              </span>
              <span>{Math.max(0, 10 - completedToday)} trips for next tier</span>
            </div>
          </div>
        </section>

        {/* 3. Segmented Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70">
          {[
            { id: "milestones", label: "Targets", icon: Target },
            { id: "quests", label: "Quests", icon: Zap },
            { id: "streak", label: "Streak", icon: Trophy },
            { id: "calculator", label: "Calc", icon: Coins },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setActiveTab(tab.id as TabKey);
                }}
                className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: DAILY TARGET MILESTONE SLABS */}
        {activeTab === "milestones" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Daily Trip Milestones
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Commission-Free
              </span>
            </div>

            <div className="space-y-2.5">
              {milestones.map((m, idx) => {
                const isCompleted = m.completed >= m.target;
                const progressPct = Math.min(100, Math.round((m.completed / m.target) * 100));
                const remaining = Math.max(0, m.target - m.completed);

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCompleted
                        ? "bg-emerald-50/50 border-emerald-200/90 shadow-2xs"
                        : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isCompleted
                              ? "bg-emerald-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : `#${idx + 1}`}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {m.title}
                            </h4>
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                            Target: <span className="font-bold text-slate-800">{m.target} Deliveries</span> (₹{m.extraPerRide}/ride bonus)
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-700">
                          +₹{m.reward.toFixed(0)}
                        </span>
                        <div>
                          {isCompleted ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Claimed ✅
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {remaining} to go 🎯
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                        <span>Progress: {Math.min(m.target, m.completed)} / {m.target} rides</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quality Rating Bonus Note */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-start gap-3">
              <Star className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Rating Protection & Fuel Cashback
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Captains with 4.8+ star rating earn 10% extra on peak surge rides and priority order matching in Kasganj!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SURGE & QUESTS */}
        {activeTab === "quests" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Special Flash Quests
              </h3>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                ⚡ Time-Limited
              </span>
            </div>

            {/* Special Quests List */}
            <div className="space-y-2.5">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className={`p-3.5 rounded-2xl border ${
                    q.completed
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-white border-slate-200/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {q.title}
                          </h4>
                          {q.tag && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {q.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{q.desc}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-emerald-700">
                        +₹{q.reward.toFixed(0)}
                      </span>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                        {q.expiresIn}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">
                      Status: <strong className="text-slate-800">{q.progress}/{q.target}</strong> trips
                    </span>
                    {q.completed ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Active Quest
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Kasganj High Demand Surge Zones */}
            <div className="mt-4 pt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kasganj High Surge Zones</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-600">LIVE DEMAND</span>
              </div>

              <div className="space-y-2">
                {surgeZones.map((z) => (
                  <div
                    key={z.id}
                    className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {z.name}
                        </h4>
                        {z.isActive && (
                          <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                            {z.multiplier}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {z.activeTiming} · {z.demandLevel}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        +₹{z.bonusPerTrip.toFixed(0)}/trip
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WEEKLY 6-DAY DUTY STREAK */}
        {activeTab === "streak" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Weekly 6-Day Duty Streak
              </h3>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Mega ₹500 Reward
              </span>
            </div>

            {/* Streak Hero Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-50/80 via-white to-amber-100/50 border border-amber-200/90 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    Streak Bonus
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      {weeklyStreak?.completedDays ?? 5} / {weeklyStreak?.targetDays ?? 6} Days
                    </span>
                    <span className="text-xs font-bold text-amber-700">Completed</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Complete 1 more duty day this week to unlock ₹500 Mega Reward!
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-amber-200 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
              </div>

              {/* 7 Days Visual Stepper */}
              <div className="grid grid-cols-7 gap-1.5 mt-4">
                {(weeklyStreak?.days ?? []).map((d, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border transition-all ${
                      d.met
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-2xs"
                        : d.isToday
                        ? "bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/40 font-bold"
                        : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">{d.day}</span>
                    <div className="mt-1">
                      {d.met ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white mx-auto" />
                      ) : (
                        <span className="text-[11px] font-mono">{d.trips || "-"}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Streak Guidelines */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Streak Rules & Eligibility</span>
              </h4>
              <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4 font-medium">
                <li>Complete a minimum of 5 successful deliveries on any 6 days in a week.</li>
                <li>Streak week runs from Monday 00:00 AM to Sunday 11:59 PM.</li>
                <li>₹500 bonus is auto-credited directly in your next 72-Hour settlement cycle.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: CALCULATOR & SETTLEMENT ASSURANCE */}
        {activeTab === "calculator" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Daily Earnings Simulator
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Calculator
              </span>
            </div>

            {/* Calculator Card */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>Deliveries Planned Today:</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {calcTrips} Rides
                  </span>
                </label>

                {/* Counter buttons */}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setCalcTrips((prev) => Math.max(1, prev - 1));
                    }}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center active:scale-95 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="w-24 text-center">
                    <span className="text-2xl font-black text-slate-900">{calcTrips}</span>
                    <p className="text-[10px] text-slate-500">trips</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setCalcTrips((prev) => Math.min(30, prev + 1));
                    }}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick select pills */}
                <div className="flex justify-center gap-2 mt-3">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setCalcTrips(num);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                        calcTrips === num
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {num} Rides
                    </button>
                  ))}
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Trip Fares (~₹42/ride)</span>
                  <span className="font-bold text-slate-900">₹{calculatedEarnings.baseFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Daily Milestone Target Bonus</span>
                  <span className="font-bold text-emerald-600">+₹{calculatedEarnings.milestoneBonus.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Peak Rush & Surge Quests</span>
                  <span className="font-bold text-amber-600">+₹{calculatedEarnings.surgeAndQuests.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Total Take-Home Pay</span>
                  <span className="text-lg text-emerald-700">₹{calculatedEarnings.total.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-500 font-medium">
                Effective Captain Earning: ~₹{calculatedEarnings.effectivePerTrip} per completed delivery
              </p>
            </div>

            {/* 72-Hour Payout Assurance */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 rounded-3xl border border-emerald-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  72-Hour Automated Bank & UPI Settlement
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                All daily milestone bonuses, flash quest earnings, and peak surge payments are automatically transferred to your verified Bank/UPI account in the 72-Hour cycle with <strong>100% Zero Commission Deduction</strong>.
              </p>
            </div>
          </div>
        )}

        {/* 4. Bottom Call To Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              navigate({ to: "/dashboard" });
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black text-sm shadow-md shadow-emerald-500/25 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Go Online & Complete Today's Target 🚀</span>
          </button>
        </div>
      </main>

      {/* 5. Fixed Bottom Navigation Dock */}
      <RiderBottomNav active="dashboard" />
    </div>
  );
}
