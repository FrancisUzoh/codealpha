// --- State Management ---
// Update this URL if your backend is on a different host or port
const API_BASE_URL = 'http://localhost:3000/api';

let products = [];
let cart = [];
let orders = [];
let categories = [];
let token = localStorage.getItem('authToken');
let selectedProduct = null;

// --- DOM Elements ---
const productsPage = document.getElementById('products-page');
const productDetailsPage = document.getElementById('product-details-page');
const cartPage = document.getElementById('cart-page');
const ordersPage = document.getElementById('orders-page');
const loginPage = document.getElementById('login-page');
const registerPage = document.getElementById('register-page');
const categoriesPage = document.getElementById('categories-page');

const productsContainer = document.getElementById('products-container');
const cartContainer = document.getElementById('cart-container');
const ordersContainer = document.getElementById('orders-container');
const categoriesContainer = document.getElementById('categories-container');

const loggedInNav = document.getElementById('logged-in-nav');
const loggedOutNav = document.getElementById('logged-out-nav');
const cartItemCount = document.getElementById('cart-item-count');

const messageContainer = document.getElementById('message-container');

// --- Utility Functions ---
const showMessage = (msg, isError = false) => {
    messageContainer.textContent = msg;
    messageContainer.className = isError ? 'p-4 text-center bg-red-500 text-white' : 'p-4 text-center bg-green-500 text-white';
    messageContainer.classList.remove('hidden');
    setTimeout(() => {
        messageContainer.classList.add('hidden');
    }, 3000);
};

const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// --- Navigation with URL History API ---
const navigateTo = (page, forceReload = false) => {
    // Hide all pages first
    productsPage.classList.add('hidden');
    productDetailsPage.classList.add('hidden');
    cartPage.classList.add('hidden');
    ordersPage.classList.add('hidden');
    loginPage.classList.add('hidden');
    registerPage.classList.add('hidden');
    categoriesPage.classList.add('hidden');

    // Show the requested page and fetch data
    switch (page) {
        case 'products':
            productsPage.classList.remove('hidden');
            fetchProducts();
            break;
        case 'productDetails':
            renderProductDetails();
            productDetailsPage.classList.remove('hidden');
            break;
        case 'cart':
            renderCart();
            cartPage.classList.remove('hidden');
            break;
        case 'orders':
            fetchOrders();
            ordersPage.classList.remove('hidden');
            break;
        case 'login':
            loginPage.classList.remove('hidden');
            break;
        case 'register':
            registerPage.classList.remove('hidden');
            break;
        case 'categories':
            categoriesPage.classList.remove('hidden');
            fetchCategories();
            break;
        case 'category-products': // New case for category-specific products
            productsPage.classList.remove('hidden');
            // Logic to fetch and render category products is handled separately
            break;
    }
    updateNav();

    // Update the URL without reloading the page
    const url = page === 'products' ? '/' : `/${page}`;
    if (window.location.pathname !== url || forceReload) {
        history.pushState({ page: page }, '', url);
    }
};

const updateNav = () => {
    if (token) {
        loggedInNav.classList.remove('hidden');
        loggedOutNav.classList.add('hidden');
    } else {
        loggedInNav.classList.add('hidden');
        loggedOutNav.classList.remove('hidden');
    }

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount > 0) {
        cartItemCount.classList.remove('hidden');
        cartItemCount.textContent = cartCount;
    } else {
        cartItemCount.classList.add('hidden');
    }
};

// --- Data Fetching ---
const fetchProducts = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        products = await response.json();
        renderProducts();
    } catch (error) {
        showMessage('Failed to fetch products.', true);
    }
};

const fetchProductsByCategory = async (category) => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch products for category: ${category}`);
        }
        products = await response.json();
        renderProducts();
        navigateTo('category-products');
    } catch (error) {
        showMessage(error.message, true);
        products = [];
        renderProducts();
    }
};

const fetchCategories = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/categories`);
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        categories = await response.json();
        renderCategories();
    } catch (error) {
        console.error('Error fetching categories:', error);
        showMessage(error.message, true);
    }
}

