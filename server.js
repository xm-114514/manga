require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const env = process.env;
const port = env.PORT || 3000;
const localhost = '127.0.0.1';
const IP = env.IPv4 || localhost;
let isAuthenticated = false;
let authenticatedIP = null;

const ebooksPath = path.join(__dirname, 'books', 'ebooks.json');
const ebooks = JSON.parse(fs.readFileSync(ebooksPath, 'utf8'));
app.use(express.static(path.join(__dirname, 'public')));

function authMiddleware(req, res, next) {
  const clientIP = req.ip;
  if (isAuthenticated && clientIP === authenticatedIP) {
    next();
  } else {
    res.status(401).sendFile(path.join(__dirname, 'public', '401.html'));
  }
}

app.use(bodyParser.json());
app.use('/books', authMiddleware, express.static(path.join(__dirname, 'books')));

app.post('/password', (req, res) => {
  const { password } = req.body;
  const correctPassword = env.password || 'qwerty';
  if (password === correctPassword) {
    isAuthenticated = true;
    authenticatedIP = req.ip;
    res.status(200).send('OK');
  } else {
    res.status(401).json({ redirect: '/' });
  }
});

app.get('/menu', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});
app.get('/books', authMiddleware, (req, res) => {
  res.json(ebooks);
});

app.get('/books/paginated', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sortType = req.query.sort || 'date-desc';
  const searchQuery = req.query.query ? req.query.query.trim() : '';
  const searchMode = req.query.mode || 'partial'
  const excludeWords = req.query.exclude ? req.query.exclude.trim().split(/\s+/) : [];

  let filteredEbooks = [...ebooks];

  if (searchQuery) {
      filteredEbooks = filteredEbooks.filter(book => {
          const targetText = `${book.title} | ${book.caption}`;
          if (searchMode === 'exact') {
              return targetText === searchQuery;
          } else {
              return targetText.includes(searchQuery);
          }
      });
  }
  if (excludeWords.length > 0) {
      filteredEbooks = filteredEbooks.filter(book => {
          const targetText = `${book.title} | ${book.caption}`;
          return !excludeWords.some(word => targetText.includes(word));
      });
  }

  switch (sortType) {
      case 'title':
          filteredEbooks.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
          break;
      case 'pages-asc':
          filteredEbooks.sort((a, b) => a.page.length - b.page.length);
          break;
      case 'pages-desc':
          filteredEbooks.sort((a, b) => b.page.length - a.page.length);
          break;
      case 'date-asc':
          filteredEbooks.sort((a, b) => {
              const aTime = fs.statSync(path.join(__dirname, 'books', a.title)).birthtimeMs;
              const bTime = fs.statSync(path.join(__dirname, 'books', b.title)).birthtimeMs;
              return aTime - bTime;
          });
          break;
      case 'date-desc':
      default:
          filteredEbooks.sort((a, b) => {
              const aTime = fs.statSync(path.join(__dirname, 'books', a.title)).birthtimeMs;
              const bTime = fs.statSync(path.join(__dirname, 'books', b.title)).birthtimeMs;
              return bTime - aTime;
          });
          break;
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedBooks = filteredEbooks.slice(startIndex, endIndex);

  res.json({
      page,
      limit,
      totalBooks: filteredEbooks.length,
      totalPages: Math.ceil(filteredEbooks.length / limit),
      books: paginatedBooks,
  });
});




app.get('/read/:title', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ebook.html'));
});

app.get('/books/:title/cover', authMiddleware, (req, res) => {
  const title = req.params.title;
  const ebook = ebooks.find(book => book.title === title);
  if (ebook) {
    res.sendFile(path.join(__dirname, ebook.cover));
  } else {
    res.status(404).send('Cover not found');
  }
});
app.get('/books/paginated', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedBooks = ebooks.slice(startIndex, endIndex);
  const totalBooks = ebooks.length;
  res.json({
    page,
    limit,
    totalBooks,
    totalPages: Math.ceil(totalBooks / limit),
    books: paginatedBooks,
  });
});

const favoritesPath = path.join(__dirname, 'favorites.json');

app.get('/fav', (req, res) => {
    try {
        if (!fs.existsSync(favoritesPath)) {
            return res.json([]); 
        }
        const favorites = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
        res.json(favorites);
    } catch (error) {
        console.error("お気に入りリストの取得エラー:", error);
        res.json([]);
    }
});

app.post('/upload_list', (req, res) => {
    try {
        const favList = req.body;
        if (!Array.isArray(favList)) {
            return res.status(400).json({ error: "無効なデータ形式" });
        }
        fs.writeFileSync(favoritesPath, JSON.stringify(favList, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error("お気に入りリストの保存エラー:", error);
        res.status(500).json({ error: "サーバーエラー" });
    }
});

app.get('/stop', () => process.exit());
app.listen(port, IP, () => console.log(`http://${IP}:${port}`));
