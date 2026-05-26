import type { MonthlyReviewMetric, MonthlyReviewMetricsSchema } from '@/@types/monthly-review';
import MonthlyReviewDashboard from './MonthlyReviewDashboard';

interface MonthlyReviewMetricsProps {
  metrics: MonthlyReviewMetric[] | MonthlyReviewMetricsSchema;
  previousMetrics?: MonthlyReviewMetric[] | MonthlyReviewMetricsSchema;
  period: string;
}

export function MonthlyReviewMetrics({ metrics, previousMetrics, period }: MonthlyReviewMetricsProps) {
  const isOnChainSchema = !Array.isArray(metrics) && metrics?.onChain !== undefined;

  if (isOnChainSchema) {
    const structMetrics = metrics as MonthlyReviewMetricsSchema;
    const structPrevMetrics = previousMetrics as MonthlyReviewMetricsSchema | undefined;
    return (
      <MonthlyReviewDashboard
        metrics={structMetrics}
        previousMetrics={structPrevMetrics}
        period={period}
      />
    );
  }

  const items = Array.isArray(metrics) ? metrics : (metrics as MonthlyReviewMetricsSchema)?.editorial ?? [];
  if (items.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {metric.label}
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {metric.value}
          </dd>
          {metric.delta ? (
            <span
              className={
                metric.direction === 'down'
                  ? 'text-xs text-red-600'
                  : metric.direction === 'up'
                    ? 'text-xs text-emerald-600'
                    : 'text-xs text-zinc-500'
              }
            >
              {metric.delta}
            </span>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

