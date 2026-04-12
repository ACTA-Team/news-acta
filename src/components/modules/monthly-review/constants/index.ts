export const MONTHLY_REVIEW_ROUTES = {
  index: '/monthly-review',
  detail: (period: string) => `/monthly-review/${period}`,
} as const;

/** YYYY-MM — validates the canonical period format for a monthly review. */
export const MONTHLY_REVIEW_PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
