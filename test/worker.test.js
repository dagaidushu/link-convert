import { describe, it, expect, vi } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

const createTestApp = (overrides = {}) => {
    const runtime = {
        kv: overrides.kv ?? new MemoryKVAdapter(),
        assetFetcher: overrides.assetFetcher ?? null,
        logger: console,
        config: {
            configTtlSeconds: 60,
            shortLinkTtlSeconds: null,
            ...(overrides.config || {})
        }
    };
    return createApp(runtime);
};

describe('Worker', () => {
    it('GET / returns HTML', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/');
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/html');
        const text = await res.text();
        expect(text).toContain('Sublink Conversion');
        expect(text).toContain('允许不安全证书');
        expect(text).toContain('原样订阅');
        expect(text).toContain('转换配置');
        expect(text).not.toContain("${t('");
    });

    it('GET /singbox returns JSON', async () => {
        const app = createTestApp();
        const config = 'vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogInRlc3QiLA0KICAiYWRkIjogIjEuMS4xLjEiLA0KICAicG9ydCI6ICI0NDMiLA0KICAiaWQiOiAiYWRkNjY2NjYtODg4OC04ODg4LTg4ODgtODg4ODg4ODg4ODg4IiwNCiAgImFpZCI6ICIwIiwNCiAgInNjeSI6ICJhdXRvIiwNCiAgIm5ldCI6ICJ3cyIsDQogICJ0eXBlIjogIm5vbmUiLA0KICAiaG9zdCI6ICIiLA0KICAicGF0aCI6ICIvIiwNCiAgInRscyI6ICJ0bHMiDQp9';
        const res = await app.request(`http://localhost/singbox?config=${encodeURIComponent(config)}`);
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('application/json');
        const json = await res.json();
        expect(json).toHaveProperty('outbounds');
    });

    it('GET /singbox returns legacy config for sing-box 1.11 UA', async () => {
        const app = createTestApp();
        const config = 'vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogInRlc3QiLA0KICAiYWRkIjogIjEuMS4xLjEiLA0KICAicG9ydCI6ICI0NDMiLA0KICAiaWQiOiAiYWRkNjY2NjYtODg4OC04ODg4LTg4ODgtODg4ODg4ODg4ODg4IiwNCiAgImFpZCI6ICIwIiwNCiAgInNjeSI6ICJhdXRvIiwNCiAgIm5ldCI6ICJ3cyIsDQogICJ0eXBlIjogIm5vbmUiLA0KICAiaG9zdCI6ICIiLA0KICAicGF0aCI6ICIvIiwNCiAgInRscyI6ICJ0bHMiDQp9';
        const res = await app.request(`http://localhost/singbox?config=${encodeURIComponent(config)}`, {
            headers: {
                'User-Agent': 'SFI/1.12.2 (Build 2; sing-box 1.11.4; language zh_CN)'
            }
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json?.dns?.servers?.[0]).toHaveProperty('address');
        expect(json?.dns?.servers?.[0]).not.toHaveProperty('type');
        expect(json?.route).not.toHaveProperty('default_domain_resolver');
    });

    it('GET /singbox returns 1.12+ config for sing-box 1.12 UA', async () => {
        const app = createTestApp();
        const config = 'vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogInRlc3QiLA0KICAiYWRkIjogIjEuMS4xLjEiLA0KICAicG9ydCI6ICI0NDMiLA0KICAiaWQiOiAiYWRkNjY2NjYtODg4OC04ODg4LTg4ODgtODg4ODg4ODg4ODg4IiwNCiAgImFpZCI6ICIwIiwNCiAgInNjeSI6ICJhdXRvIiwNCiAgIm5ldCI6ICJ3cyIsDQogICJ0eXBlIjogIm5vbmUiLA0KICAiaG9zdCI6ICIiLA0KICAicGF0aCI6ICIvIiwNCiAgInRscyI6ICJ0bHMiDQp9';
        const res = await app.request(`http://localhost/singbox?config=${encodeURIComponent(config)}`, {
            headers: {
                'User-Agent': 'SFA/1.12.12 (587; sing-box 1.12.12; language zh_Hans_CN)'
            }
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json?.dns?.servers?.[0]).toHaveProperty('type');
        expect(json?.dns?.servers?.[0]).not.toHaveProperty('address');
        expect(json?.route).toHaveProperty('default_domain_resolver', 'dns_resolver');
    });

    it('GET /clash returns YAML', async () => {
        const app = createTestApp();
        const config = 'vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogInRlc3QiLA0KICAiYWRkIjogIjEuMS4xLjEiLA0KICAicG9ydCI6ICI0NDMiLA0KICAiaWQiOiAiYWRkNjY2NjYtODg4OC04ODg4LTg4ODgtODg4ODg4ODg4ODg4IiwNCiAgImFpZCI6ICIwIiwNCiAgInNjeSI6ICJhdXRvIiwNCiAgIm5ldCI6ICJ3cyIsDQogICJ0eXBlIjogIm5vbmUiLA0KICAiaG9zdCI6ICIiLA0KICAicGF0aCI6ICIvIiwNCiAgInRscyI6ICJ0bHMiDQp9';
        const res = await app.request(`http://localhost/clash?config=${encodeURIComponent(config)}`);
        expect(res.status).toBe(200);
        // Clash builder returns text/yaml
        expect(res.headers.get('content-type')).toContain('text/yaml');
        const text = await res.text();
        expect(text).toContain('proxies:');
    });

    it('GET /clash rejects empty url-test proxy groups with a diagnostic error', async () => {
        const app = createTestApp();
        const config = `
proxies:
  - name: Node-A
    type: ss
    server: a.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
proxy-groups:
  - name: Empty Test Group
    type: url-test
    proxies: []
`;
        const res = await app.request(`http://localhost/clash?config=${encodeURIComponent(config)}`);

        expect(res.status).toBe(400);
        const text = await res.text();
        expect(text).toContain('Invalid proxy group "Empty Test Group"');
        expect(text).toContain('requires at least one proxy or provider reference');
    });

    it('GET /shorten-v2 returns short code', async () => {
        const url = 'http://example.com';
        const kvMock = {
            put: vi.fn(async () => {}),
            get: vi.fn(async () => null),
            delete: vi.fn(async () => {})
        };
        const app = createTestApp({ kv: kvMock });
        const res = await app.request(`http://localhost/shorten-v2?url=${encodeURIComponent(url)}`);
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toBeTruthy();
        expect(kvMock.put).toHaveBeenCalled();
    });

    it('POST /shorten-v2 creates a short link for a large conversion URL', async () => {
        const app = createTestApp();
        const node = 'vless://11111111-1111-1111-1111-111111111111@node.example:443?security=tls&sni=node.example#VLESS';
        const fullUrl = `http://localhost/xray?config=${encodeURIComponent(Array(500).fill(node).join('\n'))}`;

        const created = await app.request('http://localhost/shorten-v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: fullUrl, shortCode: 'large-config', target: 'x' })
        });

        expect(created.status).toBe(200);
        expect(await created.text()).toBe('large-config');

        const subscription = await app.request('http://localhost/x/large-config');
        expect(subscription.status).toBe(200);
        expect(subscription.headers.get('location')).toBeNull();
        expect(subscription.headers.get('cache-control')).toContain('no-store');
        expect(subscription.headers.get('cloudflare-cdn-cache-control')).toBe('no-store');
        expect(await subscription.text()).toBeTruthy();
    });

    it('POST /inspect returns protocol compatibility details', async () => {
        const app = createTestApp();
        const input = [
            'vless://11111111-1111-1111-1111-111111111111@node.example:443?security=tls&sni=node.example#VLESS',
            'hysteria2://secret@hy2.example:443?sni=hy2.example#HY2'
        ].join('\n');
        const res = await app.request('http://localhost/inspect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input })
        });

        expect(res.status).toBe(200);
        const report = await res.json();
        expect(report.total).toBe(2);
        expect(report.targets.find(target => target.key === 'xrayJson').skipped).toHaveLength(1);
    });

    it('GET /xray with format=json returns an Xray configuration', async () => {
        const app = createTestApp();
        const config = 'vless://11111111-1111-1111-1111-111111111111@node.example:443?security=tls&sni=node.example#VLESS';
        const res = await app.request(`http://localhost/xray?format=json&config=${encodeURIComponent(config)}`);

        expect(res.status).toBe(200);
        expect(res.headers.get('cache-control')).toContain('no-store');
        const json = await res.json();
        expect(json.outbounds).toEqual(expect.arrayContaining([
            expect.objectContaining({ tag: 'VLESS', protocol: 'vless' })
        ]));
    });

    it('keeps target-specific short links separate when they share a code', async () => {
        const app = createTestApp();
        const config = 'vless://11111111-1111-1111-1111-111111111111@node.example:443?security=tls&sni=node.example#VLESS';
        const xrayUrl = `http://localhost/xray?config=${encodeURIComponent(config)}`;
        const jsonUrl = `http://localhost/xray?format=json&config=${encodeURIComponent(config)}`;

        await app.request(`http://localhost/shorten-v2?target=x&shortCode=shared&url=${encodeURIComponent(xrayUrl)}`);
        await app.request(`http://localhost/shorten-v2?target=xj&shortCode=shared&url=${encodeURIComponent(jsonUrl)}`);

        const base64Link = await app.request(`http://localhost/resolve?url=${encodeURIComponent('http://localhost/x/shared')}`);
        const jsonLink = await app.request(`http://localhost/resolve?url=${encodeURIComponent('http://localhost/xj/shared')}`);
        const base64Original = await base64Link.json();
        const jsonOriginal = await jsonLink.json();

        expect(base64Original.originalUrl).not.toContain('format=json');
        expect(jsonOriginal.originalUrl).toContain('format=json');
    });

    it('serves a generated short link using its target-specific KV key', async () => {
        const app = createTestApp();
        const config = 'vless://11111111-1111-1111-1111-111111111111@node.example:443?security=tls&sni=node.example#VLESS';
        const fullUrl = `http://localhost/xray?config=${encodeURIComponent(config)}`;

        const created = await app.request(`http://localhost/shorten-v2?target=x&shortCode=redirected&url=${encodeURIComponent(fullUrl)}`);
        expect(created.status).toBe(200);

        const subscription = await app.request('http://localhost/x/redirected');
        expect(subscription.status).toBe(200);
        expect(subscription.headers.get('location')).toBeNull();
        expect(await subscription.text()).toBeTruthy();
    });

    it('lists and deletes short links when the management token is valid', async () => {
        const app = createTestApp({ config: { shortLinkAdminToken: 'test-token' } });
        const targetUrl = 'http://localhost/xray?config=ss%3A%2F%2Fexample';
        const created = await app.request(`http://localhost/shorten-v2?target=x&shortCode=managed&ttl=86400&url=${encodeURIComponent(targetUrl)}`);
        expect(created.status).toBe(200);

        const headers = { Authorization: 'Bearer test-token' };
        const listed = await app.request('http://localhost/short-links', { headers });
        expect(listed.status).toBe(200);
        const listData = await listed.json();
        expect(listData.links).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: 'managed', target: 'x', expiresAt: expect.any(String) })
        ]));

        const deleted = await app.request('http://localhost/short-links/managed?target=x', { method: 'DELETE', headers });
        expect(deleted.status).toBe(200);
        const afterDelete = await app.request('http://localhost/short-links', { headers });
        expect((await afterDelete.json()).links).toEqual([]);
    });
});
