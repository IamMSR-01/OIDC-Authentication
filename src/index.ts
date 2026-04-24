import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { connectDB } from './db/index';
import authRoutes from "./auth/router"


const app = express();
const PORT = process.env.PORT || 8082;


app.use(express.json());
app.use(express.static(path.resolve("public")));

app.get("/", (req, res) => res.json({ message: "Hello from Auth Server" }));

app.get("/health", (req, res) =>
    res.json({ message: "Server is healthy", healthy: true }),
);

// mount all the routes
app.use("/", authRoutes)

async function startServer(){
    try {
        // validate env
        if(!process.env.DATABASE_URL){
            throw new Error("Database url is missing in the env file");
        }

        // connect Database
        await connectDB;

        // start server
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        })
    } catch (error) {
        console.log("Failed to start server", error);
        process.exit(1);
    }
}

// Global error handlers
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception: ", err);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.log("unhandled Rejection: ", err);
    process.exit(1);
});

// start the server
startServer();