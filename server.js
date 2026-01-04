/**
 * Express Server for Music Streaming App
 * Handles API endpoints and database connections
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const { Pool } = require('pg');
const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })
  : null;

let localDataCache = null;
function getLocalData() {
  if (localDataCache) return localDataCache;
  const dataPath = path.join(__dirname, 'data.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  localDataCache = JSON.parse(raw);
  return localDataCache;
}

function ensureDb(res) {
  if (!pool) {
    res.status(503).json({ error: 'Database not configured. Set DATABASE_URL to enable this endpoint.' });
    return false;
  }
  return true;
}

const uploadsRoot = path.join(__dirname, 'uploads');
const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(uploadsRoot, 'audio');
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const safe = `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, safe);
    }
  }),
  fileFilter: (req, file, cb) => {
    const mime = String(file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();

    const allowedMimes = new Set([
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/wave',
      'audio/ogg',
      'audio/opus'
    ]);

    const allowedExts = new Set(['.mp3', '.mpeg', '.wav', '.ogg', '.opus']);

    // Some environments/browsers send audio files as application/octet-stream.
    // Accept known audio extensions as a fallback.
    if (allowedMimes.has(mime) || (mime.startsWith('audio/') && mime.length > 6) || allowedExts.has(ext)) {
      return cb(null, true);
    }

    cb(new Error('Unsupported audio type. Please upload MP3 (MPEG), WAV, or OGG.'));
  },
  limits: { fileSize: 25 * 1024 * 1024 }
});

const coverUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(uploadsRoot, 'covers');
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const safe = `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, safe);
    }
  }),
  fileFilter: (req, file, cb) => {
    const mime = String(file.mimetype || '').toLowerCase();
    if (mime.startsWith('image/')) return cb(null, true);
    cb(new Error('Unsupported cover image type. Please upload an image file.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Test database connection
if (pool) {
  pool.on('connect', () => {
    if (!IS_PRODUCTION) console.log('Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
  });
} else {
  if (!IS_PRODUCTION) console.warn('DATABASE_URL not set; running in local JSON mode (no PostgreSQL)');
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/upload/audio', (req, res) => {
  audioUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    const urlPath = `/uploads/audio/${req.file.filename}`;
    res.status(201).json({ message: 'Upload successful', file: { url: urlPath, mime: req.file.mimetype, name: req.file.originalname } });
  });
});

app.post('/api/upload/song', (req, res) => {
  if (!ensureDb(res)) return;

  const upload = multer().none();
  upload(req, res, (parseErr) => {
    if (parseErr) {
      return res.status(400).json({ error: 'Invalid form data' });
    }

    const { title, artist, album } = req.body || {};
    if (!title || !artist) {
      return res.status(400).json({ error: 'Song title and artist are required' });
    }

    audioUpload.single('file')(req, res, async (audioErr) => {
      if (audioErr) {
        return res.status(400).json({ error: audioErr.message || 'Audio upload failed' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded' });
      }

      const audioUrl = `/uploads/audio/${req.file.filename}`;

      coverUpload.single('cover')(req, res, async (coverErr) => {
        if (coverErr) {
          return res.status(400).json({ error: coverErr.message || 'Cover upload failed' });
        }

        const coverUrl = req.file && req.file.fieldname === 'cover'
          ? `/uploads/covers/${req.file.filename}`
          : null;

        try {
          const artistName = String(artist).trim();
          const albumTitle = album ? String(album).trim() : '';

          const artistResult = await pool.query(
            'INSERT INTO artists (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name',
            [artistName]
          );
          const artistRow = artistResult.rows[0];

          let albumId = null;
          if (albumTitle) {
            const existingAlbum = await pool.query(
              'SELECT id, title FROM albums WHERE title = $1 AND artist_id = $2 LIMIT 1',
              [albumTitle, artistRow.id]
            );
            if (existingAlbum.rows.length > 0) {
              albumId = existingAlbum.rows[0].id;
            } else {
              const createdAlbum = await pool.query(
                'INSERT INTO albums (title, artist_id) VALUES ($1, $2) RETURNING id, title',
                [albumTitle, artistRow.id]
              );
              albumId = createdAlbum.rows[0].id;
            }
          }

          const songResult = await pool.query(
            'INSERT INTO songs (title, artist_id, album_id, audio_url, cover_url, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, title, audio_url, cover_url',
            [String(title).trim(), artistRow.id, albumId, audioUrl, coverUrl]
          );

          const songRow = songResult.rows[0];
          res.status(201).json({
            message: 'Song uploaded successfully',
            song: {
              id: songRow.id,
              title: songRow.title,
              artist: artistRow.name,
              album: albumTitle || '',
              duration: null,
              cover: songRow.cover_url,
              audio: songRow.audio_url
            }
          });
        } catch (e) {
          console.error('Error saving uploaded song:', e);
          res.status(500).json({ error: 'Failed to save song metadata' });
        }
      });
    });
  });
});

// ============================================
// Authentication Routes
// ============================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (username, email, password, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, email, created_at',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Songs Routes
// ============================================

// Get all songs
app.get('/api/songs', async (req, res) => {
  try {
    if (!pool) {
      const data = getLocalData();
      res.json(data.songs || []);
      return;
    }

    const result = await pool.query(
      `SELECT
        s.id,
        s.title,
        a.name AS artist,
        al.title AS album,
        s.duration,
        s.cover_url AS cover,
        s.audio_url AS audio
      FROM songs s
      LEFT JOIN artists a ON a.id = s.artist_id
      LEFT JOIN albums al ON al.id = s.album_id
      ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get song by ID
app.get('/api/songs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool) {
      const data = getLocalData();
      const numericId = Number(id);
      const song = (data.songs || []).find(s => Number(s.id) === numericId);
      if (!song) return res.status(404).json({ error: 'Song not found' });
      res.json(song);
      return;
    }

    const result = await pool.query(
      `SELECT
        s.id,
        s.title,
        a.name AS artist,
        al.title AS album,
        s.duration,
        s.cover_url AS cover,
        s.audio_url AS audio
      FROM songs s
      LEFT JOIN artists a ON a.id = s.artist_id
      LEFT JOIN albums al ON al.id = s.album_id
      WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Playlists Routes
// ============================================

// Get user playlists
app.get('/api/playlists', async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const userId = req.headers['user-id']; // In production, get from JWT token
    
    const result = await pool.query(
      'SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Serve Frontend
// ============================================

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  if (!IS_PRODUCTION) {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  }
});

