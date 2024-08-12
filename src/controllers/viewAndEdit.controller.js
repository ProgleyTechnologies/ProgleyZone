import File from '../models/file.model.js';
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';



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

// crop pdf page ***
const cropPdfPage = async (req, res) => {
    try {
        const { fileId, cropBox, allPages, pageIndex } = req.body;
        console.log(req.body)

        const file = await File.findById(fileId)

        if (!file || file.mimetype !== "application/pdf") {
            return res.status(400).json({
                message: "File not found & unsupported File format"
            })
        }

        const filePath = path.resolve(file.path)
        const existingfPdfBytes = fs.readFileSync(filePath)
        const existingPdf = await PDFDocument.load(existingfPdfBytes)

        const pdfDoc = await PDFDocument.create();
        const totalPages = existingPdf.getPageCount();

        const copiedPages = await pdfDoc.copyPages(existingPdf, Array.from({ length: totalPages }, (_, i) => i));

        // console.log(copiedPages)

        copiedPages.forEach((page, index) => {
            if (allPages || index === pageIndex) {
                page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
            }
            pdfDoc.addPage(page);
        });

        const pdfBytes = await pdfDoc.save();

        const outputFilename = `cropped-${Date.now}.pdf`;
        const outputPath = path.join(__dirname, '../../uploads/cropped', outputFilename)

        ensureDirectoryExistence(outputPath);

        fs.writeFileSync(outputPath, pdfBytes)

        const croppedPdf = new File({
            filename: outputFilename,
            path: outputPath,
            size: fs.statSync(outputPath).size,
            mimetype: 'application/pdf'
        })

        await croppedPdf.save();

        return res.status(200).json({
            message: "Pdf file is cropped",
            croppedPdf
        })

    } catch (error) {
        console.error('Error in cropping PDF', error.message);
        return res.status(500).json({
            message: 'Server Error',
        });
    }
}

// organize pdf ***
const organizePdf = async (req, res) => {
    try {
        const { fileId, deletePages, zoomPages } = req.body;
        console.log(req.body)

        const file = await File.findById(fileId)

        if (!file || file.mimetype !== "application/pdf") {
            return res.status(400).json({
                message: "File not found & unsupported File format"
            })
        }

        const filePath = path.resolve(file.path);
        const existingPdfBytes = fs.readFileSync(filePath)
        const existingPdf = await PDFDocument.load(existingPdfBytes)

        const pdfDoc = await PDFDocument.create();
        console.log(pdfDoc)
        const totalPages = existingPdf.getPageCount();
        console.log(totalPages)

        const pagesToDelete = new Set(deletePages || [])
        console.log(pagesToDelete)
        const zoomConfig = zoomPages || {}

        const copiedPages = await pdfDoc.copyPages(existingPdf, Array.from({ length: totalPages }, (_, i) => i))
        console.log(copiedPages)

        copiedPages.forEach((page, index) => {
            if (!pagesToDelete.has(index)) {
                if (zoomConfig[index]) {
                    const { scale } = zoomConfig[index]
                    const { width, height } = page.getSize();
                    page.scale(scale, scale, { x: width / 2, y: height / 2 });
                }
                pdfDoc.addPage(page)

            }
        })

        const pdfBytes = await pdfDoc.save();

        const outputFilename = `organize-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../../uploads/organized', outputFilename);

        ensureDirectoryExistence(outputPath);
        fs.writeFileSync(outputPath, pdfBytes);

        const organizedFile = new File({
            filename: outputFilename,
            path: outputPath,
            mimetype: 'application/pdf',
            size: fs.statSync(outputPath).size,
        });

        await organizedFile.save();

        return res.status(200).json({
            message: 'PDF organized successfully',
            organizedFile,
        });

    } catch (error) {
        console.error('Error in organizing PDF', error.message);
        return res.status(500).json({
            message: 'Server Error',
        });
    }
}

// rotate pdf page wise ***
const rotatePdfPage = async (req, res) => {
    try {
        const { fileId, rotatePages, deletePages } = req.body;

        const file = await File.findById(fileId)

        if (!file || file.mimetype !== "application/pdf") {
            return res.status(400).json({
                message: "File not found & unsupported File format"
            })
        }

        const filePath = path.resolve(file.path);
        const existingPdfBytes = fs.readFileSync(filePath)
        const existingPdf = await PDFDocument.load(existingPdfBytes)

        const pdfDoc = await PDFDocument.create();
        const totalPages = existingPdf.getPageCount()
        const pagesToDelete = new Set(deletePages || [])
        const rotateConfig = rotatePages || {}

        const copiedPages = await pdfDoc.copyPages(existingPdf, Array.from({ length: totalPages }, (_, i) => i))
        console.log(copiedPages)

        copiedPages.forEach((page, index) => {
            if (!pagesToDelete.has(index)) {
                if (rotateConfig[index]) {
                    const { angle } = rotateConfig[index]
                    page.setRotation(degrees(angle))
                }
                pdfDoc.addPage(page)

            }
        })

        const pdfBytes = await pdfDoc.save();

        const outputFilename = `rotate-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../../uploads/rotate', outputFilename);

        ensureDirectoryExistence(outputPath);
        fs.writeFileSync(outputPath, pdfBytes);

        const rotatePdfPages = new File({
            filename: outputFilename,
            path: outputPath,
            mimetype: 'application/pdf',
            size: fs.statSync(outputPath).size,
        });

        await rotatePdfPages.save();

        return res.status(200).json({
            message: 'PDF pages rotate successfully',
            rotatePdfPages
        });



    } catch (error) {
        console.error('Error in rotating PDF pages', error.message);
        return res.status(500).json({
            message: 'Server Error',
        });

    }
}


