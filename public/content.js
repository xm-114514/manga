const
  main = document.querySelector(".main"),
  background = document.querySelector(".background"),
  menu = document.querySelector(".menu"),
  savedDarkMode = localStorage.getItem('darkMode');

window.onload = function () {
  savedDarkMode === 'true' && toggleDarkMode();
};
function toggleDarkMode() {
  main.classList.toggle('dark');
  const isDarkMode = main.classList.contains('dark');
  localStorage.setItem('darkMode', isDarkMode);
};
function menu_toggle() {
  menu.classList.toggle("open");
};
function footer_remove() {
  background.classList.toggle("remove");
  input.classList.toggle("display_none");
};

