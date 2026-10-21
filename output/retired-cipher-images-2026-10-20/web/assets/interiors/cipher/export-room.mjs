import { writeFileSync } from 'node:fs';
import { cipherRoomArtwork } from '../../../js/components/CipherRoomArtwork.js';
writeFileSync(new URL('./cipher-lobby-shell-grid.svg', import.meta.url),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1573 1000">' + cipherRoomArtwork() + '</svg>');
