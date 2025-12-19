const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.map': 'application/json',
  '.db': 'application/octet-stream'
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  
  if (urlPath === '/') {
    urlPath = '/index.html';
  }
  
  let filePath = path.join(DIST_DIR, urlPath);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      serveFile(res, path.join(DIST_DIR, 'index.html'));
    } else {
      fs.stat(filePath, (err, stats) => {
        if (stats && stats.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
        serveFile(res, filePath);
      });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running at http://0.0.0.0:${PORT}`);
});
