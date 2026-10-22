const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve('output/title-flipbook-v1');
const basePath = path.resolve('web/assets/title/somangi-crayon-start.png');
const edits = [
    'C:/Users/bogeu/.codex/generated_images/01a15b94-57f4-7f93-ace6-c72926a4fe04/exec-24e1aad9-b72d-4acd-8d82-7d9489b4945f.png',
    'C:/Users/bogeu/.codex/generated_images/01a15b94-57f4-7f93-ace6-c72926a4fe04/exec-49d1cb9a-646d-4b14-9c19-9e83740f51c8.png'
];
// Only insert the generated edits here. All other source pixels are retained.
const maskSvg = `<svg width="1672" height="941" xmlns="http://www.w3.org/2000/svg">
<path fill="white" d="M895 505 L918 483 L935 457 L947 424 L951 397 L1048 397 L1050 570 L930 570 L912 542 Z"/>
<rect fill="white" x="90" y="730" width="175" height="153"/>
<rect fill="white" x="1395" y="730" width="190" height="160"/>
</svg>`;
(async () => {
    await fs.mkdir(root, { recursive: true });
    const mask = await sharp(Buffer.from(maskSvg)).ensureAlpha().raw().toBuffer();
    const { data: original, info } = await sharp(basePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const cleanSource = 'C:/Users/bogeu/.codex/generated_images/01a15b94-57f4-7f93-ace6-c72926a4fe04/exec-6336b4f6-2284-48d1-a1e9-3a1fa47d366c.png';
    await fs.copyFile(cleanSource, path.join(root, 'generated-button-removal.png'));
    const clean = await sharp(cleanSource).ensureAlpha().raw().toBuffer();
    for (let y = 715; y < 924; y++) {
        const start = (y * info.width + 500) * 4;
        const end = (y * info.width + 1180) * 4;
        clean.copy(original, start, start, end);
    }
    assert.equal(info.width, 1672);
    assert.equal(info.height, 941);
    await sharp(original, { raw: info }).png().toFile(path.join(root, 'frame-0.png'));
    for (const [index, file] of edits.entries()) {
        await fs.copyFile(file, path.join(root, `generated-${index + 1}.png`));
        const generated = await sharp(file).resize(info.width, info.height).ensureAlpha().raw().toBuffer();
        const pixels = Buffer.from(original);
        let changed = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            const x = (i / 4) % info.width;
            // Keep original two leaves where the second generated right sprout lost one.
            if (mask[i + 3] && !(index === 1 && x >= 1395)) {
                generated.copy(pixels, i, i, i + 4);
                if (!generated.subarray(i, i + 4).equals(original.subarray(i, i + 4))) changed++;
            } else assert.ok(pixels.subarray(i, i + 4).equals(original.subarray(i, i + 4)));
        }
        assert.ok(changed > 1000);
        await sharp(pixels, { raw: info }).png().toFile(path.join(root, `frame-${index + 1}.png`));
        console.log(`frame-${index + 1}: ${changed} changed pixels inside approved regions; all other pixels identical`);
    }
    const tiles = await Promise.all([0, 1, 2].map(async index => ({
        input: await sharp(path.join(root, `frame-${index}.png`)).resize(836, 471).toBuffer(),
        left: index * 836, top: 0
    })));
    await sharp({ create: { width: 2508, height: 471, channels: 4, background: '#fcf3dc' } })
        .composite(tiles).png().toFile(path.join(root, 'comparison.png'));
    const buttonSource = 'C:/Users/bogeu/.codex/generated_images/01a15b94-57f4-7f93-ace6-c72926a4fe04/exec-4c1d8254-2c37-4c18-87da-e8b42870da65.png';
    await fs.copyFile(buttonSource, path.join(root, 'generated-button.png'));
    await sharp(buttonSource).trim().png().toFile(path.join(root, 'start-button.png'));
    await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify({
        width: 1672, height: 941, frames: ['frame-0.png', 'frame-1.png', 'frame-2.png'],
        sequence: [0, 1, 0, 2, 0, 1, 0, 2, 0],
        durations: [240, 220, 220, 220, 220, 220, 220, 220, 1100],
        generation: 'Built-in image_gen: raise the waving arm/lean sprouts left; lower the waving arm/lean sprouts right; retain original outside animated regions.',
        invariant: 'All pixels outside the arm and lower corner sprout masks equal button-free frame-0 exactly.',
        separateButton: 'start-button.png (transparent background, independent HTML button)'
    }, null, 2));
})();
