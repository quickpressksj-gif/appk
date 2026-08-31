import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Shield,
  Sun,
  UserCog,
  Sparkles,
  Zap,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";
import { adminNavItems, adminRoutes } from "../navigation/admin-routes";
import { useTheme } from "../hooks/use-theme";
import { adminLogout } from "../api/auth";

const NAV_GROUPS = [
  {
    title: "OPERATIONS",
    items: ["dashboard", "orders", "customers", "partners", "riders"],
  },
  {
    title: "CATALOG & NETWORK",
    items: ["services", "cities"],
  },
  {
    title: "FINANCE & GROWTH",
    items: ["wallet", "coupons", "memberships", "analytics"],
  },
  {
    title: "SYSTEM & GOVERNANCE",
    items: ["website", "notifications", "support", "staff", "settings"],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 py-4 scrollbar-thin scrollbar-thumb-zinc-200">
      {NAV_GROUPS.map((group) => {
        const groupItems = adminNavItems.filter((i) => group.items.includes(i.id));
        if (groupItems.length === 0) return null;

        return (
          <div key={group.title} className="space-y-1.5">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-zinc-400">
              {group.title}
            </p>
            <div className="space-y-1">
              {groupItems.map((item) => {
                const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(`${item.to}/`));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={onNavigate}
                    className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                      active
                        ? "bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200 shadow-sm"
                        : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex size-7 items-center justify-center rounded-lg transition-colors ${
                          active
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200 group-hover:text-zinc-900"
                        }`}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <span>{item.label}</span>
                    </div>

                    {active && (
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function BrandBlock() {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4.5 bg-white">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20">
          <Shield className="size-4.5" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black tracking-tight text-[#111827]">Quick<span className="text-[#16A34A]">Press</span></span>
            <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-black text-amber-900 border border-amber-300">
              OPS
            </span>
          </div>
          <p className="text-[10px] font-medium text-zinc-400">Super Admin Console</p>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const searchDropdownRef = useState<any>(null)[0];

  const handleSearchInput = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    setSearchOpen(true);
    setIsSearching(true);
    try {
      const { searchGlobal } = await import("../api/dashboard");
      const res = await searchGlobal(val);
      setSearchResults(res);
    } catch {
      /* ignore */
    } finally {
      setIsSearching(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await adminLogout();
      toast.success("Signed out successfully.");
      navigate({ to: adminRoutes.auth });
    } catch {
      navigate({ to: adminRoutes.auth });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#111827] font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Desktop Sticky Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <BrandBlock />
        <SidebarNav />

        {/* Bottom Status Block */}
        <div className="border-t border-zinc-200 p-3.5 bg-zinc-50/70">
          <div className="flex items-center justify-between rounded-xl bg-white border border-zinc-200 p-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
              </span>
              <div className="text-[11px] leading-tight">
                <p className="font-bold text-zinc-900">Cluster Online</p>
                <p className="text-[9px] text-zinc-400">Production v2.4</p>
              </div>
            </div>
            <button
              onClick={() => toast.info("System Health: 99.98% uptime · All nodes active.")}
              className="text-zinc-400 hover:text-zinc-700 p-1"
            >
              <Zap className="size-3.5 text-amber-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Floating Header */}
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-xl shadow-xs">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            {/* Mobile Sheet Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 lg:hidden active:scale-95 shadow-sm"
                  aria-label="Open menu"
                >
                  <Menu className="size-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-white text-zinc-900 border-zinc-200">
                <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                <BrandBlock />
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Page Title & Subtitle */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base sm:text-lg font-black tracking-tight text-zinc-900">{title}</h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="size-3" />
                  <span>Realtime Sync</span>
                </span>
              </div>
              {subtitle ? (
                <p className="hidden truncate text-xs font-medium text-zinc-500 sm:block">{subtitle}</p>
              ) : null}
            </div>

            {/* Search Bar with Live Server-Side Auto-Suggest */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
                placeholder="Search orders, customers, partners, riders..."
                className="h-9 w-72 rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-xs"
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 size-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              )}

              {/* Global Search Results Dropdown */}
              {searchOpen && searchResults && (
                <div
                  ref={searchDropdownRef}
                  className="absolute right-0 top-11 z-50 w-96 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
                      Search Results ({searchResults.total})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-2 max-h-80 overflow-y-auto space-y-3 scrollbar-thin">
                    {/* Orders */}
                    {searchResults.results.orders.length > 0 && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase text-emerald-700">Orders</p>
                        <div className="mt-1 space-y-1">
                          {searchResults.results.orders.map((ord) => (
                            <div
                              key={ord.id}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate({ to: adminRoutes.orders });
                              }}
                              className="flex items-center justify-between rounded-lg p-1.5 hover:bg-zinc-50 cursor-pointer text-xs"
                            >
                              <div>
                                <span className="font-bold text-zinc-900">#{ord.code}</span>
                                <span className="text-zinc-500 text-[11px] ml-1.5">{ord.customer}</span>
                              </div>
                              <span className="text-[10px] font-bold uppercase rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600">
                                {ord.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customers */}
                    {searchResults.results.customers.length > 0 && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase text-sky-700">Customers</p>
                        <div className="mt-1 space-y-1">
                          {searchResults.results.customers.map((cust) => (
                            <div
                              key={cust.id}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate({ to: adminRoutes.customers });
                              }}
                              className="flex items-center justify-between rounded-lg p-1.5 hover:bg-zinc-50 cursor-pointer text-xs"
                            >
                              <span className="font-bold text-zinc-900">{cust.name}</span>
                              <span className="text-zinc-500 text-[11px]">{cust.phone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Partners */}
                    {searchResults.results.partners.length > 0 && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase text-amber-700">Partners</p>
                        <div className="mt-1 space-y-1">
                          {searchResults.results.partners.map((prt) => (
                            <div
                              key={prt.id}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate({ to: adminRoutes.partners });
                              }}
                              className="flex items-center justify-between rounded-lg p-1.5 hover:bg-zinc-50 cursor-pointer text-xs"
                            >
                              <span className="font-bold text-zinc-900">{prt.name}</span>
                              <span className="text-zinc-500 text-[11px]">{prt.city}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Riders */}
                    {searchResults.results.riders.length > 0 && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase text-purple-700">Riders</p>
                        <div className="mt-1 space-y-1">
                          {searchResults.results.riders.map((rdr) => (
                            <div
                              key={rdr.id}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate({ to: adminRoutes.riders });
                              }}
                              className="flex items-center justify-between rounded-lg p-1.5 hover:bg-zinc-50 cursor-pointer text-xs"
                            >
                              <span className="font-bold text-zinc-900">{rdr.name}</span>
                              <span className={`text-[10px] font-bold ${rdr.isOnline ? "text-emerald-600" : "text-zinc-400"}`}>
                                {rdr.isOnline ? "● Online" : "Offline"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.total === 0 && (
                      <p className="text-xs text-zinc-500 text-center py-4">No matching records found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => navigate({ to: adminRoutes.notifications })}
              className="relative flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 shadow-sm"
            >
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-600" />
            </button>

            {/* Admin Avatar & Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-1.5 pr-2.5 text-left transition-colors hover:bg-zinc-50 shadow-sm"
                >
                  <Avatar className="size-7 rounded-lg border border-emerald-500/40">
                    <AvatarFallback className="bg-emerald-600 text-white font-black text-xs">
                      QS
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block leading-none text-left">
                    <p className="text-xs font-black text-zinc-900">Super Admin</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">4502 Master</p>
                  </div>
                  <ChevronDown className="size-3 text-zinc-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl bg-white border-zinc-200 text-zinc-900 shadow-xl p-1.5">
                <DropdownMenuLabel className="px-2.5 py-1.5">
                  <p className="text-xs font-black text-zinc-900">Super Administrator</p>
                  <p className="text-[10px] text-zinc-500">admin@quickpress.online</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-100" />
                <DropdownMenuItem
                  onClick={() => navigate({ to: adminRoutes.staff })}
                  className="rounded-xl px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <UserCog className="mr-2 size-4 text-emerald-600" />
                  <span>Staff & Roles</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate({ to: adminRoutes.settings })}
                  className="rounded-xl px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <HelpCircle className="mr-2 size-4 text-amber-600" />
                  <span>Platform Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-100" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-xl px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Lock & Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content wrapper */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {actions ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-200">
              <div className="text-xs text-zinc-500 font-medium">QuickPress Operations Console</div>
              <div className="flex items-center gap-2">{actions}</div>
            </div>
          ) : null}

          {children}
        </main>
      </div>
    </div>
  );
}