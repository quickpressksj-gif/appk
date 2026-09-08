import { apiGetJson } from "../core/transport";

export type LeaderboardPeriod = "today" | "weekly" | "all_time";

export type LeaderboardCaptain = {
  id: string;
  name: string;
  riderId: string;
  avatar: string;
  rank?: number;
  trips: number;
  earnings: number;
  rating: number;
  isMe: boolean;
  city: string;
  badge?: string;
  reward?: string;
};

export type MyRankInfo = {
  rank: number;
  trips: number;
  earnings: number;
  rating: number;
  gapToNextRank: number;
  bonusStatus: string;
  nextPrize: string;
};

export type PrizePoolItem = {
  place: string;
  reward: string;
  icon: string;
  color: "amber" | "slate" | "emerald";
};

export type LeaderboardResponse = {
  city: string;
  period: LeaderboardPeriod;
  totalCaptains: number;
  myRank: MyRankInfo;
  topThree: LeaderboardCaptain[];
  leaderboard: LeaderboardCaptain[];
  prizes: PrizePoolItem[];
};

export async function fetchCityLeaderboard(
  period: LeaderboardPeriod = "today",
  city?: string
): Promise<LeaderboardResponse> {
  try {
    const params: Record<string, string> = { period };
    if (city) params.city = city;
    const res = await apiGetJson<LeaderboardResponse>("/api/rider/leaderboard", {
      params,
    });
    return res;
  } catch (error) {
    console.warn("[LeaderboardApi] Falling back to offline fallback data:", error);
    // Offline / Mock fallback
    return {
      city: city || "Kasganj",
      period,
      totalCaptains: 8,
      myRank: {
        rank: 4,
        trips: period === "today" ? 8 : period === "weekly" ? 38 : 160,
        earnings: period === "today" ? 480 : period === "weekly" ? 2280 : 9600,
        rating: 4.9,
        gapToNextRank: 2,
        bonusStatus: "2 more to ₹100 Daily Bonus",
        nextPrize: "Top 3 Podium (Cash Prize)",
      },
      topThree: [
        {
          id: "cp-1",
          name: "Rahul Verma",
          riderId: "CP-102",
          avatar: "RV",
          rank: 1,
          trips: period === "today" ? 16 : period === "weekly" ? 84 : 520,
          earnings: period === "today" ? 960 : period === "weekly" ? 5040 : 31200,
          rating: 5.0,
          isMe: false,
          city: "Kasganj",
          badge: "Gold Champion 👑",
          reward: "₹500 Prize Pool 🥇",
        },
        {
          id: "cp-2",
          name: "Amit Kumar",
          riderId: "CP-105",
          avatar: "AK",
          rank: 2,
          trips: period === "today" ? 14 : period === "weekly" ? 76 : 480,
          earnings: period === "today" ? 840 : period === "weekly" ? 4560 : 28800,
          rating: 4.9,
          isMe: false,
          city: "Kasganj",
          badge: "Silver Ace ⚡",
          reward: "₹300 Prize Pool 🥈",
        },
        {
          id: "cp-3",
          name: "Vikas Singh",
          riderId: "CP-109",
          avatar: "VS",
          rank: 3,
          trips: period === "today" ? 11 : period === "weekly" ? 68 : 410,
          earnings: period === "today" ? 660 : period === "weekly" ? 4080 : 24600,
          rating: 4.9,
          isMe: false,
          city: "Kasganj",
          badge: "Bronze Star 🌟",
          reward: "₹150 Prize Pool 🥉",
        },
      ],
      leaderboard: [
        {
          id: "cp-1",
          name: "Rahul Verma",
          riderId: "CP-102",
          avatar: "RV",
          rank: 1,
          trips: 16,
          earnings: 960,
          rating: 5.0,
          isMe: false,
          city: "Kasganj",
          badge: "Gold Champion 👑",
          reward: "₹500 Prize Pool 🥇",
        },
        {
          id: "cp-2",
          name: "Amit Kumar",
          riderId: "CP-105",
          avatar: "AK",
          rank: 2,
          trips: 14,
          earnings: 840,
          rating: 4.9,
          isMe: false,
          city: "Kasganj",
          badge: "Silver Ace ⚡",
          reward: "₹300 Prize Pool 🥈",
        },
        {
          id: "cp-3",
          name: "Vikas Singh",
          riderId: "CP-109",
          avatar: "VS",
          rank: 3,
          trips: 11,
          earnings: 660,
          rating: 4.9,
          isMe: false,
          city: "Kasganj",
          badge: "Bronze Star 🌟",
          reward: "₹150 Prize Pool 🥉",
        },
        {
          id: "cp-me",
          name: "Captain (You)",
          riderId: "CP-YOU",
          avatar: "ME",
          rank: 4,
          trips: 8,
          earnings: 480,
          rating: 4.9,
          isMe: true,
          city: "Kasganj",
          badge: "Fleet Captain 🛵",
          reward: "Top 5 Elite 🚀",
        },
      ],
      prizes: [
        { place: "1st Place", reward: "₹500 Cash + Gold Champion Crown", icon: "👑", color: "amber" },
        { place: "2nd Place", reward: "₹300 Cash + Silver Medal", icon: "🥈", color: "slate" },
        { place: "3rd Place", reward: "₹150 Cash + Bronze Medal", icon: "🥉", color: "amber" },
        { place: "Top 10", reward: "Priority Smart Dispatch & 0 Platform Fee", icon: "🚀", color: "emerald" },
      ],
    };
  }
}
