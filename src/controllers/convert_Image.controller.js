import sharp from 'sharp';
import File from '../models/file.model.js';
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs"
import archiver from 'archiver';
import Jimp from 'jimp';
import heicConvert from "heic-convert";

// console.log(path)

// Upload File

const uploadedFile = async (req, res) => {
  try {

    console.log(req.files)

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "File is not uploaded",
      })

    }

    const fileRecords = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    }));


    const savedRecords = await File.insertMany(fileRecords)

    if (!savedRecords) {
      return res.status(400).json({
        message: "Files is not uploaded",
      })
    }

    return res.status(200).json({
      message: "File is uploaded successfully",
      files: savedRecords
    })

  } catch (error) {
    console.log("Error in uploading file controller", error.message)
  }
}

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

// console.log(__filename)
// console.log(__dirname)


// delete file
const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    console.log("File ID to delete:", fileId);

    const deletedFile = await File.findByIdAndDelete(fileId);
    console.log("Deleted File:", deletedFile);

    if (!deletedFile) {
      return res.status(400).json({
        message: "Error in deleting file"
      });
    }

    // Remove the file from the filesystem
    const filePath = path.join(__dirname, "../../uploads", deletedFile.filename);
    fs.unlinkSync(filePath);

    return res.status(200).json({
      message: "File is deleted"
    });

  } catch (error) {
    console.log("Error in deleting file controller:", error.message);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


// download file
const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await File.findById(fileId)

    if (!file) {
      return res.status(400).json({
        message: "File is not found"
      })
    }

    const filePath = path.join(__dirname, "../../uploads", file.filename);
    console.log(filePath)
    res.download(filePath, file.originalname);

  } catch (error) {
    console.log("Error in downloading File controller", error.message)
  }
}



// download files in zip
const downloadFilesInZip = async (req, res) => {
  try {
    let { fileIds } = req.body;

    // Ensure fileIds is an array
    if (!Array.isArray(fileIds)) {
      fileIds = [fileIds];
    }

    const archieve = archiver("zip", {
      zlib: { level: 9 }
    })

    res.attachment("files.zip")

    archieve.pipe(res)

    for (const fileId of fileIds) {
      const file = await File.findById(fileId);

      if (file) {
        const filePath = path.join(__dirname, "../../uploads", file.filename);
        archieve.file(filePath, { name: file.originalname });
      }
    }

    archieve.finalize();

  } catch (error) {
    console.log("Error in downloading file in zip", error.message)

  }
}



