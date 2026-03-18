import { Redis } from "ioredis"

const redis =  new Redis({
    host: 'localhost',
    port: 6379,
})

redis.on('connect', ()=>{
    console.log('redis connected')
})

redis.on('error',(error)=>{
    console.log('error', error)
})

export default redis