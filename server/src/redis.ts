import 'dotenv/config';
import { Redis } from "ioredis"

function parseRedisUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  let url = rawUrl.trim();
  // Strip wrapping quotes if present
  url = url.replace(/^["']|["']$/g, '').trim();
  // Handle accidental copy of redis-cli syntax (e.g. "--tls -u redis://..." or "redis-cli --tls -u ...")
  if (url.includes('-u ')) {
    const isTls = url.includes('--tls');
    const match = url.match(/-u\s+(redis[s]?:\/\/\S+)/);
    if (match) {
      url = match[1];
    } else {
      url = url.substring(url.indexOf('-u ') + 3).trim();
    }
    if (isTls && url.startsWith('redis://')) {
      url = url.replace('redis://', 'rediss://');
    }
  }
  return url;
}

const redisUrl = parseRedisUrl(process.env.REDIS_URL);

const redis = redisUrl
  ? new Redis(redisUrl, {
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: null,
    })
  : new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

redis.on('connect', ()=>{
    console.log('redis connected')
})

redis.on('error',(error)=>{
    console.log('redis error', error)
})

export default redis