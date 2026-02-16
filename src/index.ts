import dotenv from 'dotenv';
import { PORT } from "./configs";
import { connectDb } from "./database/mongodb";
import app from './app';

dotenv.config();

async function startServer() {
    await connectDb();

    app.listen(PORT, () => {
        console.log(`Server: http://localhost:${PORT}`)
    })
}

startServer();
