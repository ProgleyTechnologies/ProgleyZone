import express from "express";
import { imageCrop, resizeImage, rotateImage , cropImageInCircle, uploadAndMergeImages} from "../controllers/edit_Image.controllers.js";
import { upload } from "../middleware/multer.middleware.js";


const editImage = express.Router();


// Edit Image
editImage.post('/crop-image/:id', imageCrop)
editImage.post('/resize-image/:id', resizeImage)
editImage.post('/rotate-image/:id', rotateImage)
editImage.post('/crop-image-circle/:id', cropImageInCircle)
editImage.post('/upload-merge', upload.fields([{ name: 'frontImage' }, { name: 'backgroundImage' }]), uploadAndMergeImages)


export default editImage