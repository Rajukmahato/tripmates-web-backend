import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import bodyparser from 'body-parser'
import { PORT } from "./configs";
import { connectDb } from "./database/mongodb";
import authRouters from "./routes/auth.route";
import userRouters from "./routes/user.route";
import cors from 'cors';

dotenv.config();
console.log(process.env.PORT);

const app: Application = express();

let corsOptions = {
    origin: ['http://localhost:3000', "http://localhost:3003"]
    //List of accepted domain
}
app.use(cors(corsOptions));
app.use(bodyparser.json())
app.use("/api/auth", authRouters);
app.use("/api/user", userRouters);
app.use("/uploads", express.static("uploads"));


app.get("/", (req: Request, res: Response) => {
    res.send("Hello, World!")
});

async function startServer() {
    await connectDb();

    app.listen(PORT, () => {
        console.log(`Sever: http://localhost:${PORT}`)
    })
}

startServer();
