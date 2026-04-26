// ==================== CONFIGURATION ====================
// Replace these with your actual Appwrite credentials
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '69ece2d00016692b81da';
const APPWRITE_DATABASE_ID = '69ecf5d90022b54670d3';
const COLLECTION_BLOGS = 'blogs';
const COLLECTION_NOTES = 'notes';
const COLLECTION_TASKS = 'tasks';

// ==================== APPWRITE INIT ====================
const { Client, Account, Databases, Query, ID } = Appwrite;

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

// ==================== STATE ====================
let currentUser = null;
let currentView = 'home';
let taskFilter = 'all';

// Data caches
let blogsCache = [];
let publicBlogsCache = [];
let notesCache = [];
let tasksCache = [];
let quill; // Quill editor instance for content
let quillTitle; // Quill editor instance for title

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    feather.replace();
    initTheme();
    initNavigation();
    initTaskFilters();
    if (typeof Quill !== 'undefined') {
        initQuill();
    }
    trackVisitor();
    await checkAuth();
});

function initQuill() {
    const toolbarOptions = [
        ['bold', 'italic'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }]
    ];

    quillTitle = new Quill('#blog-title-editor', {
        theme: 'snow',
        modules: { toolbar: toolbarOptions },
        placeholder: 'Blog title...'
    });

    quill = new Quill('#blog-editor', {
        theme: 'snow',
        modules: { toolbar: toolbarOptions },
        placeholder: 'Write your thoughts here...'
    });
}

async function checkAuth() {
    feather.replace();

    // Check session
    try {
        currentUser = await account.get();
        onLoginSuccess();
    } catch {
        onLoggedOut();
    }

    // Check hash for initial view
    const hash = window.location.hash.replace('#', '');
    if (hash && (hash === 'home' || hash === 'login' || currentUser)) {
        switchView(hash, false);
    } else {
        switchView('home', false);
    }
}

// ==================== THEME ====================
function initTheme() {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);

    document.getElementById('theme-toggle').addEventListener('click', () => {
        const nowDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = nowDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(!nowDark);
    });
}

function updateThemeIcon(isDark) {
    const btn = document.getElementById('theme-toggle');
    btn.innerHTML = isDark
        ? '<i data-feather="moon" class="icon-sm"></i>'
        : '<i data-feather="sun" class="icon-sm"></i>';
    feather.replace();
}

// ==================== NAVIGATION ====================
function initNavigation() {
    document.querySelectorAll('.os-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchView(view);
        });
    });
}

function switchView(view, push = true) {
    // Prevent authenticated users from going back to login
    if (view === 'login' && currentUser) {
        view = 'dashboard';
    }

    currentView = view;
    document.querySelectorAll('[id^="view-"]').forEach(v => v.style.display = 'none');
    document.getElementById(`view-${view}`).style.display = 'block';

    // Update nav active state
    document.querySelectorAll('.os-nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-view') === view);
    });

    // Update browser history
    if (push) {
        const urlHash = view === 'home' ? window.location.pathname : `#${view}`;
        if (push === 'replace') {
            history.replaceState({ view }, "", urlHash);
        } else {
            history.pushState({ view }, "", urlHash);
        }
    }

    // Reset login button state whenever switching views
    const loginBtn = document.getElementById('login-submit-btn');
    if (loginBtn) {
        loginBtn.disabled = false;
        const btnContent = loginBtn.querySelector('.btn-content');
        const btnLoader = loginBtn.querySelector('.btn-loader');
        if (btnContent) btnContent.style.display = 'flex';
        if (btnLoader) btnLoader.style.display = 'none';
    }

    // View specific loads
    if (view === 'blogs') loadMyBlogs();
    if (view === 'notes') loadNotes();
    if (view === 'tasks') loadTasks();
    if (view === 'home') loadPublicBlogs();
    if (view === 'dashboard') loadDashboardStats();
}

// Guest Tab Switcher
function toggleGuestTab(tab, btn) {
    // Toggle active button
    document.querySelectorAll('.os-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Toggle content
    document.getElementById('guest-tab-projects').style.display = tab === 'projects' ? 'block' : 'none';
    document.getElementById('guest-tab-blogs').style.display = tab === 'blogs' ? 'block' : 'none';

    // Precise scroll with offset for sticky header
    const tabsElem = document.getElementById('guest-tabs');
    const offset = 100; // Height of sticky header + gap
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = tabsElem.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });

    // If switching to blogs, ensure they are loaded
    if (tab === 'blogs') {
        loadPublicBlogs();
    }
}

