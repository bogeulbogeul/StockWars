// The floor and check-grid share the exact same source projection and transform.
export function cipherAlignedFloor() {
    let tiles = '';
    const point = (u,v) => `${783+44*(u-v)},${284+22*(u+v)}`;
    // Extend beyond logical bounds only to cover the illustration's perimeter.
    for(let u=-1;u<18;u++) for(let v=-1;v<18;v++) {
        tiles += `<polygon points="${point(u,v)} ${point(u+1,v)} ${point(u+1,v+1)} ${point(u,v+1)}" fill="${(u+v)%2 ? '#eddfc5':'#fff1da'}" stroke="#d5c5aa" stroke-width="1"/>`;
    }
    return `<defs><clipPath id="cipher-aligned-floor-clip"><path d="M778 273 L933 350 L972 385 L1020 409 L1020 504 L1114 565 L1161 539 L1191 550 L1245 524 L1269 544 L1305 553 L1346 575 L1432 615 L1480 641 L1243 773 L1243 671 L1220 667 L1071 755 L1071 862 L810 995 L733 995 L73 640 Z"/></clipPath></defs>
        <g clip-path="url(#cipher-aligned-floor-clip)"><g transform="scale(0.9879211697 1.012)">${tiles}</g></g>`;
}
