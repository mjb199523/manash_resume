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
let currentViewingBlogId = null;
let quill; // Quill editor instance for content
let quillTitle; // Quill editor instance for title

// Capture blog query param early before checkAuth can strip it via history.replaceState
let pendingBlogId = new URLSearchParams(window.location.search).get('blog');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    feather.replace();
    initTheme();
    initNavigation();
    initTaskFilters();
    if (typeof Quill !== 'undefined') {
        initQuill();
    }
    trackUniqueVisitor();
    await checkAuth();
    await checkBlogQueryParam();
    
    // Smoothly dismiss preloader after initial load
    setTimeout(() => {
        const preloader = document.getElementById('os-preloader');
        if (preloader) preloader.classList.add('fade-out');
        document.body.classList.add('loaded');
    }, 600);
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

    // 1. Read hash before ANY state changes
    const hash = window.location.hash.replace('#', '');
    
    // 2. We use a flag to tell onLoginSuccess NOT to redirect if we are just loading
    window.isInitialLoad = true;

    // Check session
    try {
        currentUser = await account.get();
        onLoginSuccess();
    } catch {
        onLoggedOut();
    }

    // 3. Route to the correct view based on auth state and hash
    if (currentUser) {
        // Logged in: allow dashboard, blogs, notes, tasks
        if (hash && ['dashboard', 'blogs', 'notes', 'tasks'].includes(hash)) {
            switchView(hash, 'replace');
        } else {
            switchView('dashboard', 'replace');
        }
    } else {
        // Logged out: allow home, login
        if (hash && (hash === 'home' || hash === 'login')) {
            switchView(hash, 'replace');
        } else {
            switchView('home', 'replace');
        }
    }
    
    // 4. Hide the initial loader (skip if a blog deep link is pending — it will be hidden after the modal opens)
    if (!pendingBlogId) {
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 300);
        }
    }
    
    window.isInitialLoad = false;
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
    
    // Hide all views and remove active state
    document.querySelectorAll('.os-view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) {
        viewEl.style.display = 'block';
        // Trigger animation next frame
        requestAnimationFrame(() => {
            viewEl.classList.add('active');
        });
    }

    // Toggle Journey Mode button visibility
    const journeyToggle = document.getElementById('journey-mode-toggle');
    if (journeyToggle) {
        journeyToggle.style.display = (view === 'home' && !currentUser) ? 'inline-flex' : 'none';
    }

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
    document.getElementById('guest-tab-games').style.display = tab === 'games' ? 'block' : 'none';
    document.getElementById('guest-tab-experiments').style.display = tab === 'experiments' ? 'block' : 'none';

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
    if (document.getElementById('journey-mode-toggle')) {
        document.getElementById('journey-mode-toggle').style.display = 'none';
    }
    document.getElementById('user-pill').style.display = 'inline-flex';
    document.getElementById('logout-btn').style.display = 'inline-flex';
    document.getElementById('user-name').textContent = currentUser.name || currentUser.email.split('@')[0];
    feather.replace();

    loadDashboardStats();
    loadPublicBlogs();

    // If we were on the login page, replace history so we can't go back to it
    if (!window.isInitialLoad) {
        if (currentView === 'login') {
            switchView('dashboard', 'replace');
        } else {
            switchView(currentView, 'replace');
        }
    }
}

function onLoggedOut() {
    document.body.classList.remove('logged-in');
    document.getElementById('nav-login-btn').style.display = 'inline-flex';
    if (document.getElementById('journey-mode-toggle') && currentView === 'home') {
        document.getElementById('journey-mode-toggle').style.display = 'inline-flex';
    }
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
        
        // Update visitor count
        getVisitorCountForDashboard();
    } catch (err) {
        console.error('Stats error:', err);
    }
}

function updateGuestStats() {
    const blogCount = publicBlogsCache.length;
    // Count projects from the DOM since they are currently static
    const projectCards = document.querySelectorAll('#guest-tab-projects .project-card');
    const projectCount = projectCards.length;
    const experimentCards = document.querySelectorAll('#guest-tab-experiments .os-card');
    const experimentCount = experimentCards.length;

    const blogEl = document.getElementById('guest-stat-blogs');
    const projectEl = document.getElementById('guest-stat-projects');
    const gameEl = document.getElementById('guest-stat-games');
    const experimentEl = document.getElementById('guest-stat-experiments');

    // Count games dynamically from the DOM
    const gameCards = document.querySelectorAll('#guest-tab-games .os-card');
    const gameCount = gameCards.length || 11;

    if (blogEl) blogEl.textContent = blogCount;
    if (projectEl) projectEl.textContent = projectCount;
    if (gameEl) gameEl.textContent = gameCount;
    if (experimentEl) experimentEl.textContent = experimentCount;
}

