const express = require('express');
const yts = require('yt-search');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Add CORS headers for API
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Home page
app.get('/', (req, res) => {
    res.render('index', { 
        results: null, 
        query: '',
        activePage: 'home'
    });
});

// API Docs
app.get('/docs', (req, res) => {
    res.render('index', { 
        results: null, 
        query: '',
        activePage: 'docs'
    });
});

// Web search (POST)
app.post('/search', async (req, res) => {
    const query = req.body.query;
    if (!query) return res.redirect('/');
    
    try {
        const result = await yts(query);
        res.render('index', { 
            results: result.videos.slice(0, 15), 
            query: query,
            activePage: 'home'
        });
    } catch (error) {
        res.render('index', { 
            results: null, 
            query: query, 
            error: 'Search failed. Please try again.',
            activePage: 'home'
        });
    }
});

// API - GET method
app.get('/api/search', async (req, res) => {
    const q = req.query.q;
    if (!q) {
        return res.status(400).json({ 
            success: false, 
            error: 'Please provide a search query. Example: /api/search?q=javascript',
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        });
    }
    
    try {
        const result = await yts(q);
        res.json({ 
            success: true, 
            query: q,
            count: result.videos.length,
            results: result.videos.slice(0, 20).map(v => ({
                id: v.videoId,
                title: v.title,
                url: v.url,
                duration: v.duration,
                views: v.views,
                author: v.author.name,
                thumbnail: v.thumbnail
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Search failed' });
    }
});

// API - POST method
app.post('/api/search', async (req, res) => {
    const { query, limit = 10 } = req.body;
    if (!query) {
        return res.status(400).json({ success: false, error: 'Please provide a query in the body' });
    }
    
    try {
        const result = await yts(query);
        res.json({ 
            success: true, 
            query: query,
            count: Math.min(result.videos.length, limit),
            results: result.videos.slice(0, limit).map(v => ({
                id: v.videoId,
                title: v.title,
                url: v.url,
                views: v.views,
                author: v.author.name
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Search failed' });
    }
});

// API - PUT method
app.put('/api/search', async (req, res) => {
    const { query, minViews = 0 } = req.body;
    if (!query) {
        return res.status(400).json({ success: false, error: 'Please provide a query' });
    }
    
    try {
        const result = await yts(query);
        let filtered = result.videos.filter(v => v.views >= minViews);
        res.json({ 
            success: true, 
            query: query,
            filters: { minViews },
            count: filtered.length,
            results: filtered.slice(0, 15).map(v => ({
                id: v.videoId,
                title: v.title,
                views: v.views,
                author: v.author.name
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Search failed' });
    }
});

// API - DELETE method
app.delete('/api/search', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Search history cleared (demo)', 
        timestamp: new Date().toISOString(),
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 AJ YT Search running on http://localhost:${PORT}`);
});

module.exports = app;