const f=(e,a=!1,q=document)=>(!a?q.querySelector(e):q.querySelectorAll(e));

let current = 0;

function setting() {
  const { innerHeight: h, innerWidth: w } = window;
  const ctx = document.querySelector('#books-container');
  Object.assign(ctx.style, w > h ? { width: '90vw', margin: '0 auto' } : { width: '', margin: '' });
}

function resizeImage () {
  const img = document.querySelector("#ebook-cover");
  const h = innerHeight, w = innerWidth;
  const aspect = img.naturalWidth / img.naturalHeight;
  const [width, height] = (w > h)
   ? [`${Math.round(h * aspect * 0.8)}px`, `${Math.round(h * 0.8)}px`]
   : [`${Math.round(w * 0.8)}px`, `${Math.round(w / aspect * 0.8)}px`];
  Object.assign(img.style, { width, height });
};

function changePage(direction, ebook) {
  const p = ebook.page.length;
  current = direction === 'L' ? (current === 0 ? p - 1 : (current - 1) % p) : (current + 1) % p;
  console.log(ebook.page[current],p,current)
  const pagePath = `/books/${ebook.page[current]}`;
  f('#ebook-cover').src = pagePath;
  f('#page-number').textContent = `ページ ${current + 1} / ${p}`;
  resizeImage();
}

async function displayEbook() {
  const urlParts = window.location.pathname.split('/');
  const title = decodeURIComponent(urlParts[urlParts.length - 1]);
  try {
      const response = await fetch(`/books`);
      const books = await response.json();
      const ebook = books.find(book => book.title === title);
      if (ebook) {
          f('#ebook-title').textContent = ebook.title;
          f('#ebook-cover').src = `/books/${ebook.cover}`;
          f('#next-page').addEventListener('click', () => changePage('R', ebook));
          f('#previous-page').addEventListener('click', () => changePage('L', ebook));
          window.addEventListener("keydown", (k) => {
            if (k.key == "ArrowRight") changePage('R', ebook); else if (k.key == "ArrowLeft") changePage('L', ebook);
          });
      } else f('#ebook-title').textContent = "書籍が見つかりません";
  } catch (error) {
    console.error("書籍の取得エラー:", error);
  }
}

async function displayBooks() {
  try {
      const response = await fetch('/books');
      const books = await response.json();
      const container = f('#books-container');
      books.forEach(book => {
          const bookElement = document.createElement('div');
          bookElement.innerHTML = `
          <span style="display:flex;"><h2>${book.title}</h2>
          <p>${book.page.length}p</p></span>
          <img #canvas src="/books/${encodeURIComponent(book.cover)}" alt="${book.title}の表紙" width="150"><br>
          <button onclick="location.href='/read/${book.title}'">読む</button>`;
          container.appendChild(bookElement);
      });
  } catch (error) {
      console.error("書籍一覧の取得エラー:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/menu') {
    displayBooks();
    setting();
  } else if (window.location.pathname.startsWith('/read/')) {
    displayEbook();
    setInterval(resizeImage,100);
  } else {

    let miss_count = 0;
    const submitButton = f("#submit-button");
    const passwordInput = f("#password-input");
    const passwordArea = f("#password-area");
    const contentArea = f("#content-area");

    submitButton.addEventListener("click", async function () {
      const enteredPassword = passwordInput.value;

      try {
        const response = await fetch('/password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: enteredPassword })
        });
        if (response.ok) {
          passwordArea.classList.add('display_none');
          contentArea.classList.remove('display_none');
          location.href = "/menu";
        } else {
          miss_count++;
          alert("パスワードが間違っています");

          if (miss_count >= 2) {
            alert("アクセスが拒否されました");
            location.reload();
          }
        }
      } catch (e) {
        console.error(`エラー: ${e.message}`);
      }
    });
  }
});
