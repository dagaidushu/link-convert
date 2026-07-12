import { generateWebPath } from '../utils.js';
import { InvalidPayloadError, MissingDependencyError } from './errors.js';

const TARGETS = ['s', 'b', 'c', 'x', 'xj'];
const INDEX_KEY = 'shortlink:index';
const META_PREFIX = 'shortlink:meta:';
const MAX_INDEX_ENTRIES = 200;

function normalizeCode(code) {
    if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{3,64}$/.test(code)) {
        throw new InvalidPayloadError('Short link code must contain 3-64 letters, numbers, underscores, or hyphens');
    }
    return code;
}

function normalizeTtl(value) {
    if (value === undefined || value === null || value === '') return null;
    const seconds = Math.floor(Number(value));
    if (!Number.isFinite(seconds) || seconds < 60 || seconds > 60 * 60 * 24 * 365) {
        throw new InvalidPayloadError('Short link expiry must be between 1 minute and 365 days');
    }
    return seconds;
}

export class ShortLinkService {
    constructor(kv, options = {}) {
        this.kv = kv;
        this.options = options;
    }

    ensureKv() {
        if (!this.kv) {
            throw new MissingDependencyError('Short link service requires a KV store');
        }
        return this.kv;
    }

    async createShortLink(queryString, providedCode, target = '', ttlOverride) {
        const kv = this.ensureKv();
        if (target && !TARGETS.includes(target)) {
            throw new InvalidPayloadError('Invalid short link target');
        }
        const shortCode = providedCode ? normalizeCode(providedCode) : generateWebPath();
        const ttl = normalizeTtl(ttlOverride) ?? this.options.shortLinkTtlSeconds;
        const putOptions = ttl ? { expirationTtl: ttl } : undefined;
        await kv.put(target ? `${target}:${shortCode}` : shortCode, queryString, putOptions);
        await this.saveMetadata({ shortCode, target, ttl, putOptions });
        return shortCode;
    }

    async saveMetadata({ shortCode, target, ttl, putOptions }) {
        const kv = this.ensureKv();
        const createdAt = new Date().toISOString();
        const metadata = {
            code: shortCode,
            target,
            createdAt,
            expiresAt: ttl ? new Date(Date.now() + ttl * 1000).toISOString() : null
        };
        await kv.put(`${META_PREFIX}${target}:${shortCode}`, JSON.stringify(metadata), putOptions);

        const entries = await this.readIndex();
        const filtered = entries.filter(entry => !(entry.code === shortCode && entry.target === target));
        filtered.unshift(metadata);
        await kv.put(INDEX_KEY, JSON.stringify(filtered.slice(0, MAX_INDEX_ENTRIES)));
    }

    async readIndex() {
        const raw = await this.ensureKv().get(INDEX_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    async listShortLinks() {
        const entries = await this.readIndex();
        const now = Date.now();
        return entries.filter(entry => !entry.expiresAt || Date.parse(entry.expiresAt) > now);
    }

    async deleteShortLink(shortCode, target = '') {
        const kv = this.ensureKv();
        const code = normalizeCode(shortCode);
        const targets = target ? [target] : TARGETS;
        if (target && !TARGETS.includes(target)) {
            throw new InvalidPayloadError('Invalid short link target');
        }

        await Promise.all(targets.flatMap(item => [
            kv.delete(`${item}:${code}`),
            kv.delete(`${META_PREFIX}${item}:${code}`)
        ]));
        await kv.delete(code); // Legacy links used an unscoped key.

        const entries = await this.readIndex();
        const filtered = entries.filter(entry => !(entry.code === code && (!target || entry.target === target)));
        await kv.put(INDEX_KEY, JSON.stringify(filtered));
    }

    async resolveShortCode(code, target = '') {
        const kv = this.ensureKv();
        if (target) {
            const targetedValue = await kv.get(`${target}:${code}`);
            if (targetedValue) return targetedValue;
        }
        // Keep short links created before target-specific keys working.
        return kv.get(code);
    }
}
