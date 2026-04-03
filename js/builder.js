// Course Builder Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Redirect to login if not logged in
        alert('Please login to create a course');
        window.location.href = 'login.html';
        return;
    }
    
    const courseForm = document.getElementById('course-form');
    const loadingContainer = document.getElementById('loading');
    
    if (courseForm) {
        courseForm.addEventListener('submit', handleCourseGeneration);
    }
    
    async function handleCourseGeneration(e) {
        e.preventDefault();
        
        const topic = document.getElementById('course-topic').value.trim();
        
        // Validate form
        if (!validateCourseForm(topic)) {
            return;
        }
        
        // Show loading state
        showLoading();
        
        try {
            // Generate course data
            const courseData = await generateCourseData(topic);
            
            // Display results
            displayCourseResults(courseData, topic);
            
            showNotification('Course generated successfully!', 'success');
            
        } catch (error) {
            console.error('Course generation error:', error);
            showNotification(error.message || 'Failed to generate course. Please try again.', 'error');
            hideLoading();
        }
    }
    
    function validateCourseForm(topic) {
        if (!topic) {
            document.getElementById('course-topic').style.borderColor = '#ef4444';
            showNotification('Course topic is required', 'error');
            return false;
        }
        document.getElementById('course-topic').style.borderColor = '#e5e7eb';
        return true;
    }
    
    function showLoading() {
        courseForm.style.display = 'none';
        loadingContainer.style.display = 'block';
    }
    
    function hideLoading() {
        loadingContainer.style.display = 'none';
        courseForm.style.display = 'flex';
    }
    
    async function generateCourseData(topic) {
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Please login to create a course');
        }
        
        // Call backend API to generate course
        const response = await fetch('/api/courses/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ topic })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                localStorage.removeItem('token');
                alert('Session expired. Please login again.');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(errorData.error || 'Failed to generate course');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to generate course');
        }
        
        console.log('Course generated successfully:', data.course);
        return data.course;
    }
    

    
    function displayCourseResults(courseData, topic) {
        // Save course and redirect to new view
        saveCourseToLibrary(courseData);
    }
    
    function saveCourseToLibrary(courseData) {
        console.log('Saving course with notes:', courseData);
        console.log('Module 1 notes:', courseData.modules[0]?.notes);
        let courses = JSON.parse(localStorage.getItem('myCourses')) || [];
        courses.push(courseData);
        localStorage.setItem('myCourses', JSON.stringify(courses));
        console.log('Total courses saved:', courses.length);
        
        setTimeout(() => {
            window.location.href = `learn.html?id=${courseData.id}`;
        }, 1000);
    }
    

});