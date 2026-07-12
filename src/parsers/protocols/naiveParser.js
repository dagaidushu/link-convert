import { createTlsConfig } from '../../utils.js';

export function parseNaive(url) {
    const normalized = url.replace(/^naive\+https:\/\//i, 'https://').replace(/^naive:\/\//i, 'https://');
    const parsed = new URL(normalized);
    const params = Object.fromEntries(parsed.searchParams.entries());
    params.security = 'tls';
    params.sni = params.sni || parsed.hostname;

    return {
        type: 'naive',
        tag: decodeURIComponent(parsed.hash.slice(1) || 'NaiveProxy'),
        server: parsed.hostname,
        server_port: Number(parsed.port || 443),
        username: decodeURIComponent(parsed.username || ''),
        password: decodeURIComponent(parsed.password || ''),
        tls: createTlsConfig(params)
    };
}
