import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { specs } from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { initSocket } from "./sockets/socket.js";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/user", userRoutes);
const startServer = async () => {
    await initSocket(server);
    server.listen(PORT, () => {
        console.log(`server running on port ${PORT}`);
    });
};
startServer();
