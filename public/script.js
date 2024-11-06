async function displayEbook() {
  const urlParts = window.location.pathname.split('/');
  const title = decodeURIComponent(urlParts[urlParts.length - 1]);
  let currentPage = 0;
  try {
      const response = await fetch(`/books`);
      const books = await response.json();
      const ebook = books.find(book => book.title === title);

      if (ebook) {
          document.getElementById('ebook-title').textContent = ebook.title;
          document.getElementById('ebook-caption').textContent = ebook.caption;
          document.getElementById('ebook-cover').src = `/books/${ebook.cover}`;
          function changePage(direction, ebook) {
            const pageCount = ebook.page.length;
            currentPage = direction === 'L'
                ? (currentPage === 0 ? pageCount - 1 : (currentPage - 1) % pageCount)
                : (currentPage + 1) % pageCount;

            console.log(ebook.page[currentPage],pageCount,currentPage)
            const pagePath = `/books/${ebook.page[currentPage]}`;
            document.getElementById('ebook-cover').src = pagePath;
            document.getElementById('page-number').textContent = `ページ ${currentPage + 1} / ${pageCount}`;
          }

          document.getElementById('next-page').addEventListener('click', () => changePage('R', ebook));
          document.getElementById('previous-page').addEventListener('click', () => changePage('L', ebook));
          window.addEventListener("keydown", (k) => {
            console.log(k.key);
            if (k.key == "ArrowRight") {
              changePage('R', ebook);
            } else if (k.key == "ArrowLeft") {
              changePage('L', ebook);
            };
          });
      } else {
          document.getElementById('ebook-title').textContent = "書籍が見つかりません";
      }
  } catch (error) {
      console.error("書籍の取得エラー:", error);
  }
}

async function displayBooks() {
  try {
      const response = await fetch('/books');
      const books = await response.json();
      const container = document.getElementById('books-container');

      books.forEach(book => {
          const bookElement = document.createElement('div');
          bookElement.innerHTML = `
          <h2>${book.title}</h2>
          <p>${book.caption} (${book.page.length})</p>
          <img #canvas src="/books/${encodeURIComponent(book.cover)}" alt="${book.title}の表紙" width="150">
          <br>
          <button onclick="location.href='/read/${book.title}'">読む</button>
      `;
          container.appendChild(bookElement);
      });
  } catch (error) {
      console.error("書籍一覧の取得エラー:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/menu') {
    displayBooks();
  } else if (window.location.pathname.startsWith('/read/')) {
    displayEbook();
    const img = document.querySelector("#ebook-cover");
    img.style.maxWidth = "80%";
    const resizeImage = () => {
      const h = innerHeight, w = innerWidth;
      const aspect = img.naturalWidth / img.naturalHeight;
      if (w > h) {
        img.style.width = `${Math.round(h * aspect * 0.8)}px`;
        img.style.height = `${Math.round(h * 0.8)}px`;
      } else {
        img.style.width = `${Math.round(w * 0.8)}px`;
        img.style.height = `${Math.round(w / aspect * 0.8)}px`;
      }
    };
    setTimeout(resizeImage,50);
    window.addEventListener("resize", resizeImage);

  } else {

    let miss_count = 0;
    const submitButton = document.getElementById("submit-button");
    const passwordInput = document.getElementById("password-input");
    const passwordArea = document.getElementById("password-area");
    const contentArea = document.getElementById("content-area");

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
          location.href = "/menu"
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
