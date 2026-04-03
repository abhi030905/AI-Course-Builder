let courseData = null;
let progress = {};
let currentModule = null;
let currentTopic = null;
let currentQuiz = null;
let quizState = { currentQuestion: 0, answers: [], score: 0 };
let player = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCourse();
});

function loadCourse() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    console.log('Loading course ID:', courseId);
    
    const courses = JSON.parse(localStorage.getItem('myCourses')) || [];
    console.log('Available courses:', courses.length);
    
    courseData = courses.find(c => c.id == courseId);
    
    if (!courseData) {
        console.error('Course not found');
        alert('Course not found. Redirecting...');
        window.location.href = 'courses.html';
        return;
    }
    
    console.log('Course data:', courseData);
    console.log('Modules:', courseData.modules);
    
    if (!courseData.modules || courseData.modules.length === 0) {
        alert('Course has no modules. Please regenerate the course.');
        return;
    }
    
    loadProgress();
    renderSidebar();
    showModule(0);
    initializeEventListeners();
}

function loadProgress() {
    const saved = localStorage.getItem(`progress_${courseData.id}`);
    progress = saved ? JSON.parse(saved) : {
        modules: courseData.modules.map((m, i) => ({
            completed: false,
            topics: m.topics ? m.topics.map(() => false) : [],
            midQuizCompleted: false,
            endQuizCompleted: false
        }))
    };
}

function saveProgress() {
    localStorage.setItem(`progress_${courseData.id}`, JSON.stringify(progress));
    updateCourseProgress();
}

function updateCourseProgress() {
    const totalTopics = courseData.modules.reduce((sum, m) => sum + (m.topics?.length || 0), 0);
    const completedTopics = progress.modules.reduce((sum, m) => sum + m.topics.filter(t => t).length, 0);
    const percentage = Math.round((completedTopics / totalTopics) * 100);
    
    document.getElementById('course-progress-bar').style.width = `${percentage}%`;
    document.getElementById('course-progress-text').textContent = `${percentage}% Complete`;
}

function renderSidebar() {
    document.getElementById('course-title-sidebar').textContent = courseData.course_title || courseData.topic;
    
    const moduleList = document.getElementById('module-list');
    const modules = courseData.modules || [];
    
    moduleList.innerHTML = modules.map((module, index) => {
        const moduleProgress = progress.modules[index];
        const isLocked = false; // Unlock all modules
        const isCompleted = moduleProgress.completed;
        const isInProgress = moduleProgress.topics.some(t => t) && !isCompleted;
        
        let statusIcon = '<i class="fas fa-lock"></i>';
        let statusClass = 'locked';
        
        if (isCompleted) {
            statusIcon = '<i class="fas fa-check"></i>';
            statusClass = 'completed';
        } else if (isInProgress) {
            statusIcon = '<i class="fas fa-circle"></i>';
            statusClass = 'in-progress';
        }
        
        return `
            <div class="module-item">
                <div class="module-header ${isLocked ? 'locked' : ''}" onclick="showModule(${index})">
                    <div class="module-info">
                        <h3>Module ${index + 1}</h3>
                        <p class="module-meta">${(module.topics || []).length} Topics</p>
                    </div>
                    <div class="module-status">
                        <span class="status-icon ${statusClass}">${statusIcon}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showModule(index) {
    // Allow access to all modules
    
    currentModule = index;
    const module = courseData.modules[index];
    
    console.log('Showing module:', index, module);
    
    document.getElementById('module-view').style.display = 'block';
    document.getElementById('topic-view').style.display = 'none';
    document.getElementById('quiz-view').style.display = 'none';
    
    document.getElementById('breadcrumb').innerHTML = `
        <span>Module ${index + 1}</span>
    `;
    
    document.getElementById('module-title').textContent = module.module_title || `Module ${index + 1}`;
    document.getElementById('module-description').textContent = module.module_description || '';
    
    if (!module.topics || module.topics.length === 0) {
        console.error('Module has no topics:', module);
        document.getElementById('topic-list').innerHTML = '<p style="color: red;">No topics available for this module.</p>';
        return;
    }
    
    renderTopics(module, index);
    updateSidebarActive();
}

function renderTopics(module, moduleIndex) {
    const topicList = document.getElementById('topic-list');
    const moduleProgress = progress.modules[moduleIndex];
    
    const topics = module.topics || [];
    const midQuizIndex = Math.ceil(topics.length / 2);
    
    topicList.innerHTML = '';
    
    topics.forEach((topic, topicIndex) => {
        const isCompleted = moduleProgress.topics[topicIndex];
        const isLocked = false;
        
        const topicCard = document.createElement('div');
        topicCard.className = `topic-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
        topicCard.innerHTML = `
            <div class="topic-info">
                <h3>${topicIndex + 1}. ${topic.topic_title}</h3>
                <p>${topic.topic_description || ''}</p>
            </div>
            <div class="topic-status">
                ${isCompleted ? '<i class="fas fa-check-circle" style="color: #16a34a;"></i>' : 
                  isLocked ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-play-circle"></i>'}
            </div>
        `;
        topicCard.onclick = () => showTopic(moduleIndex, topicIndex);
        topicList.appendChild(topicCard);
        
        // Add mid-quiz after 50% of topics
        if (topicIndex === midQuizIndex - 1) {
            const quizCard = document.createElement('div');
            quizCard.className = `topic-card ${moduleProgress.midQuizCompleted ? 'completed' : ''}`;
            quizCard.innerHTML = `
                <div class="topic-info">
                    <h3><i class="fas fa-clipboard-check"></i> Mid-Module Quiz</h3>
                    <p>Test your understanding of the first half</p>
                </div>
                <div class="topic-status">
                    ${moduleProgress.midQuizCompleted ? '<i class="fas fa-check-circle" style="color: #16a34a;"></i>' : 
                      '<i class="fas fa-exclamation-circle" style="color: #f59e0b;"></i>'}
                </div>
            `;
            quizCard.onclick = () => showQuiz(moduleIndex, 'mid');
            topicList.appendChild(quizCard);
        }
    });
    
    // Add end-module quiz at the end
    const quizCard = document.createElement('div');
    quizCard.className = `topic-card ${moduleProgress.endQuizCompleted ? 'completed' : ''}`;
    quizCard.innerHTML = `
        <div class="topic-info">
            <h3><i class="fas fa-clipboard-check"></i> End-Module Quiz</h3>
            <p>Final assessment to complete this module</p>
        </div>
        <div class="topic-status">
            ${moduleProgress.endQuizCompleted ? '<i class="fas fa-check-circle" style="color: #16a34a;"></i>' : 
              '<i class="fas fa-exclamation-circle" style="color: #f59e0b;"></i>'}
        </div>
    `;
    quizCard.onclick = () => showQuiz(moduleIndex, 'end');
    topicList.appendChild(quizCard);
}

