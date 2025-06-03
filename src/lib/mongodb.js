import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "sales-proposal";

if(!MONGODB_URI){
    throw new Error("Can't connect to MONGODB client: No connection URI");
}

let cachedClient = null;
let cachedDB = null;

export async function connectToDatabase() {
    if(cachedClient && cachedDB){
        try{
            await cachedClient.db(MONGODB_DB_NAME).command({ping: 1});
            return { client: cachedClient, db: cachedDB};
        }catch(e){
            console.warn("Cached MongoDB client disconnected, Reconnecting...");
            cachedClient = null;
            cachedDB = null;
        }
    }

    const client = new MongoClient(MONGODB_URI);

    await client.connect();
    const db = client.db(MONGODB_DB_NAME);

    cachedClient = client;
    cachedDB = db;
    return {client,db};
}