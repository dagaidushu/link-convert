import { parseShadowsocks } from './protocols/shadowsocksParser.js';
import { parseVmess } from './protocols/vmessParser.js';
import { parseVless } from './protocols/vlessParser.js';
import { parseHysteria2 } from './protocols/hysteria2Parser.js';
import { parseTrojan } from './protocols/trojanParser.js';
import { parseTuic } from './protocols/tuicParser.js';
import { parseAnyTls } from './protocols/anytlsParser.js';
import { parseWireGuard } from './protocols/wireguardParser.js';
import { parseShadowsocksR } from './protocols/shadowsocksrParser.js';
import { parseSocks } from './protocols/socksParser.js';
import { parseHttpProxy } from './protocols/httpProxyParser.js';
import { parseNaive } from './protocols/naiveParser.js';
import { parseShadowTls } from './protocols/shadowtlsParser.js';
import { parseHysteria } from './protocols/hysteriaParser.js';
import { fetchSubscription } from './subscription/httpSubscriptionFetcher.js';

const protocolParsers = {
    ss: parseShadowsocks,
    vmess: parseVmess,
    vless: parseVless,
    hysteria: parseHysteria,
    hysteria2: parseHysteria2,
    hy2: parseHysteria2,
    ssr: parseShadowsocksR,
    anytls: parseAnyTls,
    wireguard: parseWireGuard,
    wg: parseWireGuard,
    http: parseHttpProxy,
    https: fetchSubscription,
    trojan: parseTrojan,
    tuic: parseTuic,
    socks: parseSocks,
    socks4: parseSocks,
    socks5: parseSocks,
    naive: parseNaive,
    'naive+https': parseNaive,
    shadowtls: parseShadowTls,
    'shadow-tls': parseShadowTls
};

export class ProxyParser {
    static async parse(url, userAgent) {
        if (!url || typeof url !== 'string') {
            return undefined;
        }
        const trimmed = url.trim();
        const type = trimmed.split('://')[0];
        const parser = protocolParsers[type];
        if (!parser) {
            return undefined;
        }
        return parser(trimmed, userAgent);
    }
}
