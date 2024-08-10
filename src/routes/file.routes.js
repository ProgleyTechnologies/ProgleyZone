import express from "express";
import { upload } from "../middleware/multer.middleware.js";
import { uploadedFile } from "../controllers/convert_Image.controller.js";

const fileRouter = express.Router();

fileRouter.post("/upload", upload.array('files', 10) ,uploadedFile)

export default fileRouter