// ==================== PUBLIC BLOGS ====================
async function loadPublicBlogs() {
    const grid = document.getElementById('public-blogs-grid');
    
    // Skeleton loader for better UX
    grid.innerHTML = Array(3).fill(0).map(() => `
        <div class="os-card">
            <div class="skeleton skeleton-title" style="margin-bottom: 20px;"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width: 80%;"></div>
            <div class="os-card-footer" style="margin-top: 20px;">
                <div class="skeleton" style="width: 80px; height: 32px;"></div>
            </div>
        </div>
    `).join('');

    try {
        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTION_BLOGS, [
            Query.equal('status', 'published'),
            Query.orderDesc('created_at'),
            Query.limit(20)
        ]);
        publicBlogsCache = res.documents;
        updateGuestStats();

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
                <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); shareBlog('${blog.$id}')" title="Copy share link">
                        <i data-feather="share-2" class="btn-icon"></i> Share
                    </button>
                </div>
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

    currentViewingBlogId = id;
    document.getElementById('viewer-title').innerHTML = blog.title;
    document.getElementById('viewer-date').textContent = formatDate(blog.created_at);
    document.getElementById('viewer-content').innerHTML = blog.content;

    document.getElementById('blog-viewer-modal').classList.add('active');
    feather.replace();
}

function closeBlogViewer() {
    currentViewingBlogId = null;
    document.getElementById('blog-viewer-modal').classList.remove('active');
}

