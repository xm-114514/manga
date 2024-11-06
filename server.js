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
    res.status(401).send('Unauthorized');
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
    res.status(401).send('Unauthorized');
  }
});

app.get('/menu', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'menu.html'));  // menu.htmlを返す
});

// 書籍データを取得するエンドポイント
app.get('/books', authMiddleware, (req, res) => {
  res.json(ebooks);  // 書籍リストをJSONで返す
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


app.get('/stop', () => process.exit());

app.listen(port, IP, () => console.log(`http://${IP}:${port}`));
