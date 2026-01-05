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

const DEFAULT_ARTIST_IMAGE = 'assets/artists/default-artist.jpg';

const DEFAULT_COVER_IMAGE = 'assets/covers/default-cover.jpg';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

app.get('/assets/artists/default-artist.jpg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.send(
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">'
    + '<defs>'
      + '<radialGradient id="g" cx="35%" cy="30%" r="80%">'
        + '<stop offset="0" stop-color="#2a2a2a"/>'
        + '<stop offset="1" stop-color="#0b0b0b"/>'
      + '</radialGradient>'
      + '<linearGradient id="p" x1="0" y1="0" x2="1" y2="1">'
        + '<stop offset="0" stop-color="#ff0066"/>'
        + '<stop offset="1" stop-color="#8e2de2"/>'
      + '</linearGradient>'
    + '</defs>'
    + '<rect width="512" height="512" rx="256" fill="url(#g)"/>'
    + '<circle cx="256" cy="206" r="92" fill="#151515" stroke="url(#p)" stroke-width="10"/>'
    + '<path d="M120 430c28-74 84-112 136-112s108 38 136 112" fill="#151515" stroke="url(#p)" stroke-width="10" stroke-linecap="round"/>'
    + '<text x="256" y="486" text-anchor="middle" fill="#bdbdbd" font-family="Inter, Arial" font-size="28">Artist</text>'
    + '</svg>'
  );
});

app.get('/assets/covers/default-cover.jpg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.send(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">'
    + '<defs>'
      + '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        + '<stop offset="0" stop-color="#1b1b1b"/>'
        + '<stop offset="1" stop-color="#0a0a0a"/>'
      + '</linearGradient>'
      + '<linearGradient id="p" x1="0" y1="1" x2="1" y2="0">'
        + '<stop offset="0" stop-color="#ff0066"/>'
        + '<stop offset="1" stop-color="#8e2de2"/>'
      + '</linearGradient>'
    + '</defs>'
    + '<rect width="800" height="800" fill="url(#g)"/>'
    + '<circle cx="400" cy="400" r="220" fill="#111" stroke="url(#p)" stroke-width="12"/>'
    + '<circle cx="400" cy="400" r="18" fill="#ff2d8d"/>'
    + '<text x="400" y="710" fill="#bdbdbd" font-size="44" font-family="Inter, Arial" text-anchor="middle">MusicStream</text>'
    + '</svg>'
  );
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { fallthrough: false }));

app.use('/uploads', (err, req, res, next) => {
  if (!err) return next();
  const status = err.status || err.statusCode || 404;
  res.status(status).send('Not Found');
});

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

    const allowedExts = new Set(['.mp3', '.wav', '.ogg', '.opus']);

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

