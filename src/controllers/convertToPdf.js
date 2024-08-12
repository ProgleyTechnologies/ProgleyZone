import sharp from 'sharp';
import File from '../models/file.model.js';
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { load } from '@pspdfkit/nodejs';
import docxpdf from "docx-pdf";
import Pptx2pdf from 'pptx2pdf';
import XLSX from "xlsx";
import toPdf from "office-to-pdf";
import PdfDocument from "pdfkit";
import libre from 'libreoffice-convert';
import { promisify } from 'util';




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


// convert PNG , JPG and JPEG image to Pdf ***
const imageToPdf = async (req, res) => {
  try {

    const { fileId, format, orientation, margin, quality } = req.body;
    console.log(req.body)

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(400).json({
        message: `File not found`
      });
    }

    const filePath = path.resolve(file.path);
    const imageBuffer = fs.readFileSync(filePath);

    // define page sizes
    const pageSizes = {
      'A4': { width: 595.28, height: 841.89 },
      'US Letter': { width: 612, height: 792 },
      'Fit As Image Size': null
    }

    const selectedSize = pageSizes[format] || pageSizes['Fit as Image Size'];
    console.log(selectedSize)

    // Define orientation
    const isLandscape = orientation === 'landscape';

    let marginSize;

    switch (margin) {

      case 'small':
        marginSize = 10;
        break;

      case 'big':
        marginSize = 50;
        break;

      case 'no margin':
      default:
        marginSize = 0
        break;
    }

    // Define quality
    let qualityValue;

    switch (quality) {

      case 'high':
        qualityValue = 80;
        break;

      case 'medium':
        qualityValue = 60;
        break;

      case 'low':
        qualityValue = 40;
        break;

      case 'same as image':
      default:
        qualityValue = 100;
        break;
    }

    let image;

    switch (file.mimetype) {
      case "image/png":
        image = await sharp(imageBuffer).png({ quality: qualityValue }).toBuffer();
        break;

      case "image/jpg":
      case "image/jpeg":
        image = await sharp(imageBuffer).jpeg({ quality: qualityValue }).toBuffer();
        break;


      default:
        return res.status(400).json({
          message: `Unsupported file format`
        });
    }

    if (!image || image.length === 0) {
      return res.status(400).json({
        message: `Invalid image buffer`
      });
    }

    console.log(`Image Buffer length`, image.length)
    // console.log(image)

    const imageMetaData = await sharp(image).metadata();
    console.log(`Image metadata is`, imageMetaData)

    const imageWidth = imageMetaData.width;
    const imageHeight = imageMetaData.height;

    const pageWidth = selectedSize ? selectedSize.width : imageWidth;
    const pageHeight = selectedSize ? selectedSize.height : imageHeight;
    // console.log(pageWidth, pageHeight)

    const pdfDoc = await PDFDocument.create()
    console.log(pdfDoc)
    const page = pdfDoc.addPage([pageWidth, pageHeight])
    console.log(page)


    try {
      let pdfImage;

      switch (file.mimetype) {
        case "image/png":
          pdfImage = await pdfDoc.embedPng(image);
          break;

        case "image/jpg":
        case "image/jpeg":
          pdfImage = await pdfDoc.embedJpg(image);
          break;

        default:
          throw new Error('Unsupported image format');
      }

      console.log('PDF image embedded:', pdfImage);

      // Calculate image placement
      const imagePlacementWidth = isLandscape ? pageHeight - 2 * marginSize : pageWidth - 2 * marginSize;
      console.log(imagePlacementWidth)

      const imagePlacementHeight = isLandscape ? pageWidth - 2 * marginSize : pageHeight - 2 * marginSize;
      console.log(imagePlacementHeight)

      const imageX = marginSize;
      const imageY = pageHeight - imagePlacementHeight - marginSize;
      console.log(imageX)
      console.log(imageY)

      page.drawImage(pdfImage, {
        x: imageX,
        y: imageY,
        width: imagePlacementWidth,
        height: imagePlacementHeight
      });

      const pdfBytes = await pdfDoc.save();
      console.log(pdfBytes)

      const outputFilename = `converted-pdf-${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '../../uploads/converted', outputFilename);

      ensureDirectoryExistence(outputPath);

      fs.writeFileSync(outputPath, pdfBytes);

      // Find the original file and update its processedFiles array
      file.processedFiles.push({
        type: 'converted',
        filename: outputFilename,
        path: outputPath,
        size: fs.statSync(outputPath).size,
      });

      await file.save();

      return res.status(200).json({
        message: 'Image file has been converted to PDF',
        convertedPdf: file,
      });
    } catch (embedError) {
      console.error('Error embedding image in PDF:', embedError.message);
      return res.status(500).json({
        message: 'Error embedding image in PDF',
      });
    }

  } catch (error) {
    console.error('Error in converting image to PDF', error.message);
    return res.status(500).json({
      message: 'Server Error',
    });

  }
}


// convert JPG to Pdf ***
const jpgToPdf = async (req, res) => {
  try {
    const { fileId, format, orientation, margin, quality } = req.body;

    const file = await File.findById(fileId);

    if (!file || (file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg')) {
      return res.status(400).json({
        message: 'File not found or unsupported file format',
      });
    }


    const filePath = path.resolve(file.path);
    const imageBuffer = fs.readFileSync(filePath);

    // define page sizes
    const pageSizes = {
      'A4': { width: 595.28, height: 841.89 },
      'US Letter': { width: 612, height: 792 },
      'Fit As Image Size': null
    }

    const selectedSize = pageSizes.format || pageSizes['Fit as Image Size'];
    console.log(selectedSize)

    // Define orientation
    const isLandscape = orientation === 'landscape';

    let marginSize;

    switch (margin) {

      case 'small':
        marginSize = 10;
        break;

      case 'big':
        marginSize = 50;
        break;

      case 'no margin':
      default:
        marginSize = 0
        break;
    }

    // Define quality
    let qualityValue;

    switch (quality) {

      case 'high':
        qualityValue = 80;
        break;

      case 'medium':
        qualityValue = 60;
        break;

      case 'low':
        qualityValue = 40;
        break;

      case 'same as image':
      default:
        qualityValue = 100;
        break;
    }

    const image = await sharp(imageBuffer)
      .jpeg({ quality: qualityValue })
      .toBuffer();

    const imageMetaData = await sharp(image).metadata();
    const imageWidth = imageMetaData.width;
    const imageHeight = imageMetaData.height;

    const pageWidth = selectedSize ? selectedSize.width : imageWidth;
    const pageHeight = selectedSize ? selectedSize.height : imageHeight;
    console.log(pageWidth, pageHeight)

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([pageWidth, pageHeight])


    const pdfImage = await pdfDoc.embedJpg(image);

    // Calculate image placement
    const imagePlacementWidth = isLandscape ? pageHeight - 2 * marginSize : pageWidth - 2 * marginSize;
    console.log(imagePlacementWidth)

    const imagePlacementHeight = isLandscape ? pageWidth - 2 * marginSize : pageHeight - 2 * marginSize;
    console.log(imagePlacementHeight)

    const imageX = marginSize;
    const imageY = pageHeight - imagePlacementHeight - marginSize;
    console.log(imageX)
    console.log(imageY)

    page.drawImage(pdfImage, {
      x: imageX,
      y: imageY,
      width: imagePlacementWidth,
      height: imagePlacementHeight
    });

    const pdfBytes = await pdfDoc.save();

    const outputFilename = `converted-pdf-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads/converted', outputFilename);

    ensureDirectoryExistence(outputPath);

    fs.writeFileSync(outputPath, pdfBytes);

    // Find the original file and update its processedFiles array
    file.processedFiles.push({
      type: 'converted',
      filename: outputFilename,
      path: outputPath,
      size: fs.statSync(outputPath).size,
    });

    await file.save();

    return res.status(200).json({
      message: 'JPG file has been converted to PDF',
      convertedPdf: file,
    });

  } catch (error) {
    console.error('Error in converting JPG to PDF', error.message);
    return res.status(500).json({
      message: 'Server Error',
    });
  }
}



