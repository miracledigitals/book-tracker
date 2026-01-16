// Book Tracker App - Main JavaScript

// ===== Data Management =====
const STORAGE_KEY = 'lumina_books';
const USER_KEY = 'lumina_user';

// Sample book covers (placeholder URLs)
const sampleCovers = [
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1474366521946-c3b3e5f5a5c6?w=300&h=450&fit=crop'
];

// Get random cover
function getRandomCover() {
    return sampleCovers[Math.floor(Math.random() * sampleCovers.length)];
}

// Initialize sample data
// Initialize sample data - DISABLED for Clean State
function initSampleData() {
    // Clean state: no sample data generation
}

function getBooks() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveBooks(books) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function getBookById(id) {
    return getBooks().find(b => b.id === id);
}

function updateBook(id, updates) {
    const books = getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
        books[index] = { ...books[index], ...updates };
        saveBooks(books);
        return books[index];
    }
    return null;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== User Data Management =====
const DEFAULT_USER = {
    name: 'Julianne Reed',
    title: 'Avid Reader',
    bio: 'Lover of classics and sci-fi. Always chasing the next great story.',
    avatar: 'JR',
    yearlyGoal: 20,
    dailyPageGoal: 30,
    preferences: {
        notifications: true,
        privacy: false
    }
};

function getUser() {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : DEFAULT_USER;
}

function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    updateHeaderUser();
}

function updateHeaderUser() {
    const user = getUser();
    document.getElementById('userName').textContent = user.name.split(' ')[0];

    const navName = document.querySelector('.user-name');
    if (navName) navName.textContent = user.name;

    const navBadge = document.querySelector('.user-badge');
    if (navBadge) navBadge.textContent = user.title;

    const navAvatar = document.querySelector('.user-avatar');
    if (navAvatar) {
        if (user.avatar && user.avatar.startsWith('data:image')) {
            navAvatar.innerHTML = `<img src="${user.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
            navAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            navAvatar.style.background = 'var(--gradient-accent)';
        }
    }

    // Update profile view if active
    const profileName = document.getElementById('profileName');
    if (profileName) {
        profileName.textContent = user.name;
        document.getElementById('profileTitle').textContent = user.title;
        document.getElementById('profileBioDisplay').textContent = user.bio;

        const largeAvatar = document.querySelector('.profile-avatar-large');
        if (user.avatar && user.avatar.startsWith('data:image')) {
            largeAvatar.innerHTML = `<img src="${user.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
            largeAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        }

        // Fill edit form
        document.getElementById('editName').value = user.name;
        document.getElementById('editTitle').value = user.title;
        document.getElementById('editBio').value = user.bio;
    }
}

// ===== Rich Notes Logic =====
function openNoteModal() {
    const editor = document.getElementById('noteRichEditor');
    editor.innerHTML = '';
    document.getElementById('noteModal').classList.add('active');
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.remove('active');
}

function execCmd(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('noteRichEditor').focus();
}