function shareBlog(blogId) {
    const url = `${window.location.origin}/manashos?blog=${blogId}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Blog link copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        prompt('Copy this link:', url);
    });
}

function showToast(message) {
    let toast = document.getElementById('share-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'share-toast';
        toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:12px;font-size:0.9rem;z-index:10000;opacity:0;transition:opacity 0.3s ease;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

async function checkBlogQueryParam() {
    // Use the blog ID captured before checkAuth could strip it from the URL
    const blogId = pendingBlogId;
    pendingBlogId = null; // Clear after use
    if (!blogId) {
        return;
    }

    // Ensure the home view is visible so the modal overlays it
    if (currentView !== 'home') {
        switchView('home', 'replace');
    }

    try {
        // Fetch the specific blog directly by ID
        const blog = await databases.getDocument(APPWRITE_DATABASE_ID, COLLECTION_BLOGS, blogId);
        if (!blog) return;

        // Set the blog data and open the viewer
        currentViewingBlogId = blogId;
        document.getElementById('viewer-title').innerHTML = blog.title;
        document.getElementById('viewer-date').textContent = formatDate(blog.created_at);
        document.getElementById('viewer-content').innerHTML = blog.content;
        document.getElementById('blog-viewer-modal').classList.add('active');
        feather.replace();
    } catch (err) {
        console.error('Failed to load shared blog:', err);
    } finally {
        // Now dismiss the initial loader that was kept visible during the blog fetch
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 300);
        }
    }
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

// ==== SURPRISE ME LOGIC ====
async function surpriseMe() {
    const btn = document.getElementById('surprise-btn');
    if (btn) btn.disabled = true;
    
    showToast('🎲 Finding something interesting...');
    
    // Artificial delay for effect
    await new Promise(r => setTimeout(r, 800));

    const options = [];
    
    // 1. Blogs
    if (publicBlogsCache.length > 0) {
        publicBlogsCache.forEach(b => options.push({ type: 'blog', id: b.$id }));
    }
    
    // 2. Projects
    const projects = document.querySelectorAll('#guest-tab-projects .project-card');
    projects.forEach((p, i) => options.push({ type: 'project', index: i }));
    
    // 3. Games
    const games = ['typing', 'memory', 'tictactoe', 'reaction', 'grid25', 'aim', 'pattern', 'scramble', 'decision', 'binary', 'challenge'];
    games.forEach(g => options.push({ type: 'game', id: g }));
    
    // 4. Experiments
    const experiments = document.querySelectorAll('#guest-tab-experiments .os-card');
    experiments.forEach((e, i) => options.push({ type: 'experiment', index: i }));

    if (options.length === 0) {
        showToast('Nothing found yet!');
        if (btn) btn.disabled = false;
        return;
    }

    const pick = options[Math.floor(Math.random() * options.length)];
    
    if (pick.type === 'blog') {
        toggleGuestTab('blogs', document.querySelector('[onclick*="toggleGuestTab(\'blogs\'"]'));
        openBlogViewer(pick.id, true);
    } else if (pick.type === 'game') {
        toggleGuestTab('games', document.querySelector('[onclick*="toggleGuestTab(\'games\'"]'));
        openGame(pick.id);
    } else if (pick.type === 'project') {
        toggleGuestTab('projects', document.querySelector('[onclick*="toggleGuestTab(\'projects\'"]'));
        projects[pick.index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        projects[pick.index].style.boxShadow = '0 0 20px var(--brand-name-color)';
        setTimeout(() => projects[pick.index].style.boxShadow = '', 2000);
    } else if (pick.type === 'experiment') {
        toggleGuestTab('experiments', document.querySelector('[onclick*="toggleGuestTab(\'experiments\'"]'));
        experiments[pick.index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        experiments[pick.index].style.boxShadow = '0 0 20px var(--brand-name-color)';
        setTimeout(() => experiments[pick.index].style.boxShadow = '', 2000);
    }

    if (btn) btn.disabled = false;
}

// ==================== MINI GAMES ====================
let activeGame = null;

function openGame(gameType) {
    const modal = document.getElementById('game-modal');
    const title = document.getElementById('game-modal-title');
    const container = document.getElementById('game-container');
    
    container.innerHTML = '';
    activeGame = gameType;

    if (gameType === 'typing') {
        title.textContent = 'Typing Speed Test';
        initTypingGame(container);
    } else if (gameType === 'memory') {
        title.textContent = 'Memory Match';
        initMemoryGame(container);
    } else if (gameType === 'tictactoe') {
        title.textContent = 'Tic Tac Toe';
        initTTTGame(container);
    } else if (gameType === 'reaction') {
        title.textContent = 'Focus Click (Reaction)';
        initReactionGame(container);
    } else if (gameType === 'grid25') {
        title.textContent = '1–25 Grid Challenge';
        initGrid25Game(container);
    } else if (gameType === 'aim') {
        title.textContent = 'Aim Trainer';
        initAimGame(container);
    } else if (gameType === 'pattern') {
        title.textContent = 'Pattern Memory';
        initPatternGame(container);
    } else if (gameType === 'scramble') {
        title.textContent = 'Word Scramble';
        initScrambleGame(container);
    } else if (gameType === 'decision') {
        title.textContent = 'Speed Decision';
        initDecisionGame(container);
    } else if (gameType === 'binary') {
        title.textContent = 'Binary Switch Puzzle';
        initBinaryGame(container);
    } else if (gameType === 'challenge') {
        title.textContent = 'Random Challenge Generator';
        initChallengeGame(container);
    }

    modal.classList.add('active');
}

function closeGame() {
    document.getElementById('game-modal').classList.remove('active');
    activeGame = null;
}

// 1. Typing Game Logic
function initTypingGame(container) {
    const quotes = [
        "Product Delivery Manager with experience orchestrating end-to-end product and program delivery across Agile and Waterfall environments.",
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
        "Design is not just what it looks like and feels like. Design is how it works."
    ];
    let quote = quotes[Math.floor(Math.random() * quotes.length)];
    let startTime, timerInterval;
    
    container.innerHTML = `
        <div class="game-typing-container">
            <div class="game-stats">
                <div class="game-stat"><span class="game-stat-v" id="wpm">0</span><span class="game-stat-l">WPM</span></div>
                <div class="game-stat"><span class="game-stat-v" id="timer">0s</span><span class="game-stat-l">Time</span></div>
            </div>
            <div class="game-typing-quote" id="quote-display"></div>
            <textarea class="os-textarea game-typing-input" id="typing-input" placeholder="Start typing here..."></textarea>
            <button class="btn btn-secondary" onclick="openGame('typing')">Reset</button>
        </div>
    `;

    const display = document.getElementById('quote-display');
    const input = document.getElementById('typing-input');
    const wpmEl = document.getElementById('wpm');
    const timerEl = document.getElementById('timer');

    display.innerHTML = quote.split('').map(char => `<span>${char}</span>`).join('');
    const characters = display.querySelectorAll('span');

    input.addEventListener('input', () => {
        if (!startTime) {
            startTime = new Date();
            timerInterval = setInterval(() => {
                const elapsed = Math.floor((new Date() - startTime) / 1000);
                timerEl.textContent = elapsed + 's';
                if (elapsed > 0) {
                    const words = input.value.trim().split(/\s+/).length;
                    wpmEl.textContent = Math.round((words / elapsed) * 60);
                }
            }, 1000);
        }

        const val = input.value.split('');
        characters.forEach((span, i) => {
            span.classList.remove('correct', 'incorrect', 'current');
            if (i < val.length) {
                span.classList.add(val[i] === span.textContent ? 'correct' : 'incorrect');
            } else if (i === val.length) {
                span.classList.add('current');
            }
        });

        if (input.value === quote) {
            clearInterval(timerInterval);
            input.disabled = true;
            showToast('Well done! Final WPM: ' + wpmEl.textContent);
        }
    });
}

// 2. Memory Game Logic
function initMemoryGame(container) {
    const icons = ['zap', 'star', 'award', 'heart', 'smile', 'moon', 'sun', 'cloud'];
    let cards = [...icons, ...icons].sort(() => Math.random() - 0.5);
    let flipped = [], matchedCount = 0, moves = 0;

    container.innerHTML = `
        <div class="game-stat" style="margin-bottom: 15px;">
            <span class="game-stat-v" id="moves">0</span><span class="game-stat-l">Moves</span>
        </div>
        <div class="memory-grid" id="memory-grid"></div>
        <button class="btn btn-secondary" style="margin-top: 15px;" onclick="openGame('memory')">Reset</button>
    `;

    const grid = document.getElementById('memory-grid');
    cards.forEach((icon, i) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.icon = icon;
        card.innerHTML = `<i data-feather="${icon}"></i>`;
        card.onclick = () => {
            if (flipped.length < 2 && !card.classList.contains('flipped') && !card.classList.contains('matched')) {
                card.classList.add('flipped');
                flipped.push(card);
                if (flipped.length === 2) {
                    moves++;
                    document.getElementById('moves').textContent = moves;
                    if (flipped[0].dataset.icon === flipped[1].dataset.icon) {
                        flipped.forEach(c => c.classList.add('matched'));
                        matchedCount += 2;
                        flipped = [];
                        if (matchedCount === cards.length) showToast('Congratulations! Finished in ' + moves + ' moves.');
                    } else {
                        setTimeout(() => {
                            flipped.forEach(c => c.classList.remove('flipped'));
                            flipped = [];
                        }, 700);
                    }
                }
            }
        };
        grid.appendChild(card);
    });
    feather.replace();
}

// 3. Tic Tac Toe Logic
function initTTTGame(container) {
    let board = Array(9).fill(null);
    let xIsNext = true;

    container.innerHTML = `
        <div class="game-stat" style="margin-bottom: 10px;">
            <span class="game-stat-l" id="ttt-status">Player X's Turn</span>
        </div>
        <div class="ttt-grid" id="ttt-grid">
            ${board.map((_, i) => `<div class="ttt-cell" data-index="${i}"></div>`).join('')}
        </div>
        <button class="btn btn-secondary" style="margin-top: 10px;" onclick="openGame('tictactoe')">Reset</button>
    `;

    const cells = container.querySelectorAll('.ttt-cell');
    const status = document.getElementById('ttt-status');

    cells.forEach(cell => {
        cell.onclick = () => {
            const i = cell.dataset.index;
            if (board[i] || calculateWinner(board)) return;
            board[i] = xIsNext ? 'X' : 'O';
            cell.textContent = board[i];
            cell.classList.add('taken', board[i].toLowerCase());
            xIsNext = !xIsNext;
            
            const winner = calculateWinner(board);
            if (winner) {
                status.textContent = winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}`;
                showToast(winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}`);
            } else {
                status.textContent = `Player ${xIsNext ? 'X' : 'O'}'s Turn`;
            }
        };
    });

    function calculateWinner(squares) {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let [a,b,c] of lines) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
        }
        return squares.every(s => s) ? 'Draw' : null;
    }
}

