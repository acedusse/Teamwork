import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (_req, res) => {
res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
console.log(`TaskMaster UI running at http://localhost:${PORT}`);
});
