const express = require('express');
const connectDB = require('./config/db.js');
const path = require('path');
const app = express();
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cart');
require('dotenv').config();
const orderRoutes = require('./routes/order');
const cors = require('cors');
const PORT = process.env.PORT || 3000; // ✅ Fixed variable assignment

connectDB();

//Middleware to parse JSON
app.use(express.json());
// ✅ Add this line to enable CORS for all routes
app.use(cors());

//serve static files from public

app.use(express.static(path.join(__dirname, 'public')));

//test route

app.get('/hello', (req, res) => {

    res.send('Hello World from Express!');

});
app.use('/api/products', productRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// The catch-all route must be last
app.get('/', (req, res) => {
    // This serves your main HTML file for any route not found above
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, () => {

    console.log(`Server running at http://localhost:${PORT}`);
});
