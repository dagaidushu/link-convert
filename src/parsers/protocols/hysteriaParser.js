import { createTlsConfig, parseArray, parseBool, parseMaybeNumber, parseServerInfo, parseUrlParams } from '../../utils.js';

export function parseHysteria(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [auth, serverInfo] = addressPart.includes('@') ? addressPart.split('@') : ['', addressPart];
    const { host, port } = parseServerInfo(serverInfo);
    params.security = 'tls';

    return {
        type: 'hysteria',
        tag: name || 'Hysteria',
        server: host,
        server_port: port,
        auth: decodeURIComponent(auth || params.auth || ''),
        protocol: params.protocol || 'udp',
        up: parseMaybeNumber(params.up || params.upmbps),
        down: parseMaybeNumber(params.down || params.downmbps),
        obfs: params.obfs,
        obfs_param: params['obfs-password'] || params.obfsParam,
        tls: createTlsConfig(params),
        alpn: parseArray(params.alpn),
        fast_open: parseBool(params['fast-open'])
    };
}
