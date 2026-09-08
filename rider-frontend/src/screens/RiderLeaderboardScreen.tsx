import { useNavigate } from "@tanstack/react-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  Crown,
  Flame,
  HelpCircle,
  Info,
  MapPin,
  Medal,
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
  fetchCityLeaderboard,
  type LeaderboardPeriod,
  type LeaderboardResponse,
} from "../api/rider/rider-leaderboard-api";
import { useRiderContext } from "../context/RiderContext";
import { RiderBottomNav } from "../components/RiderBottomNav";
import { triggerHaptic } from "../lib/captain-audio";

export function RiderLeaderboardScreen() {
  const navigate = useNavigate();
  const { session } = useRiderContext();

  const [period, setPeriod] = useState<LeaderboardPeriod>("today");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await fetchCityLeaderboard(period, "Kasganj");
        setData(res);
        if (isRefresh) {
          triggerHaptic();
          toast.success("Leaderboard Updated 🏆");
        }
      } catch {
        toast.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myRank = data?.myRank;
  const topThree = data?.topThree || [];
  const leaderboard = data?.leaderboard || [];

  // Sort top 3 for podium display (2nd on left, 1st in center, 3rd on right)
  const rank1 = topThree.find((c) => c.rank === 1);
  const rank2 = topThree.find((c) => c.rank === 2);
  const rank3 = topThree.find((c) => c.rank === 3);

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
              <span>City Leaderboard</span>
              <span className="flex h-2 w-2 rounded-full bg-amber-500" />
            </h1>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500" />
              <span>Kasganj Main Hub · Top Captains</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl active:scale-95 transition-all"
          title="Refresh Leaderboard"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-amber-600" : ""}`} />
        </button>
      </header>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto pb-24 space-y-3.5 p-3.5 bg-slate-50/60">
        {/* Time Scope Tabs (Today / Weekly / All Time) */}
        <div className="flex items-center p-1 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          {[
            { id: "today", label: "Today ☀️" },
            { id: "weekly", label: "This Week 📅" },
            { id: "all_time", label: "All Time 🏆" },
          ].map((tab) => {
            const active = period === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setPeriod(tab.id as LeaderboardPeriod);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  active
                    ? "bg-[#FFC400] text-slate-950 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* MY CURRENT RANK HERO BANNER (White Card with Amber Accents) */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-base shadow-2xs">
                #{myRank?.rank ?? 4}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  Your Current City Ranking
                </p>
                <p className="text-[11px] text-slate-500">
                  {myRank?.bonusStatus || "Keep riding to enter Top 3 Podium!"}
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Active Contender</span>
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-500 font-medium">Completed Trips</p>
              <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                {myRank?.trips ?? 8} Rides
              </p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-500 font-medium">Estimated Pay</p>
              <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                ₹{(myRank?.earnings ?? 480).toFixed(0)}
              </p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-500 font-medium">Gap to Rank #3</p>
              <p className="text-sm font-bold text-amber-600 font-mono mt-0.5">
                {myRank?.gapToNextRank ?? 2} Trips
              </p>
            </div>
          </div>
        </div>

        {/* TOP 3 PODIUM (Visual Olympic Style) */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900">City Podium Champions</h3>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              Weekly Prize Pool
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 items-end">
            {/* Rank 2 (Silver - Left) */}
            {rank2 && (
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-700 font-bold flex items-center justify-center text-sm shadow-xs">
                    {rank2.avatar || "AK"}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center border border-white">
                    2
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate max-w-[85px]">
                  {rank2.name.replace(" (You)", "")}
                </p>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                  {rank2.trips} Trips
                </span>
                <div className="w-full h-16 bg-slate-100 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-slate-300 p-1">
                  <span className="text-xs">🥈</span>
                  <span className="text-[10px] font-bold text-slate-700">₹300 Prize</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold - Center / Tallest) */}
            {rank1 && (
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-900 font-extrabold flex items-center justify-center text-base shadow-sm">
                    {rank1.avatar || "RV"}
                  </div>
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-base">
                    👑
                  </span>
                  <span className="absolute -bottom-1 right-0 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                    1
                  </span>
                </div>
                <p className="text-xs font-extrabold text-slate-900 truncate max-w-[95px]">
                  {rank1.name.replace(" (You)", "")}
                </p>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {rank1.trips} Trips
                </span>
                <div className="w-full h-22 bg-amber-50 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-amber-400 p-1 shadow-2xs">
                  <span className="text-sm">🥇</span>
                  <span className="text-[10px] font-black text-amber-950">₹500 Prize</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze - Right) */}
            {rank3 && (
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-800 font-bold flex items-center justify-center text-sm shadow-xs">
                    {rank3.avatar || "VS"}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center justify-center border border-white">
                    3
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate max-w-[85px]">
                  {rank3.name.replace(" (You)", "")}
                </p>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                  {rank3.trips} Trips
                </span>
                <div className="w-full h-12 bg-amber-50/60 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-amber-300 p-1">
                  <span className="text-xs">🥉</span>
                  <span className="text-[10px] font-bold text-amber-900">₹150 Prize</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PRIZE POOL REWARDS CARD */}
        <div className="p-3.5 bg-linear-to-r from-amber-50 via-white to-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Weekly ₹1,000 Prize Pool</p>
              <p className="text-[10px] text-slate-500">Top 3 Captains win cash prizes every Sunday</p>
            </div>
          </div>
          <span className="font-mono font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-lg">
            Active 🎯
          </span>
        </div>

        {/* FULL LEADERBOARD LIST */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Medal className="w-4 h-4 text-emerald-600" />
            <span>All Ranked Captains</span>
          </h3>

          <div className="space-y-2">
            {leaderboard.map((captain, idx) => {
              const rank = captain.rank || idx + 1;
              const isMe = captain.isMe || captain.id === session?.riderId;

              return (
                <div
                  key={captain.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isMe
                      ? "bg-emerald-50/80 border-emerald-300 shadow-xs"
                      : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Position */}
                    <div
                      className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                        rank === 1
                          ? "bg-amber-400 text-slate-950 shadow-xs"
                          : rank === 2
                          ? "bg-slate-200 text-slate-800"
                          : rank === 3
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                    </div>

                    {/* Captain Info */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`text-xs font-bold ${
                            isMe ? "text-emerald-950" : "text-slate-900"
                          }`}
                        >
                          {captain.name}
                        </p>
                        {isMe && (
                          <span className="text-[9px] font-black text-white bg-emerald-600 px-1.5 py-0.2 rounded-md">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {captain.rating?.toFixed(1) || "4.9"}
                        </span>
                        <span>•</span>
                        <span>{captain.city || "Kasganj"}</span>
                        <span>•</span>
                        <span className="text-slate-700 font-semibold">{captain.badge || "Verified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Score */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-900 font-mono">
                      {captain.trips} Trips
                    </p>
                    <p className="text-[10px] text-emerald-600 font-mono font-semibold">
                      ₹{captain.earnings?.toFixed(0) || "0"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. STRICTLY 2-TAB BOTTOM NAVIGATION */}
      <RiderBottomNav active="dashboard" ordersBadgeCount={2} />
    </div>
  );
}
