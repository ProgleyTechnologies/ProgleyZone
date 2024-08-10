import sharp from 'sharp';
import File from '../models/file.model.js';
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import Jimp from 'jimp';
import heicConvert from "heic-convert";


// Convert __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Ensure directory exists
const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
    return true;
}


const heicConversion = async (file) => {

    const originalFilePath = path.join(__dirname, "../../uploads", file.filename)

    const tempFilePath = path.join(__dirname, "../../uploads/temp", path.parse(file.filename).name + ".heic");

    const inputBuffer = fs.readFileSync(originalFilePath)

    const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: 1
    })

    ensureDirectoryExistence(tempFilePath)

    fs.writeFileSync(tempFilePath, outputBuffer);

    return tempFilePath;
}


// Image Crop
const imageCrop = async (req, res) => {
    try {

        const fileId = req.params.id;
        const { width, height, top, left } = req.body;

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(400).json({
                message: "file not found"
            })
        }

        const supportedFormats = ["image/png", "image/jpg", "image/jpeg", "image/webp", "image/bmp", "image/heic"]

        if (!supportedFormats.includes(file.mimetype)) {
            return res.status(400).json({
                message: "Unsupported file format for cropping"
            })
        }


        const fileExtension = file.mimetype.split('/')[1];

        const originalFilePath = path.join(__dirname, "../../uploads", file.filename)

        const croppedFilePath = path.join(__dirname, "../../uploads/cropped", `${path.parse(file.filename).name}-cropped.${fileExtension}`)

        ensureDirectoryExistence(croppedFilePath)

        let tempFilePath;

        if (file.mimetype === "image/heic") {
            tempFilePath = await heicConversion(file);
            console.log("HEIC converted file path:", tempFilePath);

            await sharp(tempFilePath)
                .extract({ left: parseInt(left), top: parseInt(top), width: parseInt(width), height: parseInt(height) })
                .toFile(croppedFilePath);

            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error("Failed to delete temporary file:", err.message);
            }

        }
        else if (file.mimetype === "image/bmp") {
            tempFilePath = path.join(__dirname, "../../uploads/temp", path.parse(file.filename).name + ".jpg");

            const image = await Jimp.read(originalFilePath);
            await image.writeAsync(tempFilePath);

            await sharp(tempFilePath)
                .extract({ left: parseInt(left), top: parseInt(top), width: parseInt(width), height: parseInt(height) })
                .toFile(croppedFilePath);

            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error("Failed to delete temporary file:", err.message);
            }

        }
        else {
            await sharp(originalFilePath)
                .extract({ left: parseInt(left), top: parseInt(top), width: parseInt(width), height: parseInt(height) })
                .toFile(croppedFilePath);
        }



        return res.status(200).json({
            message: "Image cropped successfully",
            croppedImgae: {
                path: croppedFilePath,
                format: fileExtension.toUpperCase()
            }
        })

    } catch (error) {
        console.log("Error in imageCrop controller", error.message)
    }
}

// Resize Image
const resizeImage = async (req, res) => {
    try {

        const fileId = req.params.id;
        const { width, height } = req.body;

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(400).json({
                message: "file not found"
            })
        }

        const supportedFormats = ["image/png", "image/jpg", "image/jpeg", "image/webp", "image/bmp", "image/heic"]

        if (!supportedFormats.includes(file.mimetype)) {
            return res.status(400).json({
                message: "Unsupported file format for cropping"
            })
        }

        const fileExtension = file.mimetype.split('/')[1];

        const originalFilePath = path.join(__dirname, "../../uploads", file.filename)
        const resizeFilePath = path.join(__dirname, "../../uploads/resize", `${path.parse(file.filename).name}-resize.${fileExtension}`)

        ensureDirectoryExistence(resizeFilePath)

        let tempFilePath;

        if (file.mimetype === "image/heic") {
            tempFilePath = await heicConversion(file);
            console.log("HEIC converted file path:", tempFilePath);

            await sharp(tempFilePath)
                .resize({width: parseInt(width), height: parseInt(height)})
                .toFile(resizeFilePath)

            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error("Failed to delete temporary file:", err.message);
            }

        }
        else if (file.mimetype === "image/bmp") {
            tempFilePath = path.join(__dirname, "../../uploads/temp", path.parse(file.filename).name + ".jpg");

            const image = await Jimp.read(originalFilePath);
            await image.writeAsync(tempFilePath);

            await sharp(tempFilePath)
                .resize({width: parseInt(width), height: parseInt(height)})
                .toFile(resizeFilePath)

            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error("Failed to delete temporary file:", err.message);
            }

        }
        else {
            await sharp(originalFilePath)
                .resize({width: parseInt(width), height: parseInt(height)})
                .toFile(resizeFilePath)
        }

        const stats = fs.statSync(resizeFilePath)
        const fileSizeInBytes = stats.size;
        console.log(`Size in Bytes ${fileSizeInBytes}`)

        const newFile = await File.create({
            path: resizeFilePath,
            format: fileExtension.toUpperCase(),
            size: fileSizeInBytes

        })


        return res.status(200).json({
            message: "Image resized successfully",
            newFile
        })

    } catch (error) {
        console.log("Error in resize image controller", error.message)
    }

}


