import mongoose from 'mongoose';

const processedFileSchema = new mongoose.Schema({
  type: String, // e.g., 'cropped', 'numbered'
  filename: String,
  path: String,
  size: Number,
}, { _id : false });

const fileSchema = new mongoose.Schema({
    filename: String,
    originalname: String,
    mimetype: String,
    size: String,
    path: String,

    convertedFiles: [{
        format: String,
        filename: String,
        path: String,
        size: Number,
      }],
      
    processedFiles: [processedFileSchema]
  });

export default mongoose.model('File', fileSchema);
