import { parseArray, parseBool, parseMaybeNumber, parseServerInfo, parseUrlParams } from '../../utils.js';

function parseReserved(raw) {
    if (!raw) return undefined;
    const values = raw.split(',').map(value => Number(value.trim()));
    return values.length === 3 && values.every(value => Number.isInteger(value) && value >= 0 && value <= 255)
        ? values
        : undefined;
}

export function parseWireGuard(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [privateKey, serverInfo] = addressPart.split('@');
    const { host, port } = parseServerInfo(serverInfo);
    const addresses = parseArray(params.address || params.addresses || params.ip);

    return {
        type: 'wireguard',
        tag: name || 'WireGuard',
        server: host,
        server_port: port,
        private_key: decodeURIComponent(privateKey || params.privatekey || params.private_key || ''),
        peer_public_key: params.publickey || params.public_key || params['peer-public-key'],
        pre_shared_key: params.presharedkey || params.pre_shared_key || params['pre-shared-key'],
        local_address: addresses,
        reserved: parseReserved(params.reserved),
        mtu: parseMaybeNumber(params.mtu),
        workers: parseMaybeNumber(params.workers),
        persistent_keepalive_interval: parseMaybeNumber(params.keepalive || params.persistent_keepalive_interval),
        ...(params.udp !== undefined ? { udp: parseBool(params.udp) } : {})
    };
}
