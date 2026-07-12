import { createTlsConfig, parseArray, parseBool, parseServerInfo, parseUrlParams } from '../../utils.js';

export function parseAnyTls(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [password, serverInfo] = addressPart.split('@');
    const { host, port } = parseServerInfo(serverInfo);

    if (!params.security) params.security = 'tls';
    const tls = createTlsConfig(params);
    if (params.fp || params.fingerprint) {
        tls.utls = { enabled: true, fingerprint: params.fp || params.fingerprint };
    }
    if (params.alpn) {
        tls.alpn = parseArray(params.alpn);
    }

    return {
        type: 'anytls',
        tag: name || 'AnyTLS',
        server: host,
        server_port: port,
        password: decodeURIComponent(password || ''),
        tls,
        idle_session_check_interval: params.idle_session_check_interval,
        idle_session_timeout: params.idle_session_timeout,
        min_idle_session: params.min_idle_session,
        ...(params.udp !== undefined ? { udp: parseBool(params.udp) } : {})
    };
}
