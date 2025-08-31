const express = require('express');
const app = express();
const comments = require('./models/comments');
const users = require('./models/users');
const posts = require('./models/posts');
const cors = require('cors');//allows front end to talk to back end
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const path = require('path');
const commentRoutes = require('./routes/comments');
const connectDB = require('./database/db.js');

require('dotenv').config();
const PORT = process.env.PORT || 3000;
connectDB();
app.use(cors());
app.use(express.json());
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use(express.urlencoded({ extended: true })); 

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});