import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSubscriptionWithFormat } from '../src/parsers/subscription/httpSubscriptionFetcher.js';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('subscription fetch protection', () => {
    it('rejects private network subscription URLs before fetching', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        await expect(fetchSubscriptionWithFormat('http://127.0.0.1/sub')).rejects.toMatchObject({ code: 'private_address' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('always revalidates subscription responses to avoid stale nodes', async () => {
        const url = 'https://subscription.example/cache-test';
        const fetchMock = vi.fn(async () => new Response('ss://YWVzLTI1Ni1nY206c2VjcmV0QG5vZGUuZXhhbXBsZTo0NDM=#SS'));
        vi.stubGlobal('fetch', fetchMock);

        const first = await fetchSubscriptionWithFormat(url, 'test-agent');
        const second = await fetchSubscriptionWithFormat(url, 'test-agent');

        expect(first.cached).toBe(false);
        expect(second.cached).toBe(false);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        const requestOptions = fetchMock.mock.calls[0][1];
        expect(requestOptions.cache).toBe('no-store');
        expect(requestOptions.cf).toEqual({ cacheTtl: 0 });
        expect(requestOptions.headers.get('Cache-Control')).toBe('no-cache');
    });
});