// 4. Reaction Game
function initReactionGame(container) {
    container.innerHTML = `
        <p style="margin-bottom: 15px; color: var(--text-muted);">Wait for GREEN, then click instantly!</p>
        <div id="reaction-area" class="game-reaction-area waiting">Click to Start</div>
        <div id="reaction-result" style="margin-top: 15px; font-weight: 700; font-size: 1.2rem;"></div>
    `;
    const area = document.getElementById('reaction-area');
    const res = document.getElementById('reaction-result');
    let state = 'start'; // start, wait, ready, end
    let startTime, timeout;

    area.onclick = () => {
        if (state === 'start' || state === 'end') {
            state = 'wait';
            area.textContent = 'Wait for Green...';
            area.className = 'game-reaction-area waiting';
            res.textContent = '';
            timeout = setTimeout(() => {
                state = 'ready';
                area.textContent = 'CLICK NOW!';
                area.className = 'game-reaction-area ready';
                startTime = Date.now();
            }, 1000 + Math.random() * 3000);
        } else if (state === 'wait') {
            clearTimeout(timeout);
            state = 'end';
            area.textContent = 'Too Early! Click to retry.';
            area.className = 'game-reaction-area';
        } else if (state === 'ready') {
            const time = Date.now() - startTime;
            state = 'end';
            area.textContent = 'Done!';
            area.className = 'game-reaction-area waiting';
            res.textContent = `Reaction Time: ${time}ms`;
            showToast(`Reaction Time: ${time}ms`);
        }
    };
}