// Rotate Image
const rotateImage = async (req, res) => {
    try {

        const fileId = req.params.id;
        const { direction } = req.body;

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(400).json({
                message: "file not found"
            })
        }

        const supportedFormats = ["image/png", "image/jpg", "image/jpeg", "image/webp", "image/bmp", "image/heic"]

        if (!supportedFormats.includes(file.mimetype)) {
            return res.status(400).json({
                message: "Unsupported file format for cropping"
            })
        }

        const fileExtension = file.mimetype.split('/')[1];

        const originalFilePath = path.join(__dirname, "../../uploads", file.filename)
        const rotateFilePath = path.join(__dirname, "../../uploads/rotate", `${path.parse(file.filename).name}-rotate.${fileExtension}`)

        ensureDirectoryExistence(rotateFilePath)

        const rotateAngle = direction === "left" ? -90 : 90

        let tempFilePath;

        if (file.mimetype === "image/heic") {
            tempFilePath = await heicConversion(file);
            console.log("HEIC converted file path:", tempFilePath);

            await sharp(tempFilePath)
                .rotate(rotateAngle)
                .toFile(rotateFilePath)

            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error("Failed to delete temporary file:", err.message);
            }

        }
        else if (file.mimetype === "image/bmp") {
            tempFilePath = path.join(__dirname, "../../uploads/temp", path.parse(file.filename).name + ".jpg");

            const image = await Jimp.read(originalFilePath);
            await image.writeAsync(tempFilePath);

            await sharp(tempFilePath)
                .rotate(rotateAngle)
                .toFile(rotateFilePath)

            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error("Failed to delete temporary file:", err.message);
            }

        }
        else {
            await sharp(originalFilePath)
                .rotate(rotateAngle)
                .toFile(rotateFilePath)
        }


        return res.status(200).json({
            message: "Image rotate successfully",
            RotatedImage: {
                path: rotateFilePath,
                format: fileExtension.toUpperCase(),
                angle: rotateAngle
            }
        })

    } catch (error) {
        console.log("Error in rotate image controller", error.message)
    }

}


