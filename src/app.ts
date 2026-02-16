import express, { Application, Request, Response } from 'express';
import bodyparser from 'body-parser'
import authRouters from "./routes/auth.route";
import userRouters from "./routes/user.route";
import adminRouters from "./routes/admin.route";
import cors from 'cors';

const app: Application = express();

let corsOptions = {
    origin: ['http://localhost:3000', "http://localhost:3003"]
}
app.use(cors(corsOptions));
app.use(bodyparser.json())
app.use("/api/auth", authRouters);
app.use("/api/user", userRouters);
app.use("/api/admin", adminRouters);
app.use("/uploads", express.static("uploads"));

app.get("/", (req: Request, res: Response) => {
    res.send("Hello, World!")
});

export default app;