// 5. 1-25 Grid Game
function initGrid25Game(container) {
    let nextNum = 1;
    let startTime, timerInterval;
    const nums = Array.from({length: 25}, (_, i) => i + 1).sort(() => Math.random() - 0.5);

    container.innerHTML = `
        <div class="game-stat" style="margin-bottom: 15px;">
            <span class="game-stat-v" id="grid-next">1</span><span class="game-stat-l">Next</span>
            <span class="game-stat-v" id="grid-timer" style="margin-left: 20px;">0.0s</span><span class="game-stat-l">Time</span>
        </div>
        <div class="game-grid25" id="grid25-box">
            ${nums.map(n => `<button class="grid25-btn" data-num="${n}">${n}</button>`).join('')}
        </div>
    `;

    const nextEl = document.getElementById('grid-next');
    const timerEl = document.getElementById('grid-timer');

    container.querySelectorAll('.grid25-btn').forEach(btn => {
        btn.onclick = () => {
            const num = parseInt(btn.dataset.num);
            if (num === nextNum) {
                if (nextNum === 1) {
                    startTime = Date.now();
                    timerInterval = setInterval(() => {
                        timerEl.textContent = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
                    }, 100);
                }
                btn.classList.add('clicked');
                nextNum++;
                if (nextNum > 25) {
                    clearInterval(timerInterval);
                    showToast('Finished! Time: ' + timerEl.textContent);
                } else {
                    nextEl.textContent = nextNum;
                }
            }
        };
    });
}

// 6. Aim Trainer
function initAimGame(container) {
    let score = 0, total = 0, timeLeft = 30, timerInterval;
    container.innerHTML = `
        <div class="game-stat" style="margin-bottom: 15px;">
            <span class="game-stat-v" id="aim-score">0</span><span class="game-stat-l">Score</span>
            <span class="game-stat-v" id="aim-timer" style="margin-left: 20px;">30s</span><span class="game-stat-l">Left</span>
        </div>
        <div class="game-aim-area" id="aim-area">
            <p id="aim-start" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:var(--text-muted);">Click anywhere to start</p>
        </div>
    `;

    const area = document.getElementById('aim-area');
    const scoreEl = document.getElementById('aim-score');
    const timerEl = document.getElementById('aim-timer');
    const startMsg = document.getElementById('aim-start');

    function spawn() {
        if (timeLeft <= 0) return;
        const target = document.createElement('div');
        target.className = 'aim-target';
        target.style.left = Math.random() * 90 + '%';
        target.style.top = Math.random() * 90 + '%';
        target.onclick = (e) => {
            e.stopPropagation();
            score++;
            scoreEl.textContent = score;
            target.remove();
            spawn();
        };
        area.appendChild(target);
    }

    area.onclick = () => {
        if (timerInterval) return;
        startMsg.style.display = 'none';
        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = timeLeft + 's';
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                area.innerHTML = `<p style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:var(--brand-name-color); font-weight:700;">Final Score: ${score}</p>`;
                showToast(`Game Over! Final Score: ${score}`);
            }
        }, 1000);
        spawn();
    };
}

// 7. Pattern Memory
function initPatternGame(container) {
    let sequence = [], userPos = 0, level = 1;
    container.innerHTML = `
        <div class="game-stat" style="margin-bottom: 15px;">
            <span class="game-stat-v" id="pattern-lvl">1</span><span class="game-stat-l">Level</span>
        </div>
        <div class="game-pattern-grid" id="pattern-grid">
            ${Array.from({length: 9}, (_, i) => `<div class="pattern-tile" data-idx="${i}"></div>`).join('')}
        </div>
        <button class="btn btn-secondary" style="margin-top: 15px;" id="pattern-start">Start Game</button>
    `;

    const tiles = container.querySelectorAll('.pattern-tile');
    const startBtn = document.getElementById('pattern-start');

    async function playSequence() {
        startBtn.disabled = true;
        for (let idx of sequence) {
            await new Promise(r => setTimeout(r, 400));
            tiles[idx].classList.add('active');
            await new Promise(r => setTimeout(r, 400));
            tiles[idx].classList.remove('active');
        }
        startBtn.disabled = false;
        userPos = 0;
    }

    function nextLevel() {
        sequence.push(Math.floor(Math.random() * 9));
        document.getElementById('pattern-lvl').textContent = sequence.length;
        playSequence();
    }

    startBtn.onclick = () => {
        sequence = [];
        nextLevel();
    };

    tiles.forEach(tile => {
        tile.onclick = () => {
            if (sequence.length === 0 || startBtn.disabled) return;
            const idx = parseInt(tile.dataset.idx);
            if (idx === sequence[userPos]) {
                userPos++;
                if (userPos === sequence.length) {
                    showToast('Correct!');
                    setTimeout(nextLevel, 800);
                }
            } else {
                showToast('Wrong! Game Over.');
                sequence = [];
            }
        };
    });
}

