const f=(e,a=!1,q=document)=>(!a?q.querySelector(e):q.querySelectorAll(e));

let current = 0;
let current_path = null;

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


const fav_list = [];

const fetch_fav_list = async () => {
    try {
        const response = await fetch("/fav");
        const books = await response.json();
        fav_list.length = 0;
        fav_list.push(...books);
        return books;
    } catch (error) {
        console.error("お気に入りリストの取得エラー:", error);
    }
};

const send_fav_list = async () => {
  if (fav_list.length == 0) return;
    try {
        await fetch("/upload_list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fav_list)
        });
    } catch (error) {
        console.error("お気に入りリストの送信エラー:", error);
    }
};

function fav() {
    if (!current_path || fav_list.includes(current_path)) return;

    fav_list.push(current_path);
    send_fav_list();

    const popup = document.createElement("div");
    popup.id = "popup";
    popup.textContent = `${current_path} をお気に入りに追加 👍`;

    popup.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        padding: 10px;
        background: rgba(184, 184, 184, 0.8);
        color: #fff;
        text-align: center;
        border-radius: 6px;
        border: 1px solid #fff;
        opacity: 0;
        transition: opacity 0.5s;
        z-index: 9999;
    `;

    document.body.appendChild(popup);
    fadeInOut(popup);
}

async function fadeInOut(element) {
    await delay(10);
    element.style.opacity = "1";
    await delay(1500);
    element.style.opacity = "0";
    await delay(500);
    element.remove();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener("DOMContentLoaded", fetch_fav_list);



function changePage(direction, ebook) {
  const p = ebook.page.length;
  current = direction === 'L' ? (current === 0 ? p - 1 : (current - 1) % p) : (current + 1) % p;
  current_path = ebook.page[current];
  console.log(ebook.page[current],p,current);
  const pagePath = `/books/${ebook.page[current]}`;
  f('#ebook-cover').src = pagePath;
  f('#page-number').textContent = `ページ ${current + 1} / ${p}`;
  setTimeout(() => resizeImage(), 10);
}

async function displayEbook(page) {
  const urlParts = window.location.pathname.split('/');
  const title = decodeURIComponent(urlParts[urlParts.length - 1]);
  try {
      const response = await fetch(`/books`);
      const books = await response.json();
      const ebook = books.find(book => book.title === title);
      if (ebook) {
        if (page) {
          console.log("page",page)
          f('#ebook-cover').src = `/books/${ebook.page[page]}`;
          current = page;
        } else {
          f('#ebook-cover').src = `/books/${ebook.cover}`;
        }
        current_path = f('#ebook-cover').src;
        f('#ebook-title').textContent = ebook.title;
        f('#next-page').addEventListener('click', () => changePage('R', ebook));
        f('#previous-page').addEventListener('click', () => changePage('L', ebook));
        document.querySelector("#ebook-cover").addEventListener("click", (event) => {
            const imgWidth = event.target.clientWidth;
            const clickX = event.clientX - event.target.getBoundingClientRect().left;
            if (clickX < imgWidth / 2) {
              changePage('R', ebook)
            } else {
              changePage('L', ebook)
            }
        });
        window.addEventListener("keydown", (k) => {
          if (k.key == "ArrowRight") changePage('R', ebook); else if (k.key == "ArrowLeft") changePage('L', ebook);
        });
      } else f('#ebook-title').textContent = "書籍が見つかりません";
  } catch (error) {
    console.error("書籍の取得エラー:", error);
  }
}


let currentPage = 1;
let totalPages = 1;
const booksPerPage = 10;
let currentSort = 'date';
let currentQuery = "",
    currentMode = "",
    currentExclude = "";
async function displayBooks() {
  const params = new URLSearchParams();

  params.append("page", currentPage);
  params.append("limit", booksPerPage);

  if (currentSort && currentSort !== "date") params.append("sort", currentSort);
  if (currentQuery) params.append("query", currentQuery);
  if (currentMode && currentMode !== "partial") params.append("mode", currentMode);
  if (currentExclude) params.append("exclude", currentExclude);

  const queryString = params.toString();
  const url = `/books/paginated?${queryString}`;

  console.log(`Fetching: ${url}`);
  try {
    const response = await fetch(url);
    const { books, totalPages: total } = await response.json();
    totalPages = total;

    const container = f("#books-container");
    container.innerHTML = "";

    books.forEach((book) => {
      const bookElement = document.createElement("div");
      bookElement.innerHTML = `
      <span style="display:flex;"><h2>${book.title}</h2>
      <p>${book.page.length}p</p></span>
      <img src="/books/${encodeURIComponent(book.cover)}" alt="${book.title}の表紙" width="150"><br>
      <button onclick="location.href='/read/${book.title}'">読む</button>`;
      container.appendChild(bookElement);
    });

    updatePaginationControls();
  } catch (error) {
    console.error("書籍一覧の取得エラー:", error);
  }
}
  
function addSearchControls() {
  const searchContainer = document.createElement('div');
  searchContainer.id = "searchContainer";
  searchContainer.innerHTML = `
  <label for="search">検索: </label>
  <input type="text" id="search" placeholder="タイトル検索">
  <label for="mode">モード: </label>
  <select id="mode">
      <option value="partial">部分一致</option>
      <option value="exact">完全一致</option>
  </select>
  <label for="exclude">除外ワード: </label>
  <input type="text" id="exclude" placeholder="除外ワード（スペース区切り）">
  <button id="search-btn">検索</button>
  `;
  f('#books-container').before(searchContainer);
  f('#search-btn').addEventListener('click', () => {
      currentQuery = f('#search').value.trim() || ""; 
      currentMode = f('#mode').value;
      currentExclude = f('#exclude').value.trim() || "";
      currentPage = 1;
      displayBooks();
  });
}
function updatePaginationControls() {
  const controls = f('#pagination-controls', true);
  for (let i = 0; i < controls.length; i++) {
      controls[i].innerHTML = `
      <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>前のページ</button>
      <span>ページ ${currentPage} / ${totalPages}</span>
      <button id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>次のページ</button>
      `;

      f('#prev-page', true)[i].addEventListener('click', () => {
          if (currentPage > 1) {
              currentPage--;
              displayBooks();
          }
      });

      f('#next-page', true)[i].addEventListener('click', () => {
          if (currentPage < totalPages) {
              currentPage++;
              displayBooks();
          }
      });
  }
}
function addSortControls() {
  const sortContainer = document.createElement('div');
  sortContainer.id = "sortContainer";
  sortContainer.innerHTML = `
  <label for="sort">並び替え: </label>
  <select id="sort">
      <option value="date-desc">作成日（新しい順）</option>
      <option value="date-asc">作成日（古い順）</option>
      <option value="title">タイトル順</option>
      <option value="pages-asc">ページ数（少ない順）</option>
      <option value="pages-desc">ページ数（多い順）</option>
  </select>
  `;

  f('#books-container').before(sortContainer);
  f('#sort').addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      displayBooks();
  });
}


document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/menu') {
      addSearchControls(); 
      addSortControls();  
      displayBooks();
      setting();
      const controlsContainer = document.createElement('div');
      controlsContainer.id = 'pagination-controls';
      f('#books-container').after(controlsContainer);
  }
  else if (window.location.pathname.startsWith('/read/')) {
    const Params = new URLSearchParams(window.location.search);
    if (!Params.size == 0) {
      const page = Number(Params.get("p"));
      console.log(page);
      displayEbook(page);

    } else {
      displayEbook();
    }

    setInterval(resizeImage, 30);
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

const Container = document.querySelector("#books-container");
function resizeWindow() {
  if (!Container) return;
  const w = innerWidth;
  if (w < 768)  Container.ariaLabel = 'mobile-container'; else if (w >= 768 && w < 1024) Container.ariaLabel = 'tablet-container'; else Container.ariaLabel = 'desktop-container';
  
}
resizeWindow();
window.addEventListener("resize", resizeWindow)
