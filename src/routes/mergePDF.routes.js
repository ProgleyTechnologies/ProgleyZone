import express from "express";
import { mergeFiles, mergePDF, splitPdfCustom, splitPdfFixed } from "../controllers/mergePDF.controller.js";

const mergePdfRouter = express.Router();

mergePdfRouter.post("/mergePdf", mergePDF)
mergePdfRouter.post("/mergePdfAndImages", mergeFiles)
mergePdfRouter.post("/split-pdf-custom", splitPdfCustom)
mergePdfRouter.post("/split-pdf-fixed", splitPdfFixed)

export default mergePdfRouter