// 8. Word Scramble
function initScrambleGame(container) {
    const words = ['PRODUCT', 'STRATEGY', 'DELIVERY', 'ANALYTICS', 'PROJECT', 'MANAGER', 'VISION', 'TEAMWORK', 'AGILE', 'ROADMAPPING'];
    let currentWord = words[Math.floor(Math.random() * words.length)];
    let scrambled = currentWord.split('').sort(() => Math.random() - 0.5).join('');

    container.innerHTML = `
        <p style="color: var(--text-muted);">Unscramble the professional term:</p>
        <div class="game-scramble-word">${scrambled}</div>
        <input type="text" id="scramble-input" class="os-input" placeholder="Type your answer..." style="text-align: center; font-size: 1.2rem;">
        <button class="btn btn-gradient btn-full" style="margin-top: 15px;" id="scramble-check">Submit</button>
        <button class="btn btn-secondary btn-full" style="margin-top: 10px;" onclick="openGame('scramble')">New Word</button>
    `;

    const input = document.getElementById('scramble-input');
    const check = document.getElementById('scramble-check');

    check.onclick = () => {
        if (input.value.toUpperCase() === currentWord) {
            showToast('Correct! Amazing vocabulary.');
            setTimeout(() => openGame('scramble'), 1500);
        } else {
            showToast('Not quite, try again.');
        }
    };
    input.onkeydown = (e) => { if (e.key === 'Enter') check.click(); };
}

// 9. Speed Decision
function initDecisionGame(container) {
    let score = 0, timeLeft = 20, timerInterval;
    let currentTask = generateTask();

    function generateTask() {
        const ops = ['+', '-', '*'];
        const op = ops[Math.floor(Math.random() * 3)];
        let a = Math.floor(Math.random() * 10) + 1;
        let b = Math.floor(Math.random() * 10) + 1;
        let result = eval(`${a}${op}${b}`);
        let displayResult = Math.random() > 0.5 ? result : result + (Math.random() > 0.5 ? 1 : -1);
        return { question: `${a} ${op} ${b} = ${displayResult}`, isTrue: result === displayResult };
    }

    container.innerHTML = `
        <div class="game-stat" style="margin-bottom: 15px;">
            <span class="game-stat-v" id="dec-score">0</span><span class="game-stat-l">Score</span>
            <span class="game-stat-v" id="dec-timer" style="margin-left: 20px;">20s</span><span class="game-stat-l">Time</span>
        </div>
        <div class="game-decision-box" id="dec-box">${currentTask.question}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <button class="btn btn-gradient" id="dec-true">TRUE</button>
            <button class="btn btn-danger" id="dec-false">FALSE</button>
        </div>
    `;

    const scoreEl = document.getElementById('dec-score');
    const timerEl = document.getElementById('dec-timer');
    const box = document.getElementById('dec-box');

    function handleAnswer(ans) {
        if (ans === currentTask.isTrue) {
            score++;
            scoreEl.textContent = score;
            currentTask = generateTask();
            box.textContent = currentTask.question;
        } else {
            showToast('Wrong! -1s Penalty');
            timeLeft -= 1;
        }
    }

    document.getElementById('dec-true').onclick = () => handleAnswer(true);
    document.getElementById('dec-false').onclick = () => handleAnswer(false);

    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft + 's';
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showToast('Game Over! Final Score: ' + score);
            box.innerHTML = `<span style="color:var(--brand-name-color)">Final Score: ${score}</span>`;
            document.getElementById('dec-true').disabled = true;
            document.getElementById('dec-false').disabled = true;
        }
    }, 1000);
}

// 10. Binary Switch
function initBinaryGame(container) {
    let grid = Array(9).fill(false);
    container.innerHTML = `
        <p style="color: var(--text-muted);">Turn all switches ON. Toggle one to affect its neighbors.</p>
        <div class="game-binary-grid">
            ${grid.map((_, i) => `<div class="binary-switch" data-idx="${i}"></div>`).join('')}
        </div>
        <button class="btn btn-secondary" style="margin-top: 15px;" onclick="openGame('binary')">Reset</button>
    `;

    const switches = container.querySelectorAll('.binary-switch');
    function update() {
        switches.forEach((s, i) => s.classList.toggle('on', grid[i]));
        if (grid.every(v => v)) showToast('Puzzle Solved! Great logic.');
    }

    switches.forEach(s => {
        s.onclick = () => {
            const i = parseInt(s.dataset.idx);
            const row = Math.floor(i / 3);
            const col = i % 3;
            // Toggle self + neighbors
            [i, i-1, i+1, i-3, i+3].forEach(idx => {
                if (idx >= 0 && idx < 9) {
                    const r = Math.floor(idx/3), c = idx%3;
                    if (Math.abs(r-row) + Math.abs(c-col) <= 1) grid[idx] = !grid[idx];
                }
            });
            update();
        };
    });
}

