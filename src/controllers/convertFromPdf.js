import File from '../models/file.model.js';
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import ConvertApi from 'convertapi';
import { Document, Packer, Paragraph, PageOrientation, SectionType } from 'docx';
import { PDFDocument } from 'pdf-lib';
import ExcelJS from 'exceljs';
import libre from 'libreoffice-convert';
import os from "os";


const convertApi = new ConvertApi(process.env.CONVERTAPI_SECRET);




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


// pdf to jpg  ***
const pdfToJpg = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode } = req.query; // mode can be 'page-to-image' or 'extract-images'

    if (!id) {
      return res.status(400).json({ message: 'Id not found' });
    }

    const file = await File.findById(id);
    console.log(file);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = file.path;

    if (!filePath) {
      return res.status(400).json({ message: 'File path not found' });
    }

    const outputDir = path.join(os.homedir(), 'Desktop');
    ensureDirectoryExistence(outputDir);

    let result, outputFiles = [];

    if (mode === 'page-to-image') {

      result = await convertApi.convert('jpg', {
        File: filePath,
      }, 'pdf')

    } else if (mode === 'extract-images') {
      result = await convertApi.convert('extract-images', {
        File: filePath,

      }, 'pdf')

    } else {
      return res.status(400).json({
        message: "Invalid mode"
      })
    }

    for (let i = 0; i < result.files.length; i++) {
      const outputFilename = `outputFile + ${Date.now()}-${i}.jpg`;
      const outputPath = path.join(outputDir, outputFilename)
      await result.files[i].save(outputPath);
      const fileSize = fs.statSync(outputPath).size;

      console.log(`File saved: ${outputPath}, size: ${fileSize} bytes`);
      outputFiles.push({
        filename: outputFilename,
        path: outputPath,
        size: fileSize,
      });
    }

    return res.status(200).json({
      message: 'JPG files created successfully',
      files: outputFiles,
    })


  } catch (error) {
    console.error('Error in creating JPG files:', error);
    return res.status(500).json({
      message: 'Server Error',
      error: error.message,
      stack: error.stack,
    });

  }
}



// pdf to word ***
const pdfToWord = async (req, res) => {
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


    const originalFilePath = path.join(__dirname, '../../uploads', file.filename).replace(/\\/g, '/');
    console.log('Original file path:', originalFilePath);

    ensureDirectoryExistence(originalFilePath)



    const wordFilePath = path.join(__dirname, '../../uploads/converted', `converted${Date.now()}.docx`).replace(/\\/g, '/');
    console.log('Word file path:', wordFilePath);

    ensureDirectoryExistence(wordFilePath);



    const pdfBuf = fs.readFileSync(originalFilePath);


    // Convert .docx to PDF using libreoffice-convert with callback
    libre.convert(pdfBuf, '.docx', undefined, (err, wordBuf) => {
      if (err) {
        console.error('Error converting file:', err.message);
        return res.status(500).json({ message: 'Error converting file', error: err.message });
      }

      // Write the PDF to the filesystem
      fs.writeFileSync(wordFilePath, wordBuf);

      // Delay cleanup of temp files
      setTimeout(() => {
        console.log('Temporary files should be cleaned up now.');
      }, 120000); // 5-second delay

      // Save the new PDF file info to the database
      File.create({
        originalname: file.originalname,
        filename: path.basename(wordFilePath),
        mimetype: 'docx',
        size: fs.statSync(wordFilePath).size,
        path: wordFilePath,
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


// Pdf to PPtx ***

const pdfToPptx = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Id not found' });
    }

    const file = await File.findById(id);
    console.log(file)

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = file.path;

    if (!filePath) {
      return res.status(400).json({ message: 'File path not found' });
    }

    const outputFilename = `output-${Date.now()}.pptx`;
    const outputDir = path.join(os.homedir(), 'Desktop');
    console.log(outputDir)
    const outputPath = path.join(outputDir, outputFilename);

    ensureDirectoryExistence(outputDir);

    const result = await convertApi.convert('pptx', {
      File: filePath,
    }, 'pdf');

    console.log(result)

    await result.file.save(outputPath);

    console.log(`PPTX created successfully, saved to: ${outputPath}`);
    const fileSize = fs.statSync(outputPath).size;
    console.log(`File size: ${fileSize} bytes`);

    return res.status(200).json({
      message: 'PPTX file created successfully',
      filename: outputFilename,
      path: outputPath,
      size: fileSize,
    });
  } catch (error) {
    console.error('Error in creating PPTX:', error);
    return res.status(500).json({
      message: 'Server Error',
      error: error.message,
      stack: error.stack,
    });
  }
};


// pdf to excel ***
const pdfToExcel = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Id not found' });
    }

    const file = await File.findById(id);
    console.log(file)

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = file.path;

    if (!filePath) {
      return res.status(400).json({ message: 'File path not found' });
    }

    const outputFilename = `output-${Date.now()}.xlsx`;
    const outputDir = path.join(os.homedir(), 'Desktop');
    console.log(outputDir)
    const outputPath = path.join(outputDir, outputFilename);

    ensureDirectoryExistence(outputDir);

    const result = await convertApi.convert('xlsx', {
      File: filePath,
    }, 'pdf');

    console.log(result)

    await result.file.save(outputPath);

    console.log(`XLSX created successfully, saved to: ${outputPath}`);
    const fileSize = fs.statSync(outputPath).size;
    console.log(`File size: ${fileSize} bytes`);

    return res.status(200).json({
      message: 'XLSX file created successfully',
      filename: outputFilename,
      path: outputPath,
      size: fileSize,
    });
  } catch (error) {
    console.error('Error in creating PPTX:', error);
    return res.status(500).json({
      message: 'Server Error',
      error: error.message,
      stack: error.stack,
    });
  }
};


// pdf to text ***

const pdfToText = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Id not found' });
    }

    const file = await File.findById(id);
    console.log(file);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = file.path;

    if (!filePath) {
      return res.status(400).json({ message: 'File path not found' });
    }

    const outputFilename = `output-${Date.now()}.txt`;
    const outputDir = path.join(os.homedir(), 'Desktop');
    console.log(outputDir);
    const outputPath = path.join(outputDir, outputFilename);

    ensureDirectoryExistence(outputDir);

    const result = await convertApi.convert('txt', {
      File: filePath,
    }, 'pdf');

    console.log(result);

    await result.file.save(outputPath);

    console.log(`Text file created successfully, saved to: ${outputPath}`);
    const fileSize = fs.statSync(outputPath).size;
    console.log(`File size: ${fileSize} bytes`);

    return res.status(200).json({
      message: 'Text file created successfully',
      filename: outputFilename,
      path: outputPath,
      size: fileSize,
    });
  } catch (error) {
    console.error('Error in creating text file:', error);
    return res.status(500).json({
      message: 'Server Error',
      error: error.message,
      stack: error.stack,
    });
  }
};

export { pdfToWord, pdfToPptx, pdfToExcel, pdfToText, pdfToJpg }