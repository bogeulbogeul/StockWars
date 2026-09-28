# Lower plinth correction

Built-in image_gen transparent edit of v7/goods.png. Full 1254-square canvas, uniform scaling in game.

## Prompt

Precise-object-edit of the supplied transparent cabinet sprite. Change ONLY the BOTTOMMOST teal plinth / base edges touching the floor. Preserve entire upper cabinet, header, left cream side panel, all products, all other shelves, canvas and proportions exactly. The long lowest front edge is too steep (slope -.51); make it exactly -.48235, rising 41 pixels per 85 pixels to the right. Hold its left/front corner fixed, lower far right end about 20 pixels. The short lowest left side edge is much too steep (about +.65); make it +.48235 by lowering the far left rear end about 40 pixels, holding the same front corner fixed. Smoothly extend only the bottom teal plinth to meet these two corrected straight edges. Keep the 3D enclosed cabinet look and original shading. Do NOT rotate/shear/resize the whole cabinet. Do NOT redesign, remove panels, change header or products. Truly transparent background, entire image uncut. Bottom two edges must follow symmetric 25.75 degree diamond floor directions, all other artwork unchanged.

## Verification

Alpha>128 lower long-edge samples: (450,1215), (550,1167), (650,1118), (750,1068), (850,1019), (950,969), (1050,918). Slope ~-0.495 vs grid -41/85. Difference across sampled span under 2 room pixels at 285/1254 scale. Approximate raster alignment, not exact projection; short side edge and upper frame not claimed grid-aligned.