function showTopic(moduleIndex, topicIndex) {
    const module = courseData.modules[moduleIndex];
    const topic = module.topics[topicIndex];
    const moduleProgress = progress.modules[moduleIndex];
    
    console.log('Showing topic:', topicIndex, topic);
    console.log('Module notes:', module.notes);
    
    currentModule = moduleIndex;
    currentTopic = topicIndex;
    
    document.getElementById('module-view').style.display = 'none';
    document.getElementById('topic-view').style.display = 'block';
    document.getElementById('quiz-view').style.display = 'none';
    
    document.getElementById('breadcrumb').innerHTML = `
        <span onclick="showModule(${moduleIndex})">Module ${moduleIndex + 1}</span>
        <i class="fas fa-chevron-right"></i>
        <span>Topic ${topicIndex + 1}</span>
    `;
    
    document.getElementById('topic-title').textContent = topic.topic_title || 'Untitled Topic';
    document.getElementById('topic-description').textContent = topic.topic_description || '';
    
    if (topic.video && topic.video.playlist_title) {
        document.getElementById('playlist-info').innerHTML = `
            <h4>From Playlist: ${topic.video.playlist_title}</h4>
            <p><strong>Video:</strong> ${topic.video.video_title}</p>
        `;
    } else {
        document.getElementById('playlist-info').innerHTML = '';
    }
    
    // Reset notes section
    const notesContent = document.getElementById('notes-content');
    notesContent.innerHTML = '<p class="notes-placeholder">Click "Generate Notes" to create AI-powered study notes for this video.</p>';
    
    const videoId = topic.video ? topic.video.video_id : null;
    if (videoId) {
        loadVideo(videoId);
    } else {
        console.error('No video ID found for topic');
    }
    
    const isCompleted = moduleProgress.topics[topicIndex];
    document.getElementById('mark-complete').textContent = isCompleted ? 'Completed' : 'Mark as Complete';
    document.getElementById('mark-complete').disabled = isCompleted;
}

function loadVideo(videoId) {
    if (player) {
        player.loadVideoById(videoId);
    } else {
        player = new YT.Player('video-player', {
            videoId: videoId,
            playerVars: { autoplay: 0, rel: 0 }
        });
    }
}

