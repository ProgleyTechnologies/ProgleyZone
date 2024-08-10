import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import fileRouter from "./routes/file.routes.js";
import optimizeImage from "./routes/optimize_Image.routes.js";
import fileConverter from "./routes/convert_Image.routes.js";
import editImage from "./routes/edit_Image.routes.js";
import path from "path";
import fs from "fs"


const app = express();


app.use(cors ({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(bodyParser.urlencoded({
    extended : true
}))

app.use(express.json())
app.use(cookieParser());



 // Create an uploads folder if it doesn't exist
 const uploadDir = 'uploads';
 if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir);
 }


app.use("/api", fileRouter)
app.use("/api", optimizeImage)
app.use("/api", fileConverter)
app.use("/api", editImage)




export{app}