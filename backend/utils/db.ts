// backend/utils/db.ts

// This is a placeholder file for your database connection and utilities.
// Replace the following code with your actual database connection logic.

import {
    Db,
    MongoClient
} from 'mongodb'; // Example using MongoDB

// Replace with your actual database connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wakesync';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// In production mode, it's best to use a global variable so that the database
// connection is cached across module hot-reloads.
// Learn more: https://vercel.com/guides/nextjs-and-mongodb#connecting-to-your-database
if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the database connection
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    globalThis._mongoClientPromise = globalThis._mongoClientPromise || MongoClient.connect(MONGODB_URI);
    clientPromise = globalThis._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(MONGODB_URI);
    clientPromise = client.connect();
}

/**
 * Get the connected database instance.
 * @returns A promise that resolves with the database instance.
 */
export const getDb = async (): Promise<Db> => {
    const client = await clientPromise;
    // Replace 'wakesync' with your actual database name if different
    return client.db('wakesync');
};

// You can add more database utility functions here,
// like functions for finding, inserting, updating, or deleting documents.

// Example of a generic find function:
/*
export const find = async (collectionName: string, query: any): Promise<any[]> => {
  const db = await getDb();
  const collection = db.collection(collectionName);
  const result = await collection.find(query).toArray();
  return result;
};
*/

// Example of a generic findOne function:
/*
export const findOne = async (collectionName: string, query: any): Promise<any | null> => {
  const db = await getDb();
  const collection = db.collection(collectionName);
  const result = await collection.findOne(query);
  return result;
};
*/

// Example of a generic insertOne function:
/*
export const insertOne = async (collectionName: string, document: any): Promise<any> => {
  const db = await getDb();
  const collection = db.collection(collectionName);
  const result = await collection.insertOne(document);
  return result.ops[0]; // Return the inserted document
};
*/