function showQuiz(moduleIndex, type) {
    const module = courseData.modules[moduleIndex];
    
    // Use AI-generated quizzes if available, otherwise generate from topics
    let quiz;
    if (module.quizzes && module.quizzes[type] && module.quizzes[type].length > 0) {
        quiz = module.quizzes[type];
    } else {
        const midIndex = Math.ceil(module.topics.length / 2);
        const topicsToQuiz = type === 'mid' ? module.topics.slice(0, midIndex) : module.topics;
        quiz = generateQuizFromTopics(topicsToQuiz, type === 'mid' ? 5 : 10);
    }
    
    currentModule = moduleIndex;
    currentQuiz = { type, quiz };
    quizState = { currentQuestion: 0, answers: [], score: 0 };
    
    document.getElementById('module-view').style.display = 'none';
    document.getElementById('topic-view').style.display = 'none';
    document.getElementById('quiz-view').style.display = 'block';
    document.getElementById('quiz-results').style.display = 'none';
    
    document.getElementById('quiz-title').textContent = type === 'mid' ? 'Mid-Module Quiz' : 'End-Module Quiz';
    document.getElementById('quiz-description').textContent = type === 'mid' ? 'Test your understanding of the first half' : 'Final assessment for this module';
    
    renderQuestion();
}

function generateQuizFromTopics(topics, count) {
    const questions = [];
    
    for (let i = 0; i < Math.min(count, topics.length); i++) {
        const topic = topics[i];
        const notes = Array.isArray(topic.video_notes) ? topic.video_notes : 
                     typeof topic.video_notes === 'string' ? topic.video_notes.split('.').filter(n => n.trim()) : [];
        
        // Extract key concept from first note or topic title
        const concept = notes[0] || topic.topic_title;
        
        questions.push({
            question: `Based on "${topic.topic_title}": ${concept.substring(0, 100)}... What is the correct understanding?`,
            options: [
                'This concept is fundamental and should be applied in practice',
                'This is an optional feature that can be ignored',
                'This only works in specific scenarios',
                'This is deprecated and should not be used'
            ],
            correct_answer: 'This concept is fundamental and should be applied in practice'
        });
    }
    
    // Fill remaining questions from video notes
    while (questions.length < count) {
        const topic = topics[questions.length % topics.length];
        const notes = Array.isArray(topic.video_notes) ? topic.video_notes : [];
        const noteIndex = questions.length % Math.max(notes.length, 1);
        const note = notes[noteIndex] || 'core concept';
        
        questions.push({
            question: `In "${topic.topic_title}", what does this mean: "${note.substring(0, 80)}..."?`,
            options: [
                'It explains the fundamental principle',
                'It describes an error condition',
                'It is a warning message',
                'It is unrelated to the topic'
            ],
            correct_answer: 'It explains the fundamental principle'
        });
    }
    
    return questions;
}

function renderQuestion() {
    const question = currentQuiz.quiz[quizState.currentQuestion];
    
    document.getElementById('quiz-question-number').textContent = 
        `Question ${quizState.currentQuestion + 1} of ${currentQuiz.quiz.length}`;
    
    document.getElementById('question-text').textContent = question.question;
    
    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = question.options.map((option, index) => `
        <div class="option-item" data-option="${option}">
            ${option}
        </div>
    `).join('');
    
    optionsList.querySelectorAll('.option-item').forEach(item => {
        item.onclick = () => selectOption(item);
    });
    
    document.getElementById('quiz-prev').disabled = quizState.currentQuestion === 0;
    document.getElementById('quiz-submit').style.display = 'block';
    document.getElementById('quiz-next').style.display = 'none';
}

function selectOption(element) {
    document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
}

function initializeEventListeners() {
    document.getElementById('back-to-module').onclick = () => showModule(currentModule);
    
    document.getElementById('mark-complete').onclick = () => {
        progress.modules[currentModule].topics[currentTopic] = true;
        saveProgress();
        checkModuleCompletion();
        showModule(currentModule);
    };
    
    document.getElementById('next-topic').onclick = () => {
        const module = courseData.modules[currentModule];
        if (currentTopic < module.topics.length - 1) {
            showTopic(currentModule, currentTopic + 1);
        } else {
            showModule(currentModule);
        }
    };
    
    document.getElementById('quiz-submit').onclick = submitQuizAnswer;
    document.getElementById('quiz-next').onclick = nextQuestion;
    document.getElementById('quiz-prev').onclick = () => {
        if (quizState.currentQuestion > 0) {
            quizState.currentQuestion--;
            renderQuestion();
        }
    };
    
    document.getElementById('continue-learning').onclick = () => {
        showModule(currentModule);
    };
    
    document.getElementById('generate-notes-btn').onclick = generateNotes;
}

