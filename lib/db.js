import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

let client;
let clientPromise;

if (!global._mongoClient) {
  client = new MongoClient(uri);
  global._mongoClient = client.connect();
}

clientPromise = global._mongoClient;

export default clientPromise;