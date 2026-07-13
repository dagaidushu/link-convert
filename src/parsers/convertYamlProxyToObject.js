import { parseBool } from '../utils.js';

function addTlsMetadata(tls, proxy) {
    if (!tls?.enabled) return tls;
    if (proxy['client-fingerprint']) {
        tls.utls = { enabled: true, fingerprint: proxy['client-fingerprint'] };
    }
    const ech = proxy['ech-opts'] ?? proxy.ech;
    if (ech) {
        tls.ech = { enabled: true, config: ech?.config ?? ech };
    }
    return tls;
}

function parseClashTransport(proxy) {
    const net = String(proxy.network || proxy['network-type'] || 'tcp').toLowerCase();
    if (net === 'ws') {
        const options = proxy['ws-opts'] || {};
        return { type: 'ws', path: options.path, headers: options.headers };
    }
    if (net === 'grpc') {
        const options = proxy['grpc-opts'] || {};
        return { type: 'grpc', service_name: options['grpc-service-name'] };
    }
    if (net === 'http') {
        const options = proxy['http-opts'] || {};
        return { type: 'http', method: options.method || 'GET', path: options.path, headers: options.headers };
    }
    if (net === 'h2') {
        const options = proxy['h2-opts'] || {};
        return { type: 'h2', path: options.path, host: options.host };
    }
    if (net === 'httpupgrade' || net === 'http-upgrade') {
        const options = proxy['httpupgrade-opts'] || proxy['http-upgrade-opts'] || {};
        return { type: 'httpupgrade', path: options.path, host: options.host, headers: options.headers };
    }
    if (net === 'xhttp' || net === 'splithttp') {
        const options = proxy['xhttp-opts'] || {};
        return { type: 'xhttp', path: options.path, host: options.host, mode: options.mode, headers: options.headers };
    }
    return undefined;
}

