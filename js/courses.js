// My Courses Page Functionality

document.addEventListener('DOMContentLoaded', function() {
        loadMyCourses();
    });
    async function loadMyCourses() {
        const coursesGrid = document.getElementById('courses-grid');
        const emptyState = document.getElementById('empty-state');
        const statsCards = document.querySelectorAll('.stat-card .stat-info h3');
        
        // Load courses from localStorage
        const coursesData = localStorage.getItem('myCourses');
        console.log('Raw localStorage data:', coursesData);
        
        const courses = coursesData ? JSON.parse(coursesData) : [];
        console.log('Parsed courses:', courses.length, courses);
            
        // Update stats
        if (statsCards.length >= 3) {
            statsCards[0].textContent = courses.length;
            statsCards[1].textContent = 0;
            statsCards[2].textContent = `${courses.length * 12}h`;
        }
        
        // Display courses
        if (courses.length === 0) {
            console.log('No courses found, showing empty state');
            if (emptyState) emptyState.style.display = 'flex';
            if (coursesGrid) coursesGrid.style.display = 'grid';
        } else {
            console.log('Displaying', courses.length, 'courses');
            if (emptyState) emptyState.style.display = 'none';
            if (coursesGrid) {
                coursesGrid.style.display = 'grid';
                coursesGrid.innerHTML = '';
                courses.forEach((course, index) => {
                    console.log('Creating card for course', index, course);
                    const courseCard = createCourseCard(course);
                    coursesGrid.appendChild(courseCard);
                });
            }
        }
    }

    function createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        const moduleCount = course.modules?.length || 0;
        const topicCount = course.modules?.reduce((sum, m) => sum + (m.topics?.length || 0), 0) || 0;
        
        card.innerHTML = `
            <div class="course-header">
                <h3>${course.course_title || course.topic || 'Untitled Course'}</h3>
            </div>
            <div class="course-meta">
                <span><i class="fas fa-book"></i> ${moduleCount} Modules</span>
                <span><i class="fas fa-play-circle"></i> ${topicCount} Topics</span>
            </div>
            <div class="course-actions">
                <button class="btn btn-primary btn-sm" onclick="window.location.href='learn.html?id=${course.id}'">
                    Start Learning
                </button>
            </div>
        `;
        
        return card;
    }