function submitQuizAnswer() {
    const selected = document.querySelector('.option-item.selected');
    if (!selected) return;
    
    const question = currentQuiz.quiz[quizState.currentQuestion];
    const answer = selected.dataset.option;
    const isCorrect = answer === question.correct_answer;
    
    quizState.answers.push({ question: question.question, answer, correct: isCorrect });
    if (isCorrect) quizState.score++;
    
    selected.classList.add(isCorrect ? 'correct' : 'incorrect');
    document.querySelectorAll('.option-item').forEach(el => {
        el.classList.add('disabled');
        if (el.dataset.option === question.correct_answer) {
            el.classList.add('correct');
        }
    });
    
    document.getElementById('quiz-submit').style.display = 'none';
    
    if (quizState.currentQuestion < currentQuiz.quiz.length - 1) {
        document.getElementById('quiz-next').style.display = 'block';
    } else {
        setTimeout(showQuizResults, 1500);
    }
}

function nextQuestion() {
    quizState.currentQuestion++;
    renderQuestion();
}

function showQuizResults() {
    document.querySelector('.quiz-body').style.display = 'none';
    document.querySelector('.quiz-actions').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'block';
    
    const percentage = Math.round((quizState.score / currentQuiz.quiz.length) * 100);
    document.getElementById('quiz-score').textContent = `${percentage}%`;
    
    let feedback = percentage >= 80 ? 'Excellent work! You have a strong understanding.' :
                   percentage >= 60 ? 'Good job! Review the topics you missed.' :
                   'Keep practicing. Review the module content and try again.';
    
    document.getElementById('quiz-feedback').textContent = feedback;
    
    if (currentQuiz.type === 'mid') {
        progress.modules[currentModule].midQuizCompleted = true;
    } else {
        progress.modules[currentModule].endQuizCompleted = true;
        progress.modules[currentModule].completed = true;
    }
    
    saveProgress();
    renderSidebar();
}

function checkModuleCompletion() {
    const moduleProgress = progress.modules[currentModule];
    const allTopicsCompleted = moduleProgress.topics.every(t => t);
    
    if (allTopicsCompleted && moduleProgress.midQuizCompleted && moduleProgress.endQuizCompleted) {
        moduleProgress.completed = true;
    }
}

function updateSidebarActive() {
    document.querySelectorAll('.module-header').forEach((el, i) => {
        el.classList.toggle('active', i === currentModule);
    });
}

function onYouTubeIframeAPIReady() {
    console.log('YouTube API Ready');
}

async function generateNotes() {
    const module = courseData.modules[currentModule];
    const topic = module.topics[currentTopic];
    
    if (!topic.video) {
        alert('No video available');
        return;
    }
    
    const btn = document.getElementById('generate-notes-btn');
    const notesContent = document.getElementById('notes-content');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    notesContent.innerHTML = '<p class="notes-loading">Generating notes with AI...</p>';
    
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${topic.video.video_id}`;
        
        console.log('Generating notes for:', topic.video.video_title);
        
        const response = await fetch('/api/notes/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoUrl,
                videoTitle: topic.video.video_title
            })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (data.success) {
            notesContent.innerHTML = `<div class="notes-text">${formatNotes(data.notes)}</div>`;
        } else {
            notesContent.innerHTML = `<p class="notes-error">Error: ${data.message || 'Failed to generate notes'}</p>`;
        }
    } catch (error) {
        console.error('Generate notes error:', error);
        notesContent.innerHTML = '<p class="notes-error">Error: Make sure the server is running.</p>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Generate Notes';
    }
}

function formatNotes(notes) {
    return notes
        .replace(/\n/g, '<br>')
        .replace(/📌/g, '<span class="emoji">📌</span>')
        .replace(/🎯/g, '<span class="emoji">🎯</span>')
        .replace(/📖/g, '<span class="emoji">📖</span>')
        .replace(/⚙️/g, '<span class="emoji">⚙️</span>')
        .replace(/💡/g, '<span class="emoji">💡</span>')
        .replace(/🧠/g, '<span class="emoji">🧠</span>')
        .replace(/🚀/g, '<span class="emoji">🚀</span>');
}
