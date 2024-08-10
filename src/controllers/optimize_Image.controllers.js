import sharp from 'sharp';
import File from '../models/file.model.js';
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import Jimp from 'jimp';
import heicConvert from "heic-convert";



//    Convert __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


console.log(__filename)
console.log(__dirname)

// Ensure directory exists
const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
    return true;
}

// compress PNG
const compressPNG = async (req, res) => {
    try {
        const fileId = req.params.id;
        const { quality } = req.body;

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(400).json({
                message: "File not found"
            })
        }

        if (file.mimetype !== "image/png") {
            return res.status(400).json({
                message: "Compress only PNG format file"
            })
        }

        const originalFilePath = path.join(__dirname, "../../uploads", file.filename)

        const compressedFilePath = path.join(__dirname, "../../uploads/compressed", path.parse(file.filename).name + ".png")

        ensureDirectoryExistence(compressedFilePath)

        try {
            await sharp(originalFilePath)
                .png({ quality })
                .toFile(compressedFilePath)

        } catch (error) {
            console.log("Error in compressed file in png using sharp", error.message)
            return res.status(500).json({
                message: "Failed to compress png Image"
            })

        }

        const originalFileSize = fs.statSync(originalFilePath).size;
        const compressedFileSize = fs.statSync(compressedFilePath).size;
        console.log(`Original file size: ${originalFileSize} bytes`);
        console.log(`Compressed file size: ${compressedFileSize} bytes`);

        const compressedFile = new File({
            filename: "compressed-" + path.parse(file.filename).name + "png",
            originalname: file.originalname,
            mimetype: "image/png",
            size: fs.statSync(compressedFilePath).size,
            path: compressedFilePath
        })

        await compressedFile.save();

        if (compressedFile) {
            return res.status(200).json({
                message: "File successfully compressed",
                compressedFile
            })
        }
    }
    catch (error) {
        console.log("Error in compressed file controller", error.message)
        return res.status(500).json({
            message: "Server Error"
        })


    }
}


// compress JPG
const compressJPG = async (req, res) => {
    try {
        const fileId = req.params.id;
        const { quality } = req.body;

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(400).json({
                message: "File not found"
            })
        }

        if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/jpg") {
            return res.status(400).json({
                message: "Compress only JPG format file"
            })
        }

        const originalFilePath = path.join(__dirname, "../../uploads", file.filename)

        const compressedFilePath = path.join(__dirname, "../../uploads/compressed", path.parse(file.filename).name + ".jpg")

        ensureDirectoryExistence(compressedFilePath)

        try {
            await sharp(originalFilePath)
                .jpeg({ quality })
                .toFile(compressedFilePath)

        } catch (error) {
            console.log("Error in compressed file in jpg using sharp", error.message)
            return res.status(500).json({
                message: "Failed to compress jpg Image"
            })

        }

        const compressedFile = new File({
            filename: "compressed-" + path.parse(file.filename).name + "jpg",
            originalname: file.originalname,
            mimetype: "image/jpg",
            size: fs.statSync(compressedFilePath).size,
            path: compressedFilePath
        })

        await compressedFile.save();

        if (compressedFile) {
            return res.status(200).json({
                message: "File successfully compressed",
                compressedFile
            })
        }
    }
    catch (error) {
        console.log("Error in compressed file controller", error.message)
        return res.status(500).json({
            message: "Server Error"
        })


    }
}


// compress JPEG
const compressJPEG = async (req, res) => {
    try {
        const fileId = req.params.id;
        const { quality } = req.body;

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(400).json({
                message: "File not found"
            })
        }

        if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/jpg") {
            return res.status(400).json({
                message: "Compress only JPEG format file"
            })
        }

        const originalFilePath = path.join(__dirname, "../../uploads", file.filename)

        const compressedFilePath = path.join(__dirname, "../../uploads/compressed", path.parse(file.filename).name + ".jpeg")

        ensureDirectoryExistence(compressedFilePath)

        try {
            await sharp(originalFilePath)
                .jpeg({ quality })
                .toFile(compressedFilePath)

        } catch (error) {
            console.log("Error in compressed file in jpeg using sharp", error.message)
            return res.status(500).json({
                message: "Failed to compress jpeg Image"
            })

        }

        const originalFileSize = fs.statSync(originalFilePath).size;
        const compressedFileSize = fs.statSync(compressedFilePath).size;
        console.log(`Original file size: ${originalFileSize} bytes`);
        console.log(`Compressed file size: ${compressedFileSize} bytes`);

        const compressedFile = new File({
            filename: "compressed-" + path.parse(file.filename).name + "jpeg",
            originalname: file.originalname,
            mimetype: "image/jpeg",
            size: fs.statSync(compressedFilePath).size,
            path: compressedFilePath
        })

        await compressedFile.save();

        if (compressedFile) {
            return res.status(200).json({
                message: "File successfully compressed",
                compressedFile
            })
        }
    }
    catch (error) {
        console.log("Error in compressed file controller", error.message)
        return res.status(500).json({
            message: "Server Error"
        })


    }
}


