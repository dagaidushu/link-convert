import { parseBool } from '../../utils.js';

export function parseSocks(url) {
    const parsed = new URL(url);
    const version = parsed.protocol.toLowerCase() === 'socks4:' ? '4' : '5';

    return {
        type: 'socks',
        tag: decodeURIComponent(parsed.hash.slice(1) || 'SOCKS'),
        server: parsed.hostname,
        server_port: Number(parsed.port || 1080),
        version,
        username: decodeURIComponent(parsed.username || ''),
        password: decodeURIComponent(parsed.password || ''),
        udp: parseBool(parsed.searchParams.get('udp'))
    };
}
