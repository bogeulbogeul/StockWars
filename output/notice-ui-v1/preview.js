const notice = document.querySelector('dialog');
const reopen = document.querySelector('#reopen');
reopen.addEventListener('click', () => notice.showModal());
document.querySelector('.close').addEventListener('click', () => notice.close());
document.querySelector('.confirm').addEventListener('click', () => notice.close());
notice.showModal();
