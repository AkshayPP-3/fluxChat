import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import {specs} from "./config/swagger.js"
import { spec } from "node:test/reporters";

dotenv.config();

const app = express();

const PORT = process.env.PORT

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(specs));

app.get("/test",(_,res)=>{
    res.send("Test message")
})
app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`)
})