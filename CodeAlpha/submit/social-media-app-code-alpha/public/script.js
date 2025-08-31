const API_URL = 'http://localhost:3000';

// Global state
let loggedInUser = null;
let authToken = null;

// DOM elements
const modalOverlay = document.getElementById('modal-overlay');
const modalText = document.getElementById('modal-text');

const mainApp = document.getElementById('main-app');
const authForms = document.getElementById('auth-forms');
const loginFormContainer = document.getElementById('login-form-container');
const registerFormContainer = document.getElementById('register-form-container');
const showLoginLink = document.getElementById('show-login');
const showRegisterLink = document.getElementById('show-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutButton = document.getElementById('logout-button');
const usernameDisplay = document.getElementById('username-display');
const createPostForm = document.getElementById('create-post-form');
const postsContainer = document.getElementById('posts-container');

// Function to load user state from localStorage
const loadStateFromLocalStorage = () => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('loggedInUser');

    if (storedToken && storedUser) {
        try {
            loggedInUser = JSON.parse(storedUser);
            authToken = storedToken;
            console.log('State loaded from localStorage.');
        } catch (e) {
            console.error('Failed to parse user data from localStorage', e);
            localStorage.removeItem('authToken');
            localStorage.removeItem('loggedInUser');
        }
    }
};

// Helper function to show a modal with a message
const showModal = (message) => {
    modalText.textContent = message;
    modalOverlay.classList.remove('hidden');
    setTimeout(() => {
        modalOverlay.classList.add('hidden');
    }, 3000);
};

// Helper function to render the correct view (login, register, or feed)
const renderView = () => {
    if (loggedInUser) {
        authForms.classList.add('hidden');
        mainApp.classList.remove('hidden');
        usernameDisplay.textContent = loggedInUser.username;
        fetchPosts();
    } else {
        authForms.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
};

// API Calls
const fetchPosts = async () => {
    postsContainer.innerHTML = `<div class="loader-container"><i class="fas fa-spinner fa-spin loader"></i></div>`;
    try {
        console.log('Fetching posts from:', `${API_URL}/posts`);
        const response = await fetch(`${API_URL}/posts`);
        console.log('Posts response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('Posts error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Posts response data:', data);
        console.log('Data type:', typeof data);
        console.log('Is data an array?', Array.isArray(data));

        // Handle different possible response formats from your backend
        let posts = [];

        if (data && data.success && data.posts) {
            // Format: { success: true, posts: [...] }
            posts = Array.isArray(data.posts) ? data.posts : [];
        } else if (data && data.data) {
            // Format: { data: [...] }
            posts = Array.isArray(data.data) ? data.data : [];
        } else if (Array.isArray(data)) {
            // Format: [...] (direct array)
            posts = data;
        } else if (data && Array.isArray(data.posts)) {
            // Format: { posts: [...] } (without success field)
            posts = data.posts;
        } else {
            // Unknown format, try to extract array from any property
            console.warn('Unknown posts data format:', data);
            posts = [];
        }

        console.log('Final posts to render:', posts);
        console.log('Posts count:', posts.length);
        renderPosts(posts);
    } catch (error) {
        showModal("Error fetching posts.");
        console.error("Error fetching posts:", error);
        postsContainer.innerHTML = `<p class="empty-state">Error loading posts. Please try again.</p>`;
    }
};

const registerUser = async (userData) => {
    console.log('Registering user with data:', userData);
    try {
        // FIXED: Using /users/register endpoint
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        console.log('Register response status:', response.status);
        const data = await response.json();
        console.log('Register response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to register');
        }

        showModal(data.message || "Registration successful!");
        loginFormContainer.classList.remove('hidden');
        registerFormContainer.classList.add('hidden');
    } catch (error) {
        showModal(`Error: ${error.message}`);
        console.error("Error registering user:", error);
    }
};

// Updated login function with correct endpoint and localStorage
const loginUser = async (userData) => {
    console.log('Attempting to log in with data:', userData);
    try {
        // FIXED: Using /users/login endpoint
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        console.log('Login API Response Status:', response.status);

        const data = await response.json();
        console.log('Login API Response Body:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to log in');
        }

        // Store user data in a global variable
        loggedInUser = data.user;
        // Store the JWT token for authenticated requests
        authToken = data.token;

        // Save user data to localStorage for persistence
        localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
        localStorage.setItem('authToken', authToken);

        console.log('User logged in:', loggedInUser);
        console.log('Auth token stored:', authToken ? 'Yes' : 'No');
        showModal(data.message || "Login successful!");
        renderView();
    } catch (error) {
        showModal(`Error: ${error.message}`);
        console.error("Error logging in:", error);
    }
};

const createPost = async (content) => {
    console.log('Creating post with content:', content);
    console.log('Logged in user:', loggedInUser);
    console.log('Auth token available:', authToken ? 'Yes' : 'No');

    if (!loggedInUser || !loggedInUser.id) {
        showModal("Please log in to create posts");
        console.error('No logged in user or user ID missing');
        return;
    }

    if (!authToken) {
        showModal("Authentication token missing. Please log in again.");
        console.error('No auth token available');
        return;
    }

    const postData = {
        content: content.trim()
        // Remove user/userId from body since we're using JWT auth
    };

    console.log('Sending post data:', JSON.stringify(postData, null, 2));

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // Include JWT token
            },
            body: JSON.stringify(postData),
        });

        console.log('Create post response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('Create post error response:', errorText);

            if (response.status === 401) {
                showModal("Authentication failed. Please log in again.");
                loggedInUser = null;
                authToken = null;
                renderView();
                return;
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Create post response data:', data);

        fetchPosts();
        showModal(data.message || "Post created successfully!");
    } catch (error) {
        showModal(`Error creating post: ${error.message}`);
        console.error("Error creating post:", error);
    }
};

