// Quiz Functionality
let currentQuestion = 0;
let score = 0;
let userAnswers = [];
let timerInterval;
let timeRemaining;
let startTime;

const questions = [
    {
        question: "What is the primary purpose of this module?",
        options: [
            "To introduce fundamental concepts",
            "To test advanced knowledge",
            "To review previous material",
            "To prepare for certification"
        ],
        correct: 0
    },
    {
        question: "Which of the following is a key learning objective?",
        options: [
            "Memorizing syntax",
            "Understanding core principles",
            "Copying code examples",
            "Skipping practice exercises"
        ],
        correct: 1
    },
    {
        question: "What is the recommended approach to learning?",
        options: [
            "Rush through videos",
            "Skip the notes",
            "Practice regularly and take notes",
            "Only watch videos once"
        ],
        correct: 2
    },
    {
        question: "How should you approach problem-solving?",
        options: [
            "Give up immediately",
            "Copy solutions without understanding",
            "Break down problems into smaller steps",
            "Avoid challenging exercises"
        ],
        correct: 2
    },
    {
        question: "What is the best way to retain information?",
        options: [
            "Passive watching",
            "Active practice and application",
            "Reading once",
            "Skipping exercises"
        ],
        correct: 1
    }
];

document.addEventListener('DOMContentLoaded', function() {
    initQuiz();
    setupEventListeners();
});

function initQuiz() {
    // Get quiz data from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const quizType = urlParams.get('type') || 'mid';
    const moduleNum = urlParams.get('module') || '1';
    
    // Set quiz info
    document.getElementById('quiz-title').textContent = `Module ${moduleNum} Quiz`;
    document.getElementById('quiz-type').textContent = quizType === 'mid' ? 'Mid-Module' : 'Final Quiz';
    
    // Set timer based on quiz type
    const duration = quizType === 'mid' ? 10 : 15; // minutes
    timeRemaining = duration * 60; // convert to seconds
    startTime = Date.now();
    
    // Initialize user answers array
    userAnswers = new Array(questions.length).fill(null);
    
    // Start timer
    startTimer();
    
    // Load first question
    loadQuestion();
}

function setupEventListeners() {
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('prev-btn').addEventListener('click', prevQuestion);
    document.getElementById('submit-btn').addEventListener('click', submitQuiz);
}

function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timer').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color when time is running out
    const timerElement = document.querySelector('.quiz-timer');
    if (timeRemaining <= 60) {
        timerElement.style.color = '#ef4444';
    } else if (timeRemaining <= 180) {
        timerElement.style.color = '#f59e0b';
    }
}

function loadQuestion() {
    const question = questions[currentQuestion];
    
    // Update question number and text
    document.getElementById('current-question').textContent = currentQuestion + 1;
    document.getElementById('question-text').textContent = question.question;
    
    // Update progress
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = 
        `Question ${currentQuestion + 1} of ${questions.length}`;
    
    // Load options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        if (userAnswers[currentQuestion] === index) {
            optionDiv.classList.add('selected');
        }
        
        optionDiv.innerHTML = `
            <div class="option-label">${String.fromCharCode(65 + index)}</div>
            <div class="option-text">${option}</div>
        `;
        
        optionDiv.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update navigation buttons
    document.getElementById('prev-btn').disabled = currentQuestion === 0;
    
    if (currentQuestion === questions.length - 1) {
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('submit-btn').style.display = 'inline-flex';
    } else {
        document.getElementById('next-btn').style.display = 'inline-flex';
        document.getElementById('submit-btn').style.display = 'none';
    }
}

function selectOption(index) {
    userAnswers[currentQuestion] = index;
    
    // Update UI
    const options = document.querySelectorAll('.option');
    options.forEach((opt, i) => {
        if (i === index) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
}

function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        loadQuestion();
    }
}

function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
}

function submitQuiz() {
    clearInterval(timerInterval);
    
    // Calculate score
    score = 0;
    userAnswers.forEach((answer, index) => {
        if (answer === questions[index].correct) {
            score++;
        }
    });
    
    // Calculate time taken
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    
    // Show results
    showResults(score, questions.length, `${minutes}:${seconds.toString().padStart(2, '0')}`);
}

function showResults(correct, total, timeTaken) {
    // Hide question container
    document.getElementById('question-container').style.display = 'none';
    
    // Show results container
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.style.display = 'block';
    
    // Calculate percentage
    const percentage = Math.round((correct / total) * 100);
    
    // Update results
    document.getElementById('score-percentage').textContent = `${percentage}%`;
    document.getElementById('score-text').textContent = `You scored ${correct} out of ${total}`;
    document.getElementById('correct-answers').textContent = correct;
    document.getElementById('wrong-answers').textContent = total - correct;
    document.getElementById('time-taken').textContent = timeTaken;
    
    // Change icon based on score
    const resultsIcon = document.querySelector('.results-icon i');
    if (percentage >= 80) {
        resultsIcon.className = 'fas fa-trophy';
        resultsIcon.style.color = '#f59e0b';
    } else if (percentage >= 60) {
        resultsIcon.className = 'fas fa-star';
        resultsIcon.style.color = '#3b82f6';
    } else {
        resultsIcon.className = 'fas fa-book';
        resultsIcon.style.color = '#64748b';
    }
}
