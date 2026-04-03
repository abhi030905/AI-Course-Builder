document.addEventListener('DOMContentLoaded', function() {
    const courseForm = document.getElementById('course-form');
    const courseOutput = document.getElementById('course-output');
    const courseModules = document.getElementById('course-modules');
    
    courseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const topic = document.getElementById('topic').value;
        const duration = document.getElementById('duration').value;
        
        if (!topic || !duration) {
            alert('Please fill in all fields');
            return;
        }
        
        console.log('Course Generation Request:', { topic, duration });
        
        // Simulate course generation
        generateCourse(topic, duration);
    });
    
    function generateCourse(topic, duration) {
        // Placeholder course structure
        const courseData = [
            { week: 1, title: `Module 1: Core Concepts & Setup - ${topic}` },
            { week: 2, title: `Module 2: API Integration & Data Flow` },
            { week: 3, title: `Module 3: UI/UX Assessment` }
        ];
        
        // Add more modules based on duration
        if (duration >= 6) {
            courseData.push({ week: 4, title: `Module 4: Advanced Implementation` });
            courseData.push({ week: 5, title: `Module 5: Testing & Optimization` });
            courseData.push({ week: 6, title: `Module 6: Deployment & Monitoring` });
        }
        
        if (duration >= 8) {
            courseData.push({ week: 7, title: `Module 7: Security & Best Practices` });
            courseData.push({ week: 8, title: `Module 8: Final Project & Review` });
        }
        
        if (duration >= 12) {
            courseData.push({ week: 9, title: `Module 9: Advanced Topics` });
            courseData.push({ week: 10, title: `Module 10: Industry Applications` });
            courseData.push({ week: 11, title: `Module 11: Portfolio Development` });
            courseData.push({ week: 12, title: `Module 12: Career Preparation` });
        }
        
        // Display course modules
        displayCourseModules(courseData);
        
        // Show the output section
        courseOutput.style.display = 'block';
        courseOutput.scrollIntoView({ behavior: 'smooth' });
    }
    
    function displayCourseModules(modules) {
        courseModules.innerHTML = '';
        
        modules.forEach(module => {
            const moduleCard = document.createElement('div');
            moduleCard.className = 'module-card';
            
            moduleCard.innerHTML = `
                <h3>Week ${module.week}: ${module.title}</h3>
                <p><strong>Video:</strong> <a href="#" style="color: #007bff;">Related video content for this module</a></p>
                <p><strong>Notes:</strong> Key concepts for this module</p>
                <p><strong>Assessments:</strong> Quiz 1 (Mid-module) | Quiz 2 (End-module)</p>
            `;
            
            courseModules.appendChild(moduleCard);
        });
    }
    
    // Logout functionality
    document.querySelector('.logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = 'login.html';
        }
    });
});