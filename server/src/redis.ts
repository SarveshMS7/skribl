import 'dotenv/config';
import { Redis } from "ioredis"

const redisUrl = process.env.REDIS_URL;

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