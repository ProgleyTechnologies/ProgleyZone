import express from "express";
import { pdfToWord,  pdfToPptx, pdfToExcel, pdfToText, pdfToJpg } from "../controllers/convertFromPdf.js";


const convertFromPdf = express.Router();


convertFromPdf.post("/pdf-to-word/:id", pdfToWord )
convertFromPdf.post("/pdf-to-pptx/:id", pdfToPptx )
convertFromPdf.post("/pdf-to-xlsx/:id", pdfToExcel )
convertFromPdf.post("/pdf-to-text/:id", pdfToText)
convertFromPdf.post("/pdf-to-jpg/:id", pdfToJpg)


export default convertFromPdf;