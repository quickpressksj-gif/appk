import { useEffect, useMemo, useState } from "react";
import { Phone, Search, ShoppingBag, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { PartnerLayout } from "../components/layout/PartnerLayout";
import { fetchPartnerCustomers, type PartnerCustomer } from "../api/partner/partner-customers-api";

export function CustomersScreen() {
  const [customers, setCustomers] = useState<PartnerCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPartnerCustomers();
      setCustomers(data);
    } catch {
      toast.error("Failed to load customer list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.lastOrderCode.toLowerCase().includes(q)
    );
  }, [customers, query]);

  const totalSpent = useMemo(() => customers.reduce((sum, c) => sum + c.totalSpent, 0), [customers]);

  return (
    <PartnerLayout
      activeTab="profile"
      title="Customers"
      subtitle={`${customers.length} unique customers ordered from your store`}
      searchQuery={query}
      onSearchChange={setQuery}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/20 text-brand-dark">
                <Users className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Customers
                </p>
                <p className="text-xl font-extrabold text-foreground">{customers.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600">
                <ShoppingBag className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Customer Spend
                </p>
                <p className="text-xl font-extrabold text-foreground">₹{totalSpent}</p>
              </div>
            </div>
          </div>

          <div className="col-span-2 rounded-3xl border border-border/80 bg-card p-5 shadow-sm lg:col-span-1">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600">
                <UserCheck className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Repeat Customers
                </p>
                <p className="text-xl font-extrabold text-foreground">
                  {customers.filter((c) => c.totalOrders > 1).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-6 md:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer by name or phone..."
              className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Content View */}
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-3xl bg-muted/60" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <Users className="mx-auto size-10 text-muted-foreground/60" />
              <h3 className="mt-3 text-sm font-bold text-foreground">No customers found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Customers will appear here when they place an order with your laundry.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm md:block">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border/80 bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4 text-center">Orders</th>
                      <th className="px-6 py-4 text-right">Total Spent</th>
                      <th className="px-6 py-4">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filtered.map((customer) => (
                      <tr key={customer.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/20 font-bold text-brand-dark">
                              {customer.name.slice(0, 1).toUpperCase()}
                            </div>
                            <span className="font-bold text-foreground">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-muted-foreground">
                          {customer.phone}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="rounded-full bg-primary/15 px-2.5 py-1 font-bold text-brand-dark">
                            {customer.totalOrders} {customer.totalOrders === 1 ? "order" : "orders"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-foreground">
                          ₹{customer.totalSpent}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-foreground">{customer.lastOrderCode}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {customer.lastOrderDate ? customer.lastOrderDate.slice(0, 10) : "Recent"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards List View */}
              <div className="space-y-3 md:hidden">
                {filtered.map((customer) => (
                  <div
                    key={customer.id}
                    className="rounded-3xl border border-border/80 bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/20 font-bold text-brand-dark">
                          {customer.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.phone}</p>
                        </div>
                      </div>
                      <a
                        href={`tel:${customer.phone}`}
                        className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground transition-colors active:scale-95"
                      >
                        <Phone className="size-4" />
                      </a>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-dashed border-border/70 pt-2.5 text-xs">
                      <span className="text-muted-foreground">
                        {customer.totalOrders} {customer.totalOrders === 1 ? "order" : "orders"}
                      </span>
                      <span className="font-extrabold text-foreground">₹{customer.totalSpent} Spent</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </PartnerLayout>
  );
}
