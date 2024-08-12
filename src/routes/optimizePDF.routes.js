import express from "express";
import { upload } from "../middleware/multer.middleware.js";
import { compressPdf } from "../controllers/optimizePDF.js";

const compressPDFRouter = express.Router();

compressPDFRouter.post("/compress-pdf/:id", compressPdf)

export default compressPDFRouter