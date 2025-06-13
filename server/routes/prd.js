import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import validate from '../middleware/validation.js';
import { PRDSchema } from '../schemas/prd.js';

const router = express.Router();
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRD_FILE =
  process.env.PRD_FILE ||
  path.join(__dirname, '../../.taskmaster/docs/prd.txt');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const TASKMASTER_DIR = path.join(__dirname, '../../.taskmaster');

// Ensure directories exist
[UPLOAD_DIR, path.dirname(PRD_FILE)].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024, // 50KB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOC, DOCX, TXT, or MD files.'));
    }
  }
});

// Store processing jobs
const processingJobs = new Map();

// Get PRD content
router.get('/', (_req, res, next) => {
  try {
    const content = fs.existsSync(PRD_FILE)
      ? fs.readFileSync(PRD_FILE, 'utf8')
      : '';
    res.json({ content });
  } catch (err) {
    next(err);
  }
});

// Update PRD content
router.post('/', validate(PRDSchema), (req, res, next) => {
  try {
    const { content } = req.validatedBody;
    const dir = path.dirname(PRD_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRD_FILE, content, 'utf8');
    res.json({ content });
  } catch (err) {
    next(err);
  }
});

// Upload PRD file
router.post('/upload', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const fileId = uuidv4();
    const fileInfo = {
      id: fileId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    // Store file info for processing
    processingJobs.set(fileId, {
      ...fileInfo,
      status: 'uploaded',
      progress: 0
    });

    res.json({
      fileId,
      message: 'File uploaded successfully',
      file: {
        name: fileInfo.originalName,
        size: fileInfo.size,
        type: fileInfo.mimetype
      }
    });
  } catch (err) {
    next(err);
  }
});

// Process uploaded PRD file
router.post('/process/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const job = processingJobs.get(fileId);

    if (!job) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The specified file ID was not found or has expired'
      });
    }

    // Update job status
    job.status = 'processing';
    job.progress = 10;
    processingJobs.set(fileId, job);

    // Emit progress update via WebSocket if available
    if (req.app.get('io')) {
      req.app.get('io').emit('processing-progress', {
        fileId,
        progress: 10,
        step: 0,
        message: 'Starting processing...'
      });
    }

    // Read file content
    let content = '';
    try {
      if (job.mimetype.startsWith('text/') || job.originalName.endsWith('.md') || job.originalName.endsWith('.txt')) {
        content = fs.readFileSync(job.path, 'utf8');
      } else {
        throw new Error('Unsupported file type for content extraction');
      }
    } catch (readError) {
      job.status = 'error';
      job.error = 'Failed to read file content';
      processingJobs.set(fileId, job);
      return res.status(400).json({
        error: 'File processing failed',
        message: 'Unable to extract content from the uploaded file'
      });
    }

    // Update progress
    job.progress = 30;
    processingJobs.set(fileId, job);
    if (req.app.get('io')) {
      req.app.get('io').emit('processing-progress', {
        fileId,
        progress: 30,
        step: 1,
        message: 'Content extracted, validating...'
      });
    }

    // Save content to PRD file
    fs.writeFileSync(PRD_FILE, content, 'utf8');

    // Update progress
    job.progress = 50;
    processingJobs.set(fileId, job);
    if (req.app.get('io')) {
      req.app.get('io').emit('processing-progress', {
        fileId,
        progress: 50,
        step: 2,
        message: 'Running parse-prd to generate tasks...'
      });
    }

    // Run parse-prd command
    try {
      const taskMasterPath = path.join(__dirname, '../../bin/task-master.js');
      const command = `node "${taskMasterPath}" parse-prd "${PRD_FILE}" --force`;
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: path.join(__dirname, '../..'),
        timeout: 120000 // 2 minute timeout
      });

      // Update progress
      job.progress = 90;
      processingJobs.set(fileId, job);
      if (req.app.get('io')) {
        req.app.get('io').emit('processing-progress', {
          fileId,
          progress: 90,
          step: 3,
          message: 'Tasks generated, finalizing...'
        });
      }

      // Check if tasks.json was created
      const tasksFile = path.join(TASKMASTER_DIR, 'tasks', 'tasks.json');
      let tasksData = null;
      
      if (fs.existsSync(tasksFile)) {
        try {
          const tasksContent = fs.readFileSync(tasksFile, 'utf8');
          tasksData = JSON.parse(tasksContent);
        } catch (parseError) {
          console.warn('Failed to parse tasks.json:', parseError);
        }
      }

      // Complete processing
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date().toISOString();
      job.output = stdout;
      job.tasksGenerated = tasksData ? tasksData.length : 0;
      processingJobs.set(fileId, job);

      if (req.app.get('io')) {
        req.app.get('io').emit('processing-progress', {
          fileId,
          progress: 100,
          step: 4,
          message: 'Processing complete!'
        });
      }

      // Clean up uploaded file after successful processing
      setTimeout(() => {
        try {
          if (fs.existsSync(job.path)) {
            fs.unlinkSync(job.path);
          }
          processingJobs.delete(fileId);
        } catch (cleanupError) {
          console.warn('Failed to cleanup file:', cleanupError);
        }
      }, 300000); // Clean up after 5 minutes

      res.json({
        success: true,
        message: 'PRD processed successfully',
        fileId,
        tasksGenerated: job.tasksGenerated,
        output: stdout,
        processingTime: new Date() - new Date(job.uploadedAt)
      });

    } catch (execError) {
      job.status = 'error';
      job.error = execError.message;
      job.stderr = execError.stderr;
      processingJobs.set(fileId, job);

      if (req.app.get('io')) {
        req.app.get('io').emit('processing-error', {
          fileId,
          error: execError.message
        });
      }

      res.status(500).json({
        error: 'Processing failed',
        message: 'Failed to process PRD and generate tasks',
        details: execError.message,
        stderr: execError.stderr
      });
    }

  } catch (err) {
    next(err);
  }
});

// Get processing status
router.get('/status/:fileId', (req, res) => {
  const { fileId } = req.params;
  const job = processingJobs.get(fileId);

  if (!job) {
    return res.status(404).json({
      error: 'File not found',
      message: 'The specified file ID was not found or has expired'
    });
  }

  res.json({
    fileId,
    status: job.status,
    progress: job.progress,
    uploadedAt: job.uploadedAt,
    completedAt: job.completedAt,
    tasksGenerated: job.tasksGenerated,
    error: job.error
  });
});

// List recent processing jobs
router.get('/jobs', (req, res) => {
  const jobs = Array.from(processingJobs.values())
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, 10) // Return last 10 jobs
    .map(job => ({
      id: job.id,
      originalName: job.originalName,
      status: job.status,
      progress: job.progress,
      uploadedAt: job.uploadedAt,
      completedAt: job.completedAt,
      tasksGenerated: job.tasksGenerated,
      error: job.error
    }));

  res.json({ jobs });
});

export default router;
