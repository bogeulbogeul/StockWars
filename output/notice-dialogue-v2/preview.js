const panel = document.querySelector('.notice');
const reopen = document.querySelector('#reopen');
const next = document.querySelector('#next');
function closeNotice() {
  panel.hidden = true;
  reopen.hidden = false;
  reopen.focus();
}
next.addEventListener('click', closeNotice);
reopen.addEventListener('click', () => {
  panel.hidden = false;
  reopen.hidden = true;
  next.focus();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !panel.hidden) closeNotice();
});
