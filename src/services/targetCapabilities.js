const TARGETS = {
    xray: {
        label: '通用 Base64',
        mode: 'passthrough',
        protocols: null,
        transports: null
    },
    singbox: {
        label: 'Sing-box',
        mode: 'converted',
        protocols: new Set(['shadowsocks', 'vmess', 'vless', 'trojan', 'hysteria2', 'tuic', 'anytls', 'wireguard', 'socks', 'http']),
        transports: new Set(['tcp', 'ws', 'grpc', 'http', 'h2', 'httpupgrade'])
    },
    clash: {
        label: 'Clash / Mihomo',
        mode: 'converted',
        protocols: new Set(['shadowsocks', 'shadowsocksr', 'vmess', 'vless', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'anytls', 'wireguard', 'socks', 'http', 'naive']),
        transports: new Set(['tcp', 'ws', 'grpc', 'http', 'h2', 'httpupgrade', 'xhttp'])
    },
    surge: {
        label: 'Surge',
        mode: 'converted',
        protocols: new Set(['shadowsocks', 'vmess', 'vless', 'trojan', 'hysteria2', 'tuic', 'socks', 'http']),
        transports: new Set(['tcp', 'ws', 'grpc'])
    },
    xrayJson: {
        label: 'Xray JSON',
        mode: 'converted',
        protocols: new Set(['shadowsocks', 'vmess', 'vless', 'trojan', 'socks', 'http']),
        transports: new Set(['tcp', 'ws', 'grpc', 'http', 'h2', 'httpupgrade', 'xhttp'])
    }
};

const REQUIRED_FIELD_GROUPS = {
    shadowsocks: [['method'], ['password']],
    shadowsocksr: [['method'], ['password']],
    vmess: [['uuid']],
    vless: [['uuid']],
    trojan: [['password']],
    hysteria2: [['password', 'auth']],
    tuic: [['uuid'], ['password']],
    anytls: [['password']],
    wireguard: [['private_key'], ['peer_public_key']]
};

function issue(code, reason, fields = []) {
    return { code, reason, fields };
}

function hasValue(value) {
    return value !== undefined && value !== null && value !== '';
}

function supportsFlow(targetKey, protocol) {
    if (protocol === 'vless') return true;
    return protocol === 'trojan' && (targetKey === 'singbox' || targetKey === 'clash');
}

function supportsFingerprint(targetKey, protocol) {
    if (targetKey === 'singbox' || targetKey === 'xrayJson') return true;
    if (targetKey === 'clash') return new Set(['vmess', 'vless', 'trojan', 'anytls']).has(protocol);
    return targetKey === 'surge' && protocol === 'vless';
}

export function getTargetDefinitions() {
    return Object.entries(TARGETS).map(([key, definition]) => ({
        key,
        label: definition.label,
        mode: definition.mode,
        protocols: definition.protocols
    }));
}

export function applyProxyOverrides(proxy, { allowInsecure = false } = {}) {
    if (!allowInsecure || !proxy?.tls?.enabled) return proxy;
    return { ...proxy, tls: { ...proxy.tls, insecure: true } };
}

export function assessProxyForTarget(targetKey, proxy) {
    const target = TARGETS[targetKey];
    const errors = [];
    const warnings = [];
    if (!target || !proxy) {
        return { errors: [issue('invalid_target_or_proxy', '无法识别目标客户端或节点')], warnings };
    }
    if (target.mode === 'passthrough') return { errors, warnings };

    const protocol = proxy.type || 'unknown';
    if (!target.protocols.has(protocol)) {
        errors.push(issue('unsupported_protocol', `${target.label} 不支持 ${protocol} 协议`, ['type']));
        return { errors, warnings };
    }

    if (!hasValue(proxy.server)) errors.push(issue('missing_server', '节点缺少服务器地址', ['server']));
    if (!Number.isInteger(Number(proxy.server_port)) || Number(proxy.server_port) <= 0) {
        errors.push(issue('missing_port', '节点缺少有效端口', ['server_port']));
    }
    for (const alternatives of REQUIRED_FIELD_GROUPS[protocol] || []) {
        if (!alternatives.some(field => hasValue(proxy[field]))) {
            errors.push(issue(
                'missing_credential',
                `节点缺少必要字段 ${alternatives.join(' 或 ')}`,
                alternatives
            ));
        }
    }

    const transportType = proxy.transport?.type || 'tcp';
    if (target.transports && !target.transports.has(transportType)) {
        errors.push(issue('unsupported_transport', `${target.label} 无法完整表达 ${transportType} 传输`, ['transport.type']));
    }

    if (proxy.tls?.ech?.enabled) {
        errors.push(issue('unsupported_ech', `${target.label} 暂不生成 ECH 配置，请使用原样订阅`, ['tls.ech']));
    }
    if (protocol === 'shadowsocks' && proxy.plugin && (targetKey === 'surge' || targetKey === 'xrayJson')) {
        errors.push(issue('unsupported_plugin', `${target.label} 无法保留 Shadowsocks 插件`, ['plugin', 'plugin_opts']));
    }
    if (protocol === 'hysteria2' && proxy.obfs?.type && targetKey === 'surge') {
        errors.push(issue('unsupported_obfs', `${target.label} 无法可靠表达 Hysteria2 混淆参数`, ['obfs']));
    }
    if (proxy.tls?.reality?.enabled) {
        if (protocol !== 'vless') {
            errors.push(issue('unsupported_reality_protocol', `${target.label} 仅对 VLESS 输出 Reality`, ['tls.reality']));
        }
        if (!hasValue(proxy.tls.reality.public_key)) {
            errors.push(issue('missing_reality_public_key', 'Reality 节点缺少公钥', ['tls.reality.public_key']));
        }
    }
    if (proxy.tls?.utls?.fingerprint && !supportsFingerprint(targetKey, protocol)) {
        errors.push(issue('unsupported_fingerprint', `${target.label} 无法为 ${protocol} 保留 TLS 指纹`, ['tls.utls.fingerprint']));
    }
    if (proxy.flow && !supportsFlow(targetKey, protocol)) {
        errors.push(issue('unsupported_flow', `${target.label} 无法为 ${protocol} 保留 flow`, ['flow']));
    }
    if (proxy.packet_encoding && targetKey !== 'clash') {
        warnings.push(issue('dropped_packet_encoding', `${target.label} 将忽略 packet-encoding`, ['packet_encoding']));
    }
    if ((proxy.tcp_fast_open || proxy.udp !== undefined) && (targetKey === 'surge' || targetKey === 'xrayJson')) {
        warnings.push(issue('dropped_performance_options', `${target.label} 将忽略部分性能或 UDP 选项`, ['tcp_fast_open', 'udp']));
    }
    if (targetKey === 'surge' && protocol === 'hysteria2') {
        const dropped = ['recv_window_conn', 'up', 'down', 'ports', 'hop_interval', 'fast_open']
            .filter(field => hasValue(proxy[field]));
        if (dropped.length > 0) {
            warnings.push(issue('dropped_hysteria2_options', `${target.label} 将忽略部分 Hysteria2 性能选项`, dropped));
        }
    }
    return { errors, warnings };
}

export function countProtocols(proxies) {
    return proxies.reduce((counts, proxy) => {
        const protocol = proxy?.type || 'unknown';
        counts[protocol] = (counts[protocol] || 0) + 1;
        return counts;
    }, {});
}
