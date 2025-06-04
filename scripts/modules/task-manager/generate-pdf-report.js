import fs from 'fs';
import PDFDocument from 'pdfkit';
import { readJSON } from '../utils.js';

/**
 * Generate a simple PDF task report.
 * @param {string} tasksPath
 * @param {string} outputPath
 * @returns {string}
 */
function generatePdfReport(tasksPath, outputPath) {
    const data = readJSON(tasksPath);
    if (!data || !Array.isArray(data.tasks)) {
        throw new Error(`No valid tasks found in ${tasksPath}`);
    }

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(outputPath));
    doc.fontSize(20).text('Task Report', { align: 'center' });
    doc.moveDown();

    data.tasks.forEach(t => {
        doc.fontSize(14).text(`ID: ${t.id} - ${t.title}`);
        doc.fontSize(10).text(`Status: ${t.status || 'pending'}`);
        doc.moveDown();
    });

    doc.end();
    return outputPath;
}

export default generatePdfReport;
