import {app} from "./app.js";
import connectDB from "./db/index.db.js";
import dotenv from "dotenv";

dotenv.config({
    path : "./.env"
})

connectDB
.then(()=>{
    app.listen(`${process.env.PORT}` || 8000)
    console.log(`Server is running on Port ${process.env.PORT}`)
})
.catch((error)=>{
    console.log("An error occur while Server is running on Specific Port", error)

})