function saveNote() {
    const text = document.getElementById('noteRichEditor').innerHTML;
    if (!text || text === '<br>') {
        showToast('Please enter some text for your note', 'error');
        return;
    }

    const books = getBooks();
    const bookIndex = books.findIndex(b => b.id === currentBookId);
    if (bookIndex === -1) return;

    if (!books[bookIndex].notes) books[bookIndex].notes = [];

    books[bookIndex].notes.unshift({
        id: generateId(),
        text: text,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    saveBooks(books);
    showToast('Note saved successfully', 'success');
    closeNoteModal();
    renderNotes(currentBookId);
}

function deleteNote(bookId, noteId) {
    const books = getBooks();
    const bookIndex = books.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return;

    books[bookIndex].notes = books[bookIndex].notes.filter(n => n.id !== noteId);
    saveBooks(books);
    renderNotes(bookId);
    showToast('Note deleted', 'info');
}

function renderNotes(bookId) {
    const container = document.getElementById('notesContainer');
    if (!container) return;

    const book = getBookById(bookId);
    if (!book || !book.notes || book.notes.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No notes for this book yet. Capture your first thought!</p></div>';
        return;
    }

    container.innerHTML = book.notes.map(note => `
        <div class="note-item">
            <div class="note-item-header">
                <span class="note-item-date">${note.date}</span>
                <button class="note-delete-btn" onclick="deleteNote('${bookId}', '${note.id}')" title="Delete note">×</button>
            </div>
            <div class="note-item-content">${note.text}</div>
        </div>
    `).join('');
}

// ===== View Management =====
let currentBookId = null;

// ===== Navigation & View Management =====
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Create view if it doesn't exist (for Goals/Stats)
    let viewEl = document.getElementById(`${viewName}-view`);
    if (!viewEl) {
        viewEl = document.createElement('div');
        viewEl.id = `${viewName}-view`;
        viewEl.className = 'view';
        viewEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${viewName === 'goals' ? '🎯' : '📊'}</div>
                <h3>${viewName === 'goals' ? 'Reading Goals' : 'Reading Stats'}</h3>
                <p>This section is coming soon! Track your long-term progress here.</p>
                <button class="btn btn-primary" onclick="showView('dashboard')" style="margin-top: 20px; max-width: 200px; margin-left: auto; margin-right: auto;">Back to Dashboard</button>
            </div>
        `;
        document.querySelector('.page-content').appendChild(viewEl);
    }

    viewEl.classList.add('active');

    const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Refresh view data
    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'library') renderLibrary();
    if (viewName === 'stats') renderStats();
    if (viewName === 'goals') renderGoals();
    if (viewName === 'settings') renderSettings();
    if (viewName === 'profile') renderProfile();
}

function showBookDetail(bookId) {
    currentBookId = bookId;
    const book = getBookById(bookId);
    if (!book) return;

    // Update detail view
    document.getElementById('detailCover').src = book.cover || getRandomCover();
    document.getElementById('detailTitle').textContent = book.title;
    document.getElementById('detailBreadcrumbTitle').textContent = book.title;
    document.getElementById('detailAuthor').textContent = book.author;
    document.getElementById('detailGenre').textContent = formatGenre(book.genre);
    document.getElementById('detailGenreValue').textContent = formatGenre(book.genre);
    document.getElementById('detailPages').textContent = `${book.totalPages} pages`;
    document.getElementById('detailISBN').textContent = book.isbn || 'N/A';

    // Status badge
    const statusBadge = document.getElementById('detailStatus');
    statusBadge.textContent = formatStatus(book.status);
    statusBadge.className = `status-badge ${book.status}`;

    // Progress
    const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
    document.getElementById('detailProgressPercent').textContent = `${progress}%`;
    document.getElementById('detailProgressPages').textContent = `${book.currentPage} of ${book.totalPages} pages`;
    document.getElementById('detailProgressBar').style.width = `${progress}%`;

    // Update slider
    const slider = document.getElementById('progressSlider');
    slider.max = book.totalPages;
    slider.value = book.currentPage;
    document.getElementById('currentPageDisplay').textContent = `Page ${book.currentPage}`;

    // Estimate
    const pagesLeft = book.totalPages - book.currentPage;
    const avgPagesPerDay = 30; // Assume 30 pages/day
    const daysLeft = Math.ceil(pagesLeft / avgPagesPerDay);
    document.getElementById('detailEstimate').textContent = pagesLeft > 0 ? `In ${daysLeft} days` : 'Completed!';

    // Chapter Tracking
    const chapterContainer = document.getElementById('chapterUpdateContainer');
    const chapterSelector = document.getElementById('chapterSelector');

    if (book.totalChapters && book.totalChapters > 0) {
        chapterContainer.style.display = 'block';
        let options = '<option value="0">Select Chapter</option>';

        if (book.chapterList && book.chapterList.length > 0) {
            // Use named chapters
            book.chapterList.forEach((title, index) => {
                const i = index + 1;
                options += `<option value="${i}" ${book.currentChapter == i ? 'selected' : ''}>${title}</option>`;
            });
        } else {
            // Fallback to "Chapter X"
            for (let i = 1; i <= book.totalChapters; i++) {
                options += `<option value="${i}" ${book.currentChapter == i ? 'selected' : ''}>Chapter ${i}</option>`;
            }
        }
        chapterSelector.innerHTML = options;
    } else {
        chapterContainer.style.display = 'none';
    }

    // Sessions & Notes
    renderSessions(book.sessions || []);
    renderNotes(book.id);

    // Update Detail Actions
    const actionsContainer = document.querySelector('.book-detail-actions');
    if (actionsContainer) {
        actionsContainer.innerHTML = `
            <button class="btn btn-primary" onclick="openNoteModal()">📝 Add Note</button>
            <button class="btn btn-outline" onclick="confirmDeleteBook('${book.id}')">🗑️ Delete Book</button>
            <button class="btn btn-primary" onclick="openReviewModal()">⭐ Review</button>
        `;
    }

    showView('book-detail');
}

function renderSessions(sessions) {
    const container = document.getElementById('sessionsList');
    if (sessions.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No reading sessions yet</p></div>';
        return;
    }

    container.innerHTML = sessions.slice(0, 3).map(s => `
        <div class="session-item">
            <div class="session-icon">📅</div>
            <div class="session-info">
                <div class="session-date">${formatDate(s.date)}</div>
                <div class="session-details">Read ${s.pages} pages • ${s.duration} mins session</div>
            </div>
            <div class="session-pages">+${s.pages}p</div>
        </div>
    `).join('');
}

// ===== Dashboard =====
function renderDashboard() {
    updateGreeting();
    renderCurrentlyReading();
    renderRecentFinished();
    updateGoal();
    updateActivity();
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    if (hour >= 17) greeting = 'Good evening';

    const user = getUser();
    document.getElementById('greeting').textContent = `${greeting}, ${user.name.split(' ')[0]}`;

    // Calculate today's pages
    const books = getBooks();
    const today = new Date().toISOString().split('T')[0];
    let todayPages = 0;
    books.forEach(b => {
        (b.sessions || []).forEach(s => {
            if (s.date === today) todayPages += s.pages;
        });
    });
    document.getElementById('todayPages').textContent = `${todayPages} pages`;
}

function renderCurrentlyReading() {
    const container = document.getElementById('currentlyReadingGrid');
    const books = getBooks().filter(b => b.status === 'reading');

    if (books.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><h3>No books currently reading</h3><p>Add a book to get started!</p></div>';
        return;
    }

    container.innerHTML = books.slice(0, 4).map(book => {
        const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
        const circumference = 2 * Math.PI * 18;
        const offset = circumference - (progress / 100) * circumference;

        return `
            <div class="book-card" onclick="showBookDetail('${book.id}')">
                <div class="book-card-cover">
                    <img src="${book.cover || getRandomCover()}" alt="${book.title}">
                    <div class="book-progress-circle">
                        <svg width="48" height="48" viewBox="0 0 48 48">
                            <circle class="progress-bg" cx="24" cy="24" r="18"/>
                            <circle class="progress-fill" cx="24" cy="24" r="18" 
                                stroke-dasharray="${circumference}" 
                                stroke-dashoffset="${offset}"/>
                        </svg>
                        <span class="book-progress-text">${progress}%</span>
                    </div>
                </div>
                <div class="book-card-info">
                    <div class="book-card-title">${book.title}</div>
                    <div class="book-card-author">${book.author}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderRecentFinished() {
    const container = document.getElementById('recentFinishedScroll');
    const books = getBooks().filter(b => b.status === 'finished');

    if (books.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No finished books yet</p></div>';
        return;
    }

    container.innerHTML = books.slice(0, 6).map(book => `
        <div class="recent-book-card" onclick="showBookDetail('${book.id}')">
            <img src="${book.cover || getRandomCover()}" alt="${book.title}">
        </div>
    `).join('');
}

function updateGoal() {
    const books = getBooks();
    const finished = books.filter(b => b.status === 'finished').length;
    const user = getUser();
    const goal = user.yearlyGoal || 20;
    const percent = Math.min(100, Math.round((finished / goal) * 100));

    document.getElementById('goalProgress').textContent = `${finished}/${goal}`;
    document.getElementById('goalProgressBar').style.width = `${percent}%`;
    document.getElementById('goalSubtitle').textContent = `${percent}% complete • ${Math.max(0, goal - finished)} books to go`;
}

function updateActivity() {
    const container = document.getElementById('activityChart');
    const books = getBooks();

    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    // Calculate pages per day
    const pagesPerDay = days.map(day => {
        let pages = 0;
        books.forEach(b => {
            (b.sessions || []).forEach(s => {
                if (s.date === day) pages += s.pages;
            });
        });
        return pages;
    });

    const maxPages = Math.max(...pagesPerDay, 50);
    const weeklyTotal = pagesPerDay.reduce((a, b) => a + b, 0);

    document.getElementById('weeklyPages').textContent = weeklyTotal;

    container.innerHTML = pagesPerDay.map(p => {
        const height = Math.max(10, (p / maxPages) * 100);
        return `<div class="activity-bar" style="height: ${height}%"></div>`;
    }).join('');
}

// ===== Library =====
let currentFilter = 'all';
let searchQuery = '';

function renderLibrary() {
    const container = document.getElementById('libraryGrid');
    let books = getBooks();

    // Apply filter
    if (currentFilter !== 'all') {
        books = books.filter(b => b.status === currentFilter);
    }

    // Apply search
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        books = books.filter(b =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q)
        );
    }

    // Apply genre filter
    const genreFilter = document.getElementById('genreFilter').value;
    if (genreFilter) {
        books = books.filter(b => b.genre === genreFilter);
    }

    if (books.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><h3>No books found</h3><p>Try adjusting your filters or add a new book</p></div>';
        return;
    }

    container.innerHTML = books.map(book => {
        const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

        let statusHtml = '';
        let quickActionsHtml = '';

        if (book.status === 'reading') {
            statusHtml = `<span class="library-book-progress">${progress}% Completed</span>`;
        } else if (book.status === 'finished' && book.rating) {
            statusHtml = `<div class="star-rating">${renderStars(book.rating)}</div>`;
        } else if (book.status === 'tbr') {
            quickActionsHtml = `
                <div class="tbr-actions">
                    <button class="btn-quick" onclick="event.stopPropagation(); startReading('${book.id}')">📖 Start</button>
                    <button class="btn-quick" onclick="event.stopPropagation(); confirmDeleteBook('${book.id}')">🗑️</button>
                </div>
            `;
        }

        return `
            <div class="library-book-card" onclick="showBookDetail('${book.id}')">
                <div class="library-book-cover">
                    <img src="${book.cover || getRandomCover()}" alt="${book.title}">
                    <span class="status-badge ${book.status}">${formatStatus(book.status)}</span>
                </div>
                <div class="library-book-title">${book.title}</div>
                <div class="library-book-author">${book.author}</div>
                ${statusHtml}
                ${quickActionsHtml}
            </div>
        `;
    }).join('');
}

function startReading(bookId) {
    updateBook(bookId, { status: 'reading' });
    showToast('Moved to Currently Reading', 'success');
    renderLibrary();
    updateGoal();
}

function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
    }
    return html;
}

