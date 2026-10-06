import { ROOM_GRID, gridToScreen } from './IsometricRoomGrid.js';

// Wall thickness extends outside the playable floor. All horizontal edges use
// the floor projection, including the rail tops and exposed wall ends.
export function getVivianWallsHtml() {
    const size = ROOM_GRID.size, thickness = .22, height = 286;
    const point = ([u, v, z]) => {
        const p = gridToScreen(u, v);
        return `${p.x},${p.y-z}`;
    };
    const face = (vertices, fill, stroke = '#174752', width = 3) =>
        `<polygon points="${vertices.map(point).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
    const line = (a, b, color, width) =>
        `<path d="M${point(a)} L${point(b)}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
    const wall = (left) => {
        const at = (along, out, z) => left ? [-out, along, z] : [along, -out, z];
        const band = (bottom, top, color, out = 0) => face([
            at(0,out,bottom), at(size,out,bottom), at(size,out,top), at(0,out,top)
        ], color, color, 0);
        let html = face([at(0,0,0),at(size,0,0),at(size,0,height),at(0,0,height)], left ? '#fff3d9' : '#f4e5c8');
        for (let i=1; i<size; i++)
            html += line(at(i,0,18),at(i,0,height-24),'#c5b699',1.6);
        // Continuous gold stripe, with the same heights on both walls.
        html += band(79,97,'#ffbf13');
        html += band(94,97,'#ffdc63');
        html += band(0,18,'#176c75');
        html += line(at(0,0,18),at(size,0,18),'#459d9e',3);
        html += band(height-24,height,left ? '#227b84' : '#196772');
        html += line(at(0,0,height-24),at(size,0,height-24),'#174752',3);
        // Exposed end face: cream body with wrapped gold stripe and teal ends.
        const end = (bottom, top, color) => face([
            at(size,0,bottom),at(size,thickness,bottom),at(size,thickness,top),at(size,0,top)
        ],color);
        html += end(0,height,left ? '#e1d2b6' : '#d6c6a9');
        html += end(79,97,'#eaaa0b');
        html += end(0,22,'#176c75');
        html += end(height-24,height,'#1d7580');
        html += face([at(0,0,height),at(size,0,height),at(size,thickness,height),at(0,thickness,height)],left ? '#48b6b9' : '#369fa8');
        html += line(at(0,thickness,height),at(size,thickness,height),'#85d3cf',2);
        return html;
    };
    // A small corner cap fills the joint without rounding off the grid axes.
    const t=thickness;
    const corner = face([[0,0,height],[-t,0,height],[-t,-t,height],[0,-t,height]],'#51b8ba');
    return `<g class="vivian-room-walls">${wall(true)}${wall(false)}
        ${line([0,0,18],[0,0,height-24],'#c4b392',3)}${corner}</g>`;
}