// Handle Browser Back/Forward buttons
window.onpopstate = function(event) {
    if (event.state && event.state.view) {
        switchView(event.state.view, false);
    } else {
        // Default to home if no state
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            switchView(hash, false);
        } else {
            switchView('home', false);
        }
    }
};

// ==================== AUTH ====================
async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-submit-btn');
    const btnContent = btn.querySelector('.btn-content');
    const btnLoader = btn.querySelector('.btn-loader');

    errorEl.style.display = 'none';

    if (!email || !password) {
        errorEl.textContent = 'Please enter email and password.';
        errorEl.style.display = 'block';
        return;
    }

    // Set loading state
    btn.disabled = true;
    btnContent.style.display = 'none';
    btnLoader.style.display = 'block';

    try {
        await account.createEmailPasswordSession(email, password);
        currentUser = await account.get();
        onLoginSuccess();
    } catch (err) {
        errorEl.textContent = err.message || 'Login failed. Check your credentials.';
        errorEl.style.display = 'block';
        
        // Reset loading state on error
        btn.disabled = false;
        btnContent.style.display = 'flex';
        btnLoader.style.display = 'none';
    }
}

async function handleLogout() {
    try {
        await account.deleteSession('current');
    } catch { }
    currentUser = null;
    onLoggedOut();
    switchView('home');
}

function onLoginSuccess() {
    document.body.classList.add('logged-in');
    document.getElementById('nav-login-btn').style.display = 'none';
    document.getElementById('user-pill').style.display = 'inline-flex';
    document.getElementById('logout-btn').style.display = 'inline-flex';
    document.getElementById('user-name').textContent = currentUser.name || currentUser.email.split('@')[0];
    feather.replace();

    loadDashboardStats();
    loadPublicBlogs();

    // If we were on the login page, replace history so we can't go back to it
    if (currentView === 'login') {
        switchView('dashboard', 'replace');
    } else {
        switchView(currentView, 'replace');
    }
}

function onLoggedOut() {
    document.body.classList.remove('logged-in');
    document.getElementById('nav-login-btn').style.display = 'inline-flex';
    document.getElementById('user-pill').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

// ==================== DASHBOARD STATS ====================
async function loadDashboardStats() {
    if (!currentUser) return;
    try {
        const blogs = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTION_BLOGS, [
            Query.equal('user_id', currentUser.$id), Query.limit(100)
        ]);
        const tasks = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTION_TASKS, [
            Query.equal('user_id', currentUser.$id), Query.limit(100)
        ]);

        document.getElementById('stat-blogs-total').textContent = blogs.total;
        document.getElementById('stat-blogs-published').textContent = blogs.documents.filter(b => b.status === 'published').length;
        document.getElementById('stat-tasks-total').textContent = tasks.total;
        document.getElementById('stat-tasks-completed').textContent = tasks.documents.filter(t => t.status === 'completed').length;
        
        // Update visitor count from global state
        const dashCounter = document.getElementById('stat-visitors-total');
        if (dashCounter) {
            dashCounter.textContent = globalVisitorCount;
        }
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// ==================== PUBLIC BLOGS ====================
async function loadPublicBlogs() {
    const grid = document.getElementById('public-blogs-grid');
    grid.innerHTML = '<div class="os-loading"><div class="os-spinner"></div></div>';

    try {
        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTION_BLOGS, [
            Query.equal('status', 'published'),
            Query.orderDesc('created_at'),
            Query.limit(20)
        ]);
        publicBlogsCache = res.documents;

        if (res.documents.length === 0) {
            grid.innerHTML = `
                <div class="os-empty" style="grid-column: 1/-1;">
                    <i data-feather="edit-3" class="os-empty-icon"></i>
                    <h3>No published blogs yet</h3>
                    <p>Check back soon for new content.</p>
                </div>`;
            feather.replace();
            return;
        }

        grid.innerHTML = res.documents.map(blog => `
            <div class="os-card clickable" onclick="openBlogViewer('${blog.$id}', true)">
                <div class="os-card-meta">
                    <span class="os-badge os-badge-published">Published</span>
                    <span>${formatDate(blog.created_at)}</span>
                </div>
                <h3 class="os-card-title">${blog.title}</h3>
                <p class="os-card-desc">${stripHtml(blog.content)}</p>
            </div>
        `).join('');
        feather.replace();
    } catch (err) {
        grid.innerHTML = `<div class="os-empty" style="grid-column:1/-1;"><p>Configure Appwrite to see blogs.</p></div>`;
        console.error('Public blogs error:', err);
    }
}

