const express = require("express");
const router = express.Router();
const Post = require("../models/posts");
const Comment = require("../models/comments");
const auth = require("../middleware/auth");

// POST /posts - Create a new post, now with secure authentication
router.post("/", auth, async (req, res) => {
    console.log('== create post request==');
    console.log('Request body:', req.body);
    console.log('Authenticated User ID:', req.user.id);
    console.log('Request headers:', req.headers);

    try {
        const { content, title, image } = req.body;
        const userId = req.user.id; //comes from auth

        console.log('Extracted fields:', { content, userId, title, image });

        if (!content || content.trim() === '') {
            console.log('Validation failed: Content is missing or empty');
            return res.status(400).json({
                success: false,
                message: "Content is required and cannot be empty"
            });
        }

        console.log('User authenticated and id retrieved from token:', userId);

        const postData = {
            content: content.trim(),
            user: userId,
            likes: [],
            comments: [],
            title: title ? title.trim() : null,
            image: image ? image.trim() : null,
        };

       

        console.log('Creating post with data:', postData);

        const post = new Post(postData); 

        console.log('Post model created, saving...');
        await post.save();

        console.log('Post saved successfully with ID:', post._id);

        await post.populate("user", "username email");

        console.log('Post populated with user data');

        const response = {
            success: true,
            message: "Post created successfully",
            post: {
                id: post._id,
                title: post.title || null,
                content: post.content,
                image: post.image || null,
                user: {
                    id: post.user._id,
                    username: post.user.username
                },
                likes: post.likes,
                likesCount: post.likes.length,
                commentsCount: post.comments.length,
                date: post.date
            }
        };

        console.log('Sending response:', response);
        res.status(201).json(response);

    } catch (err) {
        console.error('Create post error:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);

        if (err.name === 'ValidationError') {
            console.log('Mongoose validation errors:', err.errors);
            const errors = Object.values(err.errors).map(error => error.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
                details: err.errors
            });
        }

        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid ID format provided"
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error while creating post",
            error: err.message
        });
    }
});

// GET /posts - Get all posts with better error handling
router.get("/", async (req, res) => {
    console.log('== get post request==');

    try {
        console.log('Fetching posts from database...');
        const {userId} = req.query;
        const filter = {};
        if (userId) {
            filter.user = userId; // Only posts by this user
        }

        const posts = await Post.find(filter)
            .populate("user", "username email")
            .populate({
                path: "comments",
                populate: { path: "user", select: "username" }
            })
            .sort({ date: -1 });

        console.log(`✅ Found ${posts.length} posts in database`);

        if (!posts) {
            console.log('Posts query returned null/undefined');
            return res.json({
                success: false,
                message: "No posts found",
                count: 0,
                posts: []
            });
        }

        // Ensure posts is an array
        const postsArray = Array.isArray(posts) ? posts : [];
        console.log(`Posts is array: ${Array.isArray(postsArray)}`);

        // Format posts for frontend
        const formattedPosts = postsArray.map(post => {
            console.log('Formatting post:', post._id);
            return {
                id: post._id,
                title: post.title || null,
                content: post.content,
                image: post.image || null,
                user: {
                    id: post.user._id,
                    username: post.user.username
                },
                likes: post.likes || [],
                likesCount: (post.likes || []).length,
                comments: post.comments || [],
                commentsCount: (post.comments || []).length,
                date: post.date
            };
        });

        const response = {
            success: true,
            message: "Posts retrieved successfully",
            count: formattedPosts.length,
            posts: formattedPosts
        };

        console.log(`✅ Sending ${formattedPosts.length} formatted posts`);
        res.json(response);

    } catch (err) {
        console.error('❌ GET POSTS ERROR:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);

        res.status(500).json({
            success: false,
            message: "Error fetching posts",
            error: err.message,
            posts: [] // Always send an empty array as fallback
        });
    }
});

// GET /posts/:id - Get single post
router.get("/:id", async (req, res) => {
    console.log('=== GET SINGLE POST REQUEST ===');
    console.log('Post ID:', req.params.id);

    try {
        const post = await Post.findById(req.params.id)
            .populate("user", "username email")
            .populate({
                path: "comments",
                populate: {
                    path: "user",
                    select: "username"
                }
            });

        if (!post) {
            console.log('❌ Post not found');
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        console.log('✅ Post found:', post._id);

        const response = {
            success: true,
            post: {
                id: post._id,
                title: post.title || null,
                content: post.content,
                image: post.image || null,
                user: {
                    id: post.user._id,
                    username: post.user.username
                },
                likes: post.likes || [],
                likesCount: (post.likes || []).length,
                comments: post.comments || [],
                commentsCount: (post.comments || []).length,
                date: post.date
            }
        };

        res.json(response);

    } catch (err) {
        console.error('GET SINGLE POST ERROR:', err);

        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid post ID format"
            });
        }

        res.status(500).json({
            success: false,
            message: "Error fetching post",
            error: err.message
        });
    }
});

// New route to like/unlike a post. 
// This is a POST request to update the likes array.
router.post("/:id/like", auth, async (req, res) => {
    console.log('=== LIKE POST REQUEST ===');
    console.log('Post ID:', req.params.id);
    console.log('Authenticated User ID:', req.user.id);

    try {
        const postId = req.params.id;
        const userId = req.user.id; // Get user ID from authenticated token

        // Find the post by its ID
        const post = await Post.findById(postId);

        if (!post) {
            console.log('❌ Post not found');
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        // Check if the user has already liked the post
        const hasLiked = post.likes.includes(userId);

        if (hasLiked) {
            // Unlike the post: remove user's ID from the likes array
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
            console.log('✅ Post unliked by user:', userId);
        } else {
            // Like the post: add user's ID to the likes array
            post.likes.push(userId);
            console.log('✅ Post liked by user:', userId);
        }

        // Save the updated post
        await post.save();

        // Send back the updated post data
        res.json({
            success: true,
            message: hasLiked ? "Post unliked successfully" : "Post liked successfully",
            likesCount: post.likes.length
        });

    } catch (err) {
        console.error('❌ LIKE POST ERROR:', err);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid post ID format" });
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;