# 🎵 Music Streaming Web Application

A modern, full-stack music streaming web application built with HTML, CSS, JavaScript, Node.js, Express, and PostgreSQL.

## ✨ Features

- 🎶 Music playback with HTML5 Audio
- 👤 User authentication (Register/Login)
- ❤️ Like/Unlike songs
- 📋 Create and manage playlists
- 📊 Recently played & mostly listened tracks
- 🎨 Beautiful PicsArt-inspired gradient UI
- 🎨 Real-time audio visualizer
- 📱 Responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/music-streaming-app.git
cd music-streaming-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up PostgreSQL database**
```bash
# Create database
createdb musicstream

# Run schema
psql -d musicstream -f database/schema.sql

# (Optional) Add sample data
psql -d musicstream -f database/seed.sql
```

4. **Configure environment variables**
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL=postgresql://username:password@localhost:5432/musicstream
JWT_SECRET=your-secret-key-here
```

5. **Start the server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

6. **Open in browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
music-streaming-app/
├── server.js              # Express server
├── package.json            # Dependencies
├── .env                    # Environment variables (not in git)
├── database/
│   ├── schema.sql         # Database schema
│   └── seed.sql           # Sample data
├── js/
│   ├── auth.js            # Authentication logic
│   ├── player.js          # Audio player
│   ├── ui.js              # UI components
│   └── ...
├── css/
│   └── styles.css         # Main stylesheet
└── *.html                  # Frontend pages
```

## 🗄️ Database Schema

- **users** - User accounts
- **artists** - Music artists
- **albums** - Music albums
- **songs** - Music tracks
- **playlists** - User playlists
- **playlist_songs** - Playlist-song relationships
- **liked_songs** - User favorites
- **recently_played** - Play history

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Songs
- `GET /api/songs` - Get all songs
- `GET /api/songs/:id` - Get song by ID

### Playlists
- `GET /api/playlists` - Get user playlists

## 🚀 Deployment

### Deploy Backend (Railway/Render/Heroku)

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Connect to Railway/Render**
   - Import from GitHub
   - Add environment variables
   - Deploy!

### Deploy Frontend (Vercel/Netlify)

1. **Connect repository**
2. **Build settings**: None needed (static files)
3. **Deploy!**

## 📝 Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=production
```

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, bcryptjs
- **Audio**: HTML5 Audio API, Web Audio API

## 📄 License

ISC

## 👤 Author

Your Name

## 🙏 Acknowledgments

- Icons and images from Unsplash
- Audio samples from SoundHelix

