// Module Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    loadModuleData();
    setupSectionNavigation();
    setupQuizButtons();
});

function loadModuleData() {
    // Get module data from localStorage
    const moduleData = JSON.parse(localStorage.getItem('currentModule'));
    const courseTopic = localStorage.getItem('courseTopic');
    
    if (!moduleData) {
        showNotification('Module data not found', 'error');
        return;
    }
    
    // Update page content
    document.getElementById('course-title').textContent = courseTopic;
    document.getElementById('module-title').textContent = `Week ${moduleData.week}: ${moduleData.title}`;
    document.getElementById('module-description').textContent = moduleData.description;
    document.getElementById('video-count').textContent = moduleData.videos.length;
    document.getElementById('progress-text').textContent = `Module ${moduleData.week} of 8`;
    
    // Set progress
    const progress = (moduleData.week / 8) * 100;
    document.getElementById('module-progress').style.width = `${progress}%`;
    
    // Load videos
    loadVideos(moduleData.videos);
    
    // Load notes
    loadNotes(moduleData.notes);
}

function loadVideos(videos) {
    const videosContainer = document.getElementById('videos-list');
    videosContainer.innerHTML = '';
    
    videos.forEach((video, index) => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <i class="fas fa-play-circle"></i>
                <button class="video-play-btn" data-video-url="${video.url}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <span class="video-duration">${video.duration}</span>
                <p class="video-description">${video.description ? video.description.substring(0, 150) + '...' : 'Learn key concepts in this tutorial'}</p>
            </div>
        `;
        
        videosContainer.appendChild(videoCard);
    });
    
    // Add video play functionality
    const playButtons = videosContainer.querySelectorAll('.video-play-btn');
    playButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const videoUrl = btn.dataset.videoUrl;
            window.open(videoUrl, '_blank');
        });
    });
}

function loadNotes(notes) {
    const summaryElement = document.getElementById('notes-summary-text');
    const keyPointsList = document.getElementById('notes-keypoints-list');
    const resourcesList = document.getElementById('notes-resources-list');
    
    if (summaryElement) {
        summaryElement.textContent = notes?.summary || 'No summary available';
    }
    
    if (keyPointsList) {
        keyPointsList.innerHTML = '';
        const keyPoints = Array.isArray(notes?.keyPoints) ? notes.keyPoints : [];
        keyPoints.forEach(point => {
            const li = document.createElement('li');
            li.textContent = point;
            keyPointsList.appendChild(li);
        });
    }
    
    if (resourcesList) {
        resourcesList.innerHTML = '';
        const resources = Array.isArray(notes?.resources) ? notes.resources : [];
        resources.forEach(resource => {
            const li = document.createElement('li');
            li.textContent = resource;
            resourcesList.appendChild(li);
        });
    }
}

function setupSectionNavigation() {
    const sectionItems = document.querySelectorAll('.section-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    sectionItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionName = item.dataset.section;
            
            // Update active states
            sectionItems.forEach(si => si.classList.remove('active'));
            contentSections.forEach(cs => cs.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(`${sectionName}-section`).classList.add('active');
        });
    });
}

function setupQuizButtons() {
    const quizButtons = document.querySelectorAll('.quiz-start-btn');
    
    quizButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const quizType = btn.dataset.quiz;
            const moduleData = JSON.parse(localStorage.getItem('currentModule'));
            
            // Store quiz data and open quiz page
            const quizData = {
                type: quizType,
                module: moduleData.week,
                title: moduleData.title,
                questions: quizType === 'mid' ? 5 : 10,
                duration: quizType === 'mid' ? 10 : 15
            };
            
            localStorage.setItem('currentQuiz', JSON.stringify(quizData));
            window.open(`quiz.html?type=${quizType}&module=${moduleData.week}`, '_blank');
        });
    });
}