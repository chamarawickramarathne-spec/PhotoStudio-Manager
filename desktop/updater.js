const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");
const { spawn } = require("child_process");

const USER_AGENT = "PhotoStudioManager-Desktop";
const MAX_REDIRECTS = 5;
const INSTALLER_PREFIX = "PhotoStudioManager-Setup";

function archLabel() {
  if (process.arch === "ia32") return "x86";
  if (process.arch === "x64") return "x64";
  return process.arch;
}

function getInstallerName() {
  return `${INSTALLER_PREFIX}-${archLabel()}.exe`;
}

function parseVersion(input) {
  const match = String(input || "")
    .trim()
    .replace(/^v/i, "")
    .match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  }
  return 0;
}

function httpError(status, message) {
  const err = new Error(`${message} (HTTP ${status})`);
  err.status = status;
  return err;
}

function httpsGetJson(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = https.request(
      { hostname: target.hostname, path: target.pathname + target.search, method: "GET", headers: { "User-Agent": USER_AGENT, Accept: "application/vnd.github+json" } },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          if (redirects >= MAX_REDIRECTS) {
            reject(new Error("Too many redirects"));
            return;
          }
          httpsGetJson(new URL(res.headers.location, url).href, redirects + 1).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(httpError(res.statusCode, "Unexpected response from release server"));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error("Invalid JSON from release server"));
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const follow = (href, redirects) => {
      const target = new URL(href);
      const req = https.request(
        { hostname: target.hostname, path: target.pathname + target.search, method: "GET", headers: { "User-Agent": USER_AGENT } },
        (res) => {
          if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
            res.resume();
            if (redirects >= MAX_REDIRECTS) {
              reject(new Error("Too many redirects while downloading installer"));
              return;
            }
            follow(new URL(res.headers.location, href).href, redirects + 1);
            return;
          }
          if (res.statusCode !== 200) {
            res.resume();
            reject(httpError(res.statusCode, "Failed to download file"));
            return;
          }
          const file = fs.createWriteStream(destPath);
          file.on("error", reject);
          res.on("error", reject);
          res.pipe(file);
          const total = Number(res.headers["content-length"]) || 0;
          let received = 0;
          let lastPct = -1;
          res.on("data", (chunk) => {
            received += chunk.length;
            if (total > 0) {
              const pct = Math.floor((received / total) * 100);
              if (pct !== lastPct) {
                lastPct = pct;
                if (onProgress) onProgress(pct);
              }
            }
          });
          file.on("close", () => resolve({ size: received }));
        },
      );
      req.on("error", reject);
      req.end();
    };
    follow(url, 0);
  });
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function createUpdater({ repo, currentVersion }) {
  const check = async () => {
    if (!repo) return { status: "disabled", currentVersion };

    let release;
    try {
      release = await httpsGetJson(`https://api.github.com/repos/${repo}/releases/latest`);
    } catch (err) {
      return {
        status: "error",
        message: err.status === 404 ? "No releases found for this project." : err.message,
      };
    }

    const latestVersion = String(release.tag_name || "").replace(/^v/i, "");
    const cmp = compareVersions(latestVersion, currentVersion);
    if (cmp === null) {
      return { status: "error", message: `Unparseable release version: ${release.tag_name}` };
    }
    if (cmp <= 0) return { status: "up-to-date", currentVersion };

    const installerName = getInstallerName();
    const asset = (release.assets || []).find((item) => item.name === installerName);
    const checksum = (release.assets || []).find((item) => item.name === `${installerName}.sha256`);

    if (!asset) {
      return {
        status: "installer-missing",
        latestVersion,
        message: `Release is missing ${installerName}.`,
      };
    }
    if (!checksum) {
      return {
        status: "integrity-unavailable",
        latestVersion,
        message: "Release has no .sha256 checksum; update refused.",
      };
    }

    return {
      status: "update-available",
      currentVersion,
      latestVersion,
      downloadUrl: asset.browser_download_url,
      checksumUrl: checksum.browser_download_url,
      size: asset.size,
    };
  };

  const download = async (result, downloadDir) => {
    await fs.promises.mkdir(downloadDir, { recursive: true });
    const installerPath = path.join(downloadDir, getInstallerName());
    const checksumPath = `${installerPath}.sha256`;

    await fs.promises.rm(installerPath, { force: true });
    await downloadFile(result.checksumUrl, checksumPath);
    await downloadFile(result.downloadUrl, installerPath);

    const expected = (await fs.promises.readFile(checksumPath, "utf8")).trim().split(/\s+/)[0];
    const actual = await sha256File(installerPath);
    if (expected.toLowerCase() !== actual.toLowerCase()) {
      await fs.promises.rm(installerPath, { force: true });
      return { status: "integrity-mismatch", message: "Installer failed SHA-256 verification." };
    }
    return { status: "downloaded", installerPath };
  };

  const apply = (installerPath) =>
    spawn(installerPath, ["/S"], { detached: true, stdio: "ignore", windowsHide: true });

  return { check, download, apply };
}

module.exports = { createUpdater, getInstallerName, archLabel, compareVersions, parseVersion };