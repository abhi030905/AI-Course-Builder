const axios = require('axios');
require('dotenv').config();

async function searchVideos(query, maxResults = 5, includePlaylist = false) {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: maxResults,
                key: process.env.YOUTUBE_API_KEY,
                videoEmbeddable: 'true',
                relevanceLanguage: 'en',
                order: 'relevance',
                safeSearch: 'strict'
            }
        });
        
        const videos = response.data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            description: item.snippet.description || 'No description available',
            duration: 'N/A'
        }));
        
        // Get video durations
        if (videos.length > 0) {
            const videoIds = videos.map(v => v.videoId).join(',');
            try {
                const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                    params: {
                        part: 'contentDetails',
                        id: videoIds,
                        key: process.env.YOUTUBE_API_KEY
                    }
                });
                
                detailsResponse.data.items.forEach((item) => {
                    const video = videos.find(v => v.videoId === item.id);
                    if (video) {
                        video.duration = parseDuration(item.contentDetails.duration);
                    }
                });
            } catch (err) {
                console.error('Error fetching video details:', err.message);
            }
        }
        
        return videos;
    } catch (error) {
        console.error('YouTube API Error:', error.message);
        return [];
    }
}

function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    if (hours) return `${hours}h ${minutes || 0}m`;
    if (minutes) return `${minutes}m`;
    return `${seconds || 0}s`;
}

async function getPlaylistVideos(playlistId, maxResults = 10) {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
            params: {
                part: 'snippet',
                playlistId: playlistId,
                maxResults: maxResults,
                key: process.env.YOUTUBE_API_KEY
            }
        });
        
        const videos = response.data.items.map(item => ({
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
            description: item.snippet.description || 'No description available',
            duration: 'N/A'
        }));
        
        return videos;
    } catch (error) {
        console.error('YouTube Playlist API Error:', error.message);
        return [];
    }
}

async function searchPlaylists(query, maxResults = 5) {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'playlist',
                maxResults: maxResults,
                key: process.env.YOUTUBE_API_KEY,
                relevanceLanguage: 'en',
                order: 'relevance'
            }
        });
        
        return response.data.items.map(item => ({
            playlistId: item.id.playlistId,
            title: item.snippet.title,
            description: item.snippet.description,
            channelTitle: item.snippet.channelTitle
        }));
    } catch (error) {
        console.error('YouTube Playlist Search Error:', error.message);
        return [];
    }
}

module.exports = { searchVideos, getPlaylistVideos, searchPlaylists };