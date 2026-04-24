/**
 * ===============================================================
 * SMART LMS - COURSE & PROGRESS LOGIC (progress.js)
 * ===============================================================
 * This file handles:
 * - Course data (modules, lessons, quizzes)
 * - Progress tracking (localStorage)
 * - Assessment system (quiz logic, module unlocking)
 * - Certificate unlocking logic
 */

// --- Course Data Management ---

/**
 * IndexedDB Helper for large video files
 */
const dbName = 'SmartLMS_Assets';
const storeName = 'assets';
const legacyProgressKey = 'lms-progress';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveAssetBlob(id, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(blob, id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getAssetBlob(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteAssetBlob(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Backward-compatible aliases used by the dashboards and course player.
async function saveVideoBlob(id, blob) {
    return saveAssetBlob(id, blob);
}

async function getVideoBlob(id) {
    return getAssetBlob(id);
}

async function deleteVideoBlob(id) {
    return deleteAssetBlob(id);
}

/**
 * Get courses from localStorage or return default data
 */
function getCourses() {
    const storedCourses = localStorage.getItem('lms-courses');
    if (storedCourses) {
        return JSON.parse(storedCourses);
    }
    // Default data if none exists
    return [
  {
    id: 'course-1',
    title: 'Modern Web Development',
    description: 'Master HTML, CSS, and JavaScript from scratch.',
    duration: 40,
    image: 'https://picsum.photos/seed/webdev/400/200',
    category: 'Development',
    skills: ['HTML5', 'CSS3', 'JavaScript ES6', 'Responsive Design'],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: HTML Basics',
        lessons: [
          { id: 'l1', title: 'Introduction to HTML', content: 'HTML stands for HyperText Markup Language...' },
          { id: 'l2', title: 'HTML Tags & Elements', content: 'Tags are the building blocks of HTML...' }
        ],
        quiz: {
          id: 'q1',
          questions: [
            { question: 'What does HTML stand for?', options: ['HyperText Markup Language', 'HighText Machine Language', 'HyperText Main Language'], correct: 0 },
            { question: 'Which tag is used for the largest heading?', options: ['&lt;h6&gt;', '&lt;head&gt;', '&lt;h1&gt;'], correct: 2 },
            { question: 'What is the correct tag for a line break?', options: ['&lt;break&gt;', '&lt;br&gt;', '&lt;lb&gt;'], correct: 1 }
          ]
        }
      },
      {
        id: 'm2',
        title: 'Module 2: CSS Styling',
        lessons: [
          { id: 'l3', title: 'Introduction to CSS', content: 'CSS is used to style HTML elements...' },
          { id: 'l4', title: 'Selectors & Properties', content: 'Selectors target HTML elements to apply styles...' }
        ],
        quiz: {
          id: 'q2',
          questions: [
            { question: 'What does CSS stand for?', options: ['Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Sheets'], correct: 1 },
            { question: 'Which property is used to change background color?', options: ['color', 'bgcolor', 'background-color'], correct: 2 },
            { question: 'How do you select an element with id "demo"?', options: ['.demo', '#demo', '*demo'], correct: 1 }
          ]
        }
      }
    ]
  },
  {
    id: 'course-2',
    title: 'Python for Data Science',
    description: 'Learn Python, Pandas, and Matplotlib for data analysis.',
    duration: 50,
    image: 'https://picsum.photos/seed/python/400/200',
    category: 'Data Science',
    skills: ['Python', 'Pandas', 'Matplotlib', 'Data Analysis'],
    modules: [
      {
        id: 'p1',
        title: 'Module 1: Python Basics',
        lessons: [
          { id: 'pl1', title: 'Variables & Data Types', content: 'Python is a high-level, interpreted language...' },
          { id: 'pl2', title: 'Control Flow', content: 'If statements and loops are essential...' }
        ],
        quiz: {
          id: 'pq1',
          questions: [
            { question: 'Which of these is a Python list?', options: ['(1, 2)', '[1, 2]', '{1, 2}'], correct: 1 }
          ]
        }
      }
    ]
  },
  {
    id: 'course-3',
    title: 'UI/UX Design Essentials',
    description: 'Master Figma and design principles for modern apps.',
    duration: 35,
    image: 'https://picsum.photos/seed/design/400/200',
    category: 'Design',
    skills: ['Figma', 'UI Principles', 'UX Research', 'Prototyping'],
    modules: []
  },
  {
    id: 'course-4',
    title: 'Cybersecurity Fundamentals',
    description: 'Protect systems and networks from digital attacks.',
    duration: 45,
    image: 'https://picsum.photos/seed/cyber/400/200',
    category: 'IT & Security',
    skills: ['Network Security', 'Ethical Hacking', 'Cryptography', 'Threat Modeling'],
    modules: []
  },
  {
    id: 'course-5',
    title: 'Cloud Computing with AWS',
    description: 'Deploy and manage applications on Amazon Web Services.',
    duration: 60,
    image: 'https://picsum.photos/seed/cloud/400/200',
    category: 'IT & Security',
    skills: ['AWS Services', 'Cloud Architecture', 'Serverless', 'IAM'],
    modules: []
  },
  {
    id: 'course-6',
    title: 'Mobile App Dev with Flutter',
    description: 'Build beautiful cross-platform apps with Dart.',
    duration: 55,
    image: 'https://picsum.photos/seed/mobile/400/200',
    category: 'Development',
    skills: ['Flutter', 'Dart', 'Cross-platform Dev', 'Mobile UI'],
    modules: []
  },
  {
    id: 'course-7',
    title: 'Machine Learning A-Z',
    description: 'Dive deep into Scikit-Learn, Keras, and TensorFlow.',
    duration: 70,
    image: 'https://picsum.photos/seed/ml/400/200',
    category: 'Data Science',
    skills: ['Scikit-Learn', 'TensorFlow', 'Neural Networks', 'Regression'],
    modules: []
  },
  {
    id: 'course-8',
    title: 'Blockchain & Web3',
    description: 'Understand Ethereum, Solidity, and Smart Contracts.',
    duration: 40,
    image: 'https://picsum.photos/seed/blockchain/400/200',
    category: 'Development',
    skills: ['Solidity', 'Ethereum', 'Smart Contracts', 'Web3.js'],
    modules: []
  },
  {
    id: 'course-9',
    title: 'DevOps & Docker',
    description: 'Streamline development with CI/CD and containers.',
    duration: 30,
    image: 'https://picsum.photos/seed/devops/400/200',
    category: 'IT & Security',
    skills: ['Docker', 'Kubernetes', 'CI/CD Pipelines', 'Infrastructure as Code'],
    modules: []
  },
  {
    id: 'course-10',
    title: 'Full-Stack React & Node',
    description: 'Build scalable web applications with the MERN stack.',
    duration: 65,
    image: 'https://picsum.photos/seed/mern/400/200',
    category: 'Development',
    skills: ['React', 'Node.js', 'Express', 'MongoDB'],
    modules: []
  }
];
}

// Global reference to courses
let courseData = getCourses();

function createEmptyProgress() {
    return {
        completedLessons: {},
        passedQuizzes: {},
        completedModules: {}
    };
}

function getProgressStorageKey() {
    const sessionStr = localStorage.getItem('lms-session');
    if (!sessionStr) {
        return legacyProgressKey;
    }

    const session = JSON.parse(sessionStr);
    return session && session.email ? `${legacyProgressKey}:${session.email}` : legacyProgressKey;
}

function getProgressData() {
    const progressKey = getProgressStorageKey();
    const storedProgress = localStorage.getItem(progressKey);
    if (storedProgress) {
        return JSON.parse(storedProgress);
    }

    if (progressKey !== legacyProgressKey) {
        const legacyProgress = localStorage.getItem(legacyProgressKey);
        if (legacyProgress) {
            localStorage.setItem(progressKey, legacyProgress);
            localStorage.removeItem(legacyProgressKey);
            return JSON.parse(legacyProgress);
        }
    }

    const emptyProgress = createEmptyProgress();
    localStorage.setItem(progressKey, JSON.stringify(emptyProgress));
    return emptyProgress;
}

function saveProgressData(progress) {
    localStorage.setItem(getProgressStorageKey(), JSON.stringify(progress));
}

function getModuleRecord(moduleId) {
    for (const course of courseData) {
        const module = course.modules.find(m => m.id === moduleId);
        if (module) {
            return { course, module };
        }
    }
    return null;
}

function getLessonRecord(lessonId) {
    for (const course of courseData) {
        for (const module of course.modules) {
            const lesson = module.lessons.find(l => l.id === lessonId);
            if (lesson) {
                return { course, module, lesson };
            }
        }
    }
    return null;
}

function getQuizRecord(quizId) {
    for (const course of courseData) {
        for (const module of course.modules) {
            if (module.quiz && module.quiz.id === quizId) {
                return { course, module, quiz: module.quiz };
            }
        }
    }
    return null;
}

function getLessonProgressKey(courseId, lessonId) {
    return `${courseId}::${lessonId}`;
}

function getModuleProgressKey(courseId, moduleId) {
    return `${courseId}::${moduleId}`;
}

function getQuizProgressKey(courseId, quizId) {
    return `${courseId}::${quizId}`;
}

function isLessonCompleted(courseId, lessonId) {
    const progress = getProgressData();
    return progress.completedLessons[getLessonProgressKey(courseId, lessonId)] === true;
}

/**
 * Save current courseData to localStorage
 */
function saveCourses() {
    localStorage.setItem('lms-courses', JSON.stringify(courseData));
}

/**
 * Add a new course (Admin & Editor Feature)
 */
function addCourse(course) {
    const session = JSON.parse(localStorage.getItem('lms-session'));
    if (session && session.role === 'editor') {
        course.status = 'pending';
        course.authorEmail = session.email;
        course.rejectionReason = null;
    } else if (!course.status) {
        course.status = 'published';
    }
    courseData.push(course);
    saveCourses();
}

/**
 * Update an existing course (Admin & Editor Feature)
 */
function updateCourse(courseId, updatedData) {
    const index = courseData.findIndex(c => c.id === courseId);
    if (index !== -1) {
        const session = JSON.parse(localStorage.getItem('lms-session'));
        
        // If an editor updates a course, it goes back to pending review
        if (session && session.role === 'editor') {
            updatedData.status = 'pending';
            updatedData.rejectionReason = null;
        }
        
        courseData[index] = { ...courseData[index], ...updatedData };
        saveCourses();
        return true;
    }
    return false;
}

/**
 * Remove a course by ID (Admin & Editor Feature)
 */
async function removeCourse(courseId) {
    const courseToRemove = courseData.find(c => c.id === courseId);
    
    if (courseToRemove) {
        // Clean up asset blobs from IndexedDB
        if (courseToRemove.imageId) {
            await deleteAssetBlob(courseToRemove.imageId);
        }
        for (const module of courseToRemove.modules) {
            for (const lesson of module.lessons) {
                if (lesson.videoId) {
                    await deleteAssetBlob(lesson.videoId);
                }
            }
        }
    }

    courseData = courseData.filter(c => c.id !== courseId);
    saveCourses();
}

// --- Progress Management ---

/**
 * Initialize progress data in localStorage if it doesn't exist
 */
function initProgress() {
    getProgressData();
}

/**
 * Mark a lesson as completed and update progress
 */
function completeLesson(lessonId) {
    const lessonRecord = getLessonRecord(lessonId);
    if (!lessonRecord) return;

    const progress = getProgressData();
    progress.completedLessons[getLessonProgressKey(lessonRecord.course.id, lessonId)] = true;
    saveProgressData(progress);
    
    // Check if all lessons in the current module are done to unlock the quiz
    checkModuleReadiness();
    updateGlobalProgress(); // From app.js
}

/**
 * Check if all lessons in a module are completed
 */
function isModuleLessonsDone(moduleId) {
    const moduleRecord = getModuleRecord(moduleId);
    if (!moduleRecord) return false;
    
    return moduleRecord.module.lessons.every(lesson =>
        isLessonCompleted(moduleRecord.course.id, lesson.id)
    );
}

/**
 * Check if a module is fully completed (lessons + quiz)
 */
function isModuleCompleted(moduleId) {
    const moduleRecord = getModuleRecord(moduleId);
    if (!moduleRecord) return false;

    const progress = getProgressData();
    return progress.completedModules[getModuleProgressKey(moduleRecord.course.id, moduleId)] === true;
}

/**
 * Find module by ID in the course data
 */
function findModuleById(moduleId) {
    const moduleRecord = getModuleRecord(moduleId);
    return moduleRecord ? moduleRecord.module : null;
}

// --- Assessment System ---

let currentQuiz = null;
let userAnswers = [];
let quizFeedback = []; // Track if question has been checked

/**
 * Start a quiz for a specific module
 */
function startQuiz(moduleId) {
    const moduleRecord = getModuleRecord(moduleId);
    if (!moduleRecord || !isModuleLessonsDone(moduleId) || !moduleRecord.module.quiz || moduleRecord.module.quiz.questions.length === 0) {
        showNotification('Complete all lessons first!', 'error');
        return;
    }
    
    currentQuiz = moduleRecord.module.quiz;
    userAnswers = new Array(currentQuiz.questions.length).fill(null);
    quizFeedback = new Array(currentQuiz.questions.length).fill(false);
    renderQuiz(0);
}

/**
 * Render a quiz question
 */
function renderQuiz(questionIndex) {
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer) return;
    
    const q = currentQuiz.questions[questionIndex];
    const isChecked = quizFeedback[questionIndex];
    const selectedOpt = userAnswers[questionIndex];
    
    quizContainer.innerHTML = `
        <div class="card quiz-card">
            <div class="flex justify-between items-center mb-4">
                <p class="text-muted" style="font-size: 0.875rem;">Question ${questionIndex + 1} of ${currentQuiz.questions.length}</p>
                <div class="progress-container" style="width: 100px; height: 6px; margin: 0;">
                    <div class="progress-bar" style="width: ${((questionIndex + 1) / currentQuiz.questions.length) * 100}%"></div>
                </div>
            </div>
            
            <h3 class="mb-6" style="font-size: 1.25rem; line-height: 1.4;">${q.question}</h3>
            
            <div class="quiz-options">
                ${q.options.map((opt, i) => {
                    let statusClass = '';
                    if (selectedOpt === i) statusClass = 'selected';
                    
                    if (isChecked) {
                        if (i === q.correct) statusClass = 'correct';
                        else if (selectedOpt === i) statusClass = 'incorrect';
                        else statusClass = 'disabled';
                    }
                    
                    return `
                        <div class="quiz-option ${statusClass}" onclick="${isChecked ? '' : `selectOption(${questionIndex}, ${i})`}">
                            <div class="flex items-center gap-3">
                                <span class="opt-indicator">${String.fromCharCode(65 + i)}</span>
                                <span>${opt}</span>
                            </div>
                            ${isChecked && i === q.correct ? '<span class="text-success">✓</span>' : ''}
                            ${isChecked && selectedOpt === i && i !== q.correct ? '<span class="text-danger">✕</span>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>

            ${isChecked && selectedOpt !== null ? `
                <div class="p-4 rounded mb-6 ${selectedOpt === q.correct ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}" style="font-size: 0.875rem; font-weight: 500;">
                    ${selectedOpt === q.correct ? '✨ Correct! Well done.' : '❌ Incorrect. The correct answer was: ' + q.options[q.correct]}
                </div>
            ` : ''}

            <div class="mt-6 flex justify-between items-center">
                <div>
                    ${questionIndex > 0 ? `<button class="btn btn-outline" onclick="renderQuiz(${questionIndex - 1})">Previous</button>` : ''}
                </div>
                
                <div class="flex gap-2">
                    ${!isChecked && selectedOpt !== null ? `
                        <button class="btn btn-primary" onclick="checkAnswer(${questionIndex})">Check Answer</button>
                    ` : ''}
                    
                    ${isChecked || selectedOpt === null ? `
                        ${questionIndex < currentQuiz.questions.length - 1 
                            ? `<button class="btn btn-primary" ${selectedOpt === null ? 'disabled' : ''} onclick="renderQuiz(${questionIndex + 1})">Next Question</button>` 
                            : `<button class="btn btn-primary" ${selectedOpt === null ? 'disabled' : ''} onclick="submitQuiz()">Finish Quiz</button>`}
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Handle option selection in quiz
 */
function selectOption(qIndex, optIndex) {
    userAnswers[qIndex] = optIndex;
    renderQuiz(qIndex);
}

/**
 * Provide immediate feedback for a question
 */
function checkAnswer(qIndex) {
    quizFeedback[qIndex] = true;
    renderQuiz(qIndex);
}

/**
 * Submit quiz and calculate score
 */
function submitQuiz() {
    if (userAnswers.includes(null)) {
        showNotification('Please answer all questions!', 'error');
        return;
    }
    
    let correctCount = 0;
    currentQuiz.questions.forEach((q, i) => {
        if (userAnswers[i] === q.correct) correctCount++;
    });
    
    const score = Math.round((correctCount / currentQuiz.questions.length) * 100);
    const passed = score >= 70;
    
    showQuizResult(score, passed);
    
    if (passed) {
        const progress = getProgressData();
        const quizRecord = getQuizRecord(currentQuiz.id);
        const moduleId = quizRecord ? quizRecord.module.id : null;
        if (quizRecord && moduleId) {
            progress.passedQuizzes[getQuizProgressKey(quizRecord.course.id, currentQuiz.id)] = true;
            progress.completedModules[getModuleProgressKey(quizRecord.course.id, moduleId)] = true;
            saveProgressData(progress);
        }
        showNotification('Module completed successfully!', 'success');
    } else {
        showNotification('Score below 70%. Please retry.', 'error');
    }
}

/**
 * Show quiz result screen
 */
function showQuizResult(score, passed) {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = `
        <div class="card text-center">
            <h2 class="mb-2">${passed ? 'Congratulations!' : 'Try Again'}</h2>
            <p class="text-muted mb-4">Your Score: ${score}%</p>
            <div class="mb-4" style="font-size: 4rem;">${passed ? '🎉' : '❌'}</div>
            <p class="mb-4">${passed ? 'You have successfully completed this module.' : 'You need at least 70% to pass.'}</p>
            ${passed 
                ? `<button class="btn btn-primary" onclick="location.reload()">Back to Course</button>` 
                : `<button class="btn btn-primary" onclick="startQuiz(findModuleIdByQuizId(currentQuiz.id))">Retry Quiz</button>`}
        </div>
    `;
}

function findModuleIdByQuizId(quizId) {
    const quizRecord = getQuizRecord(quizId);
    return quizRecord ? quizRecord.module.id : null;
}

/**
 * Calculate progress for a specific course
 */
function getCourseProgress(courseId) {
    const progress = getProgressData();
    const course = courseData.find(c => c.id === courseId);
    if (!course) return 0;
    
    let totalLessons = 0;
    let completedCount = 0;
    
    course.modules.forEach(module => {
        totalLessons += module.lessons.length;
        module.lessons.forEach(lesson => {
            if (progress.completedLessons[getLessonProgressKey(course.id, lesson.id)]) {
                completedCount++;
            }
        });
    });
    
    return Math.round((completedCount / totalLessons) * 100) || 0;
}

// Initialize on load
initProgress();