const likePost = async (postId) => {
    console.log('Liking post:', postId);

    if (!loggedInUser || !loggedInUser.id) {
        showModal("Please log in to like posts");
        return;
    }

    // Check for the authentication token
    const token = authToken;
    if (!token) {
        showModal("Authentication token missing. Please log in again.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Add the authorization header
            },
        });

        console.log('Like post response status:', response.status);
        const data = await response.json();
        console.log('Like post response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to like post');
        }

        fetchPosts(); // Re-fetch posts to update the UI
        showModal(data.message || "Post liked!");
    } catch (error) {
        showModal(`Error liking post: ${error.message}`);
        console.error("Error liking post:", error);
    }
};

const addComment = async (text, postId) => {
    console.log('Adding comment:', text, 'to post:', postId);

    if (!loggedInUser || !loggedInUser.id) {
        showModal("Please log in to add comments");
        return;
    }

    // Check for the authentication token
    const token = authToken;
    if (!token) {
        showModal("Authentication token missing. Please log in again.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Add the authorization header
            },
            body: JSON.stringify({
                text,
                post: postId
            }),
        });

        console.log('Add comment response status:', response.status);
        const data = await response.json();
        console.log('Add comment response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to add comment');
        }

        fetchPosts(); // Re-fetch posts to update the UI
        showModal("Comment added!");
    } catch (error) {
        showModal(`Error adding comment: ${error.message}`);
        console.error("Error adding comment:", error);
    }
};

// Render posts to the DOM
const renderPosts = (posts) => {
    console.log('Rendering posts:', posts);

    if (!Array.isArray(posts)) {
        console.error('Posts is not an array:', posts);
        postsContainer.innerHTML = `<p class="empty-state">Error: Posts data format is incorrect</p>`;
        return;
    }

    if (posts.length === 0) {
        postsContainer.innerHTML = `<p class="empty-state">No posts found. Be the first to post!</p>`;
        return;
    }

    postsContainer.innerHTML = posts.map(post => {
        console.log('Rendering individual post:', post);

        // Handle different possible ID formats from your backend
        const postId = post.id || post._id;
        const userId = post.user?.id || post.user?._id;
        const username = post.user?.username || 'Unknown User';
        const userLikes = post.likes || [];
        const postComments = post.comments || [];

        // Check if current user has liked this post
        const currentUserId = loggedInUser?.id || loggedInUser?._id;
        // The toString() conversion is important for accurate comparison
        const isLiked = userLikes.map(id => id.toString()).includes(currentUserId.toString());

        return `
        <div class="post-card">
            <div class="post-header">
                <div class="user-info">
                    <div class="avatar">${username[0].toUpperCase()}</div>
                    <div>
                        <p class="username"><a href="user-profile.html?userId=${userId}" class="user-link">${username}</a></p>
                        <p class="timestamp">${new Date(post.date).toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <p class="post-content">${post.content || ''}</p>
            <div class="post-actions">
                <button class="action-button like-button ${isLiked ? 'liked' : ''}" data-post-id="${postId}">
                    <i class="fas fa-heart"></i>
                    <span>${userLikes.length}</span>
                </button>
                <div class="action-button">
                    <i class="fas fa-comment"></i>
                    <span>${postComments.length}</span>
                </div>
            </div>
            <div class="comment-section">
                <h3 class="comment-header">Comments</h3>
                ${postComments && postComments.length > 0 ?
                postComments.map(comment => `
                        <p class="comment-text"><span class="username">${comment.user?.username || 'Unknown'}:</span> ${comment.text || ''}</p>
                    `).join('') :
                `<p class="comment-text">No comments yet.</p>`
            }
                <form class="comment-form mt-2" data-post-id="${postId}">
                    <input name="commentText" type="text" placeholder="Add a comment..." class="comment-input" required />
                    <button type="submit" class="form-button small-button">Add</button>
                </form>
            </div>
        </div>
    `;
    }).join('');
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, rendering view');
    loadStateFromLocalStorage(); // Load state before rendering
    renderView();
});

if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
    });
}

if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.remove('hidden');
        registerFormContainer.classList.add('hidden');
    });
}
//form id
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);//converts into pbject - key value pairs
        console.log('Register form data:', data);
        registerUser(data);
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        console.log('Login form data:', data);
        loginUser(data);
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        console.log('Logging out user');
        loggedInUser = null;
        authToken = null; // Clear auth token
        localStorage.removeItem('authToken');
        localStorage.removeItem('loggedInUser');
        renderView();
    });
}

if (createPostForm) {
    createPostForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const postText = document.getElementById('post-textarea').value;
        console.log('Creating post with text:', postText);
        createPost(postText);
        document.getElementById('post-textarea').value = '';
    });
}

if (postsContainer) {
    postsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.like-button')) {
            const button = e.target.closest('.like-button');
            const postId = button.dataset.postId;
            console.log('Like button clicked for post:', postId);
            likePost(postId);
        }
    });

    postsContainer.addEventListener('submit', (e) => {
        if (e.target.closest('.comment-form')) {
            e.preventDefault();
            const form = e.target.closest('.comment-form');
            const postId = form.dataset.postId;
            const commentText = form.querySelector('[name="commentText"]').value;
            console.log('Comment form submitted:', commentText, 'for post:', postId);
            addComment(commentText, postId);
        }
    });
}
