import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes.js";

import {specs} from "./config/swagger.js"

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(specs));
app.use("/api/auth",authRoutes);


app.get("/test",(_,res)=>{
    res.send("Test message")
})
app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`)
})