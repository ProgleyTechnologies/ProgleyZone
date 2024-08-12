import express from "express";
import { addPageNumbers, addWaterMark, cropPdfPage, extractPdfPages, organizePdf, removePdfPages, rotateoverAllPdf, rotatePdfPage } from "../controllers/viewAndEdit.controller.js";


const viewAndEditPdf = express.Router();

viewAndEditPdf.post('/crop-pdf', cropPdfPage)
viewAndEditPdf.post('/organize-pdf', organizePdf)
viewAndEditPdf.post('/rotate-pdf-pages', rotatePdfPage)
viewAndEditPdf.post('/rotate-pdf', rotateoverAllPdf)
viewAndEditPdf.post('/remove-pdf', removePdfPages)
viewAndEditPdf.post('/extract-pdf', extractPdfPages)
// viewAndEditPdf.post('/extract-images-from-pdf', extractImagesFromPdf)
viewAndEditPdf.post('/add-page-number', addPageNumbers)
viewAndEditPdf.post('/add-water-mark', addWaterMark)

export default viewAndEditPdf