// rotate pdf page wise ***
const rotateoverAllPdf = async (req, res) => {
    try {
        const { fileId, rotateDirection, deletePages } = req.body;

        const file = await File.findById(fileId)

        if (!file || file.mimetype !== "application/pdf") {
            return res.status(400).json({
                message: "File not found & unsupported File format"
            })
        }

        const filePath = path.resolve(file.path);
        const existingPdfBytes = fs.readFileSync(filePath)
        const existingPdf = await PDFDocument.load(existingPdfBytes)

        const pdfDoc = await PDFDocument.create();
        const totalPages = existingPdf.getPageCount()
        const pagesToDelete = new Set(deletePages || [])
        const angle = rotateDirection === "left" ? degrees(-90) : degrees(90)

        const copiedPages = await pdfDoc.copyPages(existingPdf, Array.from({ length: totalPages }, (_, i) => i))
        console.log(copiedPages)

        copiedPages.forEach((page, index) => {
            if (!pagesToDelete.has(index)) {
                page.setRotation(angle)
                pdfDoc.addPage(page)

            }
        })

        const pdfBytes = await pdfDoc.save();

        const outputFilename = `rotate-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../../uploads/rotate', outputFilename);

        ensureDirectoryExistence(outputPath);
        fs.writeFileSync(outputPath, pdfBytes);

        const rotatedOverAllPdf = new File({
            filename: outputFilename,
            path: outputPath,
            mimetype: 'application/pdf',
            size: fs.statSync(outputPath).size,
        });

        await rotatedOverAllPdf.save();

        return res.status(200).json({
            message: 'PDF rotate successfully',
            rotatedOverAllPdf
        });



    } catch (error) {
        console.error('Error in rotating PDF', error.message);
        return res.status(500).json({
            message: 'Server Error',
        });

    }
}

// remove pdf pages ***
const removePdfPages = async (req, res) => {
    try {
        const { fileId, deletePages } = req.body;

        const file = await File.findById(fileId)

        if (!file || file.mimetype !== "application/pdf") {
            return res.status(400).json({
                message: "File not found & unsupported File format"
            })
        }

        const filePath = path.resolve(file.path);
        const existingPdfBytes = fs.readFileSync(filePath)
        const existingPdf = await PDFDocument.load(existingPdfBytes)

        const pdfDoc = await PDFDocument.create();
        const totalPages = existingPdf.getPageCount()
        const pagesToDelete = new Set(deletePages || [])



        const pagesToKeep = Array.from({ length: totalPages }, ((_, i) => i)).filter(index => (!pagesToDelete.has(index)))

        const copiedPages = await pdfDoc.copyPages(existingPdf, pagesToKeep)
        console.log(copiedPages)
        copiedPages.forEach(page => pdfDoc.addPage(page));


        const pdfBytes = await pdfDoc.save();

        const outputFilename = `remove-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../../uploads/remove', outputFilename);

        ensureDirectoryExistence(outputPath);
        fs.writeFileSync(outputPath, pdfBytes);

        const removePdf = new File({
            filename: outputFilename,
            path: outputPath,
            mimetype: 'application/pdf',
            size: fs.statSync(outputPath).size,
        });

        await removePdf.save();

        return res.status(200).json({
            message: 'PDF pages removed successfully',
            removePdf
        });



    } catch (error) {
        console.error('Error in remove PDF pages', error.message);
        return res.status(500).json({
            message: 'Server Error',
        });

    }
}

