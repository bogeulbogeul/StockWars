// Edit only torso/clothing vertex buffers; preserve animation, rig and head bytes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const ratio = .88;
const files = [
    ...['walk', 'wave', 'eat', 'jump', 'crab', 'office-sit'].map(n =>
        [`web/assets/characters/3d/somangi/${n}.glb`, `somangi-${n}.glb`]),
    ...['bench-sit', 'bench-doze'].map(n =>
        [`web/assets/characters/3d/anna/${n}.glb`, `moa-${n}.glb`]),
    ['web/assets/characters/3d/agent-k/Agent-K.glb', 'tori.glb'],
    ['web/assets/office/3d/Information-furnished-room.glb', 'information-room.glb'],
    ['output/bongbong-meshy-apron-fit-v3/Bongbong-finished-apron.glb', 'bongbong.glb']
];
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const report = [];
for (const [relative, name] of files) {
    const backup = path.join(__dirname, 'original', name);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    if (!fs.existsSync(backup)) fs.copyFileSync(path.join(root, relative), backup);
    const source = fs.readFileSync(backup);
    const jsonLength = source.readUInt32LE(12);
    const json = JSON.parse(source.toString('utf8', 20, 20 + jsonLength));
    const binary = Buffer.from(source.subarray(28 + jsonLength));
    const originalBinary = Buffer.from(binary);
    const edited = new Set();
    const names = [];
    function accessor(index) {
        const a = json.accessors[index], view = json.bufferViews[a.bufferView];
        if (a.componentType !== 5126 || a.type !== 'VEC3' || a.sparse) throw Error('Unsupported vector');
        return { a, stride: view.byteStride || 12, offset: (view.byteOffset || 0) + (a.byteOffset || 0) };
    }
    function modify(index, normal) {
        if (edited.has(index)) return;
        edited.add(index);
        const { a, stride, offset } = accessor(index);
        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < a.count; i++) {
            const at = offset + i * stride;
            const v = [0, 1, 2].map(k => binary.readFloatLE(at + k * 4));
            v[0] *= normal ? 1 / ratio : ratio;
            if (normal) { const length = Math.hypot(...v) || 1; v.forEach((_, k) => v[k] /= length); }
            v.forEach((value, k) => {
                binary.writeFloatLE(value, at + k * 4);
                min[k] = Math.min(min[k], value); max[k] = Math.max(max[k], value);
            });
        }
        if (a.min) a.min = min;
        if (a.max) a.max = max;
    }
    for (const node of json.nodes) {
        if (node.mesh === undefined || !/^(Eating_Torso|Anna_Vest|AgentK_Vest|Bongbong_Meshy_Apron|Apron_Continuous_Waist_.*|Apron_Finished_Shoulder_.*)$/.test(node.name)) continue;
        names.push(node.name);
        for (const primitive of json.meshes[node.mesh].primitives) {
            if (primitive.targets?.length) throw Error('Review morph targets before editing');
            modify(primitive.attributes.POSITION, false);
            if (primitive.attributes.NORMAL !== undefined) modify(primitive.attributes.NORMAL, true);
            if (primitive.attributes.TANGENT !== undefined) throw Error('Review tangent transform');
        }
    }
    if (!names.includes('Eating_Torso')) throw Error(`Missing torso: ${name}`);
    // All other accessors (head, limbs, UVs, weights, indices, animation keys) remain exact.
    for (let i = 0; i < json.accessors.length; i++) {
        if (edited.has(i)) continue;
        const a = json.accessors[i], v = json.bufferViews[a.bufferView];
        if (!v) continue;
        const bytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[a.componentType];
        const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[a.type] * bytes;
        const offset = (v.byteOffset || 0) + (a.byteOffset || 0);
        for (let j = 0; j < a.count; j++) {
            const at = offset + j * (v.byteStride || width);
            if (!binary.subarray(at, at + width).equals(originalBinary.subarray(at, at + width))) throw Error(`Unexpected accessor edit ${i}`);
        }
    }
    if (name === 'bongbong.glb') {
        // Source Blender MixRGB tint was omitted by its GLB export on the head.
        // Multiply the existing face texture by the same peach as torso/arms.
        for (const material of json.materials) {
            if (material.name === 'Material_0_BongbongApricot')
                material.pbrMetallicRoughness.baseColorFactor = [1, .57, .32, 1];
        }
    }
    let j = Buffer.from(JSON.stringify(json));
    j = Buffer.concat([j, Buffer.alloc((4 - j.length % 4) % 4, 32)]);
    const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + j.length + binary.length, 8);
    header.writeUInt32LE(j.length, 12); header.write('JSON', 16);
    const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length); binHeader.write('BIN\0', 4);
    const output = Buffer.concat([header, j, binHeader, binary]);
    fs.writeFileSync(path.join(__dirname, name), output);
    report.push({ source: relative, output: name, ratio, edited: names,
        unchangedAccessorsVerified: true, clips: (json.animations || []).map(a => a.name),
        originalSha256: hash(source), outputSha256: hash(output) });
}
fs.writeFileSync(path.join(__dirname, 'validation.json'), JSON.stringify(report, null, 2));
console.log(`Built ${report.length} models; preserved all unrelated accessor bytes.`);