// compress file 50%
const compressedFile50 = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(400).json({
        message: "File not found"
      });
    }

    const originalFilePath = path.join(__dirname, "../../uploads", file.filename);
    console.log(originalFilePath)

    const compressedFilePath = path.join(__dirname, "../../uploads/compressed-" + path.parse(file.filename).name + ".png");
    console.log(compressedFilePath)

    let format = file.mimetype.split('/')[1].toLowerCase();
    console.log("Original format:", format);

    let sharpInstance;
    let intermediatePath = null;

    if (format === 'bmp') {
      // Convert BMP to PNG using Jimp before compression
      intermediatePath = path.join(__dirname, "../../uploads/intermediate-" + path.parse(file.filename).name + ".png");

      console.log("Intermediate path:", intermediatePath);

      try {
        const image = await Jimp.read(originalFilePath);
        await image.writeAsync(intermediatePath);
        console.log("Intermediate file created at:", intermediatePath);

        // Check if the intermediate file was created
        if (!fs.existsSync(intermediatePath)) {
          return res.status(500).json({
            message: "Failed to create intermediate PNG file from BMP"
          });
        }

        // Update sharpInstance to point to the new intermediate file
        sharpInstance = sharp(intermediatePath);
        format = 'png';

      }
      catch (conversionError) {
        console.error("Error during BMP to PNG conversion:", conversionError.message);

        return res.status(500).json({
          message: "Failed to convert BMP to PNG"
        });
      }
    }
    else {
      sharpInstance = sharp(originalFilePath);
    }

    // Compress the image
    try {
      if (format === 'jpg' || format === 'jpeg') {
        await sharpInstance.jpeg({ quality: 50 }).toFile(compressedFilePath);
      }
      else if (format === 'png') {
        await sharpInstance.png({ quality: 50 }).toFile(compressedFilePath);
      }
      else if (format === 'webp') {
        await sharpInstance.webp({ quality: 50 }).toFile(compressedFilePath);
      }
      else {
        // if (intermediatePath) {
        //   fs.unlinkSync(intermediatePath); // Clean up intermediate file
        // }
        return res.status(400).json({
          message: "Unsupported file format"
        });
      }
    }
    catch (compressionError) {
      console.error("Error during image compression:", compressionError.message);

      return res.status(500).json({
        message: "Failed to compress image"
      });
    }

    // Clean up intermediate file if it exists
    // if (intermediatePath) {
    //   fs.unlinkSync(intermediatePath);
    // }

    const compressedFile = new File({
      filename: "compressed-" + path.parse(file.filename).name + ".png",
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: fs.statSync(compressedFilePath).size,
      path: compressedFilePath
    });

    await compressedFile.save();

    return res.status(200).json({
      message: "File is compressed up to 50%",
      compressedFile
    });

  } catch (error) {
    console.log("Error in compressing file up to 50%", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


// compressed according to user range
const compressedFileInRange = async (req, res) => {
  try {
    const fileId = req.params.id;
    const { quality } = req.body;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(400).json({
        message: "File not found"
      });
    }

    const originalFilePath = path.join(__dirname, "../../uploads", file.filename);

    const compressedFilePath = path.join(__dirname, "../../uploads/compressed-" + path.parse(file.filename).name + ".jpeg");

    let format = file.mimetype.split('/')[1].toLowerCase();
    console.log("Original format:", format);

    let sharpInstance;
    let intermediatePath = null;

    if (format === 'bmp') {
      // Convert BMP to PNG using Jimp before compression
      intermediatePath = path.join(__dirname, "../../uploads/intermediate-" + path.parse(file.filename).name + ".png");
      console.log("Intermediate path:", intermediatePath);

      try {
        const image = await Jimp.read(originalFilePath);
        await image.writeAsync(intermediatePath);
        console.log("Intermediate file created at:", intermediatePath);

        // Check if the intermediate file was created
        if (!fs.existsSync(intermediatePath)) {
          return res.status(500).json({
            message: "Failed to create intermediate PNG file from BMP"
          });
        }

        // Update sharpInstance to point to the new intermediate file
        sharpInstance = sharp(intermediatePath);
        format = 'png';

      }
      catch (conversionError) {
        console.error("Error during BMP to PNG conversion:", conversionError.message);

        return res.status(500).json({
          message: "Failed to convert BMP to PNG"
        });
      }
    }
    else {
      sharpInstance = sharp(originalFilePath);
    }

    // Compress the image
    try {
      if (format === 'jpg' || format === 'jpeg') {
        await sharpInstance.jpeg({ quality }).toFile(compressedFilePath);
      }
      else if (format === 'png') {
        await sharpInstance.png({ quality }).toFile(compressedFilePath);
      }
      else if (format === 'webp') {
        await sharpInstance.webp({ quality }).toFile(compressedFilePath);
      }
      else {
        if (intermediatePath) {
          fs.unlinkSync(intermediatePath); // Clean up intermediate file
        }
        return res.status(400).json({
          message: "Unsupported file format"
        });
      }
    }
    catch (compressionError) {
      console.error("Error during image compression:", compressionError.message);

      return res.status(500).json({
        message: "Failed to compress image"
      });
    }

    // Clean up intermediate file if it exists
    if (intermediatePath) {
      fs.unlinkSync(intermediatePath);
    }

    const compressedFileInRange = new File({
      filename: "compressed-" + path.parse(file.filename).name + ".jpeg",
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: fs.statSync(compressedFilePath).size,
      path: compressedFilePath,
      format: mime.extension(mimetype).toUpperCase(), // Store format as uppercase (e.g., JPEG, PNG)
      dimensions: { width: null, height: null } // Update with actual dimensions if needed
    });

    await compressedFileInRange.save();

    return res.status(200).json({
      message: `File is compressed up to ${quality} %`,
      compressedFileInRange
    });

  } catch (error) {
    console.log("Error in compressing file according to user need", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};




// Image Conversion.....

// Image to png

const imageToPNG = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(400).json({
        message: "File is not found"
      });
    }

    const originalFilePath = path.join(__dirname, "../../uploads", file.filename);
    const convertedFilePath = path.join(__dirname, "../../uploads", path.parse(file.filename).name + ".png");

    if (file.mimetype === "image/heic") {

      const inputBuffer = fs.readFileSync(originalFilePath)

      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: "PNG",
        quality: 1
      })

      fs.writeFileSync(convertedFilePath, outputBuffer)

    }
    else if (file.mimetype === 'image/bmp') {
      const image = await Jimp.read(originalFilePath);
      await image.writeAsync(convertedFilePath);
    }
    else {
      await sharp(originalFilePath)
        .png()
        .toFile(convertedFilePath);
    }


    const convertedFile = {
      format: 'png',
      filename: path.parse(file.filename).name + ".png",
      path: convertedFilePath,
      size: fs.statSync(convertedFilePath).size,
    };

    file.convertedFiles.push(convertedFile);
    await file.save();

    return res.status(200).json({
      message: "File converted to PNG",
      convertedFile
    });

  } catch (error) {
    console.log("Error in converting image to PNG:", error.message);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


// Image to JPG
const imageToJPG = async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await File.findById(fileId)

    if (!file) {
      return res.status(400).json({
        message: "File not found"
      })
    }

    const originalFilePath = path.join(__dirname, "../../uploads", file.filename)
    const convertedFilePath = path.join(__dirname, "../../uploads", path.parse(file.filename).name + ".jpg")

    if (file.mimetype === "image/heic") {

      const inputBuffer = fs.readFileSync(originalFilePath)

      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: 1
      })

      fs.writeFileSync(convertedFilePath, outputBuffer)

    }
    else if (file.mimetype === 'image/bmp') {
      const image = await Jimp.read(originalFilePath);
      await image.writeAsync(convertedFilePath);
    }
    else {
      await sharp(originalFilePath)
        .jpeg()
        .toFile(convertedFilePath);
    }

    const convertedFile = {
      format: ".jpg",
      filename: path.parse(file.filename).name + ".jpg",
      path: convertedFilePath,
      size: fs.statSync(convertedFilePath).size

    }

    file.convertedFiles.push(convertedFile)

    await file.save();

    return res.status(200).json({
      message: "File converted to JPG",
      convertedFile
    });
  } catch (error) {
    console.log("Error in converting image to JPG controller", error.message)
  }
}

