# AI Course Builder - Backend Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- Gemini API Key (from Google AI Studio)
- YouTube Data API Key (from Google Cloud Console)

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup MySQL Database
```bash
# Login to MySQL
mysql -u root -p

# Run the database.sql file
source database.sql
```

### 3. Configure Environment Variables
Edit the `.env` file with your credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_course_builder

GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key

PORT=3000
JWT_SECRET=your_random_secret_key
```

### 4. Get API Keys

#### Gemini API Key:
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste into `.env`

#### YouTube API Key:
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Copy and paste into `.env`

### 5. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Courses
- `POST /api/courses/create` - Create new course (requires auth)
- `GET /api/courses/my-courses` - Get user's courses (requires auth)

### Notes
- `GET /api/notes/:courseId/:videoId` - Get notes for a video (requires auth)
- `POST /api/notes` - Create a new note (requires auth)
- `PUT /api/notes/:noteId` - Update a note (requires auth)
- `DELETE /api/notes/:noteId` - Delete a note (requires auth)

## Frontend Integration

Update your frontend JavaScript to call the backend API instead of using localStorage.

Example for registration:
```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password })
});
const data = await response.json();
localStorage.setItem('token', data.token);
```

## Testing
1. Start the server: `npm run dev`
2. Open http://localhost:3000 in browser
3. Register a new account
4. Create a course and verify it generates modules with videos
5. Open a course and navigate to a video
6. Test the notes feature by creating, editing, and deleting notes

## Features

### ✅ Course Generation
- AI-powered course structure generation using Gemini API
- Automatic video selection from YouTube
- Module-based organization
- Progress tracking

### ✅ Notes System
- Create personal notes for each video
- Edit and delete notes
- Notes are saved per user and video
- Clean and intuitive interface

### ✅ Quiz System
- Mid-module and end-module quizzes
- AI-generated questions
- Progress tracking

## Recent Changes

### Notes Feature Added
- Replaced AI chatbot with a notes system
- Users can now create, edit, and delete notes for each video
- Notes are stored in the database
- See `NOTES_FEATURE.md` for detailed documentation