// Crop Image in circle
const cropImageInCircle = async (req, res) => {
    try {

        const fileId = req.params.id;
        const { diameter } = req.body;

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(400).json({
                message: "file not found"
            })
        }

        const supportedFormats = ["image/png", "image/jpg", "image/jpeg", "image/webp", "image/bmp", "image/heic"]

        if (!supportedFormats.includes(file.mimetype)) {
            return res.status(400).json({
                message: "Unsupported file format for cropping"
            })
        }

        const fileExtension = file.mimetype.split('/')[1];

        const originalFilePath = path.join(__dirname, "../../uploads", file.filename)
        const cropInCirclePath = path.join(__dirname, "../../uploads/circleCrop", `${path.parse(file.filename).name}-circle-crop.${fileExtension}`)

        ensureDirectoryExistence(cropInCirclePath)

        let tempFilePath;

        if (file.mimetype === "image/heic") {
            tempFilePath = await heicConversion(file);
            console.log("HEIC converted file path:", tempFilePath);

            await sharp(tempFilePath)
                .resize({ width: diameter, height: diameter, fit: 'cover' })
                .composite([{ // Create a circle mask
                    input: Buffer.from(`<svg><circle cx="${diameter / 2}" cy="${diameter / 2}" r="${diameter / 2}" /></svg>`),
                    blend: 'dest-in'
                }])
                .png() // Output format as PNG for transparency support
                .toFile(cropInCirclePath);

            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error("Failed to delete temporary file:", err.message);
            }

        }
        else if (file.mimetype === "image/bmp") {
            tempFilePath = path.join(__dirname, "../../uploads/temp", path.parse(file.filename).name + ".jpg");

            const image = await Jimp.read(originalFilePath);
            await image.writeAsync(tempFilePath);

            await sharp(tempFilePath)
                .resize({ width: diameter, height: diameter, fit: 'cover' })
                .composite([{ // Create a circle mask
                    input: Buffer.from(`<svg><circle cx="${diameter / 2}" cy="${diameter / 2}" r="${diameter / 2}" /></svg>`),
                    blend: 'dest-in'
                }])
                .png() // Output format as PNG for transparency support
                .toFile(cropInCirclePath);

            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error("Failed to delete temporary file:", err.message);
            }

        }
        else {
            await sharp(originalFilePath)
                .resize({ width: diameter, height: diameter, fit: 'cover' })
                .composite([{ // Create a circle mask
                    input: Buffer.from(`<svg><circle cx="${diameter / 2}" cy="${diameter / 2}" r="${diameter / 2}" /></svg>`),
                    blend: 'dest-in'
                }])
                .png() // Output format as PNG for transparency support
                .toFile(cropInCirclePath);
        }


        return res.status(200).json({
            message: "Image is cropped in circle successfully",
            croppedInCircle: {
                path: cropInCirclePath,
                format: fileExtension.toUpperCase()
            }
        })

    } catch (error) {
        console.log("Error in crop image controller in circle", error.message)
    }


}

// Merge Image
const uploadAndMergeImages = async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length < 2) {
            return res.status(400).json({
                message: "Both front and background images are required"
            });
        }

        const frontImageFile = files.frontImage[0];
        const backgroundImageFile = files.backgroundImage[0];

        const frontImagePath = frontImageFile.path;
        const backImagePath = backgroundImageFile.path;

        const frontImage = sharp(frontImagePath)
        const backImage = sharp(backImagePath)

        const frontMetaData = await sharp(frontImagePath).metadata();
        const backMetaData = await sharp(backImagePath).metadata();

        const newWidth = Math.max(frontMetaData.width, backMetaData.width)
        const newheight = frontMetaData.height + backMetaData.height

        const bufferfront = await frontImage.resize(newWidth).toBuffer();
        const bufferback = await backImage.resize(newWidth).toBuffer();

        const newImage = await sharp({
            create: {
                width: newWidth,
                height: newheight,
                channels: 3,
                background: { r: 255, g: 255, b: 255 }
            }
        })
            .composite([
                { input: bufferfront, top: 0, left: 0 },
                { input: bufferback, top: frontMetaData.height, left: 0 }
            ])
            .toFormat('jpeg')
            .toBuffer();

        const outputPath = path.join(__dirname, '../../uploads/merged', `${frontImageFile.filename} + ${backgroundImageFile.filename}`);

        ensureDirectoryExistence(outputPath)
        fs.writeFileSync(outputPath, newImage);

        // Cleanup

        try {
            fs.unlinkSync(backImagePath);
            fs.unlinkSync(frontImagePath);

        } catch (error) {
            console.log("Error occuring between unlink file", error)
        }

        const stats = fs.statSync(outputPath)
        const fileSizeInBytes = stats.size;
        console.log(`Size in Bytes ${fileSizeInBytes}`)
        const fileSizeInKB = (stats.size / 1024).toFixed(2) + 'KB';
        console.log(`Size in KB ${fileSizeInKB}`)

        // const newFile = await File.create({
        //     path: outputPath,
        //     size: fileSizeInKB
            
        // })
        
        return res.status(200).json({
            message: "Image merged successfully",
            newSize: fileSizeInKB
        })


    } catch (error) {
        console.log("Error in uploadAndMergeImages controller", error.message);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};





export { imageCrop, resizeImage, rotateImage, cropImageInCircle, uploadAndMergeImages }