// ===== Add Book =====
let uploadedCover = null;

function handleCoverUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        uploadedCover = e.target.result;
        const container = document.getElementById('coverUpload');
        container.innerHTML = `<img src="${uploadedCover}" alt="Book cover">`;
    };
    reader.readAsDataURL(file);
}

function addBook() {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const pages = parseInt(document.getElementById('bookPages').value) || 0;
    const chapters = parseInt(document.getElementById('bookChapters').value) || 0; // Capture chapters
    const genre = document.getElementById('bookGenre').value;
    const description = document.getElementById('bookDescription').value.trim();

    if (!title || !author) {
        showToast('Please enter title and author', 'error');
        return;
    }

    if (pages < 1) {
        showToast('Please enter a valid page count', 'error');
        return;
    }

    const newBook = {
        id: generateId(),
        title,
        author,
        cover: uploadedCover || getRandomCover(),
        cover: uploadedCover || getRandomCover(),
        totalPages: pages,
        totalChapters: chapters,
        chapterList: smartImportChapters.length === chapters ? smartImportChapters : [],
        currentChapter: 0,
        currentPage: 0,
        genre: genre || 'fiction',
        status: 'tbr',
        rating: 0,
        review: '',
        description,
        sessions: [],
        dateAdded: new Date().toISOString().split('T')[0]
    };

    const books = getBooks();
    books.push(newBook);
    saveBooks(books);

    // Reset form
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookPages').value = '';
    document.getElementById('bookChapters').value = '';
    document.getElementById('bookGenre').value = '';
    document.getElementById('bookDescription').value = '';
    uploadedCover = null;
    smartImportChapters = []; // Reset scraped chapters
    document.getElementById('coverUpload').innerHTML = `
        <input type="file" id="coverInput" accept="image/*" style="display: none" onchange="handleCoverUpload(event)">
        <div class="cover-upload-icon">📷</div>
        <div class="cover-upload-text">Scan Cover</div>
        <div class="cover-upload-hint">Click to upload or drag book cover</div>
    `;

    showToast('Book added to library!', 'success');
    showView('library');
}

