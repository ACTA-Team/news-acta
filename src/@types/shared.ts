/**
 * Cross-cutting types. These do not belong to any specific module.
 */

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export type SortDirection = 'asc' | 'desc';

export interface SeoImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}
