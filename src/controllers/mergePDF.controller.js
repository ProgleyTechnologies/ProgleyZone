import sharp from 'sharp';
import File from '../models/file.model.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

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

const mergePDF = async (req, res) => {
    try {
        const { fileIds } = req.body;

        // Fetch PDF documents from the database
        const pdfDocs = await File.find({ _id: { $in: fileIds } });

        if (!pdfDocs.length) {
            return res.status(400).json({
                message: 'No PDF files found to merge'
            });
        }

        // Initialize a new PDF document
        const mergedPdf = await PDFDocument.create();

        // Loop through each PDF document and merge
        for (const pdfDoc of pdfDocs) {
            // if (pdfDoc.mimetype !== 'application/pdf') {
            //     return res.status(400).json({
            //         message: 'Only PDF format files can be merged'
            //     });
            // }

            const existingPdfBytes = fs.readFileSync(pdfDoc.path); // Ensure this is the correct property for the file path
            const existingPdf = await PDFDocument.load(existingPdfBytes);
            const copiedPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
            copiedPages.forEach(page => {
                mergedPdf.addPage(page);
            });
        }

        // Save the merged PDF document
        const mergedPdfBytes = await mergedPdf.save();
        const mergedPdfPath = path.join(__dirname, '../../uploads/merged', `merged-${Date.now()}.pdf`);

        ensureDirectoryExistence(mergedPdfPath);

        fs.writeFileSync(mergedPdfPath, mergedPdfBytes);

        // Save the merged file details in the database
        const mergedFile = new File({
            filename: `merged-${Date.now()}.pdf`,
            path: mergedPdfPath,
            mimetype: 'application/pdf',
            size: fs.statSync(mergedPdfPath).size,
        });

        await mergedFile.save();

        return res.status(200).json({
            message: 'Files successfully merged',
            mergedFile
        });
    } catch (error) {
        console.error('Error in merging files', error.message);
        return res.status(500).json({
            message: 'Server Error'
        });
    }
};


// Merge Pdf and images
const mergeFiles = async (req, res) => {
    try {
        const { fileIds } = req.body;
        console.log(fileIds)

        // Fetch documents from the database
        const docs = await File.find({ _id: { $in: fileIds } });
        console.log(docs)

        if (!docs.length) {
            return res.status(400).json({
                message: 'No files found to merge'
            });
        }

        // Initialize a new PDF document
        const mergedPdf = await PDFDocument.create();

        for (const doc of docs) {
            try {
                const filePath = path.resolve(doc.path);
                console.log("Processing file:", filePath, "with mimetype:", doc.mimetype);

                if (doc.mimetype === 'application/pdf') {
                    // Load PDF file
                    const existingPdfBytes = fs.readFileSync(filePath);
                    const existingPdf = await PDFDocument.load(existingPdfBytes);
                    const copiedPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
                    copiedPages.forEach(page => {
                        mergedPdf.addPage(page);
                    });

                } else if (doc.mimetype.startsWith('image/')) {
                    // Convert image to PDF page
                    const imageBytes = fs.readFileSync(filePath);
                    const image = await sharp(imageBytes).resize({ width: 595 }).toBuffer();
                    const imagePage = mergedPdf.addPage([595, 842]); // A4 size

                    let imageEmbed;
                    if (doc.mimetype === "image/png") {
                        imageEmbed = await mergedPdf.embedPng(image)

                    } else if (doc.mimetype === "image/jpeg" || doc.mimetype === "image/jpg") {
                        imageEmbed = await mergedPdf.embedJpg(image)
                    }

                    else {
                        return res.status(400).json({
                            message: "unsupported file format"
                        })
                    }

                imagePage.drawImage(imageEmbed, {
                    x: 0,
                    y: 0,
                    width: 595,
                    height: imageEmbed.height * (595 / imageEmbed.width)
                });

            } 
            else {
                console.log("Unsupported file format:", doc.mimetype);
                return res.status(400).json({
                    message: 'Unsupported file format'
                });
            }
        
    } catch (innerError) {
        console.error("Error processing file:", doc.path, innerError);
        throw innerError;
    }
}

// Save the merged PDF document
const mergedPdfBytes = await mergedPdf.save();
console.log(mergedPdfBytes)
const mergedPdfPath = path.join(__dirname, '../../uploads/merged', `merged-${Date.now()}.pdf`);
console.log(mergedPdfPath)

ensureDirectoryExistence(mergedPdfPath);

fs.writeFileSync(mergedPdfPath, mergedPdfBytes);

// Save the merged file details in the database
const mergedFile = new File({
    filename: `merged-${Date.now()}.pdf`,
    path: mergedPdfPath,
    mimetype: 'application/pdf',
    size: fs.statSync(mergedPdfPath).size,
});

await mergedFile.save();

return res.status(200).json({
    message: 'Files successfully merged',
    mergedFile
});
    } catch (error) {
    console.error('Error in merging files', error.message);
    return res.status(500).json({
        message: 'Server Error'
    });
}
};