// ===== Progress Update =====
function updateProgress() {
    if (!currentBookId) return;

    const slider = document.getElementById('progressSlider');
    const newPage = parseInt(slider.value);
    const book = getBookById(currentBookId);

    if (!book) return;

    const pagesRead = newPage - book.currentPage;

    const updates = {
        currentPage: newPage,
        sessions: [...(book.sessions || [])]
    };

    if (pagesRead > 0) {
        updates.sessions.unshift({
            date: new Date().toISOString().split('T')[0],
            pages: pagesRead,
            duration: Math.round(pagesRead * 1.5) // Estimate 1.5 min per page
        });
    }

    // Check if finished
    if (newPage >= book.totalPages) {
        updates.status = 'finished';
        updates.dateFinished = new Date().toISOString().split('T')[0];
        showToast('Congratulations! You finished the book! 🎉', 'success');
    } else if (book.status === 'tbr' && newPage > 0) {
        updates.status = 'reading';
    }

    updateBook(currentBookId, updates);
    showBookDetail(currentBookId);

    if (pagesRead > 0 && newPage < book.totalPages) {
        showToast(`Progress updated: +${pagesRead} pages`, 'success');

        // Smart Notifications: Near Completion
        const percentage = (newPage / book.totalPages) * 100;
        if (percentage >= 90 && percentage < 100) {
            setTimeout(() => {
                showToast('🔥 You\'re so close! Less than 10% left!', 'info');
            }, 1000);
        } else if (percentage >= 50 && percentage < 55) {
            setTimeout(() => {
                showToast('Halfway there! Keep it up!', 'info');
            }, 1000);
        }

        // Smart Notification: Daily Goal Check
        const user = getUser();
        const todayStr = new Date().toISOString().split('T')[0];

        // Calculate total pages for ONE day (today) across all books
        const allBooks = getBooks();
        const todayPages = allBooks.reduce((total, b) => {
            return total + (b.sessions || [])
                .filter(s => s.date === todayStr)
                .reduce((sum, s) => sum + s.pages, 0);
        }, 0);

        // Notify if goal just crossed
        if (todayPages >= user.dailyPageGoal && (todayPages - pagesRead) < user.dailyPageGoal) {
            setTimeout(() => {
                showToast(`🎯 Daily Goal Achieved: ${todayPages} pages today!`, 'success');
            }, 1500);
        }
    }
}

// Slider live update
document.getElementById('progressSlider')?.addEventListener('input', function () {
    document.getElementById('currentPageDisplay').textContent = `Page ${this.value} `;
});

// ===== Review Modal =====
function openReviewModal() {
    const book = getBookById(currentBookId);
    if (!book) return;

    // Render rating stars
    const ratingContainer = document.getElementById('ratingInput');
    ratingContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('button');
        star.className = `rating-star ${i <= book.rating ? 'active' : ''}`;
        star.textContent = '★';
        star.onclick = () => selectRating(i);
        ratingContainer.appendChild(star);
    }

    document.getElementById('reviewText').value = book.review || '';
    document.getElementById('reviewModal').classList.add('active');
}

function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
}

function selectRating(rating) {
    document.querySelectorAll('.rating-star').forEach((star, i) => {
        star.classList.toggle('active', i < rating);
    });
    window.selectedRating = rating;
}

function saveReview() {
    if (!currentBookId) return;

    const rating = window.selectedRating || 0;
    const review = document.getElementById('reviewText').value.trim();

    updateBook(currentBookId, { rating, review });
    closeReviewModal();
    showToast('Review saved!', 'success');
    showBookDetail(currentBookId);
}


