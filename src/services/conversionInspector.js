import { BaseConfigBuilder } from '../builders/BaseConfigBuilder.js';

const TARGETS = [
    { key: 'xray', label: '通用 Base64', protocols: null },
    { key: 'singbox', label: 'Sing-box', protocols: new Set(['shadowsocks', 'vmess', 'vless', 'trojan', 'hysteria2', 'tuic', 'anytls', 'wireguard', 'socks', 'http']) },
    { key: 'clash', label: 'Clash / Mihomo', protocols: new Set(['shadowsocks', 'shadowsocksr', 'vmess', 'vless', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'anytls', 'wireguard', 'socks', 'http', 'naive']) },
    { key: 'surge', label: 'Surge', protocols: new Set(['shadowsocks', 'vmess', 'vless', 'trojan', 'hysteria2', 'tuic', 'socks', 'http']) },
    { key: 'xrayJson', label: 'Xray JSON', protocols: new Set(['shadowsocks', 'vmess', 'vless', 'trojan', 'socks', 'http']) }
];

export async function inspectConversion(input, { lang = 'zh-CN', userAgent } = {}) {
    const parser = new BaseConfigBuilder(input, {}, lang, userAgent);
    const proxies = await parser.parseCustomItems();
    const parseReport = parser.getConversionReport();

    return {
        total: proxies.length,
        parseIssues: parseReport.skipped,
        targets: TARGETS.map(target => {
            const skipped = proxies
                .filter(proxy => target.protocols && !target.protocols.has(proxy?.type))
                .map(proxy => ({
                    name: proxy.tag || proxy.server || '未命名节点',
                    type: proxy.type || 'unknown',
                    reason: `${target.label} 不支持 ${proxy.type || 'unknown'}`
                }));
            return {
                key: target.key,
                label: target.label,
                converted: proxies.length - skipped.length,
                skipped
            };
        })
    };
}
