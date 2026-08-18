/**
 * Shared domain types.
 *
 * Partner and rider contracts already live here so the frontends and the
 * single shared backend agree on one definition per entity.
 */
export type * from "./partner";
export type * from "./rider";
export type * from "./order";
export type * from "./account";
export type * from "./catalog";

export type ID = string;

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type * from "./payment";