// ===== Share & Other Interactions =====
function shareBook() {
    const book = getBookById(currentBookId);
    if (!book) return;

    if (navigator.share) {
        navigator.share({
            title: book.title,
            text: `Check out ${book.title} by ${book.author} on Lumina!`,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        showToast(`Sharing features for "${book.title}" coming soon!`, 'success');
    }
}

function joinChallenge() {
    showToast('Challenge joined! Reading streak target: 7 days.', 'success');
}

function showNotifications() {
    showToast('No new notifications today.', 'success');
}

// Profile Enhancements
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const user = getUser();
        user.avatar = e.target.result;
        saveUser(user);
        showToast('Avatar updated', 'success');
    };
    reader.readAsDataURL(file);
}

function confirmRestartProfile() {
    if (confirm('Are you sure you want to restart your profile? This will clear all your reading stats but keep your books.')) {
        const books = getBooks();
        books.forEach(b => {
            b.sessions = [];
            b.currentPage = 0;
            if (b.status === 'finished') b.status = 'tbr';
        });
        saveBooks(books);

        const user = getUser();
        user.yearlyGoal = 20; // Reset goals
        saveUser(user);

        showToast('Profile restarted', 'info');
        showView('profile');
    }
}

function confirmDeleteProfile() {
    if (confirm('CRITICAL: This will delete ALL your books and settings. This cannot be undone. Proceed?')) {
        localStorage.clear();
        window.location.reload();
    }
}

// Book Deletion
let bookToDelete = null;

function confirmDeleteBook(bookId) {
    bookToDelete = bookId;
    const book = getBookById(bookId);
    document.getElementById('deleteConfirmMsg').textContent = `Are you sure you want to delete "${book.title}" from your library?`;
    document.getElementById('deleteConfirmModal').classList.add('active');
    document.getElementById('confirmDeleteBtn').onclick = () => deleteBook(bookId);
}

function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').classList.remove('active');
    bookToDelete = null;
}

function deleteBook(bookId) {
    const books = getBooks().filter(b => b.id !== bookId);
    saveBooks(books);
    closeDeleteModal();
    showToast('Book removed from library', 'info');
    showView('library');
}

// ===== Profile Actions =====
function toggleEditProfile() {
    const form = document.getElementById('profileEditForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function saveProfile() {
    const user = getUser();
    user.name = document.getElementById('editName').value.trim();
    user.title = document.getElementById('editTitle').value.trim();
    user.bio = document.getElementById('editBio').value.trim();

    if (!user.name) {
        showToast('Name cannot be empty', 'error');
        return;
    }

    if (!user.avatar || !user.avatar.startsWith('data:image')) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        user.avatar = initials;
    }

    saveUser(user);
    toggleEditProfile();
    showToast('Profile updated successfully!', 'success');
}

function renderProfile() {
    const books = getBooks();
    const finishedBooks = books.filter(b => b.status === 'finished');
    const totalPages = books.reduce((sum, b) => sum + b.currentPage, 0);
    const avgRating = finishedBooks.length > 0
        ? (finishedBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / finishedBooks.length).toFixed(1)
        : '0.0';

    document.getElementById('totalBooksRead').textContent = finishedBooks.length;
    document.getElementById('totalPageCount').textContent = totalPages.toLocaleString();
    document.getElementById('avgRating').textContent = avgRating;

    updateHeaderUser();
}

// ===== Goals Actions =====
function renderGoals() {
    const user = getUser();
    const books = getBooks();
    const finished = books.filter(b => b.status === 'finished').length;

    document.getElementById('yearlyGoalInput').value = user.yearlyGoal;
    document.getElementById('dailyPageGoalInput').value = user.dailyPageGoal;
    document.getElementById('goalsFinishedCount').textContent = finished;
    document.getElementById('goalsRemainingCount').textContent = Math.max(0, user.yearlyGoal - finished);
}

function updateYearlyGoal() {
    const val = parseInt(document.getElementById('yearlyGoalInput').value);
    if (val > 0) {
        const user = getUser();
        user.yearlyGoal = val;
        saveUser(user);
        renderGoals();
        showToast('Yearly goal updated!', 'success');
    }
}

function updateDailyPageGoal() {
    const val = parseInt(document.getElementById('dailyPageGoalInput').value);
    if (val > 0) {
        const user = getUser();
        user.dailyPageGoal = val;
        saveUser(user);
        renderGoals();
        showToast('Daily target updated!', 'success');
    }
}

// ===== Stats Actions =====
function renderStats() {
    renderGenreChart();
    renderMonthlyChart();
    renderRatingDistribution();
}