// compress WEBP 
const compressWEBP = async (req, res) => {
    try {
        const fileId = req.params.id;
        const { quality } = req.body;

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(400).json({
                message: "File not found"
            })
        }

        if (file.mimetype !== "image/webp") {
            return res.status(400).json({
                message: "Compress only WEBP format file"
            })
        }

        const originalFilePath = path.join(__dirname, "../../uploads", file.filename)

        const compressedFilePath = path.join(__dirname, "../../uploads/compressed", path.parse(file.filename).name + ".webp")

        ensureDirectoryExistence(compressedFilePath)

        try {
            await sharp(originalFilePath)
                .webp({ quality })
                .toFile(compressedFilePath)

        } catch (error) {
            console.log("Error in compressed file in webp using sharp", error.message)
            return res.status(500).json({
                message: "Failed to compress webp Image"
            })

        }

        const originalFileSize = fs.statSync(originalFilePath).size;
        const compressedFileSize = fs.statSync(compressedFilePath).size;
        console.log(`Original file size: ${originalFileSize} bytes`);
        console.log(`Compressed file size: ${compressedFileSize} bytes`);

        const compressedFile = new File({
            filename: "compressed-" + path.parse(file.filename).name + "webp",
            originalname: file.originalname,
            mimetype: "image/webp",
            size: fs.statSync(compressedFilePath).size,
            path: compressedFilePath
        })

        await compressedFile.save();

        if (compressedFile) {
            return res.status(200).json({
                message: "File successfully compressed",
                compressedFile
            })
        }
    }
    catch (error) {
        console.log("Error in compressed file controller", error.message)
        return res.status(500).json({
            message: "Server Error"
        })


    }
}



// compress HEIC
const compressHEIC = async (req, res) => {
    try {
        const fileId = req.params.id;
        const { quality } = req.body;

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(400).json({
                message: "File not found"
            });
        }

        if (file.mimetype !== "image/heic") {
            return res.status(400).json({
                message: "Compress only HEIC format file"
            });
        }

        const originalFilePath = path.join(__dirname, "../../uploads", file.filename);

        const tempFilePath = path.join(__dirname, "../../uploads/temp", path.parse(file.filename).name + ".heic");

        const compressedFilePath = path.join(__dirname, "../../uploads/compressed", path.parse(file.filename).name + ".heic");

        ensureDirectoryExistence(tempFilePath);
        ensureDirectoryExistence(compressedFilePath);

        // Convert HEIC to temporary JPEG file
        const inputBuffer = fs.readFileSync(originalFilePath);
        const outputBuffer = await heicConvert({
            buffer: inputBuffer,
            format: 'JPEG',
            quality: quality
        });


        fs.writeFileSync(tempFilePath, outputBuffer);


        await sharp(tempFilePath)
            .jpeg({ quality })
            .toFile(compressedFilePath);


        fs.unlink(tempFilePath, (err) => {
            if (err) console.error("Failed to delete temporary file:", err.message);
        });

        const originalFileSize = fs.statSync(originalFilePath).size;
        const compressedFileSize = fs.statSync(compressedFilePath).size;
        console.log(`Original file size: ${originalFileSize} bytes`);
        console.log(`Compressed file size: ${compressedFileSize} bytes`);

        const compressedFile = new File({
            filename: `compressed-${path.parse(file.filename).name}.heic`,
            originalname: file.originalname,
            mimetype: "image/heic",
            size: fs.statSync(compressedFilePath).size,
            path: compressedFilePath
        });

        await compressedFile.save();

        return res.status(200).json({
            message: "File successfully compressed",
            compressedFile
        });

    } catch (error) {
        console.log("Error in compressing HEIC file", error.message);
        return res.status(500).json({
            message: "Server Error"
        });
    }
};



// compress BMP
const compressBMP = async (req, res) => {
    try {
        const fileId = req.params.id;
        const { quality } = req.body;

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(400).json({
                message: "File not found"
            });
        }

        if (file.mimetype !== "image/bmp") {
            return res.status(400).json({
                message: "Compress only BMP format file"
            });
        }

        const originalFilePath = path.join(__dirname, "../../uploads", file.filename);
        const compressedFileName = path.parse(file.filename).name;


        try {
            // Convert BMP to JPEG first to achieve better compression
            const tempBmpToJpegPath = path.join(__dirname, "../../uploads/temp", `${path.parse(file.filename).name}.jpg`);

            ensureDirectoryExistence(tempBmpToJpegPath);

            const jimpImage = await Jimp.read(originalFilePath);
            await jimpImage.quality(quality).writeAsync(tempBmpToJpegPath);

            const compressedFilePath = path.join(__dirname, "../../uploads/compressed", `${path.parse(file.filename).name}.jpg`);

            ensureDirectoryExistence(compressedFilePath);
            // mimeType = "image/jpeg";
            await sharp(tempBmpToJpegPath).jpeg({ quality }).toFile(compressedFilePath);

            // Clean up temporary file
            try {
                fs.unlinkSync(tempBmpToJpegPath);
            } catch (err) {
                console.error("Failed to delete temporary file:", err.message);
            }

            const originalFileSize = fs.statSync(originalFilePath).size;
            const compressedFileSize = fs.statSync(compressedFilePath).size;
            console.log(`Original file size: ${originalFileSize} bytes`);
            console.log(`Compressed file size: ${compressedFileSize} bytes`);

            const compressedFile = new File({
                filename: `compressed-${compressedFileName}.bmp`,
                originalname: file.originalname,
                mimetype: "image/bmp",
                size: fs.statSync(compressedFilePath).size,
                path: compressedFilePath
            });

            await compressedFile.save();

            return res.status(200).json({
                message: "File successfully compressed",
                compressedFile
            });

        } catch (error) {
            console.log("Error in compressed file in bmp using jimp", error.message);
            return res.status(500).json({
                message: "Failed to compress bmp Image"
            });
        }

    } catch (error) {
        console.log("Error in compressed bmp file controller", error.message);
        return res.status(500).json({
            message: "Server Error"
        });
    }
};


