import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { ProxyParser } from '../src/parsers/ProxyParser.js';
import { convertYamlProxyToObject } from '../src/parsers/convertYamlProxyToObject.js';
import { inspectConversion } from '../src/services/conversionInspector.js';

const UUID = '11111111-1111-1111-1111-111111111111';

function createTestApp() {
    return createApp({
        kv: new MemoryKVAdapter(),
        assetFetcher: null,
        logger: console,
        config: { configTtlSeconds: 60, shortLinkTtlSeconds: null }
    });
}

describe('Compatibility enhancement', () => {
    it.each([
        ['allowInsecure', '0', false],
        ['allowInsecure', '1', true],
        ['allow_insecure', 'false', false],
        ['allow_insecure', 'true', true],
        ['insecure', '0', false],
        ['skip-cert-verify', '1', true]
    ])('parses %s=%s as %s', async (key, value, expected) => {
        const node = `vless://${UUID}@node.example:443?security=tls&sni=node.example&${key}=${value}#Node`;
        const proxy = await ProxyParser.parse(node);
        expect(proxy.tls.insecure).toBe(expected);
    });

    it('keeps protocol defaults when the insecure parameter is absent', async () => {
        const trojan = await ProxyParser.parse('trojan://secret@node.example:443?sni=node.example#Trojan');
        const tuic = await ProxyParser.parse(`tuic://${UUID}:secret@node.example:443?sni=node.example#TUIC`);

        expect(trojan.tls.insecure).toBe(false);
        expect(tuic.tls.insecure).toBe(true);
    });

    it('parses quoted YAML booleans without treating false as truthy', () => {
        const disabled = convertYamlProxyToObject({
            name: 'Disabled', type: 'vless', server: 'node.example', port: 443,
            uuid: UUID, tls: 'true', 'skip-cert-verify': 'false', udp: '0'
        });
        const enabled = convertYamlProxyToObject({
            name: 'Enabled', type: 'vless', server: 'node.example', port: 443,
            uuid: UUID, tls: '1', 'skip-cert-verify': '1', udp: 'true'
        });

        expect(disabled).toMatchObject({ tls: { enabled: true, insecure: false }, udp: false });
        expect(enabled).toMatchObject({ tls: { enabled: true, insecure: true }, udp: true });
    });

    it('applies the insecure override to converted output but not raw Base64 output', async () => {
        const app = createTestApp();
        const node = `vless://${UUID}@node.example:443?security=tls&sni=node.example&allowInsecure=0#Node`;
        const rawUrl = `http://localhost/xray?config=${encodeURIComponent(node)}`;
        const rawOverrideUrl = `${rawUrl}&allow_insecure=true`;

        const raw = await (await app.request(rawUrl)).text();
        const rawOverride = await (await app.request(rawOverrideUrl)).text();
        expect(rawOverride).toBe(raw);

        const jsonResponse = await app.request(
            `http://localhost/xray?format=json&allow_insecure=1&config=${encodeURIComponent(node)}`
        );
        const config = await jsonResponse.json();
        const outbound = config.outbounds.find(item => item.tag === 'Node');
        expect(outbound.streamSettings.tlsSettings.allowInsecure).toBe(true);
    });

    it('preserves ECH in raw input and skips it only for converted targets', async () => {
        const node = `vless://${UUID}@node.example:443?security=tls&sni=node.example&ech=test-config#ECH`;
        const report = await inspectConversion(node);

        expect(report.targets.find(target => target.key === 'xray')).toMatchObject({ mode: 'passthrough', converted: 1 });
        for (const target of report.targets.filter(item => item.mode === 'converted')) {
            expect(target.skipped[0]).toMatchObject({ code: 'unsupported_ech', fields: ['tls.ech'] });
            expect(target.skipped[0].reason).toBeTruthy();
        }
    });

    it('reports target-specific transport support and detailed reasons', async () => {
        const input = [
            `vless://${UUID}@xhttp.example:443?security=tls&sni=xhttp.example&type=xhttp&path=%2Fx#XHTTP`,
            `vless://${UUID}@h2.example:443?security=tls&sni=h2.example&type=h2&host=h2.example&path=%2Fh2#H2`
        ].join('\n');
        const report = await inspectConversion(input, { allowInsecure: true });
        const singbox = report.targets.find(target => target.key === 'singbox');
        const clash = report.targets.find(target => target.key === 'clash');
        const xrayJson = report.targets.find(target => target.key === 'xrayJson');

        expect(report).toMatchObject({
            total: 2,
            protocolCounts: { vless: 2 },
            overrides: { allowInsecure: true }
        });
        expect(singbox.skipped[0]).toMatchObject({ code: 'unsupported_transport', fields: ['transport.type'] });
        expect(clash.converted).toBe(2);
        expect(xrayJson.converted).toBe(2);
    });

    it.each([
        ['httpupgrade', 'httpupgrade-opts'],
        ['xhttp', 'xhttp-opts']
    ])('retains %s transport from Clash YAML', (network, optionsKey) => {
        const proxy = convertYamlProxyToObject({
            name: network,
            type: 'vless',
            server: 'node.example',
            port: 443,
            uuid: UUID,
            tls: true,
            network,
            [optionsKey]: { path: '/transport', host: 'node.example', mode: 'auto' }
        });

        expect(proxy.transport).toMatchObject({ type: network, path: '/transport', host: 'node.example' });
    });

    it('skips nodes with missing critical fields without stopping valid nodes', async () => {
        const input = [
            `vless://${UUID}@broken.example:443?security=reality&sni=broken.example#Broken`,
            'vmess://not-valid-base64',
            `vless://${UUID}@good.example:443?security=tls&sni=good.example&type=ws&path=%2Fws#Good`
        ].join('\n');
        const report = await inspectConversion(input);
        const clash = report.targets.find(target => target.key === 'clash');

        expect(report.total).toBe(2);
        expect(report.parseIssues).toHaveLength(1);
        expect(report.parseIssues[0]).toMatchObject({ code: 'invalid_node', fields: [] });
        expect(clash.converted).toBe(1);
        expect(clash.skipped[0]).toMatchObject({
            name: 'Broken',
            code: 'missing_reality_public_key',
            fields: ['tls.reality.public_key']
        });
    });

    it('keeps AnyTLS session fields and Hysteria2 auth through Clash conversion', async () => {
        const app = createTestApp();
        const source = yaml.dump({
            proxies: [
                {
                    name: 'AnyTLS', type: 'anytls', server: 'any.example', port: 443,
                    password: 'secret', sni: 'any.example',
                    'idle-session-check-interval': 30,
                    'idle-session-timeout': 120,
                    'min-idle-session': 5
                },
                {
                    name: 'HY2', type: 'hysteria2', server: 'hy.example', port: 443,
                    auth: 'secret', sni: 'hy.example'
                }
            ]
        });
        const response = await app.request(`http://localhost/clash?config=${encodeURIComponent(source)}`);
        const config = yaml.load(await response.text());

        expect(config.proxies.find(item => item.name === 'AnyTLS')).toMatchObject({
            'idle-session-check-interval': 30,
            'idle-session-timeout': 120,
            'min-idle-session': 5
        });
        expect(config.proxies.find(item => item.name === 'HY2')).toMatchObject({ auth: 'secret' });
    });

    it('inspects a large subscription without changing compatibility counts', async () => {
        const nodes = Array.from({ length: 300 }, (_, index) =>
            `vless://${UUID}@node${index}.example:443?security=tls&sni=node${index}.example#Node-${index}`
        );
        const report = await inspectConversion(nodes.join('\n'));

        expect(report.total).toBe(300);
        expect(report.protocolCounts).toEqual({ vless: 300 });
        expect(report.targets.find(target => target.key === 'clash')).toMatchObject({ converted: 300, skipped: [] });
    });
});