// convert word to pdf ***
const wordToPdf = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Received fileId:', id);

    const file = await File.findById(id);
    console.log('Retrieved file:', file);

    if (!file) {
      return res.status(400).json({
        message: "File not found"
      });
    }


    const originalFilePath = path.join(__dirname, '../../uploads', file.filename);
    console.log('Original file path:', originalFilePath);

    ensureDirectoryExistence(originalFilePath)



    const pdfFilePath = path.join(__dirname, '../../uploads/converted', `converted${Date.now()}.pdf`);
    console.log('PDF file path:', pdfFilePath);

    ensureDirectoryExistence(pdfFilePath);  

    

    const docxBuf = fs.readFileSync(originalFilePath);
    

    // Convert .docx to PDF using libreoffice-convert with callback
    libre.convert(docxBuf, 'pdf', undefined, (err, pdfBuf) => {
      if (err) {
        console.error('Error converting file:', err.message);
        return res.status(500).json({ message: 'Error converting file', error: err.message });
      }

      // Write the PDF to the filesystem
      fs.writeFileSync(pdfFilePath, pdfBuf);

      // Save the new PDF file info to the database
      File.create({
        originalname: file.originalname,
        filename: path.basename(pdfFilePath),
        mimetype: 'application/pdf',
        size: fs.statSync(pdfFilePath).size,
        path: pdfFilePath,
      })
        .then((newFile) => {
          res.status(200).json({
            message: 'File converted to PDF successfully',
            convertedFile: newFile,
          });
        })
        .catch((saveErr) => {
          res.status(500).json({ message: 'Error saving converted file', error: saveErr.message });
        });
    });



  } catch (error) {
    console.log("Error in wordToPdf controller", error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}


// convert Ppts to pdf ***

const pptxToPdf = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'File Id not found' });
    }

    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = file.path;

    if (!filePath) {
      return res.status(400).json({ message: 'File path not found' });
    }

    const outputFilename = `output-${Date.now()}.pdf`;
    const outputDir = path.join(__dirname, '../../uploads');
    const outputPath = path.join(outputDir, outputFilename);

    ensureDirectoryExistence(outputDir);

    const pptxBuffer = fs.readFileSync(filePath);
    const pdfBuffer = await toPdf(pptxBuffer);

    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`PDF created successfully, saved to: ${outputPath}`);
    const fileSize = fs.statSync(outputPath).size;
    console.log(`File size: ${fileSize} bytes`);

    return res.status(200).json({
      message: 'PDF file created successfully',
      filename: outputFilename,
      path: outputPath,
      size: fileSize,
    });
  } catch (error) {
    console.error('Error in creating PDF:', error);
    return res.status(500).json({
      message: 'Server Error',
      error: error.message,
      stack: error.stack,
    });
  }
};


