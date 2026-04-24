/**
 * ===============================================================
 * SMART LMS - STUDY PLANNER LOGIC (planner.js)
 * ===============================================================
 * This file handles the logic for:
 * - Calculating available study time
 * - Determining if a study plan is realistic
 * - Generating a basic study schedule
 */

document.addEventListener('DOMContentLoaded', () => {
    initActiveCourse();
    const plannerForm = document.getElementById('planner-form');
    if (plannerForm) {
        plannerForm.addEventListener('submit', calculatePlan);
        
        // Add input listeners for validation
        const inputs = ['hours-per-day', 'days-per-week', 'target-months'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', validateForm);
        });
    }
});

let activeCourse = null;
let remainingHours = 0;

/**
 * Validate if the form can be submitted
 */
function validateForm() {
    const submitBtn = document.getElementById('create-plan-btn');
    if (!submitBtn) return;

    const hours = document.getElementById('hours-per-day').value;
    const days = document.getElementById('days-per-week').value;
    const months = document.getElementById('target-months').value;

    const allFilled = hours && days && months;
    const hasActiveCourse = activeCourse !== null;
    const isCompleted = activeCourse && typeof getCourseProgress === 'function' && getCourseProgress(activeCourse.id) >= 100;

    submitBtn.disabled = !allFilled || !hasActiveCourse || isCompleted;
}

/**
 * Initialize the planner with the currently active course
 */
function initActiveCourse() {
    const courseTitleEl = document.getElementById('active-course-title');
    const resultContainer = document.getElementById('planner-result');
    
    if (!courseTitleEl) return;

    // Get active course from storage
    const activeCourseId = localStorage.getItem('lms-active-course');
    const courses = typeof getCourses === 'function' ? getCourses() : [];
    activeCourse = courses.find(c => c.id === activeCourseId);

    if (!activeCourse) {
        courseTitleEl.innerText = 'No Active Course';
        courseTitleEl.classList.add('text-danger');
        
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="card text-center" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📚</div>
                    <h3 class="mb-2">No Active Course</h3>
                    <p class="text-muted mb-4">You haven't started any courses yet. Go to the dashboard to find a course and start learning!</p>
                    <a href="/dashboard.html" class="btn btn-primary">Browse Courses</a>
                </div>
            `;
        }
        validateForm();
        return;
    }

    // Calculate remaining hours
    const progress = typeof getCourseProgress === 'function' ? getCourseProgress(activeCourse.id) : 0;
    remainingHours = activeCourse.duration * (1 - (progress / 100));
    
    courseTitleEl.innerText = `${activeCourse.title} (${Math.round(remainingHours)}h remaining)`;
    
    if (progress >= 100) {
        courseTitleEl.innerText = `${activeCourse.title} (Completed!)`;
    }

    validateForm();
}

/**
 * Calculate the feasibility of the user's study plan
 */
function calculatePlan(event) {
    event.preventDefault();
    
    if (!activeCourse) return;

    // Get user inputs
    const hoursPerDay = parseFloat(document.getElementById('hours-per-day').value);
    const daysPerWeek = parseFloat(document.getElementById('days-per-week').value);
    const targetMonths = parseFloat(document.getElementById('target-months').value);
    
    // This helps determine if the user's plan is realistic
    const totalWeeks = targetMonths * 4.345; // Average weeks in a month
    const totalAvailableHours = hoursPerDay * daysPerWeek * totalWeeks;
    
    const resultContainer = document.getElementById('planner-result');
    if (!resultContainer) return;
    
    const isRealistic = totalAvailableHours >= remainingHours;
    
    // Display the result
    resultContainer.innerHTML = `
        <div class="card mt-4 ${isRealistic ? 'border-success' : 'border-danger'}">
            <h3 class="mb-2">${isRealistic ? '✅ Plan is Achievable!' : '❌ Plan is Not Realistic'}</h3>
            <p class="text-muted mb-4">
                Course: <strong>${activeCourse.title}</strong><br>
                You have <strong>${Math.round(remainingHours)} hours</strong> remaining to complete this course. 
                Based on your inputs, you will have <strong>${Math.round(totalAvailableHours)} hours</strong> available over ${targetMonths} months.
            </p>
            <div class="schedule-output">
                <h4 class="mb-2">Your Weekly Schedule:</h4>
                <ul class="list-disc pl-5">
                    <li>Study <strong>${hoursPerDay} hours</strong> per day</li>
                    <li>Commit <strong>${daysPerWeek} days</strong> per week</li>
                    <li>Estimated completion: <strong>${remainingHours > 0 ? Math.round(remainingHours / (hoursPerDay * daysPerWeek)) : 0} weeks</strong></li>
                </ul>
            </div>
            ${!isRealistic ? `<p class="mt-4 text-danger"><strong>Suggestion:</strong> Try increasing your daily hours or extending your target completion time.</p>` : ''}
        </div>
    `;
}