// 11. Challenge Generator
function initChallengeGame(container) {
    const challenges = [
        "Write a 100-word summary of your career vision without using the word 'Experience'.",
        "Explain a complex technical concept to a 5-year-old in exactly 3 sentences.",
        "Sketch a user flow for a 'Teleportation App' on a piece of paper.",
        "Identify 3 inefficiencies in your current daily routine and propose fixes.",
        "Think of a problem you solved recently. How would you solve it with 10% of the budget?",
        "Design a logo for a company that sells 'Bottled Silence'.",
        "Pitch your favorite project in exactly 15 words.",
        "Imagine you are the PM for a 'Gravity-free Library'. What's the top feature?"
    ];
    
    container.innerHTML = `
        <div class="challenge-card" id="challenge-box">Click the button for a new challenge...</div>
        <button class="btn btn-gradient btn-full" style="margin-top: 20px;" id="challenge-next">
            <i data-feather="refresh-cw" class="btn-icon"></i> New Challenge
        </button>
    `;

    const box = document.getElementById('challenge-box');
    document.getElementById('challenge-next').onclick = () => {
        box.textContent = challenges[Math.floor(Math.random() * challenges.length)];
        feather.replace();
    };
    feather.replace();
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

async function trackUniqueVisitor() {
    const lastVisitStr = localStorage.getItem('os_visitor_timestamp');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (lastVisitStr) {
        const lastVisit = parseInt(lastVisitStr, 10);
        if (now - lastVisit < oneHour) {
            // Less than 1 hour since last counted visit
            return;
        }
    }

    try {
        localStorage.setItem('os_visitor_timestamp', now.toString());
        try {
            const response = await fetch('/api/visit');
            if (!response.ok) throw new Error("Proxy response not ok");
        } catch (err) {
            await fetch('https://abacus.jasoncameron.dev/hit/mjb-resume-2026/visits');
        }
    } catch (error) {
        console.error('Visitor tracking error:', error);
        localStorage.removeItem('os_visitor_timestamp');
    }
}

async function getVisitorCountForDashboard() {
    try {
        let count = 0;
        try {
            const response = await fetch('/api/visit?action=get');
            if (!response.ok) throw new Error("Proxy response not ok");
            const data = await response.json();
            if (data && typeof data.count === 'number') {
                count = data.count;
            } else {
                throw new Error("Invalid proxy data");
            }
        } catch (err) {
            const fallbackResponse = await fetch('https://abacus.jasoncameron.dev/get/mjb-resume-2026/visits', {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const fallbackData = await fallbackResponse.json();
            if (fallbackData && typeof fallbackData.value === 'number') {
                count = fallbackData.value;
            }
        }
        globalVisitorCount = count.toLocaleString();
        
        const dashCounter = document.getElementById('stat-visitors-total');
        if (dashCounter) {
            dashCounter.textContent = globalVisitorCount;
        }
    } catch (error) {
        console.error('Visitor fetching error:', error);
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

// ==================== JOURNEY MODE ====================
let isJourneyMode = false;

function toggleJourneyMode() {
    isJourneyMode = !isJourneyMode;
    
    const portfolioContent = document.getElementById('portfolio-mode-content');
    const journeyContent = document.getElementById('journey-mode-content');
    const toggleText = document.getElementById('journey-toggle-text');
    const toggleBtn = document.getElementById('journey-mode-toggle');

    if (isJourneyMode) {
        // Switch to Journey Mode
        portfolioContent.style.opacity = '0';
        setTimeout(() => {
            portfolioContent.style.display = 'none';
            journeyContent.style.display = 'block';
            journeyContent.style.opacity = '0';
            // Trigger reflow
            journeyContent.offsetHeight;
            journeyContent.style.opacity = '1';
            
            toggleText.textContent = 'Back to ManashOS';
            toggleBtn.classList.remove('btn-secondary');
            toggleBtn.classList.add('btn-gradient');
            
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-feather', 'grid');
                feather.replace();
            }
            
            // Initialize Carousel
            initJourneyCarousel();
        }, 300);
    } else {
        // Switch back to Portfolio Mode
        journeyContent.style.opacity = '0';
        setTimeout(() => {
            journeyContent.style.display = 'none';
            portfolioContent.style.display = 'block';
            portfolioContent.style.opacity = '0';
            // Trigger reflow
            portfolioContent.offsetHeight;
            portfolioContent.style.opacity = '1';
            
            toggleText.textContent = 'My Journey';
            toggleBtn.classList.add('btn-secondary');
            toggleBtn.classList.remove('btn-gradient');
            
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-feather', 'map');
                feather.replace();
            }
        }, 300);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== JOURNEY CAROUSEL LOGIC ====================
// ==================== JOURNEY CAROUSEL LOGIC ====================
let currentJourneyIndex = 0;

function initJourneyCarousel() {
    const track = document.getElementById('journey-track');
    const cards = document.querySelectorAll('.journey-step-card');
    const prevBtn = document.getElementById('journey-prev');
    const nextBtn = document.getElementById('journey-next');
    const container = document.querySelector('.journey-carousel-container');
    const content = document.getElementById('journey-mode-content');
    
    if (!track || !cards.length) return;

    window.updateJourneyCarousel = function() {
        const wrapper = document.querySelector('.journey-carousel-track-wrapper');
        const containerWidth = wrapper.offsetWidth;
        const cardWidth = cards[0].offsetWidth;
        const gap = window.innerWidth <= 900 ? 30 : 15;
        
        const offset = (containerWidth / 2) - (cardWidth / 2) - (currentJourneyIndex * (cardWidth + gap));
        track.style.transform = `translateX(${offset}px)`;
        
        cards.forEach((card, i) => {
            card.classList.toggle('active', i === currentJourneyIndex);
        });
        
        // Update Stepper
        const steps = document.querySelectorAll('.step-item');
        steps.forEach((step, i) => {
            step.classList.toggle('active', i === currentJourneyIndex);
            const dot = step.querySelector('.step-dot');
            if (dot) dot.textContent = i === currentJourneyIndex ? '●' : '○';
        });
        
        if (prevBtn) prevBtn.disabled = currentJourneyIndex === 0;
        if (nextBtn) nextBtn.disabled = currentJourneyIndex === cards.length - 1;

        // Background Depth Shift
        const hue = 250 + (currentJourneyIndex * 20); 
        content.style.background = `radial-gradient(circle at center, hsla(${hue}, 70%, 10%, 0.15) 0%, transparent 70%)`;
    };

    window.jumpToJourneyStep = function(index) {
        currentJourneyIndex = index;
        updateJourneyCarousel();
    };

    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            if (currentJourneyIndex > 0) jumpToJourneyStep(currentJourneyIndex - 1);
        };
    }

    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            if (currentJourneyIndex < cards.length - 1) jumpToJourneyStep(currentJourneyIndex + 1);
        };
    }

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;
    if (container) {
        container.ontouchstart = e => touchStartX = e.changedTouches[0].screenX;
        container.ontouchend = e => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) nextBtn?.click();
            if (touchEndX - touchStartX > 50) prevBtn?.click();
        };
    }

    // Active Card Tilt Effect
    cards.forEach(card => {
        card.onmousemove = (e) => {
            if (!card.classList.contains('active')) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (centerY - y) / 20;
            const rotateY = (x - centerX) / 20;
            card.style.transform = `scale(1.02) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
        };
        card.onmouseleave = () => {
            if (card.classList.contains('active')) {
                card.style.transform = `scale(1) translateZ(0)`;
            }
        };
    });

    window.addEventListener('resize', updateJourneyCarousel);
    requestAnimationFrame(updateJourneyCarousel);
}

// Expand Mode Logic
function expandJourneyCard(index) {
    const modal = document.getElementById('journey-expand-modal');
    const modalBody = document.getElementById('modal-body-content');
    const cards = document.querySelectorAll('.journey-step-card');
    const card = cards[index];

    if (!modal || !modalBody || !card) return;

    // Clone content for modal
    const title = card.querySelector('.journey-card-title').textContent;
    const identity = card.querySelector('.journey-card-identity').textContent;
    const points = card.querySelector('.journey-card-points').innerHTML;
    const shift = card.querySelector('.journey-card-shift').innerHTML;
    const impact = card.querySelector('.journey-card-impact').innerHTML;

    modalBody.innerHTML = `
        <h2 style="font-size: 2.5rem; margin-bottom: 10px;" class="text-gradient">${title}</h2>
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 30px;">${identity}</p>
        <div class="modal-details" style="display: grid; gap: 25px;">
            <div>
                <h4 style="margin-bottom: 15px; color: var(--gradient-start); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.15em;">Deep Dive</h4>
                <ul class="journey-card-points" style="margin-bottom: 0;">${points}</ul>
            </div>
            <div style="display: grid; gap: 15px;">
                <div class="journey-card-shift" style="margin-top: 0; padding: 15px;">${shift}</div>
                <div class="journey-card-impact" style="margin-top: 0; padding: 15px;">${impact}</div>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeJourneyModal() {
    const modal = document.getElementById('journey-expand-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('journey-expand-modal');
    if (e.target === modal) closeJourneyModal();
});

// Initialize on load if in journey mode
document.addEventListener('DOMContentLoaded', () => {
    if (typeof isJourneyMode !== 'undefined' && isJourneyMode) {
        initJourneyCarousel();
    }
});

