import fs from 'fs';

// Read the routes file
const routesPath = 'server/routes/tasks.js';
let content = fs.readFileSync(routesPath, 'utf8');

// Replace the problematic function call
content = content.replace(
    'const statistics = getDashboardStatistics(start, end, period);',
    'const statistics = getActivityStatistics(start, end);'
);

// Write back the file
fs.writeFileSync(routesPath, content);

console.log('✅ Fixed the analytics endpoint function call'); 