import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const ENV = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `.env.${ENV}`);
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const staticDir = ENV === 'production'
  ? path.join(__dirname, '../dist/public')
  : path.join(__dirname, '../public');
app.use(express.static(staticDir));

app.get('/', (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
console.log(`TaskMaster UI running at http://localhost:${PORT}`);
});
