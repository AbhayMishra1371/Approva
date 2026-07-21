import { redis } from "./redis";

export async function getOrSetCache<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>
): Promise<T> {
    try {
        const cached = await redis.get<T>(key);
        if (cached) {
            console.log(`[Redis Cache Hit] Key: ${key}`);
            return cached;
        }
        console.log(`[Redis Cache Miss] Key: ${key}`);
    } catch (error) {
        console.warn(`[Redis Cache Read Error] Key: ${key}, falling back to fetcher`, error);
    }

    const data = await fetcher();

    try {
        await redis.set(key, data, {
            ex: ttl,
        });
    } catch (error) {
        console.warn(`[Redis Cache Write Error] Key: ${key}`, error);
    }

    return data;
}

export async function invalidateCache(key: string): Promise<void> {
    try {
        await redis.del(key);
        console.log(`[Redis Cache Invalidated] Key: ${key}`);
    } catch (error) {
        console.warn(`[Redis Cache Invalidate Error] Key: ${key}`, error);
    }
}