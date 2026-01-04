-- Sample Data for Music Streaming App
-- Run this after creating the schema

-- Sample Artists
INSERT INTO artists (name, bio, image_url) VALUES
('The Weeknd', 'Canadian singer-songwriter', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Taylor Swift', 'American singer-songwriter', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Ed Sheeran', 'English singer-songwriter', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Billie Eilish', 'American singer-songwriter', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Drake', 'Canadian rapper and singer', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400')
ON CONFLICT DO NOTHING;

-- Sample Albums
INSERT INTO albums (title, artist_id, cover_url, release_date)
SELECT 
    'After Hours',
    id,
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    '2020-03-20'
FROM artists WHERE name = 'The Weeknd'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample Songs (you'll need to update audio_url with actual URLs)
INSERT INTO songs (title, artist_id, album_id, duration, audio_url, cover_url, genre)
SELECT 
    'Blinding Lights',
    a.id,
    al.id,
    200,
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    'Pop'
FROM artists a
CROSS JOIN albums al
WHERE a.name = 'The Weeknd' AND al.title = 'After Hours'
LIMIT 1
ON CONFLICT DO NOTHING;