// Global cache for public blogs to avoid refetching for viewer
async function openBlogViewer(id, isPublic = false) {
    let blog;
    if (isPublic) {
        blog = publicBlogsCache.find(b => b.$id === id);
    } else {
        blog = blogsCache.find(b => b.$id === id);
    }

    if (!blog) return;

    document.getElementById('viewer-title').innerHTML = blog.title;
    document.getElementById('viewer-date').textContent = formatDate(blog.created_at);
    document.getElementById('viewer-content').innerHTML = blog.content;

    document.getElementById('blog-viewer-modal').classList.add('active');
}

function closeBlogViewer() {
    document.getElementById('blog-viewer-modal').classList.remove('active');
}

// ==================== MY BLOGS (CRUD) ====================
async function loadMyBlogs() {
    const grid = document.getElementById('blogs-grid');
    grid.innerHTML = '<div class="os-loading"><div class="os-spinner"></div></div>';

    try {
        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTION_BLOGS, [
            Query.equal('user_id', currentUser.$id),
            Query.orderDesc('created_at'),
            Query.limit(50)
        ]);
        blogsCache = res.documents;

        if (blogsCache.length === 0) {
            grid.innerHTML = `
                <div class="os-empty" style="grid-column:1/-1;">
                    <i data-feather="edit-3" class="os-empty-icon"></i>
                    <h3>No blogs yet</h3>
                    <p>Write your first blog post.</p>
                </div>`;
            feather.replace();
            return;
        }

        grid.innerHTML = blogsCache.map(blog => `
            <div class="os-card clickable" onclick="openBlogViewer('${blog.$id}')">
                <div class="os-card-meta">
                    <span class="os-badge ${blog.status === 'published' ? 'os-badge-published' : 'os-badge-draft'}">${blog.status}</span>
                    <span>${formatDate(blog.created_at)}</span>
                </div>
                <h3 class="os-card-title">${blog.title}</h3>
                <p class="os-card-desc">${stripHtml(blog.content)}</p>
                <div class="os-card-footer">
                    <span style="font-size:0.75rem; color:var(--text-muted);">${blog.content.length} chars</span>
                    <div class="os-card-actions" onclick="event.stopPropagation()">
                        <button onclick="editBlog('${blog.$id}')" title="Edit"><i data-feather="edit-2"></i></button>
                        <button class="delete" onclick="deleteBlog('${blog.$id}')" title="Delete"><i data-feather="trash-2"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
        feather.replace();
    } catch (err) {
        grid.innerHTML = `<div class="os-empty" style="grid-column:1/-1;"><p>Error loading blogs.</p></div>`;
        console.error('Blogs error:', err);
    }
}

function openBlogModal(id = null) {
    document.getElementById('blog-edit-id').value = '';
    document.getElementById('blog-status').value = 'draft';
    document.getElementById('blog-modal-title').textContent = 'New Blog';

    if (id) {
        const blog = blogsCache.find(b => b.$id === id);
        if (blog) {
            document.getElementById('blog-edit-id').value = blog.$id;
            quillTitle.root.innerHTML = blog.title;
            quill.root.innerHTML = blog.content;
            document.getElementById('blog-status').value = blog.status;
            document.getElementById('blog-modal-title').textContent = 'Edit Blog';
        } else {
            quillTitle.setContents([]);
            quill.setContents([]);
        }
    } else {
        quillTitle.setContents([]);
        quill.setContents([]);
    }

    document.getElementById('blog-modal').classList.add('active');
}

function closeBlogModal() {
    document.getElementById('blog-modal').classList.remove('active');
}

function editBlog(id) { openBlogModal(id); }

async function saveBlog() {
    const editId = document.getElementById('blog-edit-id').value;
    const title = quillTitle.root.innerHTML;
    const content = quill.root.innerHTML;
    const status = document.getElementById('blog-status').value;

    if (quillTitle.getText().trim().length === 0) return alert('Title is required.');
    if (quill.getText().trim().length === 0) return alert('Content is required.');

    try {
        if (editId) {
            await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTION_BLOGS, editId, {
                title, content, status
            });
        } else {
            await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTION_BLOGS, ID.unique(), {
                user_id: currentUser.$id,
                title, content, status,
                created_at: new Date().toISOString()
            });
        }
        closeBlogModal();
        loadMyBlogs();
        loadPublicBlogs();
        loadDashboardStats();
    } catch (err) {
        alert('Error saving blog: ' + err.message);
    }
}

async function deleteBlog(id) {
    if (!confirm('Delete this blog?')) return;
    try {
        await databases.deleteDocument(APPWRITE_DATABASE_ID, COLLECTION_BLOGS, id);
        loadMyBlogs();
        loadPublicBlogs();
        loadDashboardStats();
    } catch (err) {
        alert('Error deleting blog: ' + err.message);
    }
}

// ==================== NOTES (CRUD) ====================
async function loadNotes() {
    const list = document.getElementById('notes-list');
    list.innerHTML = '<div class="os-loading"><div class="os-spinner"></div></div>';

    try {
        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTION_NOTES, [
            Query.equal('user_id', currentUser.$id),
            Query.orderDesc('created_at'),
            Query.limit(50)
        ]);
        notesCache = res.documents;

        if (notesCache.length === 0) {
            list.innerHTML = `
                <div class="os-empty">
                    <i data-feather="file-text" class="os-empty-icon"></i>
                    <h3>No notes yet</h3>
                    <p>Capture your first thought.</p>
                </div>`;
            feather.replace();
            return;
        }

        list.innerHTML = notesCache.map(note => `
            <div class="os-note-item">
                <div class="os-note-header">
                    <span class="os-note-title">${escapeHtml(note.title)}</span>
                    <span class="os-note-date">${formatDate(note.created_at)}</span>
                </div>
                <p class="os-note-content">${escapeHtml(note.content)}</p>
                <div class="os-note-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editNote('${note.$id}')">
                        <i data-feather="edit-2" class="btn-icon"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteNote('${note.$id}')">
                        <i data-feather="trash-2" class="btn-icon"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        feather.replace();
    } catch (err) {
        list.innerHTML = `<div class="os-empty"><p>Error loading notes.</p></div>`;
        console.error('Notes error:', err);
    }
}