// compress Image
const compressImage = async (req, res) => {
    try {

        const { quality } = req.body;
        const fileIds = req.body.fileIds;
    
        if (!fileIds || !Array.isArray(fileIds)) {
          return res.status(400).json({ message: "Invalid file IDs" });
        }
    
        const compressedFiles = [];
    
        for (const fileId of fileIds) {
          const file = await File.findById(fileId);
    
          if (!file) {
            return res.status(400).json({ message: `File with ID ${fileId} not found` });
          }
    
          const originalFilePath = path.join(__dirname, "../../uploads", file.filename);
          let compressedFilePath, mimeType;
    
          switch (file.mimetype) {
            case "image/png":
              compressedFilePath = path.join(__dirname, "../../uploads/compressed", `${path.parse(file.filename).name}.png`);
              ensureDirectoryExistence(compressedFilePath);
              mimeType = "image/png";
              await sharp(originalFilePath).png({ quality }).toFile(compressedFilePath);
              break;
    
            case "image/jpg":
            case "image/jpeg":
              compressedFilePath = path.join(__dirname, "../../uploads/compressed", `${path.parse(file.filename).name}.jpg`);
              ensureDirectoryExistence(compressedFilePath);
              mimeType = "image/jpeg";
              await sharp(originalFilePath).jpeg({ quality }).toFile(compressedFilePath);
              break;
    
            case "image/webp":
              compressedFilePath = path.join(__dirname, "../../uploads/compressed", `${path.parse(file.filename).name}.webp`);
              ensureDirectoryExistence(compressedFilePath);
              mimeType = "image/webp";
              await sharp(originalFilePath).webp({ quality }).toFile(compressedFilePath);
              break;
    
            case "image/bmp":
              const tempBmpToJpegPath = path.join(__dirname, "../../uploads/temp", `${path.parse(file.filename).name}.jpg`);
              ensureDirectoryExistence(tempBmpToJpegPath);
              const jimpImage = await Jimp.read(originalFilePath);
              await jimpImage.quality(quality).writeAsync(tempBmpToJpegPath);
              compressedFilePath = path.join(__dirname, "../../uploads/compressed", `${path.parse(file.filename).name}.jpg`);
              ensureDirectoryExistence(compressedFilePath);
              mimeType = "image/jpeg";
              await sharp(tempBmpToJpegPath).jpeg({ quality }).toFile(compressedFilePath);
              try {
                fs.unlinkSync(tempBmpToJpegPath);
              } catch (err) {
                console.error("Failed to delete temporary file:", err.message);
              }
              break;
    
            case "image/heic":
              const tempFilePath = path.join(__dirname, "../../uploads/temp", `${path.parse(file.filename).name}.jpeg`);
              compressedFilePath = path.join(__dirname, "../../uploads/compressed", `${path.parse(file.filename).name}.jpeg`);
              ensureDirectoryExistence(tempFilePath);
              ensureDirectoryExistence(compressedFilePath);
              const inputBuffer = fs.readFileSync(originalFilePath);
              const outputBuffer = await heicConvert({ buffer: inputBuffer, format: 'JPEG', quality: quality / 100 });
              fs.writeFileSync(tempFilePath, outputBuffer);
              mimeType = "image/heic";
              await sharp(tempFilePath).jpeg({ quality }).toFile(compressedFilePath);
              fs.unlink(tempFilePath, (err) => {
                if (err) console.error("Failed to delete temporary file:", err.message);
              });
              break;
    
            default:
              return res.status(400).json({ message: `Unsupported file format: ${file.mimetype}` });
          }
    
          const compressedFile = new File({
            filename: `compressed-${path.parse(file.filename).name}.${mimeType.split('/')[1]}`,
            originalname: file.originalname,
            mimetype: mimeType,
            size: fs.statSync(compressedFilePath).size,
            path: compressedFilePath,
          });
    
          await compressedFile.save();
          compressedFiles.push(compressedFile);
        }
    
        return res.status(200).json({ message: "Files successfully compressed", compressedFiles });

        
        
    } catch (error) {
        console.log("Error in compressing file", error.message);
        return res.status(500).json({ message: "Server Error" });
    }
};






export { compressPNG, compressJPG, compressJPEG, compressWEBP, compressHEIC, compressBMP, compressImage }




