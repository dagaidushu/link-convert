import { BaseConfigBuilder } from '../builders/BaseConfigBuilder.js';
import { applyProxyOverrides, assessProxyForTarget, countProtocols, getTargetDefinitions } from './targetCapabilities.js';

export async function inspectConversion(input, { lang = 'zh-CN', userAgent, allowInsecure = false } = {}) {
    const parser = new BaseConfigBuilder(input, {}, lang, userAgent);
    const proxies = await parser.parseCustomItems();
    const parseReport = parser.getConversionReport();
    const preparedProxies = proxies.map(proxy => applyProxyOverrides(proxy, { allowInsecure }));

    return {
        total: proxies.length,
        protocolCounts: countProtocols(proxies),
        parseIssues: parseReport.skipped,
        overrides: { allowInsecure: Boolean(allowInsecure) },
        targets: getTargetDefinitions().map(target => {
            const skipped = [];
            const warnings = [];
            const warningNodes = new Set();
            for (const [index, proxy] of preparedProxies.entries()) {
                const name = proxy.tag || proxy.server || '未命名节点';
                const type = proxy.type || 'unknown';
                const assessment = assessProxyForTarget(target.key, proxy);
                if (assessment.errors.length > 0) {
                    skipped.push({ name, type, ...assessment.errors[0] });
                } else {
                    assessment.warnings.forEach(warning => {
                        warningNodes.add(index);
                        warnings.push({ name, type, ...warning });
                    });
                }
            }
            const converted = proxies.length - skipped.length;
            return {
                key: target.key,
                label: target.label,
                mode: target.mode,
                converted,
                success: converted - warningNodes.size,
                warningCount: warningNodes.size,
                warnings,
                skipped
            };
        })
    };
}