function openNoteModal(id = null) {
    document.getElementById('note-edit-id').value = '';
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('note-modal-title').textContent = 'New Note';

    if (id) {
        const note = notesCache.find(n => n.$id === id);
        if (note) {
            document.getElementById('note-edit-id').value = note.$id;
            document.getElementById('note-title').value = note.title;
            document.getElementById('note-content').value = note.content;
            document.getElementById('note-modal-title').textContent = 'Edit Note';
        }
    }

    document.getElementById('note-modal').classList.add('active');
}

function closeNoteModal() {
    document.getElementById('note-modal').classList.remove('active');
}

function editNote(id) { openNoteModal(id); }

async function saveNote() {
    const editId = document.getElementById('note-edit-id').value;
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();

    if (!title) return alert('Title is required.');

    try {
        if (editId) {
            await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTION_NOTES, editId, {
                title, content
            });
        } else {
            await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTION_NOTES, ID.unique(), {
                user_id: currentUser.$id,
                title, content,
                created_at: new Date().toISOString()
            });
        }
        closeNoteModal();
        loadNotes();
    } catch (err) {
        alert('Error saving note: ' + err.message);
    }
}

async function deleteNote(id) {
    if (!confirm('Delete this note?')) return;
    try {
        await databases.deleteDocument(APPWRITE_DATABASE_ID, COLLECTION_NOTES, id);
        loadNotes();
    } catch (err) {
        alert('Error deleting note: ' + err.message);
    }
}