const uploadSong = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const field = String(file.fieldname || '').toLowerCase();
      const subfolder = field === 'cover' ? 'covers' : (field === 'artistphoto' ? 'artists' : 'audio');
      const dest = path.join(uploadsRoot, subfolder);
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const safe = `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, safe);
    }
  }),
  fileFilter: (req, file, cb) => {
    const field = String(file.fieldname || '').toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();

    if (field === 'cover') {
      if (mime.startsWith('image/')) return cb(null, true);
      return cb(new Error('Unsupported cover image type. Please upload an image file.'));
    }

    if (field === 'artistphoto') {
      if (mime.startsWith('image/')) return cb(null, true);
      return cb(new Error('Unsupported artist image type. Please upload an image file.'));
    }

    const allowedMimes = new Set([
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/wave',
      'audio/ogg',
      'audio/opus'
    ]);
    const allowedExts = new Set(['.mp3', '.wav', '.ogg', '.opus']);

    if (allowedMimes.has(mime) || (mime.startsWith('audio/') && mime.length > 6) || allowedExts.has(ext)) {
      return cb(null, true);
    }

    return cb(new Error('Unsupported audio type. Please upload MP3 (MPEG), WAV, or OGG.'));
  },
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

app.get('/api/admin/reset-seed', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: 'Use POST to reset and seed the database.',
    example: {
      method: 'POST',
      url: '/api/admin/reset-seed',
      headers: {
        'x-admin-secret': 'YOUR_ADMIN_SECRET'
      }
    }
  });
});

app.post('/api/admin/reset-seed', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const secret = req.headers['x-admin-secret'];
    if (!process.env.ADMIN_SECRET || String(secret || '') !== String(process.env.ADMIN_SECRET)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Strict wipe (guarantee empty DB)
    await pool.query('TRUNCATE TABLE playlist_songs, playlists, songs, albums, artists CASCADE');
    res.json({
      ok: true,
      artists: 0,
      albums: 0,
      songs: 0
    });
  } catch (error) {
    console.error('Error resetting/seeding database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/delete-song', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const secret = req.headers['x-admin-secret'];
    if (!process.env.ADMIN_SECRET || String(secret || '') !== String(process.env.ADMIN_SECRET)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const title = req.body?.title != null ? String(req.body.title).trim() : '';
    const artist = req.body?.artist != null ? String(req.body.artist).trim() : '';

    if (!title) return res.status(400).json({ error: 'title is required' });

    const params = [title];
    let where = 'LOWER(s.title) = LOWER($1)';
    if (artist) {
      params.push(artist);
      where += ' AND LOWER(a.name) = LOWER($2)';
    }

    const idsRes = await pool.query(
      `SELECT s.id
       FROM songs s
       LEFT JOIN artists a ON a.id = s.artist_id
       WHERE ${where}`,
      params
    );

    if (idsRes.rows.length === 0) {
      return res.json({ deleted: 0 });
    }

    const ids = idsRes.rows.map(r => r.id);
    await pool.query('DELETE FROM songs WHERE id = ANY($1::uuid[])', [ids]);
    res.json({ deleted: ids.length });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/duplicates', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const secret = req.headers['x-admin-secret'];
    if (!process.env.ADMIN_SECRET || String(secret || '') !== String(process.env.ADMIN_SECRET)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      `SELECT
        LOWER(s.title) AS title,
        LOWER(a.name) AS artist,
        s.audio_url,
        COUNT(*) AS count,
        ARRAY_AGG(s.id ORDER BY s.created_at DESC) AS ids
      FROM songs s
      LEFT JOIN artists a ON a.id = s.artist_id
      GROUP BY LOWER(s.title), LOWER(a.name), s.audio_url
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching duplicates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

