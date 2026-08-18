import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerBellAction, PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { SectionHeading } from "../components/PartnerPrimitives";
import { CustomerSuccessOverlay } from "../components/customers/CustomerSuccessOverlay";
import { ReviewAnalyticsCards } from "../components/reviews/ReviewAnalyticsCards";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { ReviewEmptyState } from "../components/reviews/ReviewEmptyState";
import { ReviewReplySheet } from "../components/reviews/ReviewReplySheet";
import { ReviewAnalyticsSkeleton, ReviewListSkeleton } from "../components/reviews/ReviewSkeletons";
import { ReviewToolbar } from "../components/reviews/ReviewToolbar";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  buildReviewAnalytics,
  fetchPartnerCustomersData,
  sortReviews,
  type PartnerReview,
  type ReviewSortId,
} from "../data/partner-customers-mock";

/**
 * Sprint 3.7 — Reviews & ratings (UI only, mock data, replies are local state).
 */
export function ReviewsScreen() {
  const navigate = useNavigate();
  const { data, setData } = usePartnerResource(fetchPartnerCustomersData);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ReviewSortId>("latest");
  const [activeRating, setActiveRating] = useState<number | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ id: string; mode: "create" | "edit" } | null>(
    null,
  );
  const [success, setSuccess] = useState<string | null>(null);

  const reviews = data?.reviews ?? [];

  const handleRefresh = useCallback(async () => {
    const fresh = await fetchPartnerCustomersData();
    setData(fresh);
    toast.success("Reviews refreshed");
  }, [setData]);

  const analytics = useMemo(() => buildReviewAnalytics(reviews), [reviews]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = reviews.filter((review) => {
      const matchesQuery =
        !needle ||
        review.customerName.toLowerCase().includes(needle) ||
        review.serviceName.toLowerCase().includes(needle) ||
        review.orderId.toLowerCase().includes(needle);
      const matchesRating = activeRating === null || review.rating === activeRating;
      return matchesQuery && matchesRating;
    });
    return sortReviews(filtered, sort);
  }, [reviews, query, sort, activeRating]);

  const updateReview = (id: string, updater: (review: PartnerReview) => PartnerReview) => {
    if (!data) return;
    setData({
      ...data,
      reviews: data.reviews.map((review) => (review.id === id ? updater(review) : review)),
    });
  };

  const activeReview = replyTarget
    ? (reviews.find((review) => review.id === replyTarget.id) ?? null)
    : null;
  const isFiltering = query.trim().length > 0 || activeRating !== null;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-6xl">
        <PartnerTopBar
          title="Reviews & Ratings"
          subtitle="Feedback, replies and rating analytics"
          onBack={() => navigate({ to: partnerRoutes.dashboard })}
          action={<PartnerBellAction />}
        />

        {!data ? (
          <div className="space-y-4 px-5 pb-32 pt-4">
            <ReviewAnalyticsSkeleton />
            <ReviewListSkeleton />
          </div>
        ) : (
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="animate-fade-in px-5 pt-4">
              <ReviewAnalyticsCards
                analytics={analytics}
                activeRating={activeRating}
                onRatingSelect={setActiveRating}
              />

              <div className="mt-5">
                <SectionHeading title="All Reviews" />
                <div className="mt-4">
                  <ReviewToolbar
                    query={query}
                    onQueryChange={setQuery}
                    sort={sort}
                    onSortChange={setSort}
                    resultCount={visible.length}
                    activeRating={activeRating}
                    onClearRating={() => setActiveRating(null)}
                  />
                </div>
              </div>
            </div>

            <div className="px-5 pb-32 pt-4">
              {visible.length === 0 ? (
                <ReviewEmptyState
                  variant={isFiltering && reviews.length > 0 ? "no-results" : "no-reviews"}
                  onAction={() => {
                    setQuery("");
                    setActiveRating(null);
                    setSort("latest");
                  }}
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {visible.map((review, index) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      index={index}
                      onReply={() => setReplyTarget({ id: review.id, mode: "create" })}
                      onEditReply={() => setReplyTarget({ id: review.id, mode: "edit" })}
                      onDeleteReply={() => {
                        updateReview(review.id, (item) => ({ ...item, reply: null }));
                        toast.success("Reply deleted");
                      }}
                      onOpenCustomer={() =>
                        navigate({
                          to: partnerRoutes.customerProfile,
                          params: { customerId: review.customerId },
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </PullToRefresh>
        )}

        <PartnerBottomNav active="dashboard" />
      </div>

      {activeReview && replyTarget ? (
        <ReviewReplySheet
          review={activeReview}
          mode={replyTarget.mode}
          onClose={() => setReplyTarget(null)}
          onSubmit={(text) => {
            const isEdit = replyTarget.mode === "edit";
            updateReview(activeReview.id, (item) => ({
              ...item,
              reply: { text, date: new Date().toISOString() },
            }));
            setReplyTarget(null);
            setSuccess(isEdit ? "Reply updated" : "Reply posted");
          }}
        />
      ) : null}

      <CustomerSuccessOverlay message={success} onDone={() => setSuccess(null)} />
      <Toaster />
    </main>
  );
}
