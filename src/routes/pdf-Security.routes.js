import express from 'express';
import { protectPdf } from '../controllers/pdf-Security.controller.js';

const securityRouter = express.Router();

securityRouter.post('/secure-pdf/:id', protectPdf)

export default securityRouter