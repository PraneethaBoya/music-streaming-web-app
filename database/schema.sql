-- Music Streaming App Database Schema
-- PostgreSQL Database Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Artists Table
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_name_unique ON artists(name);

-- Prevent blank names
ALTER TABLE artists
  ADD CONSTRAINT IF NOT EXISTS artists_name_not_blank CHECK (length(btrim(name)) > 0);

-- Albums Table
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    cover_url TEXT,
    release_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prevent blank titles and duplicate album names per artist
ALTER TABLE albums
  ADD CONSTRAINT IF NOT EXISTS albums_title_not_blank CHECK (length(btrim(title)) > 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_albums_artist_title_unique
  ON albums(artist_id, lower(title));

-- Songs Table
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    duration INTEGER, -- Duration in seconds
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    genre VARCHAR(100),
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prevent blank song titles
ALTER TABLE songs
  ADD CONSTRAINT IF NOT EXISTS songs_title_not_blank CHECK (length(btrim(title)) > 0);

-- Playlists Table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playlist Songs (Many-to-Many)
CREATE TABLE IF NOT EXISTS playlist_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (playlist_id, song_id)
);

-- Liked Songs (User favorites)
CREATE TABLE IF NOT EXISTS liked_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, song_id)
);

-- Recently Played
CREATE TABLE IF NOT EXISTS recently_played (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_songs_user ON liked_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_played_user ON recently_played(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_played_time ON recently_played(played_at DESC);

-- Insert sample data (optional)
-- You can add sample artists, songs, etc. here

