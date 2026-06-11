const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all static files from the /public directory
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all: send index.html for any unmatched route (SPA-friendly)
app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
    console.log(`✅  Server running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌  Port ${PORT} is already in use.`);
        console.error(`   → Stop the other process, or set a different port:`);
        console.error(`   → PORT=3001 npm run dev\n`);
        process.exit(1);
    } else {
        throw err;
    }
});
