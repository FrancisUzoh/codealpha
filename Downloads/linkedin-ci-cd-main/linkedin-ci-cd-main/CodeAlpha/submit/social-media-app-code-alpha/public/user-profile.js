const API_URL = 'http://localhost:3000';

// DOM Elements
const modalOverlay = document.getElementById('modal-overlay');
const modalText = document.getElementById('modal-text');
const postsContainer = document.getElementById('posts-container');
const profileUsername = document.getElementById('profile-username');
const profileEmail = document.getElementById('profile-email');
const profilePostCount = document.getElementById('profile-post-count');
const backButton = document.getElementById('back-button');

let loggedInUser = null; // Optional: for liking/comments
let authToken = localStorage.getItem('authToken');

// Show modal messages
const showModal = (message) => {
    modalText.textContent = message;
    modalOverlay.classList.remove('hidden');
    setTimeout(() => modalOverlay.classList.add('hidden'), 3000);
};

// Get userId from URL query string
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');

if (!userId) {
    showModal('No userId provided in URL!');
    postsContainer.innerHTML = '<p>No user selected.</p>';
}

// Fetch user profile info
const fetchUser = async () => {
    try {
        const res = await fetch(`${API_URL}/users/${userId}`);
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();

        profileUsername.textContent = data.username || 'Unknown';
        profileEmail.textContent = data.email || 'No email';
    } catch (err) {
        showModal(err.message);
        console.error(err);
    }
};

// Fetch posts **only from this user**
const fetchUserPosts = async () => {
    postsContainer.innerHTML = `<p>Loading posts...</p>`;
    try {
        // Pass userId as query param so backend filters posts
        const res = await fetch(`${API_URL}/posts?userId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch posts');

        const data = await res.json();
        // Render all posts returned from backend for this user
        renderPosts(data.posts || []);
    } catch (err) {
        showModal(err.message);
        postsContainer.innerHTML = '<p>Error loading posts.</p>';
    }
};

// Render posts on the page
const renderPosts = (posts) => {
    profilePostCount.textContent = `Posts: ${posts.length}`;

    if (posts.length === 0) {
        postsContainer.innerHTML = '<p>This user has not posted yet.</p>';
        return;
    }

    postsContainer.innerHTML = posts.map(post => {
        const postId = post.id || post._id;
        const username = post.user?.username || 'Unknown';
        const postComments = post.comments || [];
        const userLikes = post.likes || [];
        const isLiked = loggedInUser ? userLikes.includes(loggedInUser.id) : false;

        return `
            <div class="post-card">
                <div class="post-header">
                    <p class="username">${username}</p>
                    <p class="timestamp">${new Date(post.date).toLocaleString()}</p>
                </div>
                <p class="post-content">${post.content || ''}</p>
                <div class="post-actions">
                    <button class="like-button ${isLiked ? 'liked' : ''}" data-post-id="${postId}">
                        <i class="fas fa-heart"></i> <span>${userLikes.length}</span>
                    </button>
                </div>
                <div class="comment-section">
                    <h4>Comments (${postComments.length})</h4>
                    ${postComments.map(c => `<p><b>${c.user?.username || 'Unknown'}:</b> ${c.text}</p>`).join('')}
                    <form class="comment-form" data-post-id="${postId}">
                        <input name="commentText" type="text" placeholder="Add a comment..." required>
                        <button type="submit">Add</button>
                    </form>
                </div>
            </div>
        `;
    }).join('');

    addPostEventListeners();
};

// Add event listeners for like buttons and comment forms
const addPostEventListeners = () => {
    document.querySelectorAll('.like-button').forEach(btn => {
        btn.addEventListener('click', async () => {
            const postId = btn.dataset.postId;
            if (!authToken) return showModal('Login to like posts');

            try {
                const res = await fetch(`${API_URL}/posts/${postId}/like`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await res.json();
                showModal(data.message || 'Post liked!');
                fetchUserPosts(); // Refresh posts
            } catch (err) {
                showModal(err.message);
            }
        });
    });

    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const postId = form.dataset.postId;
            const text = form.commentText.value.trim();
            if (!text) return;
            if (!authToken) return showModal('Login to comment');

            try {
                await fetch(`${API_URL}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ text, post: postId })
                });
                showModal('Comment added!');
                form.commentText.value = '';
                fetchUserPosts(); // Refresh posts
            } catch (err) {
                showModal(err.message);
            }
        });
    });
};

// Back button
if (backButton) {
    backButton.addEventListener('click', () => window.location.href = 'index.html');
}

// Initialize page
fetchUser();
fetchUserPosts();
