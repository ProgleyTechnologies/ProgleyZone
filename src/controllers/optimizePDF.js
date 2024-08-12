import File from '../models/file.model.js';
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import { exec } from 'child_process';




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

const getgsCompressionSetting = (level) => {
  if (level >= 75) return '/prepress';
  if (level >= 50) return '/printer';
  if (level >= 25) return '/ebook';
  return '/screen';
}


const compressPdf = async (req, res) => {
  try {

    const {compressionLevel} = req.body;
    const level = parseInt(compressionLevel);

    if(isNaN(level) || level < 1 || level > 100){
      return res.status(400).json({
        message: 'Invalid compression level.It must be between 1 to 100',
      });
    }

    const gsCompressionSetting = getgsCompressionSetting(level);
    
    
    
    const fileId = req.params.id;
    console.log(`File ID: ${fileId}`);

    const file = await File.findById(fileId);
    console.log("File exist", file)

    if (!file) {
      console.error(`File with ID ${fileId} not found`);
      return res.status(400).json({
        message: 'File not found',
      });
    }

    if (file.mimetype !== 'application/pdf') {
      console.error(`Unsupported file format: ${file.mimetype}`);
      return res.status(400).json({
        message: 'Unsupported file format',
      });
    }

    const filePath = path.resolve(file.path);
    const outputFilename = `compressed-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads/compressed', outputFilename);

    ensureDirectoryExistence(outputPath);

    // Determine the Ghostscript command based on the OS
    const gsCommand = process.platform === 'win32' 
      ? `gswin64c -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsCompressionSetting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${filePath}"`
      : `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${filePath}"`;

      console.log(gsCommand)

    // Execute the Ghostscript command
    exec(gsCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error in compressing PDF: ${error.message}`);
        return res.status(500).json({
          message: 'Error in compressing PDF',
          error: error.message,
        });
      }

      console.log(`Compression successful, saved to: ${outputPath}`);

      // Log file sizes for debugging
      const originalFileSize = (fs.statSync(filePath).size / 1024).toFixed(2) + 'KB' ;
      const compressedFileSize = (fs.statSync(outputPath).size / 1024).toFixed(2) + 'KB';
      console.log(`Original file size: ${originalFileSize} bytes`);
      console.log(`Compressed file size: ${compressedFileSize} bytes`);

      // Save compressed PDF information to the database
      const compressedPdf = new File({
        filename: outputFilename,
        path: outputPath,
        size: compressedFileSize,
        mimetype: 'application/pdf',
      });

      compressedPdf.save()
        .then(() => {
          return res.status(200).json({
            message: 'PDF file is compressed',
            compressedPdf,
          });
        })
        .catch(saveError => {
          console.error('Error saving compressed PDF:', saveError);
          return res.status(500).json({
            message: 'Error saving compressed PDF',
            error: saveError.message,
          });
        });
    });
  } catch (error) {
    console.error('Error in compressing PDF:', error);
    return res.status(500).json({
      message: 'Server Error',
      error: error.message,
      stack: error.stack,
    });
  }
};


export {compressPdf}