// text to pdf  ***
const textToPdf = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Received fileId:', id);

    const file = await File.findById(id);
    console.log('Retrieved file:', file);

    if (!file) {
      return res.status(400).json({
        message: "File not found"
      });
    }


    const originalFilePath = path.join(__dirname, '../../uploads', file.filename);
    console.log('Original file path:', originalFilePath);

    ensureDirectoryExistence(originalFilePath)



    const pdfFilePath = path.join(__dirname, '../../uploads/converted', `converted${Date.now()}.pdf`);
    console.log('PDF file path:', pdfFilePath);

    ensureDirectoryExistence(pdfFilePath);  

    

    const textBuf = fs.readFileSync(originalFilePath);
    

    // Convert .docx to PDF using libreoffice-convert with callback
    libre.convert(textBuf, 'pdf', undefined, (err, pdfBuf) => {
      if (err) {
        console.error('Error converting file:', err.message);
        return res.status(500).json({ message: 'Error converting file', error: err.message });
      }

      // Write the PDF to the filesystem
      fs.writeFileSync(pdfFilePath, pdfBuf);

      // Save the new PDF file info to the database
      File.create({
        originalname: file.originalname,
        filename: path.basename(pdfFilePath),
        mimetype: 'application/pdf',
        size: fs.statSync(pdfFilePath).size,
        path: pdfFilePath,
      })
        .then((newFile) => {
          res.status(200).json({
            message: 'File converted to PDF successfully',
            convertedFile: newFile,
          });
        })
        .catch((saveErr) => {
          res.status(500).json({ message: 'Error saving converted file', error: saveErr.message });
        });
    });
  }
  catch{
    console.log("Error in Text To Pdf controller", error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}



// excel to  ***
const excelToPdf = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Received fileId:', id);

    const file = await File.findById(id);
    console.log('Retrieved file:', file);

    if (!file) {
      return res.status(400).json({
        message: "File not found"
      });
    }


    const originalFilePath = path.join(__dirname, '../../uploads', file.filename);
    console.log('Original file path:', originalFilePath);

    ensureDirectoryExistence(originalFilePath)



    const pdfFilePath = path.join(__dirname, '../../uploads/converted', `converted${Date.now()}.pdf`);
    console.log('PDF file path:', pdfFilePath);

    ensureDirectoryExistence(pdfFilePath);  

    

    const excelBuf = fs.readFileSync(originalFilePath);
    

    // Convert .docx to PDF using libreoffice-convert with callback
    libre.convert(excelBuf, 'pdf', undefined, (err, pdfBuf) => {
      if (err) {
        console.error('Error converting file:', err.message);
        return res.status(500).json({ message: 'Error converting file', error: err.message });
      }

      // Write the PDF to the filesystem
      fs.writeFileSync(pdfFilePath, pdfBuf);

      // Save the new PDF file info to the database
      File.create({
        originalname: file.originalname,
        filename: path.basename(pdfFilePath),
        mimetype: 'application/pdf',
        size: fs.statSync(pdfFilePath).size,
        path: pdfFilePath,
      })
        .then((newFile) => {
          res.status(200).json({
            message: 'File converted to PDF successfully',
            convertedFile: newFile,
          });
        })
        .catch((saveErr) => {
          res.status(500).json({ message: 'Error saving converted file', error: saveErr.message });
        });
    });
  }
  catch{
    console.log("Error in Text To Pdf controller", error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}


export { jpgToPdf, wordToPdf, pptxToPdf, textToPdf, excelToPdf, imageToPdf }