// image To JPeg
const imageToJPEG = async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await File.findById(fileId)

    if (!file) {
      return res.status(400).json({
        message: "File not found"
      })
    }

    const originalFilePath = path.join(__dirname, "../../uploads", file.filename)
    const convertedFilePath = path.join(__dirname, "../../uploads", path.parse(file.filename).name + ".jpeg")

    if (file.mimetype === "image/heic") {

      const inputBuffer = fs.readFileSync(originalFilePath)

      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: 1
      })

      fs.writeFileSync(convertedFilePath, outputBuffer)

    }
    else if (file.mimetype === 'image/bmp') {
      const image = await Jimp.read(originalFilePath);
      await image.writeAsync(convertedFilePath);
    }
    else {
      await sharp(originalFilePath)
        .jpeg()
        .toFile(convertedFilePath);
    }

    const convertedFile = {
      format: ".jpeg",
      filename: path.parse(file.filename).name + ".jpeg",
      path: convertedFilePath,
      size: fs.statSync(convertedFilePath).size

    }

    file.convertedFiles.push(convertedFile)

    await file.save();

    return res.status(200).json({
      message: "File converted to JPEG",
      convertedFile
    });
  } catch (error) {
    console.log("Error in converting image to JPG controller", error.message)
  }
}

// Image To WEBP
const imageToWEBP = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(400).json({
        message: "File is not found"
      });
    }

    const originalFilePath = path.join(__dirname, "../../uploads", file.filename);
    const tempFilePath = path.join(__dirname, "../../uploads/temp", path.parse(file.filename).name + "-temp.jpg");
    const convertedFilePath = path.join(__dirname, "../../uploads/converted", path.parse(file.filename).name + ".webp");

    ensureDirectoryExistence(tempFilePath);
    ensureDirectoryExistence(convertedFilePath)

    if (file.mimetype === "image/heic") {
      const inputBuffer = fs.readFileSync(originalFilePath);
      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: 'JPEG', // Convert HEIC to JPEG first
        quality: 1
      });

      fs.writeFileSync(tempFilePath, outputBuffer);

      await sharp(tempFilePath)
        .webp()
        .toFile(convertedFilePath);

      try {
        fs.unlinkSync(tempFilePath); // Remove the temporary file
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError.message);
      }

    }
    else if (file.mimetype === 'image/bmp') {
      const image = await Jimp.read(originalFilePath);
      await image.writeAsync(convertedFilePath);
    }
    else {
      await sharp(originalFilePath)
        .webp()
        .toFile(convertedFilePath);
    }



    const convertedFile = {
      format: 'webp',
      filename: path.parse(file.filename).name + ".webp",
      path: convertedFilePath,
      size: fs.statSync(convertedFilePath).size,
    };

    file.convertedFiles.push(convertedFile);
    await file.save();

    return res.status(200).json({
      message: "File converted to WEBP",
      convertedFile
    });

  } catch (error) {
    console.log("Error in converting image to WEBP:", error.message);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}

