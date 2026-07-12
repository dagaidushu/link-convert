import { BaseConfigBuilder } from './BaseConfigBuilder.js';

function buildStreamSettings(proxy) {
    const transport = proxy.transport;
    const tls = proxy.tls;
    if (!transport && !tls?.enabled) return undefined;

    const stream = { network: transport?.type || 'tcp' };
    if (tls?.reality?.enabled) {
        stream.security = 'reality';
        stream.realitySettings = {
            serverName: tls.server_name,
            fingerprint: tls.utls?.fingerprint || 'chrome',
            publicKey: tls.reality.public_key,
            shortId: tls.reality.short_id
        };
    } else if (tls?.enabled) {
        stream.security = 'tls';
        stream.tlsSettings = {
            serverName: tls.server_name,
            allowInsecure: !!tls.insecure,
            alpn: tls.alpn
        };
    } else {
        stream.security = 'none';
    }

    if (transport?.type === 'ws') {
        stream.wsSettings = { path: transport.path || '/', headers: transport.headers };
    } else if (transport?.type === 'grpc') {
        stream.grpcSettings = { serviceName: transport.service_name };
    } else if (transport?.type === 'http') {
        stream.httpSettings = { path: Array.isArray(transport.path) ? transport.path : [transport.path || '/'], host: transport.host ? [transport.host] : undefined };
    } else if (transport?.type === 'httpupgrade') {
        stream.httpupgradeSettings = { path: transport.path || '/', host: transport.host || transport.headers?.host };
    } else if (transport?.type === 'xhttp') {
        stream.xhttpSettings = { path: transport.path || '/', host: transport.host || transport.headers?.host, mode: transport.mode };
    }
    return stream;
}

export class XrayConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, lang, userAgent) {
        super(inputString, { outbounds: [] }, lang, userAgent);
        this.config = {
            log: { loglevel: 'warning' },
            inbounds: [{ tag: 'socks-in', listen: '127.0.0.1', port: 10808, protocol: 'socks', settings: { auth: 'noauth', udp: true } }],
            outbounds: [],
            routing: { domainStrategy: 'AsIs', rules: [] }
        };
    }

    isProxySupported(proxy) {
        return new Set(['shadowsocks', 'vmess', 'vless', 'trojan']).has(proxy?.type);
    }

    getProxies() { return this.config.outbounds; }
    getProxyName(proxy) { return proxy.tag; }
    addProxyToConfig(proxy) { this.config.outbounds.push(proxy); }

    convertProxy(proxy) {
        if (proxy.type === 'shadowsocks') {
            return {
                tag: proxy.tag,
                protocol: 'shadowsocks',
                settings: { servers: [{ address: proxy.server, port: proxy.server_port, method: proxy.method, password: proxy.password }] }
            };
        }
        if (proxy.type === 'vmess' || proxy.type === 'vless') {
            const user = proxy.type === 'vmess'
                ? { id: proxy.uuid, alterId: proxy.alter_id ?? 0, security: proxy.security || 'auto' }
                : { id: proxy.uuid, encryption: 'none', flow: proxy.flow };
            return {
                tag: proxy.tag,
                protocol: proxy.type,
                settings: { vnext: [{ address: proxy.server, port: proxy.server_port, users: [user] }] },
                streamSettings: buildStreamSettings(proxy)
            };
        }
        if (proxy.type === 'trojan') {
            return {
                tag: proxy.tag,
                protocol: 'trojan',
                settings: { servers: [{ address: proxy.server, port: proxy.server_port, password: proxy.password }] },
                streamSettings: buildStreamSettings(proxy)
            };
        }
        return null;
    }

    async build() {
        const items = await this.parseCustomItems();
        this.addCustomItems(items);
        this.config.outbounds.push({ tag: 'direct', protocol: 'freedom' }, { tag: 'block', protocol: 'blackhole' });
        return { config: this.config, report: this.getConversionReport() };
    }
}
