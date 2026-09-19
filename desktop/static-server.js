const fs = require("fs");
const http = require("http");
const path = require("path");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function mimeOf(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeOf(filePath) });
    res.end(data);
  });
}

function createStaticServer(rootDir) {
  const root = path.resolve(rootDir);

  const handler = (req, res) => {
    const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    let filePath = path.normalize(path.join(root, pathname));

    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (statErr, stat) => {
      if (statErr) {
        if (!statErr.code || statErr.code !== "ENOENT") {
          res.writeHead(500);
          res.end("Internal Server Error");
          return;
        }
        const looksLikeAsset = /\.[a-zA-Z0-9]{1,10}$/.test(pathname.toLowerCase());
        if (!looksLikeAsset && req.method === "GET") {
          serveFile(res, path.join(root, "index.html"));
          return;
        }
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      if (stat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
      serveFile(res, filePath);
    });
  };

  return {
    listen() {
      return new Promise((resolve, reject) => {
        const server = http.createServer(handler);
        server.on("error", reject);
        server.listen(0, "127.0.0.1", () => {
          resolve({ server, port: server.address().port });
        });
      });
    },
  };
}

module.exports = { createStaticServer };