import {cipherGridToScreen} from './CipherGrid.js';
import {generatedSofa} from './CipherSofaGeneratedImage.js';

// Use the generated illustration at uniform scale; no shear or face reconstruction.
const silhouette='M282 534 Q282 514 298 508 L353 478 L374 487 L374 441 Q374 422 390 413 L648 276 Q668 265 682 271 L699 256 L962 111 Q976 102 990 109 L1014 122 Q1030 130 1036 162 L1039 178 L1277 307 Q1290 317 1290 333 L1290 551 Q1290 566 1278 571 L1277 599 L1236 619 L1208 605 L1208 599 L586 916 L586 933 L546 952 L519 937 L518 918 L340 806 L318 816 L288 800 L288 771 L282 762 Z';
export function sofaAsset(item){
    const scale=131.2/(1236-546);
    const front=cipherGridToScreen(item.u+1,item.v+2);
    const r={x:front.x-546*scale,y:front.y-952*scale,w:1536*scale,h:1024*scale};
    return {r,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${r.w}" height="${r.h}" viewBox="0 0 1536 1024"><defs><clipPath id="sofa"><path d="${silhouette}"/></clipPath></defs><image href="${generatedSofa}" width="1536" height="1024" clip-path="url(#sofa)"/></svg>`};
}
