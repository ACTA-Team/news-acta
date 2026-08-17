import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const publishScheduledArticles = vi.fn();

vi.mock('@/components/modules/admin/services/scheduling.service', () => ({
  publishScheduledArticles: () => publishScheduledArticles(),
}));

const { GET } = await import('../route');

const ORIGINAL_SECRET = process.env.CRON_SECRET;

function request(authorization?: string): Request {
  return new Request('https://example.test/api/cron/publish-scheduled', {
    headers: authorization ? { authorization } : {},
  });
}

beforeEach(() => {
  publishScheduledArticles.mockReset();
  publishScheduledArticles.mockResolvedValue({ publishedCount: 0, published: [], errors: [] });
  process.env.CRON_SECRET = 'test-cron-secret-value';
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL_SECRET;
});

describe('GET /api/cron/publish-scheduled', () => {
  it('returns 401 when the Authorization header is missing', async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' });
    expect(publishScheduledArticles).not.toHaveBeenCalled();
  });

  it('returns 401 for a wrong secret of the same length', async () => {
    const response = await GET(request('Bearer test-cron-secret-WRONG'));

    expect(response.status).toBe(401);
    expect(publishScheduledArticles).not.toHaveBeenCalled();
  });

  it('returns 401 for a secret of a different length', async () => {
    const response = await GET(request('Bearer short'));

    expect(response.status).toBe(401);
    expect(publishScheduledArticles).not.toHaveBeenCalled();
  });

  it('returns 401 when the scheme is missing', async () => {
    const response = await GET(request('test-cron-secret-value'));

    expect(response.status).toBe(401);
    expect(publishScheduledArticles).not.toHaveBeenCalled();
  });

  it('returns 401 when CRON_SECRET is not configured, even with a Bearer header', async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(request('Bearer anything'));

    expect(response.status).toBe(401);
    expect(publishScheduledArticles).not.toHaveBeenCalled();
  });

  it('runs the job and returns its result for the correct secret', async () => {
    publishScheduledArticles.mockResolvedValue({
      publishedCount: 2,
      published: [
        { id: 'a', slug: 'one' },
        { id: 'b', slug: 'two' },
      ],
      errors: [],
    });

    const response = await GET(request('Bearer test-cron-secret-value'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ publishedCount: 2 });
    expect(publishScheduledArticles).toHaveBeenCalledTimes(1);
  });

  it('returns 500 rather than throwing when the job fails', async () => {
    publishScheduledArticles.mockRejectedValue(new Error('database unreachable'));

    const response = await GET(request('Bearer test-cron-secret-value'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'database unreachable' });
  });
});