function renderGenreChart() {
    const books = getBooks();
    const genres = {};
    books.forEach(b => {
        const g = formatGenre(b.genre);
        genres[g] = (genres[g] || 0) + 1;
    });

    const container = document.getElementById('genreDistributionChart');
    const legend = document.getElementById('genreLegend');

    if (Object.keys(genres).length === 0) {
        container.innerHTML = '<p>No data yet</p>';
        return;
    }

    const colors = ['#dc143c', '#ff4d6d', '#800020', '#4d1621', '#a08080', '#5a1a24'];
    let html = '<svg viewBox="0 0 100 100" width="150" height="150"><circle cx="50" cy="50" r="40" fill="transparent" stroke="#2d1a1f" stroke-width="20"/></svg>';

    // Simple pie chart logic (CSS or SVG)
    // For simplicity, we'll use a legend and basic bar distribution for now or a simple CSS chart
    legend.innerHTML = Object.entries(genres).map(([g, count], i) => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${colors[i % colors.length]}"></div>
            <span>${g}: ${count}</span>
        </div>
    `).join('');

    container.innerHTML = `
        <div style="width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(
            ${Object.entries(genres).map(([g, count], i) => {
        const total = books.length;
        const prevSum = Object.values(genres).slice(0, i).reduce((a, b) => a + b, 0);
        const start = (prevSum / total) * 100;
        const end = ((prevSum + count) / total) * 100;
        return `${colors[i % colors.length]} ${start}% ${end}%`;
    }).join(', ')
        }
        )"></div>
    `;
}

function renderMonthlyChart() {
    const container = document.getElementById('monthlyPagesChart');
    const books = getBooks();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthData = new Array(12).fill(0);

    books.forEach(b => {
        (b.sessions || []).forEach(s => {
            const date = new Date(s.date);
            if (date.getFullYear() === new Date().getFullYear()) {
                monthData[date.getMonth()] += s.pages;
            }
        });
    });

    const max = Math.max(...monthData, 500);

    container.innerHTML = monthData.map((val, i) => `
        <div class="chart-bar-v" style="height: ${(val / max) * 100}%" title="${months[i]}: ${val} pages">
            <div class="chart-bar-label">${months[i]}</div>
        </div>
    `).join('');
}

function renderRatingDistribution() {
    const books = getBooks().filter(b => b.status === 'finished');
    const ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    books.forEach(b => {
        if (b.rating) ratings[b.rating]++;
    });

    const container = document.getElementById('ratingDistributionChart');
    const total = books.length || 1;

    container.innerHTML = [5, 4, 3, 2, 1].map(r => `
        <div class="rating-bar-row">
            <div class="rating-label">${r} Stars</div>
            <div class="rating-track">
                <div class="rating-fill" style="width: ${(ratings[r] / total) * 100}%"></div>
            </div>
            <div class="rating-count">${ratings[r]}</div>
        </div>
    `).join('');
}

// ===== Settings Actions =====
function renderSettings() {
    const user = getUser();
    document.getElementById('notifToggle').checked = user.preferences.notifications;
    document.getElementById('privacyToggle').checked = user.preferences.privacy;
}

document.getElementById('notifToggle')?.addEventListener('change', (e) => {
    const user = getUser();
    user.preferences.notifications = e.target.checked;
    saveUser(user);
});

document.getElementById('privacyToggle')?.addEventListener('change', (e) => {
    const user = getUser();
    user.preferences.privacy = e.target.checked;
    saveUser(user);
});

function exportData() {
    const books = getBooks();
    const user = getUser();
    const data = { books, user, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_library_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Library exported successfully!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.books) {
                saveBooks(data.books);
                if (data.user) saveUser(data.user);
                showToast('Library imported successfully!', 'success');
                renderDashboard();
            } else {
                throw new Error('Invalid data format');
            }
        } catch (err) {
            showToast('Failed to import data. Check file format.', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Are you SURE you want to clear all reading data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_KEY);
        location.reload();
    }
}

// ===== Toast Notifications =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : '!'}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===== Helpers =====
function formatStatus(status) {
    const map = { reading: 'Reading', tbr: 'TBR', finished: 'Finished' };
    return map[status] || status;
}

// ===== Onboarding Logic =====
function initializeDynamicDates() {
    const currentYear = new Date().getFullYear();
    const goalYearDisplay = document.getElementById('goalYearDisplay');
    const goalSettingYear = document.getElementById('goalSettingYear');

    if (goalYearDisplay) goalYearDisplay.textContent = currentYear;
    if (goalSettingYear) goalSettingYear.textContent = currentYear;
}

function checkFirstRun() {
    const user = localStorage.getItem(USER_KEY);
    if (!user) {
        document.getElementById('onboardingView').style.display = 'flex';
    } else {
        initSampleData();
        renderDashboard();
    }
}

function completeOnboarding() {
    const name = document.getElementById('setupName').value.trim();
    if (!name) {
        showToast('Please enter your name to continue', 'error');
        return;
    }

    const newUser = {
        ...DEFAULT_USER,
        name: name,
        title: document.getElementById('setupTitle').value || 'Book Enthusiast',
        yearlyGoal: parseInt(document.getElementById('setupGoal').value) || 12,
        bio: document.getElementById('setupBio').value || ''
    };

    saveUser(newUser);
    document.getElementById('onboardingView').style.display = 'none';
    showToast(`Welcome to Lumina, ${name}!`, 'success');

    initSampleData();
    renderDashboard();
}

function formatGenre(genre) {
    const map = {
        'fiction': 'Fiction',
        'non-fiction': 'Non-Fiction',
        'sci-fi': 'Sci-Fi',
        'fantasy': 'Fantasy',
        'mystery': 'Mystery',
        'romance': 'Romance',
        'classic': 'Classic Literature',
        'biography': 'Biography',
        'theology': 'Theology/Christian',
        'self-help': 'Self-Help'
    };
    return map[genre] || genre || 'Fiction';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function showUserProfile() {
    showView('profile');
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', function () {
    initializeDynamicDates();
    checkFirstRun();

    // Navigation
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', () => showView(item.dataset.view));
    });

    // Library tabs
    document.querySelectorAll('.library-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.library-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderLibrary();
        });
    });

    // Library search
    document.getElementById('librarySearch')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderLibrary();
    });

    // Genre filter
    document.getElementById('genreFilter')?.addEventListener('change', renderLibrary);

    // Global search from header
    document.getElementById('globalSearch')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        const librarySearch = document.getElementById('librarySearch');
        if (librarySearch) librarySearch.value = searchQuery;

        if (e.target.value && document.getElementById('dashboard-view').classList.contains('active')) {
            showView('library');
        }
        renderLibrary();
    });

    // Share button listener
    document.querySelector('.btn-icon')?.addEventListener('click', shareBook);

    // Header buttons
    document.querySelector('.notification-btn')?.addEventListener('click', showNotifications);
    document.querySelector('.user-profile')?.addEventListener('click', showUserProfile);

    // Challenge card
    document.querySelector('.action-card:last-child')?.addEventListener('click', joinChallenge);

    // Detail view extra links
    document.querySelector('#book-detail-view .view-all-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Full reading history coming soon!', 'success');
    });

    // Sidebar navigation (ensure all are active)
    document.querySelectorAll('.nav-item').forEach(item => {
        if (!item.hasAttribute('data-view')) {
            item.addEventListener('click', () => {
                showToast(`${item.textContent.trim()} feature coming soon!`, 'success');
            });
        }
    });

    // Calculate streak
    updateStreak();

    // Init User UI
    updateHeaderUser();

    // Init Online Search
    initOnlineSearch();
});


function updateStreak() {
    const books = getBooks();
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        let hasSession = false;
        books.forEach(b => {
            (b.sessions || []).forEach(s => {
                if (s.date === dateStr) hasSession = true;
            });
        });

        if (hasSession) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }

    document.getElementById('streakDays').textContent = streak;
}

// ===== Smart Import Logic =====
let smartImportChapters = []; // Store extracted TOC

async function handleSmartImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    showToast('Analyzing file...', 'info');

    try {
        if (file.type === 'application/pdf') {
            await parsePDF(file);
        } else if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
            await parseEPUB(file);
        } else {
            showToast('Unsupported file format. Please use PDF or EPUB.', 'error');
        }
    } catch (err) {
        console.error('Import Error:', err);
        showToast('Failed to read file. Please enter details manually.', 'error');
    }

    // Reset input
    event.target.value = '';
}

async function parsePDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Get Metadata
    const metadata = await pdf.getMetadata();
    const info = metadata.info || {};

    // Fill Form
    if (info.Title) document.getElementById('bookTitle').value = info.Title;
    if (info.Author) document.getElementById('bookAuthor').value = info.Author;
    document.getElementById('bookPages').value = pdf.numPages;

    // Extract Outline (TOC)
    try {
        const outline = await pdf.getOutline();
        smartImportChapters = [];
        if (outline && outline.length > 0) {
            // Flatten PDF outline to linear list
            const flatten = (items) => {
                let list = [];
                items.forEach(item => {
                    list.push(item.title);
                    if (item.items && item.items.length > 0) {
                        list = list.concat(flatten(item.items));
                    }
                });
                return list;
            };
            smartImportChapters = flatten(outline);

            if (smartImportChapters.length > 0) {
                document.getElementById('bookChapters').value = smartImportChapters.length;
                showToast(`Extracted ${smartImportChapters.length} chapters from PDF`, 'success');
            }
        }
    } catch (e) {
        console.warn('PDF Outline extraction failed', e);
    }

    showToast('PDF details extracted successfully!', 'success');
}

async function parseEPUB(file) {
    const zip = await JSZip.loadAsync(file);

    // Find content.opf to read metadata
    const opfFile = Object.keys(zip.files).find(name => name.endsWith('.opf'));
    if (!opfFile) throw new Error('Invalid EPUB: content.opf not found');

    const opfContent = await zip.file(opfFile).async('string');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(opfContent, 'text/xml');

    const title = xmlDoc.getElementsByTagName('dc:title')[0]?.textContent;
    const author = xmlDoc.getElementsByTagName('dc:creator')[0]?.textContent;

    if (title) document.getElementById('bookTitle').value = title;
    if (author) document.getElementById('bookAuthor').value = author;

    // Extract TOC (NCX)
    smartImportChapters = [];
    try {
        // Try to find TOC id in spine or manifest
        const spine = xmlDoc.getElementsByTagName('spine')[0];
        const tocId = spine?.getAttribute('toc') || 'ncx';

        // Find manifest item with id=tocId
        const manifest = xmlDoc.getElementsByTagName('manifest')[0];
        let tocHref = null;
        if (manifest) {
            const items = manifest.getElementsByTagName('item');
            for (let i = 0; i < items.length; i++) {
                if (items[i].getAttribute('id') === tocId) {
                    tocHref = items[i].getAttribute('href');
                    break;
                }
            }
        }

        if (tocHref) {
            // Resolve path relative to OPF file
            const opfPath = opfFile.substring(0, opfFile.lastIndexOf('/') + 1);
            const tocPath = opfPath + tocHref;

            const tocContent = await zip.file(tocPath).async('string');
            const tocXml = parser.parseFromString(tocContent, 'text/xml');

            // Parse navPoints
            const navPoints = tocXml.getElementsByTagName('navPoint');
            for (let i = 0; i < navPoints.length; i++) {
                const label = navPoints[i].getElementsByTagName('navLabel')[0]?.textContent?.trim();
                if (label) smartImportChapters.push(label);
            }

            if (smartImportChapters.length > 0) {
                document.getElementById('bookChapters').value = smartImportChapters.length;
                showToast(`Extracted ${smartImportChapters.length} chapters from EPUB`, 'success');
            }
        }
    } catch (e) {
        console.warn('EPUB TOC extraction failed', e);
    }

    showToast('EPUB details extracted successfully!', 'success');
}

// ===== Online Book Search =====
let searchTimeout = null;

function initOnlineSearch() {
    const input = document.getElementById('bookSearchInput');
    const resultsContainer = document.getElementById('searchResults');

    if (input) {
        input.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 3) {
                resultsContainer.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(() => {
                searchOnlineBooks(query);
            }, 500);
        });

        // Close results when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
                resultsContainer.style.display = 'none';
            }
        });
    }
}

async function searchOnlineBooks(query) {
    const resultsContainer = document.getElementById('searchResults');

    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            displaySearchResults(data.items);
        } else {
            resultsContainer.style.display = 'none';
        }
    } catch (err) {
        console.error('Search Error:', err);
    }
}

function displaySearchResults(books) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    container.style.display = 'block';

    books.forEach(book => {
        const info = book.volumeInfo;
        const thumbnail = info.imageLinks?.smallThumbnail || info.imageLinks?.thumbnail || '';
        const title = info.title || 'Unknown Title';
        const authors = info.authors ? info.authors.join(', ') : 'Unknown Author';

        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            ${thumbnail ? `<img src="${thumbnail}" class="search-result-thumb">` : '<div class="search-result-thumb"></div>'}
            <div class="search-result-info">
                <div class="search-result-title">${title}</div>
                <div class="search-result-author">${authors}</div>
            </div>
        `;

        item.addEventListener('click', () => selectBook(book));
        container.appendChild(item);
    });
}