// extract pdf pages ***
const extractPdfPages = async (req, res) => {
    try {
        const { fileId, extractPages } = req.body;

        const file = await File.findById(fileId)

        if (!file || file.mimetype !== "application/pdf") {
            return res.status(400).json({
                message: "File not found & unsupported File format"
            })
        }

        const filePath = path.resolve(file.path);
        const existingPdfBytes = fs.readFileSync(filePath)
        const existingPdf = await PDFDocument.load(existingPdfBytes)

        const extractedPdf = [];


        for (let pageIndex of extractPages) {
            if (pageIndex < 0 || pageIndex >= existingPdf.getPageCount()) {
                return res.status(400).json({
                    messsage: "Page index is not valid"
                })

            }

            const pdfDoc = await PDFDocument.create()
            const [extractedPage] = await pdfDoc.copyPages(existingPdf, [pageIndex])
            pdfDoc.addPage(extractedPage)

            const pdfBytes = await pdfDoc.save();

            const outputFilename = `extractedPages-${Date.now()}.pdf`;
            const outputPath = path.join(__dirname, '../../uploads/extractedPdfPages', outputFilename);

            ensureDirectoryExistence(outputPath);
            fs.writeFileSync(outputPath, pdfBytes);

            const extractedPdfPages = new File({
                filename: outputFilename,
                path: outputPath,
                mimetype: 'application/pdf',
                size: fs.statSync(outputPath).size,
            });

            await extractedPdfPages.save();
            extractedPdf.push(extractedPdfPages)


        }

        return res.status(200).json({
            message: 'Extracted Pdf Pages successfully',
            extractedPdf
        });



    } catch (error) {
        console.error('Error in extracted Pdf Pages', error.message);
        return res.status(500).json({
            message: 'Server Error',
        });

    }
}


// extract images from pdf
// const extractImagesFromPdf = async (req, res) => {
//     try {
//         const { fileId } = req.body;

//         if (!fileId) {
//             return res.status(400).json({
//                 message: 'Invalid request data'
//             });
//         }

//         const file = await File.findById(fileId);

//         if (!file || file.mimetype !== 'application/pdf') {
//             return res.status(400).json({
//                 message: 'File not found or unsupported file format'
//             });
//         }

//         const filePath = path.resolve(file.path);
//         const fileBuffer = fs.readFileSync(filePath);

//         const pdfData = await PdfParse(fileBuffer);

//         const extractedImages = [];
//         const pdfDoc = await PDFDocument.load(fileBuffer);

//         for (let i = 0; i < pdfDoc.getPageCount(); i++) {
//             const page = pdfDoc.getPage(i);
//             const { view } = new JSDOM(pdfData.text);
//             const canvas = view.document.createElement('canvas');
//             const context = canvas.getContext('2d');

//             // Assuming page dimensions for canvas
//             canvas.width = page.getWidth();
//             canvas.height = page.getHeight();
//             context.fillStyle = 'white';
//             context.fillRect(0, 0, canvas.width, canvas.height);

//             // Extract images from the page
//             const images = page.node.PDFImages;
//             for (let j = 0; j < images.length; j++) {
//                 const image = images[j];
//                 const imgData = image.obj.data;
//                 const imgType = image.obj.filter;

//                 const outputFilename = `extracted-image-${i + 1}-${j + 1}-${Date.now()}.png`;
//                 const outputPath = path.join(__dirname, '../../uploads/extracted', outputFilename);

//                 ensureDirectoryExistence(outputPath);

//                 fs.writeFileSync(outputPath, imgData);

//                 const extractedImage = new File({
//                     filename: outputFilename,
//                     path: outputPath,
//                     mimetype: `image/${imgType === 'DCTDecode' ? 'jpeg' : 'png'}`,
//                     size: fs.statSync(outputPath).size,
//                 });

//                 await extractedImage.save();
//                 extractedImages.push(extractedImage);
//             }
//         }

//         return res.status(200).json({
//             message: 'Images extracted successfully',
//             extractedImages
//         });

//     } catch (error) {
//         console.error('Error in extracting images from PDF', error.message);
//         return res.status(500).json({
//             message: 'Server Error',
//         });
//     }
// };






// Add page Number to pdf