// WEBP To JPEG
const WebpToJpg = async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await File.findById(fileId)

    if (!file) {
      return res.status(400).json({
        message: "File not found"
      })
    }

    // console.log(file)

    const originalFilePath = path.join(__dirname, "../../uploads", file.filename)

    const webpToJpegFilePath = path.join(__dirname, "../../uploads/converted", path.parse(file.filename).name + ".jpeg");

    ensureDirectoryExistence(webpToJpegFilePath)


    if (file.mimetype !== "image/webp") {
      return res.status(400).json({
        message: "You can convert only webp image format"
      })
    }

    await sharp(originalFilePath)
      .jpeg()
      .toFile(webpToJpegFilePath)

    const convertedFile = {
      format: "jpeg",
      filename: path.parse(file.filename).name + ".jpeg",
      path: webpToJpegFilePath,
      size: fs.statSync(webpToJpegFilePath).size
    }

    file.convertedFiles.push(convertedFile)
    await file.save();

    return res.status(200).json({
      message: "Converted webp To jpeg",
      convertedFile
    })

  } catch (error) {
    console.log("Error in converting webp to jpeg", error.message)
  }
}


// Heic To Jpeg
const HeicToJpeg = async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await File.findById(fileId)

    if (!file) {
      return res.status(400).json({
        message: "File not found"
      })
    }

    // console.log(file)

    const originalFilePath = path.join(__dirname, "../../uploads", file.filename)

    const heicToJpegFilePath = path.join(__dirname, "../../uploads/converted", path.parse(file.filename).name + ".jpeg");

    ensureDirectoryExistence(heicToJpegFilePath)

    // console.log(heicToJpegFilePath)


    if (file.mimetype !== "image/heic") {
      return res.status(400).json({
        message: "You can convert only heic image format"
      })
    }

    const inputBuffer = fs.readFileSync(originalFilePath)

    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 1
    })

    fs.writeFileSync(heicToJpegFilePath, outputBuffer)

    const convertedFile = {
      format: "jpeg",
      filename: path.parse(file.filename).name + ".jpeg",
      path: heicToJpegFilePath,
      size: fs.statSync(heicToJpegFilePath).size
    }

    file.convertedFiles.push(convertedFile)
    await file.save();

    return res.status(200).json({
      message: "Converted heic To jpeg",
      convertedFile
    })

  } catch (error) {
    console.log("Error in converting heic to jpeg", error.message)
  }
}