function selectBook(book) {
    const info = book.volumeInfo;

    // Auto-fill Form
    document.getElementById('bookTitle').value = info.title || '';
    document.getElementById('bookAuthor').value = info.authors ? info.authors.join(', ') : '';
    document.getElementById('bookPages').value = info.pageCount || '';
    document.getElementById('bookChapters').value = ''; // Reset chapters (API doesn't provide it)

    // Description
    if (info.description) {
        // Strip HTML tags from description if present
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = info.description;
        document.getElementById('bookDescription').value = tempDiv.textContent || tempDiv.innerText || '';
    }

    // Attempt to map categories to genre (simple heuristic)
    if (info.categories) {
        const cat = info.categories[0].toLowerCase();
        const select = document.getElementById('bookGenre');
        for (let i = 0; i < select.options.length; i++) {
            if (cat.includes(select.options[i].value)) {
                select.selectedIndex = i;
                break;
            }
        }
    }

    // Handle Cover
    if (info.imageLinks) {
        // Try to construct a higher quality URL if possible, default to thumbnail
        let coverUrl = info.imageLinks.thumbnail || info.imageLinks.smallThumbnail;
        if (coverUrl) {
            // Swap http for https
            coverUrl = coverUrl.replace('http://', 'https://');

            // Hack to get higher res from Google Books if Zoom=1
            // simple string replace isn't always reliable but worth a try e.g. zoom=1 -> zoom=0
        }

        uploadedCover = coverUrl;
        document.getElementById('coverUpload').innerHTML = `<img src="${uploadedCover}" alt="Book cover">`;
    }

    // Clear search results
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('bookSearchInput').value = '';

    showToast('Book details imported!', 'success');
}