// Split PDF custom
const splitPdfCustom = async (req, res) => {
    try {
        const {fileId, startPage, endPage} = req.body;

        const file = await File.findById(fileId)

        if(!file || file.mimetype !== "application/pdf"){
            return res.status(400).json({
                message : "Unsupported file format"
            })
        }

        const filePath = path.resolve(file.path)
        const existingPdfBytes = fs.readFileSync(filePath)
        const existingPdf = await PDFDocument.load(existingPdfBytes)

        const PdfDoc = await PDFDocument.create();

        const copiedPages = await PdfDoc.copyPages(existingPdf, Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i));
        copiedPages.forEach(page => {
            PdfDoc.addPage(page);
        });


        const PdfBytes = await PdfDoc.save();
        const outputFilename = `split-${startPage}-${endPage}-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../../uploads/splits', outputFilename);

        ensureDirectoryExistence(outputPath)

        fs.writeFileSync(outputPath, PdfBytes)

        const splitPdf = new File({
            filename : outputFilename,
            path : outputPath,
            mimetype : 'application/pdf',
            size : fs.statSync(outputPath).size
        })

        await splitPdf.save();

        return res.status(200).json({
            message : "Pdf split in user range suuccessfully",
            splitPdf
        })
    
    } catch (error) {
        console.error('Error in splitting PDF', error.message);
        return res.status(500).json({
            message: 'Server Error'
        });
    }
}


// Split Pdf Fixed
const splitPdfFixed = async (req, res) => {
    try {
        const {fileId, chunkSize} = req.body;

        const file = await File.findById(fileId)

        if(!file || file.mimetype !== "application/pdf"){
            return res.status(400).json({
                message : "Unsupported file format"
            })
        }

        const filePath = path.resolve(file.path)
        const existingPdfBytes = fs.readFileSync(filePath)
        const existingPdf = await PDFDocument.load(existingPdfBytes)

        const totalPages = existingPdf.getPageCount();
        const splitFiles = [];

        for (let i = 0; i < totalPages; i += chunkSize) {
            const pdfDoc = await PDFDocument.create();
            const copiedPages = await pdfDoc.copyPages(existingPdf, Array.from({ length: Math.min(chunkSize, totalPages - i) }, (_, j) => i + j));
            copiedPages.forEach(page => {
                pdfDoc.addPage(page);
            });


            const pdfBytes = await pdfDoc.save();
            const outputFilename = `split-${i + 1}-${Math.min(i + chunkSize, totalPages)}-${Date.now()}.pdf`;
            const outputPath = path.join(__dirname, '../../uploads/splits', outputFilename);

            ensureDirectoryExistence(outputPath);
            fs.writeFileSync(outputPath, pdfBytes);

            const splitFile = new File({
                filename: outputFilename,
                path: outputPath,
                mimetype: 'application/pdf',
                size: fs.statSync(outputPath).size,
            });

            await splitFile.save();
            splitFiles.push(splitFile);
        }

        return res.status(200).json({
            message : "Pdf split in fixed suuccessfully",
            splitFiles
        })
    
    } catch (error) {
        console.error('Error in splitting PDF', error.message);
        return res.status(500).json({
            message: 'Server Error'
        });
    }
}

export { mergePDF, mergeFiles, splitPdfCustom, splitPdfFixed };