import express from "express";
import { jpgToPdf, wordToPdf, pptxToPdf, textToPdf, excelToPdf, imageToPdf} from "../controllers/convertToPdf.js";
// import { upload } from "../middleware/multer.middleware.js";

const convertToPdf = express.Router();

convertToPdf.post('/image-to-pdf', imageToPdf)
convertToPdf.post('/jpg-to-pdf', jpgToPdf)
convertToPdf.post("/word-to-pdf/:id", wordToPdf )
convertToPdf.post("/ppts-to-pdf/:id", pptxToPdf)
// convertToPdf.post("/excel-to-pdf/:id", excelToPdf)
convertToPdf.post("/text-to-pdf/:id", textToPdf)
convertToPdf.post("/excel-to-pdf/:id", excelToPdf)

export default convertToPdf;