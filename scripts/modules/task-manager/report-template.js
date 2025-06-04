import fs from 'fs';
import ejs from 'ejs';

/**
 * Render a report using an EJS template and data.
 * @param {string} templatePath
 * @param {object} data
 * @param {string} outputPath
 * @returns {string}
 */
function renderReportTemplate(templatePath, data, outputPath) {
    const template = fs.readFileSync(templatePath, 'utf8');
    const output = ejs.render(template, data);
    fs.writeFileSync(outputPath, output, 'utf8');
    return outputPath;
}

export default renderReportTemplate;
