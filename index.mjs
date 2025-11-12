import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ========= КОНФИГУРАЦИЯ =========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOAD_DIR = path.join(__dirname, "download");
const LOG_FILE = path.join(__dirname, "wallpaper.log");
const IMAGES_DB = path.join(__dirname, "images-db.json");
const DOWNLOADED_TRACKER = path.join(__dirname, "downloaded.json");

const REPO_OWNER = "dharmx";
const REPO_NAME = "walls";
const BRANCH = "main";
const GITHUB_API_TOKEN = ""; // мы не превышаем число запросов 60 в час

// ========= ЛОГГИРОВАНИЕ =========
const log = async (message, isError = false) => {
  const timestamp = new Date().toISOString();
  const prefix = isError ? "[ERROR]" : "[INFO]";
  const logEntry = `${timestamp} ${prefix} ${message}\n`;
  try {
    await fs.appendFile(LOG_FILE, logEntry);
  } catch (e) {
    console.error("Log write failed:", e.message);
  }
};

// ========= ОСНОВНЫЕ ФУНКЦИИ =========
const fetchGitHubTree = async () => {
  const headers = { "User-Agent": "wallpaper-changer" };
  if (GITHUB_API_TOKEN) headers.Authorization = `Bearer ${GITHUB_API_TOKEN}`;

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API: ${res.status} ${await res.text()}`);
  return await res.json();
};

const buildImagesDB = async () => {
  await log("Building image database...");
  const { tree } = await fetchGitHubTree();
  const exts = [".jpg", ".jpeg", ".png", ".webp"];
  const images = tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
    .filter((p) => exts.includes(path.extname(p).toLowerCase()))
    .map((p) => ({
      url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${encodeURIComponent(p)}`,
      path: p,
    }));
  await fs.writeFile(IMAGES_DB, JSON.stringify(images, null, 2));
  await log(`Database built (${images.length} images)`);
  return images;
};

const downloadImage = async (url, filePath) => {
  await log(`Downloading: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(buf));
  await log(`Saved: ${filePath}`);
};

const setWallpaper = async (imgPath) => {
  await log(`Setting wallpaper: ${imgPath}`);
  await fs.access(imgPath);

  // ✅ Правильный импорт из библиотеки wallpaper
  const { setWallpaper: setWP } = await import("wallpaper");
  await setWP(imgPath, { scale: "fill" });

  await log("Wallpaper set successfully");
};

// ========= ГЛАВНАЯ ФУНКЦИЯ =========
const main = async () => {
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

  // Загрузка или создание БД
  let images;
  try {
    images = JSON.parse(await fs.readFile(IMAGES_DB, "utf8"));
  } catch {
    images = await buildImagesDB();
  }

  // Трекер скачанных
  let downloaded = [];
  try {
    downloaded = JSON.parse(await fs.readFile(DOWNLOADED_TRACKER, "utf8"));
  } catch {
    await fs.writeFile(DOWNLOADED_TRACKER, "[]");
  }

  // Выбор случайного
  const available = images.filter((img) => !downloaded.includes(img.url));
  const selected = available.length
    ? available[Math.floor(Math.random() * available.length)]
    : images[Math.floor(Math.random() * images.length)];

  const safeName = path
    .basename(selected.path)
    .replace(/[^a-z0-9.]/gi, "_")
    .toLowerCase();
  const localPath = path.join(DOWNLOAD_DIR, safeName);

  // Скачивание (если ещё не скачан)
  if (!downloaded.includes(selected.url)) {
    await downloadImage(selected.url, localPath);
    downloaded.push(selected.url);
    await fs.writeFile(DOWNLOADED_TRACKER, JSON.stringify(downloaded, null, 2));
  }

  // Установка обоев
  await setWallpaper(localPath);
};

// ========= ЗАПУСК =========
main().catch(async (err) => {
  await log(`FATAL: ${err.message}`, true);
  console.error(err);
  process.exit(1);
});
