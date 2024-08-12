import File from '../models/file.model.js';
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import ConvertApi from 'convertapi';
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

// protect pdf

const protectPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, confirmPassword } = req.body;

        if (!id) {
            return res.status(400).json({
                message: "Id not found"
            })
        }

        if (!password || !confirmPassword) {
            return res.status(400).json({
                message: "Password and confirm Password are required"
            })

        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Password and confirm Password does not match"
            })

        }

        const file = await File.findById(id)

        if (!file) {
            return res.status(400).json({
                message: "file not found"
            })

        }

        const filePath = file.path;

        const outputFilename = `outputFile ${Date.now()}.pdf`;
        const outputPath = path.join(os.homedir(), 'Desktop')
        ensureDirectoryExistence(outputPath)

        const result = await convertApi.convert('pdf', {
            File: filePath,
            Password: password

        })

        console.log(result)

        await result.file.save(outputPath)

        return res.status(200).json({
            message: "Pdf File successfully secured",
            file: outputPath,
            size: fs.statSync(outputPath).size
        })

    } catch (error) {
        console.error('Error in protecting PDF:', error);
        res.status(500).json({ message: 'Internal server error' });

    }
}

export{protectPdf}