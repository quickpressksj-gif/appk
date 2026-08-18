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
} from "lucide-react";

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

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-8">
      {adminNavItems.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            to={item.to}
            onClick={onNavigate}
            className={
              active
                ? "flex items-center gap-3 rounded-xl bg-primary/15 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors"
                : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            }
          >
            <Icon className={active ? "h-4 w-4 text-foreground" : "h-4 w-4"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandBlock() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-cta">
        <Shield className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-foreground">QuickPress</p>
        <p className="text-xs text-muted-foreground">Admin console</p>
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

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <BrandBlock />
        <SidebarNav />
        <div className="border-t border-border px-4 py-4">
          <p className="text-xs text-muted-foreground">QuickPress ops · v1.0</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <BrandBlock />
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</h1>
              {subtitle ? (
                <p className="hidden truncate text-sm text-muted-foreground sm:block">{subtitle}</p>
              ) : null}
            </div>

            <div className="relative hidden xl:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, partners…"
                className="h-9 w-72 rounded-xl pl-9"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="rounded-xl"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label="Notifications">
                  <Bell className="h-4.5 w-4.5" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { t: "4 partner KYC reviews pending", s: "Partners" },
                  { t: "₹6.4L payouts awaiting approval", s: "Finance" },
                  { t: "2 high priority tickets unassigned", s: "Support" },
                ].map((n) => (
                  <DropdownMenuItem key={n.t} className="flex-col items-start gap-1 py-2.5">
                    <span className="text-sm text-foreground">{n.t}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {n.s}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-xl px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">MI</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-foreground md:inline">Meera Iyer</span>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium text-foreground">Meera Iyer</p>
                  <p className="text-xs text-muted-foreground">Super admin · All cities</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: adminRoutes.staff })}>
                  <UserCog className="mr-2 h-4 w-4" /> Staff & roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: adminRoutes.auth })}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5 sm:px-6">
              {actions}
            </div>
          ) : null}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}