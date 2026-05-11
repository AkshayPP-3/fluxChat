import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

dotenv.config();

const app = express();

const PORT = process.env.PORT

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.get("/test",(_,res)=>{
    res.send("Test message")
})
app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`)
})