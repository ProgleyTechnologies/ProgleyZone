import express from "express";
import { compressPNG, compressJPG, compressJPEG, compressWEBP, compressHEIC, compressBMP, compressImage } from "../controllers/optimize_Image.controllers.js";

const optimizeImage = express.Router();



// Optimize Image
optimizeImage.post('/compress-png/:id', compressPNG)
optimizeImage.post('/compress-jpg/:id', compressJPG)
optimizeImage.post('/compress-jpeg/:id', compressJPEG)
optimizeImage.post('/compress-webp/:id', compressWEBP)
optimizeImage.post('/compress-heic/:id', compressHEIC)
optimizeImage.post('/compress-bmp/:id', compressBMP)
optimizeImage.post('/compress-image', compressImage)

export default optimizeImage