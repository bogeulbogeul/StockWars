// Full-screen UI covers the world. Resume with a fresh clock on the next frame.
export function worldRenderVisible() {
    return !document.hidden && !document.body.classList.contains('title-screen-active')
        && !document.querySelector('.cozy-phone[open], .packing-game[open], .leaf-inventory[open], .first-day-animation[open], .recovery-drink-effect[open], .diary-book[open]');
}