// ***
const addPageNumbers = async (req, res) => {
    try {
        const { fileId, startPage, fromPage, toPage, color, margin, textSize } = req.body;

        console.log(req.body);

        const file = await File.findById(fileId);

        if (!file || file.mimetype !== 'application/pdf') {
            return res.status(400).json({
                message: 'File not found or unsupported file format',
            });
        }

        const filePath = path.resolve(file.path)
        const existingPdfBytes = fs.readFileSync(filePath)
        const existingPdf = await PDFDocument.load(existingPdfBytes)

        const pdfDoc = await PDFDocument.create();

        const totalPages = existingPdf.getPageCount();
        const copiedPages = await pdfDoc.copyPages(existingPdf, Array.from({ length: totalPages }, (_, i) => i));


        console.log(copiedPages);

        const colorComponents = color.split(',').map(Number)
        console.log(colorComponents)
        const textColor = rgb(colorComponents[0] / 255, colorComponents[1] / 255, colorComponents[2] / 255);
        // console.log(textColor)

        let marginValue;

        switch (margin) {

            case 'low':
                marginValue = 10;
                break;

            case 'medium':
                marginValue = 20;
                break;

            case 'high':
                marginValue = 30;
                break;

            default:
                marginValue = 10

        }

        copiedPages.forEach((page, index) => {
            console.log(page, index)
            if (index + 1 >= fromPage && index + 1 <= toPage) {
                page.drawText(`${startPage + index - fromPage + 1}`, {
                    x: page.getWidth() / 2,
                    y: marginValue,
                    size: textSize,
                    color: textColor,
                    align: 'center',
                });
            }
            pdfDoc.addPage(page);
        });

        const pdfBytes = await pdfDoc.save();

        const outputFilename = `numbered-pdf-${Date.now()}.pdf`
        const outputPath = path.join(__dirname, '../../uploads/numbered', outputFilename)

        ensureDirectoryExistence(outputPath)

        fs.writeFileSync(outputPath, pdfBytes)

        // Find the original file and update its processedFiles array
        file.processedFiles.push({
            type: 'numbered',
            filename: outputFilename,
            path: outputPath,
            size: fs.statSync(outputPath).size,
        });

        await file.save();

        return res.status(200).json({
            message: 'PDF file has been numbered',
            numberedPdf: file
        });

    } catch (error) {
        console.error('Error in adding page numbers to PDF', error.message);
        return res.status(500).json({
            message: 'Server Error',
        });

    }
}

// Add waterMark to pdf
const addWaterMark = async (req, res) => {
    try {
        const { fileId, text, fromPage, toPage, angle, font, color, textSize, transparency } = req.body;

        const file = await File.findById(fileId);

        if (!file || file.mimetype !== 'application/pdf') {
            return res.status(400).json({
                message: 'File not found or unsupported file format',
            });
        }

        const filePath = path.resolve(file.path)
        const existingPdfBytes = fs.readFileSync(filePath)
        const existingPdf = await PDFDocument.load(existingPdfBytes)

        const pdfDoc = await PDFDocument.create();

        const totalPages = existingPdf.getPageCount();
        const copiedpages = await pdfDoc.copyPages(existingPdf, Array.from({ length: totalPages }, (_, i) => i))

        const colorComponents = color.split(',').map(Number)
        const textColor = rgb(colorComponents[0] / 255, colorComponents[1] / 255, colorComponents[2] / 255)


        let selectedFont;
        switch (font) {
            case 'arial':
                selectedFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
                break;

            case 'timesRoman':

                selectedFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
                break;

            case 'timesRomanBold':
                selectedFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
                break;


            default:
                selectedFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
                break;
        }

        let rotation = 0;
        switch (angle) {
            case '45':
                rotation = 45 * (Math.PI / 180);
                break;
            case '90':
                rotation = 90 * (Math.PI / 180);
                break;
            case '135':
                rotation = 135 * (Math.PI / 180);
                break;
            case '180':
                rotation = 180 * (Math.PI / 180);
                break;
            default:
                rotation = 0;
                break;
        }

        copiedpages.forEach((page, index) => {
            if (index + 1 >= fromPage && index + 1 <= toPage) {
                const { width, height } = page.getSize();

                page.drawText(text, {
                    x: width / 2,
                    y: height / 2,
                    size: textSize,
                    font: selectedFont,
                    color: textColor,
                    rotate: rotation ? rotation * (Math.PI / 180) : undefined,
                    opacity: transparency,
                })

            }

            pdfDoc.addPage(page)
        })

        const pdfBytes = await pdfDoc.save();

        const outputFilename = `watermarked-pdf-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../../uploads/watermarked', outputFilename);

        ensureDirectoryExistence(outputPath);

        fs.writeFileSync(outputPath, pdfBytes);

        // Find the original file and update its processedFiles array
        file.processedFiles.push({
            type: 'watermarked',
            filename: outputFilename,
            path: outputPath,
            size: fs.statSync(outputPath).size,
        });

        await file.save();

        return res.status(200).json({
            message: 'PDF file has been watermarked',
            watermarkedPdf: file,
        });

    } catch (error) {
        console.error('Error in adding watermark to PDF', error.message);
        return res.status(500).json({
            message: 'Server Error',
        });
    }

}


export { cropPdfPage, organizePdf, rotatePdfPage, rotateoverAllPdf, removePdfPages, extractPdfPages, addPageNumbers, addWaterMark }