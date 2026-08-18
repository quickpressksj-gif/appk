import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Images,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { matchesGalleryQuery, type GalleryImage } from "../../data/partner-shop-mock";

function GalleryTile({
  image,
  index,
  total,
  onRemove,
  onMove,
}: {
  image: GalleryImage;
  index: number;
  total: number;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure
      style={{ animationDelay: `${index * 40}ms` }}
      className="animate-rise group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
    >
      <div
        className={`relative flex aspect-4/3 items-center justify-center bg-linear-to-br ${image.tint} ${
          loaded ? "" : "shimmer"
        }`}
        onAnimationEnd={() => setLoaded(true)}
      >
        <Images className="size-6 text-muted-foreground" />
        <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-wider text-foreground">
          {index + 1}
        </span>
        <button
          type="button"
          aria-label={`Remove ${image.title}`}
          onClick={onRemove}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-card/90 text-destructive shadow-soft transition-all duration-300 active:scale-[0.9]"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <figcaption className="flex items-center gap-2 px-3 py-2.5">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.74rem] font-bold tracking-tight text-foreground">
            {image.title}
          </span>
          <span className="block truncate text-[0.62rem] font-medium text-muted-foreground">
            {image.tag} · {image.uploadedOn}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Move ${image.title} left`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="flex size-7 items-center justify-center rounded-full bg-muted text-foreground transition-all duration-300 active:scale-[0.9] disabled:opacity-40"
          >
            <ArrowLeft className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Move ${image.title} right`}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="flex size-7 items-center justify-center rounded-full bg-muted text-foreground transition-all duration-300 active:scale-[0.9] disabled:opacity-40"
          >
            <ArrowRight className="size-3.5" />
          </button>
        </span>
      </figcaption>
    </figure>
  );
}

/** Gallery management — add / remove / reorder / search, max 10 placeholders. */
export function ShopGallery({
  images,
  limit,
  query,
  onQueryChange,
  onAdd,
  onRemove,
  onMove,
}: {
  images: GalleryImage[];
  limit: number;
  query: string;
  onQueryChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  const visible = images.filter((image) => matchesGalleryQuery(image, query));
  const isFull = images.length >= limit;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition-colors focus-within:border-primary">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search gallery images"
            placeholder="Search photos by name or tag"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear gallery search"
              onClick={() => onQueryChange("")}
              className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={isFull}
          className="ripple flex shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-3 text-[0.7rem] font-black tracking-tight text-primary-foreground transition-all duration-300 active:scale-[0.96] disabled:opacity-50"
        >
          <ImagePlus className="size-3.5" /> Add
        </button>
      </div>

      <p className="mt-2 text-[0.66rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {images.length} of {limit} photos used
        {query ? ` · ${visible.length} matching` : ""}
      </p>

      {visible.length === 0 ? (
        <div className="card-soft mt-4 flex flex-col items-center border border-border px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Images className="size-5" />
          </span>
          <p className="mt-3 text-sm font-bold tracking-tight text-foreground">
            {query ? "No photos match your search" : "No photos yet"}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {query
              ? "Try a different name or tag."
              : "Add up to 10 placeholder photos to showcase your shop."}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((image) => {
            const index = images.findIndex((item) => item.id === image.id);
            return (
              <GalleryTile
                key={image.id}
                image={image}
                index={index}
                total={images.length}
                onRemove={() => onRemove(image.id)}
                onMove={(direction) => onMove(image.id, direction)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
