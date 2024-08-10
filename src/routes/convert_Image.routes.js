import express from "express";
import { imageToPNG, imageToJPG, imageToWEBP, WebpToJpg, HeicToJpeg , imageToJPEG} from "../controllers/convert_Image.controller.js"


const fileConverter = express.Router();

// Coverted images
fileConverter.post('/convert-png/:id', imageToPNG);
fileConverter.post('/convert-jpg/:id', imageToJPG);
fileConverter.post('/convert-jpeg/:id', imageToJPEG);
fileConverter.post('/convert-webp/:id', imageToWEBP);
fileConverter.post('/convert-webpTojpeg/:id', WebpToJpg);
fileConverter.post('/convert-heicTojpeg/:id', HeicToJpeg);
// fileConverter.post('/convert-Image/:id', convertImage);

export default fileConverter

