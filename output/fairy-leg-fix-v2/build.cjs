const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const previous = path.resolve(__dirname, '../fairy-body-narrow-v1');
const manifest = JSON.parse(fs.readFileSync(path.join(previous, 'validation.json')));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const reports = [];
for (const entry of manifest) {
    const source = fs.readFileSync(path.join(previous, entry.output));
    const size = source.readUInt32LE(12);
    const json = JSON.parse(source.toString('utf8', 20, size + 20));
    const binary = Buffer.from(source.subarray(size + 28));
    const original = Buffer.from(binary);
    const changes = new Set();
    const vector = index => {
        const a = json.accessors[index], view = json.bufferViews[a.bufferView];
        if (a.componentType !== 5126 || a.type !== 'VEC3') throw Error('Unexpected vector');
        return { a, offset: (view.byteOffset || 0) + (a.byteOffset || 0), stride: view.byteStride || 12 };
    };
    const get = (v, i) => [0, 1, 2].map(k => original.readFloatLE(v.offset + i * v.stride + k * 4));
    function put(v, i, values) {
        values.forEach((n, k) => {
            const at = v.offset + i * v.stride + k * 4;
            binary.writeFloatLE(n, at);
            for (let j = 0; j < 4; j++) changes.add(at + j);
        });
    }
    let changed = 0, fixedHead = 0, fixedFeet = 0;
    for (const node of json.nodes) {
        if (node.name !== 'Somangi_Body' || node.mesh === undefined) continue;
        for (const primitive of json.meshes[node.mesh].primitives) {
            const pos = vector(primitive.attributes.POSITION);
            const normal = vector(primitive.attributes.NORMAL);
            const floor = pos.a.min[1];
            for (let i = 0; i < pos.a.count; i++) {
                const [x, y, z] = get(pos, i), h = y - floor;
                if (h >= .6) { fixedHead++; continue; }
                if (h <= .11) { fixedFeet++; continue; }
                const u = Math.max(0, Math.min(1, (h - .11) / .22));
                const t = u * u * (3 - 2 * u);
                const dt = u > 0 && u < 1 ? 6 * u * (1 - u) / .22 : 0;
                const a = 1 - .20 * t;
                put(pos, i, [x * a, y + .16 * t, z * a]);
                const [nx, ny, nz] = get(normal, i);
                const n = [nx / a, (ny + .20 * x * dt * nx / a + .20 * z * dt * nz / a) / (1 + .16 * dt), nz / a];
                const length = Math.hypot(...n);
                put(normal, i, n.map(v => v / length));
                changed++;
            }
            // Update bounds for the complete accessor, including the unchanged head.
            const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
            for (let i = 0; i < pos.a.count; i++) for (let k = 0; k < 3; k++) {
                const v = binary.readFloatLE(pos.offset + i * pos.stride + k * 4);
                min[k] = Math.min(min[k], v); max[k] = Math.max(max[k], v);
            }
            pos.a.min = min; pos.a.max = max;
        }
    }
    if (!changed || !fixedHead || !fixedFeet) throw Error('Incomplete repair');
    // Every byte outside the selected leg positions/normals remains exact.
    for (let i = 0; i < binary.length; i++)
        if (!changes.has(i) && original[i] !== binary[i]) throw Error('Unrelated data changed');
    let j = Buffer.from(JSON.stringify(json));
    j = Buffer.concat([j, Buffer.alloc((4 - j.length % 4) % 4, 32)]);
    const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + j.length + binary.length, 8); header.writeUInt32LE(j.length, 12); header.write('JSON', 16);
    const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length); binHeader.write('BIN\0', 4);
    const output = Buffer.concat([header, j, binHeader, binary]);
    fs.writeFileSync(path.join(__dirname, entry.output), output);
    reports.push({ file: entry.output, changedVertices: changed, unchangedHeadVertices: fixedHead,
        unchangedFootVertices: fixedFeet, unrelatedBytesPreserved: true, clips: entry.clips,
        sourceHash: hash(source), outputHash: hash(output) });
}
fs.writeFileSync(path.join(__dirname, 'geometry-validation.json'), JSON.stringify(reports, null, 2));
console.log(`Repaired ${reports.length} GLBs; head, foot soles, rig, weights and motion keys unchanged.`);
