import { decodeBase64 } from '../../utils.js';

function decodeUrlSafeBase64(value = '') {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    return decodeBase64(padded);
}

export function parseShadowsocksR(url) {
    try {
        const payload = url.replace(/^ssr:\/\//i, '').split('#')[0];
        const decoded = decodeUrlSafeBase64(payload);
        const [serverPart, query = ''] = decoded.split('/?');
        const [server, port, protocol, method, obfs, passwordEncoded] = serverPart.split(':');
        if (!server || !port || !protocol || !method || !obfs || !passwordEncoded) return null;

        const params = new URLSearchParams(query);
        const decodeParam = (key) => {
            const value = params.get(key);
            return value ? decodeUrlSafeBase64(value) : undefined;
        };

        return {
            type: 'shadowsocksr',
            tag: decodeParam('remarks') || server,
            server,
            server_port: Number(port),
            method,
            password: decodeUrlSafeBase64(passwordEncoded),
            protocol,
            protocol_param: decodeParam('protoparam'),
            obfs,
            obfs_param: decodeParam('obfsparam'),
            udp: true
        };
    } catch {
        return null;
    }
}
