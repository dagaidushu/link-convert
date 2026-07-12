import { createTlsConfig, parseMaybeNumber, parseServerInfo, parseUrlParams } from '../../utils.js';

export function parseShadowTls(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [password, serverInfo] = addressPart.split('@');
    const { host, port } = parseServerInfo(serverInfo);
    params.security = 'tls';
    params.sni = params.sni || params.host;

    return {
        type: 'shadowtls',
        tag: name || 'ShadowTLS',
        server: host,
        server_port: port,
        password: decodeURIComponent(password || ''),
        version: parseMaybeNumber(params.version) || 3,
        tls: createTlsConfig(params)
    };
}