// convert Image
// const convertImage = async (req, res) => {
//   try {
//     const fileId = req.params.id;
//     const targetFormat = req.params.format.toLowerCase();

//     console.log(`Converting file ID ${fileId} to ${targetFormat}`);

//     const validFormats = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'heic'];

//     if (!validFormats.includes(targetFormat)) {
//       return res.status(400).json({
//         message: "Invalid target format. Valid formats are png, jpg, jpeg, heic, ,webp,bmp"
//       });
//     }

//     const file = await File.findById(fileId);
//     if (!file) {
//       return res.status(400).json({
//         message: "File not found"
//       });
//     }

//     const originalFilePath = path.join(__dirname, "../../uploads", file.filename);
//     const convertedFilePath = path.join(__dirname, "../../uploads/converted", `${path.parse(file.filename).name}.${targetFormat}`);

//     ensureDirectoryExistence(convertedFilePath);

//     let tempFilePath = null;
//     let inputBuffer;

//     if (file.mimetype === "image/heic") {

//       console.log("Processing HEIC file");

//       inputBuffer = fs.readFileSync(originalFilePath);

//       const intermediateFormat = 'JPEG';

//       const outputBuffer = await heicConvert({
//         buffer: inputBuffer,
//         format: intermediateFormat,
//         quality: 1
//       });

//       console.log(outputBuffer)

//       tempFilePath = path.join(__dirname, "../../uploads/temp", `${path.parse(file.filename).name}.${intermediateFormat.toLowerCase()}`);

//       console.log(tempFilePath)

//       ensureDirectoryExistence(tempFilePath);
//       fs.writeFileSync(tempFilePath, outputBuffer);
//     }
//     else {
//       tempFilePath = originalFilePath;
//     }



//     if (targetFormat === 'bmp' || file.mimetype === 'image/bmp') {
//       console.log("Processing BMP file");
//       const image = await Jimp.read(tempFilePath);
//       console.log(`Image object: ${image}`);
//       await image.writeAsync(convertedFilePath);
//     }

//     else if(targetFormat === 'bmp' || file.mimetype === 'image/webp'){
//       console.log("Processing BMP file");
//       const image = await Jimp.read(tempFilePath);
//       console.log(`Image object: ${image}`);
//       await image.writeAsync(convertedFilePath);

//     } 
    
//     else {
//       console.log("Processing with Sharp");
//       await sharp(tempFilePath)
//         .toFormat(targetFormat)
//         .toFile(convertedFilePath);
//     }

//     if (file.mimetype === "image/heic") {
//       try {
//         fs.unlinkSync(tempFilePath); // Remove the temporary file
//         console.log("Temporary file deleted");
//       } catch (unlinkError) {
//         console.error("Error deleting temporary file:", unlinkError.message);
//       }
//     }


//     const convertedFile = {
//       format: targetFormat,
//       filename: `${path.parse(file.filename).name}.${targetFormat}`,
//       path: convertedFilePath,
//       size: fs.statSync(convertedFilePath).size,
//     };

//     file.convertedFiles.push(convertedFile);
//     await file.save();

//     return res.status(200).json({
//       message: `File converted to ${targetFormat.toUpperCase()}`,
//       convertedFile
//     });
//   } catch (error) {
//     console.log("Error in converting image:", error.message);
//     return res.status(500).json({
//       message: "Internal server error"
//     });
//   }
// };



export { uploadedFile, deleteFile, downloadFile, downloadFilesInZip, compressedFile50, compressedFileInRange, imageToPNG, imageToJPG, imageToWEBP, WebpToJpg, HeicToJpeg, imageToJPEG }