const fetchCart = async () => {
    if (!token) {
        cart = [];
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/cart`, { headers: getHeaders() });
        if (response.ok) {
            const data = await response.json();
            cart = data.items;
        } else {
            cart = [];
        }
    } catch (error) {
        showMessage('Failed to fetch cart.', true);
    }
    updateNav();
};

const fetchOrders = async () => {
    console.log('=== DEBUGGING FETCH ORDERS ===');
    console.log('Token exists:', !!token);
    console.log('API_BASE_URL:', API_BASE_URL);

    if (!token) {
        console.log('No token, setting empty orders');
        orders = [];
        renderOrders();
        return;
    }

    try {
        const url = `${API_BASE_URL}/orders/history`;
        console.log('Fetching from URL:', url);
        console.log('Headers:', getHeaders());

        const response = await fetch(url, { headers: getHeaders() });
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
            orders = await response.json();
            console.log('Orders received:', orders.length);
            console.log('First order:', orders[0]);
            renderOrders();
        } else {
            console.log('Response not ok, status:', response.status);
            const errorText = await response.text();
            console.log('Error response:', errorText);
            orders = [];
            renderOrders();
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showMessage('Failed to fetch orders.', true);
        orders = [];
        renderOrders();
    }
    console.log('--- END DEBUG ---');
};

// --- Event Handlers ---
const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('authToken', token);
            showMessage('Login successful!');
            await fetchCart();
            await fetchOrders();
            navigateTo('products');
        } else {
            showMessage(data.message || 'Login failed.', true);
        }
    } catch (error) {
        showMessage('An error occurred during login.', true);
    }
};

const handleRegister = async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (!username) {
        showMessage('Username is required.', true);
        return;
    }
    if (!email || !email.includes('@')) {
        showMessage('Please enter a valid email address.', true);
        return;
    }
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('User account created.');
            navigateTo('login');
        } else {
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                const errorMessages = data.errors.map(err => err.msg).join(' ');
                showMessage(`Registration failed: ${errorMessages}`, true);
            } else {
                showMessage(data.message || 'Registration failed.', true);
            }
        }
    } catch (error) {
        showMessage('An error occurred during registration.', true);
    }
};

const handleLogout = () => {
    token = null;
    localStorage.removeItem('authToken');
    showMessage('Logged out successfully.');
    cart = [];
    orders = [];
    navigateTo('products');
};

const handleAddToCart = async (productId) => {
    if (!token) {
        showMessage('Please log in to add items to your cart.', true);
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ productId: productId, quantity: 1 })
        });
        if (response.ok) {
            showMessage('Product added to cart!');
            await fetchCart();
        } else {
            const errorData = await response.json();
            showMessage(errorData.message || 'Failed to add product to cart.', true);
        }
    } catch (error) {
        showMessage('An error occurred.', true);
    }
};

const handleCheckout = async () => {
    if (!cart || cart.length === 0) {
        showMessage('Your cart is empty!', true);
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            showMessage(errorData.message || 'Checkout failed.', true);
            return;
        }

        showMessage('Checkout successful! Thank you for your purchase.');
        await fetchCart();
        await fetchOrders();
        navigateTo('orders');
    } catch (error) {
        showMessage('An error occurred during checkout.', true);
    }
};

const handleDeleteFromCart = async (productId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (response.ok) {
            showMessage('Item removed from cart.');
            await fetchCart();
        } else {
            showMessage('Failed to remove item.', true);
        }
    } catch (err) {
        showMessage('An error occurred.', true);
    }
};

// --- Rendering Functions ---
const renderProducts = () => {
    productsContainer.innerHTML = '';
    if (products.length === 0) {
        productsContainer.innerHTML = '<p class="col-span-full text-center text-gray-600 text-xl">No products found.</p>';
        return;
    }
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-xl font-semibold text-gray-800">${product.name}</h3>
                <p class="text-gray-600 my-2 text-sm">${product.description.substring(0, 70)}...</p>
                <div class="flex justify-between items-center mt-4">
                    <span class="text-2xl font-bold text-gray-900">$${product.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300" data-product-id="${product._id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        productCard.addEventListener('click', () => {
            selectedProduct = product;
            navigateTo('productDetails');
        });
        productsContainer.appendChild(productCard);
    });

    productsContainer.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = e.target.dataset.productId;
            handleAddToCart(productId);
        });
    });
};

function renderCategories() {
    categoriesContainer.innerHTML = '';
    if (categories.length === 0) {
        categoriesContainer.innerHTML = '<p class="col-span-full text-center text-gray-600 text-xl">No categories found.</p>';
        return;
    }
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 text-center cursor-pointer';
        categoryCard.innerHTML = `<h3 class="text-xl font-semibold text-gray-800">${category}</h3>`;
        categoryCard.onclick = () => {
            fetchProductsByCategory(category);
        };
        categoriesContainer.appendChild(categoryCard);
    });
}

const renderProductDetails = () => {
    productDetailsPage.innerHTML = `
        <div class="container mx-auto p-8 bg-white rounded-lg shadow-2xl my-8">
            <div class="flex flex-col md:flex-row gap-8">
                <div class="w-full md:w-1/2">
                    <img src="${selectedProduct.image}" alt="${selectedProduct.name}" class="w-full h-auto rounded-lg shadow-md">
                </div>
                <div class="w-full md:w-1/2">
                    <h2 class="text-5xl font-extrabold text-gray-900 mb-4">${selectedProduct.name}</h2>
                    <p class="text-green-600 text-4xl font-bold mb-6">$${selectedProduct.price.toFixed(2)}</p>
                    <p class="text-gray-700 text-lg leading-relaxed mb-6">${selectedProduct.description}</p>
                    <div class="flex items-center space-x-4 mb-6">
                        <span class="text-gray-500 font-semibold">Category:</span>
                        <span class="bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full">${selectedProduct.category}</span>
                    </div>
                    <button onclick="handleAddToCart('${selectedProduct._id}')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 text-lg">
                        Add to Cart
                    </button>
                    <button onclick="navigateTo('products')" class="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 text-lg">
                        Back to Products
                    </button>
                </div>
            </div>
        </div>
    `;
};

const renderCart = () => {
    cartContainer.innerHTML = '';
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="text-center text-gray-600 text-xl">Your cart is empty.</p>';
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const cartHtml = `
        <div class="flex flex-col lg:flex-row gap-8">
            <div class="flex-1 space-y-4">
                ${cart.map(item => `
                    <div class="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
                        <img src="${item.product.image}" alt="${item.product.name}" class="w-20 h-20 object-cover rounded-md">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold">${item.product.name}</h3>
                            <p class="text-gray-600">Quantity: ${item.quantity}</p>
                            <p class="text-gray-900 font-bold">$${(item.product.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <button onclick="handleDeleteFromCart('${item.product._id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition duration-300">
                            Remove
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="w-full lg:w-1/3 bg-white rounded-lg shadow-md p-6 h-fit">
                <h3 class="text-2xl font-bold mb-4 border-b pb-2">Order Summary</h3>
                <div class="flex justify-between items-center text-xl font-semibold mb-6">
                    <span>Total:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
                <button onclick="handleCheckout()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md transition duration-300 text-lg">
                    Proceed to Checkout
                </button>
            </div>
        </div>
    `;
    cartContainer.innerHTML = cartHtml;
};

const renderOrders = () => {
    ordersContainer.innerHTML = '';
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p class="text-center text-gray-600 text-xl">You have no past orders.</p>';
        return;
    }
    const ordersHtml = orders.map(order => `
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                    <h3 class="text-xl font-bold">Order #${order._id.slice(-6)}</h3>
                    <p class="text-sm text-gray-500">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span class="text-2xl font-bold text-gray-800">$${order.totalPrice.toFixed(2)}</span>
            </div>
            <div class="space-y-4">
                ${order.items.map(item => `
                    <div class="flex items-center space-x-4">
                        <img src="${item.product.image}" alt="${item.product.name}" class="w-16 h-16 object-cover rounded-md">
                        <div class="flex-1">
                            <p class="font-semibold">${item.product.name}</p>
                            <p class="text-gray-600 text-sm">Quantity: ${item.quantity}</p>
                        </div>
                        <p class="font-bold">$${item.product.price.toFixed(2)}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    ordersContainer.innerHTML = ordersHtml;
};

// --- Initialisation ---
const init = async () => {
    // Add event listeners for forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Initial data fetching
    await fetchProducts();
    await fetchCategories();
    await fetchCart();
    await fetchOrders();

    // Event listener for browser's back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.page) {
            navigateTo(event.state.page);
        } else {
            const path = window.location.pathname.substring(1) || 'products';
            navigateTo(path);
        }
    });

    // Event delegation for all internal navigation links
    document.body.addEventListener('click', (e) => {
        const targetLink = e.target.closest('a[href^="/"]');
        if (targetLink && targetLink.href && !targetLink.href.startsWith(window.location.origin + '#')) {
            e.preventDefault();
            const path = targetLink.pathname.substring(1) || 'products';
            navigateTo(path);
        }
    });

    // Initial page navigation based on the URL
    const initialPath = window.location.pathname.substring(1) || 'products';
    navigateTo(initialPath);
};

// Start the app when the window is fully loaded
window.addEventListener('load', init);