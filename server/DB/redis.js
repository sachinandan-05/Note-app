import redis from "redis";
import dotenv from "dotenv";
dotenv.config();
const redisClient=redis.createClient({
    url:process.env.REDIS_URL,
    password:process.env.REDIS_TOKEN
});
redisClient.on("error",(err)=>console.log(err));
redisClient.on("connect",()=>console.log("Redis connected"));
export default redisClient;