// Study Planner Application
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const timeline = document.getElementById('timeline');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const reminderText = document.getElementById('reminder-text');
    
    // Statistics elements
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const progressBar = document.getElementById('progress-bar');
    const upcomingDeadlinesEl = document.getElementById('upcoming-deadlines');
    
    // Initialize tasks array from local storage or empty array
    let tasks = JSON.parse(localStorage.getItem('studyTasks')) || [];
    
    // Initialize the app
    function init() {
        renderTasks();
        updateStatistics();
        checkReminders();
        setupTabs();
    }
    
    // Set up tab functionality
    function setupTabs() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab') + '-view';
                document.getElementById(tabId).classList.add('active');
                
                // If switching to timeline view, render it
                if (tabId === 'timeline-view') {
                    renderTimeline();
                }
            });
        });
    }
    
    // Add task form submission
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const deadline = document.getElementById('task-deadline').value;
        const priority = document.getElementById('task-priority').value;
        
        // Create task object
        const task = {
            id: Date.now(), // Simple ID generation
            title,
            description,
            deadline,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Add to tasks array
        tasks.push(task);
        
        // Save to local storage
        saveTasks();
        
        // Re-render tasks and update statistics
        renderTasks();
        updateStatistics();
        checkReminders();
        
        // Reset form
        taskForm.reset();
    });
    
    // Save tasks to local storage
    function saveTasks() {
        localStorage.setItem('studyTasks', JSON.stringify(tasks));
    }
    
    // Render tasks in list view
    function renderTasks() {
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i>📚</i>
                    <h3>No study tasks yet</h3>
                    <p>Add your first task to get started!</p>
                </div>
            `;
            return;
        }
        
        // Sort tasks by deadline (soonest first)
        const sortedTasks = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        
        taskList.innerHTML = sortedTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-info">
                    <h3>${task.title}</h3>
                    <p>${task.description}</p>
                    <div class="task-meta">
                        <span>Due: ${formatDate(task.deadline)}</span>
                        <span class="priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-edit" onclick="toggleTask(${task.id})">
                        ${task.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button class="btn btn-danger" onclick="deleteTask(${task.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    // Render timeline view
    function renderTimeline() {
        if (tasks.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <i>📅</i>
                    <h3>No tasks to display</h3>
                    <p>Add tasks to see them on the timeline.</p>
                </div>
            `;
            return;
        }
        
        // Sort tasks by deadline
        const sortedTasks = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        
        timeline.innerHTML = sortedTasks.map(task => `
            <div class="timeline-item">
                <div class="timeline-content ${task.completed ? 'completed' : ''}">
                    <h3>${task.title}</h3>
                    <p>${task.description}</p>
                    <div class="task-meta">
                        <span>Due: ${formatDate(task.deadline)}</span>
                        <span class="priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
                    </div>
                    <div class="task-actions" style="margin-top: 10px;">
                        <button class="btn btn-edit" onclick="toggleTask(${task.id})">
                            ${task.completed ? 'Undo' : 'Complete'}
                        </button>
                        <button class="btn btn-danger" onclick="deleteTask(${task.id})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Toggle task completion status
    window.toggleTask = function(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        
        saveTasks();
        renderTasks();
        updateStatistics();
        
        // If we're on the timeline view, update it too
        if (document.getElementById('timeline-view').classList.contains('active')) {
            renderTimeline();
        }
    };
    
    // Delete a task
    window.deleteTask = function(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateStatistics();
            
            // If we're on the timeline view, update it too
            if (document.getElementById('timeline-view').classList.contains('active')) {
                renderTimeline();
            }
        }
    };
    
    // Update statistics
    function updateStatistics() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
        progressBar.style.width = `${progress}%`;
        
        // Update upcoming deadlines
        const upcoming = tasks
            .filter(task => !task.completed)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 3); // Show only 3 upcoming deadlines
        
        if (upcoming.length === 0) {
            upcomingDeadlinesEl.innerHTML = '<p>No upcoming deadlines.</p>';
        } else {
            upcomingDeadlinesEl.innerHTML = upcoming.map(task => `
                <div class="stat-item">
                    <span>${task.title}</span>
                    <span>${formatDate(task.deadline)}</span>
                </div>
            `).join('');
        }
    }
    
    // Check for reminders (tasks due within 2 days)
    function checkReminders() {
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        
        const urgentTasks = tasks.filter(task => {
            if (task.completed) return false;
            
            const taskDate = new Date(task.deadline);
            return taskDate <= twoDaysFromNow && taskDate >= now;
        });
        
        if (urgentTasks.length === 0) {
            reminderText.textContent = 'No upcoming deadlines.';
            document.getElementById('reminder-section').style.display = 'none';
        } else {
            document.getElementById('reminder-section').style.display = 'block';
            reminderText.textContent = `You have ${urgentTasks.length} task(s) due soon!`;
        }
    }
    
    // Format date for display
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    // Initialize the application
    init();
});