app.get('/api/admin/db-status', async (req, res) => {
  try {
    const secret = req.headers['x-admin-secret'];
    if (!process.env.ADMIN_SECRET || String(secret || '') !== String(process.env.ADMIN_SECRET)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!pool) {
      const local = getLocalData();
      return res.json({
        ok: true,
        dbConfigured: false,
        counts: {
          artists: Array.isArray(local?.artists) ? local.artists.length : 0,
          albums: Array.isArray(local?.albums) ? local.albums.length : 0,
          songs: Array.isArray(local?.songs) ? local.songs.length : 0,
          playlists: Array.isArray(local?.playlists) ? local.playlists.length : 0
        }
      });
    }

    const [artists, albums, songs, playlists] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM artists'),
      pool.query('SELECT COUNT(*)::int AS count FROM albums'),
      pool.query('SELECT COUNT(*)::int AS count FROM songs'),
      pool.query('SELECT COUNT(*)::int AS count FROM playlists')
    ]);

    res.json({
      ok: true,
      dbConfigured: true,
      counts: {
        artists: artists.rows[0]?.count ?? 0,
        albums: albums.rows[0]?.count ?? 0,
        songs: songs.rows[0]?.count ?? 0,
        playlists: playlists.rows[0]?.count ?? 0
      }
    });
  } catch (error) {
    console.error('Error checking db status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload song endpoint
app.post('/api/upload/song', (req, res) => {
  if (!ensureDb(res)) return;

  uploadSong.fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'artistPhoto', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Invalid form data' });
    }

    const { title, artist, album } = req.body || {};
    if (!title || !artist) {
      return res.status(400).json({ error: 'Song title and artist are required' });
    }

    const audioFile = req.files && req.files.file && req.files.file[0] ? req.files.file[0] : null;
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const coverFile = req.files && req.files.cover && req.files.cover[0] ? req.files.cover[0] : null;
    const artistPhotoFile = req.files && req.files.artistPhoto && req.files.artistPhoto[0] ? req.files.artistPhoto[0] : null;

    const audioUrl = `/uploads/audio/${audioFile.filename}`;
    const coverUrl = coverFile ? `/uploads/covers/${coverFile.filename}` : null;
    const artistImageUrl = artistPhotoFile ? `/uploads/artists/${artistPhotoFile.filename}` : null;

    try {
      const artistName = String(artist).trim();
      const albumTitle = (album ? String(album).trim() : '') || 'Singles';

      const artistResult = await pool.query(
        'INSERT INTO artists (name, image_url) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name, image_url',
        [artistName, artistImageUrl || DEFAULT_ARTIST_IMAGE]
      );
      let artistRow = artistResult.rows[0];

      if ((!artistRow.image_url || String(artistRow.image_url).trim() === '') && (artistImageUrl || DEFAULT_ARTIST_IMAGE)) {
        const updatedArtist = await pool.query(
          'UPDATE artists SET image_url = $1 WHERE id = $2 RETURNING id, name, image_url',
          [artistImageUrl || DEFAULT_ARTIST_IMAGE, artistRow.id]
        );
        if (updatedArtist.rows.length > 0) artistRow = updatedArtist.rows[0];
      }

      let albumId = null;
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

// Artist → Album → Song catalog
app.get('/api/catalog', async (req, res) => {
  try {
    if (!pool) {
      const local = getLocalData();
      res.json(Array.isArray(local?.catalog) ? local.catalog : []);
      return;
    }

    const result = await pool.query(
      `SELECT
        a.id AS artist_id,
        a.name AS artist_name,
        a.image_url AS artist_image,
        al.id AS album_id,
        al.title AS album_name,
        al.cover_url AS album_cover,
        s.id AS song_id,
        s.title AS song_title,
        s.duration AS song_duration,
        s.cover_url AS song_cover,
        s.audio_url AS audio_url,
        s.created_at AS song_created_at
      FROM artists a
      LEFT JOIN albums al ON al.artist_id = a.id
      LEFT JOIN songs s ON s.album_id = al.id
      ORDER BY a.created_at ASC, al.created_at ASC, s.created_at ASC`
    );

    const artistOrder = [];
    const artistMap = new Map();
    const albumMapByArtist = new Map();
    const artistNumericIdByUuid = new Map();
    const albumNumericIdByUuid = new Map();
    const songNumericIdByUuid = new Map();

    const getArtistNumericId = (uuid) => {
      if (!uuid) return null;
      if (!artistNumericIdByUuid.has(uuid)) artistNumericIdByUuid.set(uuid, artistNumericIdByUuid.size + 1);
      return artistNumericIdByUuid.get(uuid);
    };
    const getAlbumNumericId = (uuid) => {
      if (!uuid) return null;
      if (!albumNumericIdByUuid.has(uuid)) albumNumericIdByUuid.set(uuid, albumNumericIdByUuid.size + 1);
      return albumNumericIdByUuid.get(uuid);
    };
    const getSongNumericId = (uuid) => {
      if (!uuid) return null;
      if (!songNumericIdByUuid.has(uuid)) songNumericIdByUuid.set(uuid, songNumericIdByUuid.size + 1);
      return songNumericIdByUuid.get(uuid);
    };

    for (const row of result.rows) {
      const artistUuid = row.artist_id;
      if (!artistMap.has(artistUuid)) {
        artistMap.set(artistUuid, {
          artistId: getArtistNumericId(artistUuid),
          artistName: row.artist_name || '',
          artistImage: row.artist_image || '',
          albums: []
        });
        artistOrder.push(artistUuid);
        albumMapByArtist.set(artistUuid, new Map());
      }

      const artistAlbumsMap = albumMapByArtist.get(artistUuid);
      const albumUuid = row.album_id;
      if (albumUuid && !artistAlbumsMap.has(albumUuid)) {
        const albumObj = {
          albumId: getAlbumNumericId(albumUuid),
          albumName: row.album_name || '',
          albumCover: row.album_cover || '',
          songs: []
        };
        artistAlbumsMap.set(albumUuid, albumObj);
        artistMap.get(artistUuid).albums.push(albumObj);
      }

      if (albumUuid && row.song_id) {
        const albumObj = artistAlbumsMap.get(albumUuid);
        if (albumObj) {
          albumObj.songs.push({
            songId: getSongNumericId(row.song_id),
            title: row.song_title || '',
            duration: row.song_duration != null ? String(row.song_duration) : '',
            audioUrl: row.audio_url || '',
            coverUrl: row.song_cover || '',
            liked: false
          });
        }
      }
    }

    const catalog = artistOrder.map(uuid => artistMap.get(uuid)).filter(Boolean);
    res.json(catalog);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
        s.genre AS language,
        s.cover_url AS cover,
        s.audio_url AS audio,
        s.cover_url AS coverImage,
        s.audio_url AS audioUrl
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
        s.genre AS language,
        s.cover_url AS cover,
        s.audio_url AS audio,
        s.cover_url AS coverImage,
        s.audio_url AS audioUrl
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
app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  if (!IS_PRODUCTION) {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  }
});

