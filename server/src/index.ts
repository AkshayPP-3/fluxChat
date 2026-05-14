import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js"
import userRoutes from "./routes/userRoutes.js";

import {specs} from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";

import http from "http";
import {initSocket} from "./sockets/socket.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000

const server = http.createServer(app);

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(specs));

app.use("/api/auth",authRoutes);
app.use("/api/conversations",conversationRoutes);
app.use("/api/messages",messageRoutes);
app.use("/api/user",userRoutes)

app.get("/test",(_,res)=>{
    res.send("Test message")
})

initSocket(server);

server.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`)
})