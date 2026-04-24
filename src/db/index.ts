import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export async function connectDB(){
    try {
        const client = await pool.connect();
        console.log("Database is connected successfully");
        client.release();
    } catch (error) {
        console.error("Database connection failed: ", error);
        throw error;
    }
}
