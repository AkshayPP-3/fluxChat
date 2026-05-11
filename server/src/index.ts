import express from "express";
const app = express();
const PORT = process.env.PORT || 3000
app.get("/test",(_,res)=>{
    res.send("Test message")
})
app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`)
})