// ==================== TASKS (CRUD) ====================
function initTaskFilters() {
    document.querySelectorAll('.os-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            taskFilter = btn.getAttribute('data-filter');
            document.querySelectorAll('.os-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks();
        });
    });
}

async function loadTasks() {
    const list = document.getElementById('tasks-list');
    list.innerHTML = '<div class="os-loading"><div class="os-spinner"></div></div>';

    try {
        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTION_TASKS, [
            Query.equal('user_id', currentUser.$id),
            Query.orderDesc('created_at'),
            Query.limit(100)
        ]);
        tasksCache = res.documents;
        renderTasks();
    } catch (err) {
        list.innerHTML = `<div class="os-empty"><p>Error loading tasks.</p></div>`;
        console.error('Tasks error:', err);
    }
}

function renderTasks() {
    const list = document.getElementById('tasks-list');
    let filtered = tasksCache;

    if (taskFilter === 'pending') filtered = tasksCache.filter(t => t.status === 'pending');
    if (taskFilter === 'completed') filtered = tasksCache.filter(t => t.status === 'completed');

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="os-empty">
                <i data-feather="check-square" class="os-empty-icon"></i>
                <h3>No tasks found</h3>
                <p>${taskFilter === 'all' ? 'Add your first task.' : `No ${taskFilter} tasks.`}</p>
            </div>`;
        feather.replace();
        return;
    }

    list.innerHTML = filtered.map(task => `
        <div class="os-task-item ${task.status === 'completed' ? 'completed' : ''}">
            <button class="os-task-check ${task.status === 'completed' ? 'checked' : ''}" onclick="toggleTask('${task.$id}')">
                ${task.status === 'completed' ? '✓' : ''}
            </button>
            <div class="os-task-info">
                <div class="os-task-title">${escapeHtml(task.title)}</div>
                <div class="os-task-sub">
                    ${task.description ? escapeHtml(task.description) + ' · ' : ''}
                    ${task.due_date ? 'Due: ' + formatDate(task.due_date) : ''}
                    ${!task.description && !task.due_date ? formatDate(task.created_at) : ''}
                </div>
            </div>
            <div class="os-task-actions">
                <button onclick="editTask('${task.$id}')" title="Edit"><i data-feather="edit-2"></i></button>
                <button onclick="deleteTask('${task.$id}')" title="Delete"><i data-feather="trash-2"></i></button>
            </div>
        </div>
    `).join('');
    feather.replace();
}

async function toggleTask(id) {
    const task = tasksCache.find(t => t.$id === id);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
        await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTION_TASKS, id, { status: newStatus });
        task.status = newStatus;
        renderTasks();
        loadDashboardStats();
    } catch (err) {
        alert('Error updating task: ' + err.message);
    }
}

function openTaskModal(id = null) {
    document.getElementById('task-edit-id').value = '';
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-due').value = '';
    document.getElementById('task-modal-title').textContent = 'New Task';

    if (id) {
        const task = tasksCache.find(t => t.$id === id);
        if (task) {
            document.getElementById('task-edit-id').value = task.$id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-desc').value = task.description || '';
            document.getElementById('task-due').value = task.due_date || '';
            document.getElementById('task-modal-title').textContent = 'Edit Task';
        }
    }

    document.getElementById('task-modal').classList.add('active');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
}

function editTask(id) { openTaskModal(id); }

async function saveTask() {
    const editId = document.getElementById('task-edit-id').value;
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-desc').value.trim();
    const due_date = document.getElementById('task-due').value;

    if (!title) return alert('Title is required.');

    try {
        if (editId) {
            await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTION_TASKS, editId, {
                title, description, due_date
            });
        } else {
            await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTION_TASKS, ID.unique(), {
                user_id: currentUser.$id,
                title, description,
                status: 'pending',
                due_date: due_date || '',
                created_at: new Date().toISOString()
            });
        }
        closeTaskModal();
        loadTasks();
        loadDashboardStats();
    } catch (err) {
        alert('Error saving task: ' + err.message);
    }
}

async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    try {
        await databases.deleteDocument(APPWRITE_DATABASE_ID, COLLECTION_TASKS, id);
        tasksCache = tasksCache.filter(t => t.$id !== id);
        renderTasks();
        loadDashboardStats();
    } catch (err) {
        alert('Error deleting task: ' + err.message);
    }
}

// ==================== HELPERS ====================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

// Close modals on overlay click
document.querySelectorAll('.os-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            // Check if backdrop closing is disabled for this modal
            if (overlay.getAttribute('data-no-backdrop-close') === 'true') {
                return;
            }
            overlay.classList.remove('active');
        }
    });
});

// Close modals on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.os-modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
});

// ==================== VISITOR LOGIC ====================
let globalVisitorCount = "...";
async function trackVisitor() {
    try {
        let count = 0;
        try {
            // Try internal API proxy first (works in production Vercel)
            const response = await fetch('/api/visit');
            if (!response.ok) throw new Error("Proxy response not ok");
            const data = await response.json();
            if (data && typeof data.count === 'number') {
                count = data.count;
            } else {
                throw new Error("Invalid proxy data");
            }
        } catch (err) {
            // Fallback for local development where /api/visit is not served as a function
            const fallbackResponse = await fetch('https://abacus.jasoncameron.dev/hit/mjb-resume-2026/visits');
            const fallbackData = await fallbackResponse.json();
            if (fallbackData && typeof fallbackData.value === 'number') {
                count = fallbackData.value;
            }
        }
        globalVisitorCount = count.toLocaleString();
        
        // If dashboard is open, update it
        const dashCounter = document.getElementById('stat-visitors-total');
        if (dashCounter) {
            dashCounter.innerText = globalVisitorCount;
        }
    } catch (error) {
        console.error('Visitor tracking error:', error);
    }
}

// ==================== EXPORT TASKS ====================
function openExportModal() {
    document.getElementById('export-tasks-modal').classList.add('active');
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('export-start-date').value = today;
    document.getElementById('export-end-date').value = today;
    document.getElementById('export-date-range').value = 'today';
    toggleCustomDates();
}

function closeExportModal() {
    document.getElementById('export-tasks-modal').classList.remove('active');
}

function toggleCustomDates() {
    const range = document.getElementById('export-date-range').value;
    document.getElementById('custom-date-fields').style.display = range === 'custom' ? 'flex' : 'none';
}

async function exportTasks(type) {
    const range = document.getElementById('export-date-range').value;
    let startDate = new Date();
    let endDate = new Date();

    if (range === 'today') {
        startDate.setHours(0,0,0,0);
        endDate.setHours(23,59,59,999);
    } else if (range === 'month') {
        startDate.setDate(1);
        startDate.setHours(0,0,0,0);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23,59,59,999);
    } else if (range === 'custom') {
        const startVal = document.getElementById('export-start-date').value;
        const endVal = document.getElementById('export-end-date').value;
        if (!startVal || !endVal) {
            alert("Please select both start and end dates.");
            return;
        }
        startDate = new Date(startVal);
        startDate.setHours(0,0,0,0);
        endDate = new Date(endVal);
        endDate.setHours(23,59,59,999);
    }

    // Filter tasks from cache
    const filteredTasks = tasksCache.filter(t => {
        const tDate = new Date(t.created_at || t.$createdAt);
        return tDate >= startDate && tDate <= endDate;
    });

    if (filteredTasks.length === 0) {
        alert("No tasks found in this date range.");
        return;
    }

    // Prepare data
    const rows = filteredTasks.map((t, index) => [
        index + 1,
        t.title || '',
        t.description || '',
        t.status === 'completed' ? 'Completed' : 'Pending'
    ]);
    const header = ['Sl. No.', 'Task Name', 'Description', 'Status'];

    if (type === 'csv') {
        const csvContent = [header, ...rows].map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Tasks_Report_${range}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (type === 'pdf') {
        if (!window.jspdf) {
            alert("PDF generation library is still loading, please try again in a moment.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(`Tasks Report (${range.toUpperCase()})`, 14, 15);
        
        doc.setFontSize(10);
        doc.text(`Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, 14, 22);

        doc.autoTable({
            startY: 28,
            head: [header],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [138, 125, 244] },
            styles: { fontSize: 9 }
        });

        doc.save(`Tasks_Report_${range}.pdf`);
    }

    closeExportModal();
}
