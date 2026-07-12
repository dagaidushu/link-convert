import { createTlsConfig, parseBool } from '../../utils.js';

export function isHttpProxyUri(value) {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' &&
            (Boolean(parsed.username || parsed.password) || parsed.searchParams.get('proxy') === 'true');
    } catch {
        return false;
    }
}

export function parseHttpProxy(url) {
    const parsed = new URL(url);
    const params = Object.fromEntries(parsed.searchParams.entries());
    if (params.tls === 'true' || params.security === 'tls') params.security = 'tls';

    return {
        type: 'http',
        tag: decodeURIComponent(parsed.hash.slice(1) || 'HTTP Proxy'),
        server: parsed.hostname,
        server_port: Number(parsed.port || (params.security === 'tls' ? 443 : 80)),
        username: decodeURIComponent(parsed.username || ''),
        password: decodeURIComponent(parsed.password || ''),
        tls: createTlsConfig(params),
        udp: parseBool(params.udp)
    };
}