// Inject Search Styles Dynamically (Fallback)
const searchStyles = document.createElement('style');
searchStyles.textContent = `
/* Online Search Results */
.add-book-search { position: relative; width: 100%; }
.search-results {
    position: absolute; top: 100%; left: 0; right: 0;
    background: var(--bg-card); border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0 0 var(--radius-md) var(--radius-md);
    max-height: 300px; overflow-y: auto; z-index: 100;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-top: 4px;
}
.search-result-item {
    display: flex; gap: var(--space-md); padding: var(--space-md);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    cursor: pointer; transition: background 0.2s;
}
.search-result-item:last-child { border-bottom: none; }
.search-result-item:hover { background: rgba(255, 255, 255, 0.05); }
.search-result-thumb {
    width: 40px; height: 60px; object-fit: cover;
    border-radius: 4px; background: var(--bg-input);
}
.search-result-info {
    flex: 1; display: flex; flex-direction: column; justify-content: center;
}
.search-result-title { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); }
.search-result-author { font-size: 0.8rem; color: var(--text-muted); }
`;
document.head.appendChild(searchStyles);

function updateBookChapter(chapter) {
    if (!currentBookId) return;

    const val = parseInt(chapter);
    updateBook(currentBookId, { currentChapter: val });
    showToast(`Progress: Chapter ${val} completed`, 'success');
}