export function convertYamlProxyToObject(p) {
    if (!p || typeof p !== 'object' || !p.type) return null;
    const type = String(p.type).toLowerCase();
    const name = p.name || p.tag || 'proxy';
    const toArray = (value) => {
        if (value === undefined || value === null) return undefined;
        return Array.isArray(value) ? value : [value];
    };
    switch (type) {
        case 'ss':
        case 'shadowsocks':
            return {
                tag: name,
                type: 'shadowsocks',
                server: p.server,
                server_port: parseInt(p.port),
                method: p.cipher || p.method,
                password: p.password,
                network: 'tcp',
                tcp_fast_open: parseBool(p['fast-open'], false),
                udp: typeof p.udp !== 'undefined' ? parseBool(p.udp) : undefined,
                plugin: p.plugin,
                plugin_opts: p['plugin-opts']
            };
        case 'vmess': {
            const tlsEnabled = parseBool(p.tls, Boolean(p['ech-opts']));
            const tls = addTlsMetadata(tlsEnabled
                ? {
                    enabled: true,
                    server_name: p.servername || p.sni,
                    insecure: parseBool(p['skip-cert-verify'], false),
                    alpn: toArray(p.alpn)
                }
                : { enabled: false }, p);
            const transport = parseClashTransport(p);
            return {
                tag: name,
                type: 'vmess',
                server: p.server,
                server_port: parseInt(p.port),
                uuid: p.uuid,
                alter_id: typeof p.alterId !== 'undefined' ? parseInt(p.alterId) : 0,
                security: p.cipher || p.security || 'auto',
                network: transport?.type || p.network || 'tcp',
                tcp_fast_open: parseBool(p['fast-open'], false),
                transport,
                tls,
                udp: typeof p.udp !== 'undefined' ? parseBool(p.udp) : undefined,
                packet_encoding: p['packet-encoding'],
                alpn: toArray(p.alpn)
            };
        }
        case 'vless': {
            const tlsEnabled = parseBool(p.tls, Boolean(p['reality-opts'] || p['ech-opts']));
            const reality = p['reality-opts'];
            const tls = addTlsMetadata(tlsEnabled
                ? {
                    enabled: true,
                    server_name: p.servername || p.sni,
                    insecure: parseBool(p['skip-cert-verify'], false),
                    alpn: toArray(p.alpn),
                    ...(reality
                        ? { reality: { enabled: true, public_key: reality['public-key'], short_id: reality['short-id'] } }
                        : {})
                }
                : { enabled: false }, p);
            const transport = parseClashTransport(p);
            return {
                tag: name,
                type: 'vless',
                server: p.server,
                server_port: parseInt(p.port),
                uuid: p.uuid,
                tcp_fast_open: parseBool(p['fast-open'], false),
                tls,
                transport,
                network: transport?.type || 'tcp',
                flow: p.flow ?? undefined,
                udp: typeof p.udp !== 'undefined' ? parseBool(p.udp) : undefined,
                packet_encoding: p['packet-encoding'],
                alpn: toArray(p.alpn)
            };
        }
        case 'trojan': {
            const tlsEnabled = parseBool(p.tls, Boolean(p['reality-opts'] || p['ech-opts']));
            const reality = p['reality-opts'];
            const tls = addTlsMetadata(tlsEnabled
                ? {
                    enabled: true,
                    server_name: p.servername || p.sni,
                    insecure: parseBool(p['skip-cert-verify'], false),
                    alpn: toArray(p.alpn),
                    ...(reality
                        ? { reality: { enabled: true, public_key: reality['public-key'], short_id: reality['short-id'] } }
                        : {})
                }
                : { enabled: false }, p);
            const transport = parseClashTransport(p);
            return {
                type: 'trojan',
                tag: name,
                server: p.server,
                server_port: parseInt(p.port),
                password: p.password,
                network: transport?.type || p.network || 'tcp',
                tcp_fast_open: parseBool(p['fast-open'], false),
                tls,
                transport,
                flow: p.flow ?? undefined,
                alpn: toArray(p.alpn)
            };
        }
        case 'hysteria2':
        case 'hysteria':
        case 'hy2': {
            const tls = {
                enabled: true,
                server_name: p.sni,
                insecure: parseBool(p['skip-cert-verify'], false),
                alpn: toArray(p.alpn)
            };
            const obfs = {};
            if (p.obfs) {
                obfs.type = p.obfs;
                obfs.password = p['obfs-password'];
            }
            const hopIntervalRaw = p['hop-interval'];
            const hopInterval = Number(hopIntervalRaw);
            return {
                tag: name,
                type: 'hysteria2',
                server: p.server,
                server_port: parseInt(p.port),
                password: p.password ?? p.auth,
                tls,
                obfs: Object.keys(obfs).length > 0 ? obfs : undefined,
                auth: p.auth,
                recv_window_conn: p['recv-window-conn'],
                up: p.up,
                down: p.down,
                ports: p.ports,
                hop_interval: Number.isNaN(hopInterval) ? hopIntervalRaw : hopInterval,
                alpn: toArray(p.alpn),
                fast_open: typeof p['fast-open'] !== 'undefined' ? parseBool(p['fast-open']) : undefined
            };
        }
        case 'tuic': {
            return {
                tag: name,
                type: 'tuic',
                server: p.server,
                server_port: parseInt(p.port),
                uuid: p.uuid,
                password: p.password,
                congestion_control: p['congestion-controller'] || p.congestion_control,
                tls: {
                    enabled: true,
                    server_name: p.sni,
                    alpn: toArray(p.alpn),
                    insecure: parseBool(p['skip-cert-verify'], false)
                },
                flow: p.flow ?? undefined,
                udp_relay_mode: p['udp-relay-mode'],
                zero_rtt: typeof p['zero-rtt'] !== 'undefined' ? parseBool(p['zero-rtt']) : undefined,
                reduce_rtt: typeof p['reduce-rtt'] !== 'undefined' ? parseBool(p['reduce-rtt']) : undefined,
                fast_open: typeof p['fast-open'] !== 'undefined' ? parseBool(p['fast-open']) : undefined,
                disable_sni: typeof p['disable-sni'] !== 'undefined' ? parseBool(p['disable-sni']) : undefined
            };
        }
        case 'anytls': {
            const tls = {
                enabled: true,
                server_name: p.sni,
                insecure: parseBool(p['skip-cert-verify'], false),
                alpn: toArray(p.alpn)
            };
            if (p['client-fingerprint']) {
                tls.utls = {
                    enabled: true,
                    fingerprint: p['client-fingerprint']
                };
            }
            return {
                tag: name,
                type: 'anytls',
                server: p.server,
                server_port: parseInt(p.port),
                password: p.password,
                udp: typeof p.udp !== 'undefined' ? parseBool(p.udp) : undefined,
                idle_session_check_interval: p['idle-session-check-interval'],
                idle_session_timeout: p['idle-session-timeout'],
                min_idle_session: p['min-idle-session'],
                // Keep legacy aliases for callers that consume parser output directly.
                'idle-session-check-interval': p['idle-session-check-interval'],
                'idle-session-timeout': p['idle-session-timeout'],
                'min-idle-session': p['min-idle-session'],
                tls
            };
        }
        case 'ssr':
        case 'shadowsocksr':
            return {
                tag: name,
                type: 'shadowsocksr',
                server: p.server,
                server_port: parseInt(p.port),
                method: p.cipher,
                password: p.password,
                protocol: p.protocol,
                protocol_param: p['protocol-param'] || p.protocol_param,
                obfs: p.obfs,
                obfs_param: p['obfs-param'] || p.obfs_param,
                udp: typeof p.udp !== 'undefined' ? parseBool(p.udp) : undefined
            };
        case 'wireguard':
            return {
                tag: name,
                type: 'wireguard',
                server: p.server,
                server_port: parseInt(p.port),
                private_key: p['private-key'] || p.private_key,
                peer_public_key: p['public-key'] || p.peer_public_key,
                pre_shared_key: p['pre-shared-key'] || p.pre_shared_key,
                local_address: toArray(p.ip || p.address || p.local_address),
                reserved: p.reserved,
                mtu: p.mtu,
                persistent_keepalive_interval: p['persistent-keepalive'] || p.persistent_keepalive_interval,
                udp: typeof p.udp !== 'undefined' ? parseBool(p.udp) : undefined
            };
        default:
            return null;
    }
}
