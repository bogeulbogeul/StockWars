# Parallel shelf revision — built-in imagegen

Reference: vivian-grid-v4/goods.png. Existing medicine designs retained. Raised rear header removed because its perspective differed from the shelf rails. Source geometry was checked at both upper and lower outlines, not only the contact silhouette.

## Selected generation prompt
Redraw this health merchandise shelving as a geometrically consistent orthographic game cabinet. REMOVE the tall raised rear header/signboard entirely. Make a simple OPEN TOP three-tier shelving cabinet with identical rectangular shelves, two short solid side panels. The topmost horizontal structural line is the top shelf itself, not a raised header. All three shelves EXACTLY SAME LENGTH AND DEPTH. All long parallel shelf lips slope -0.5 (2px right=1px UP), all short depth edges slope +0.5, vertical posts exactly vertical. Upper shelf, middle shelf and bottom plinth are vertically translated copies of SAME parallelogram, no changing pitch. NO perspective. Same stocked orange green-leaf vitamin bottles, blue heartbeat bottles, silver orange pill packs on three tiers. Crisp navy outlines, teal cream yellow palette. 1x2 footprint, long axis lower-left to upper-right, front lower-right, left end visible. Entire image isolated on transparent with 12% blank safety margins each side especially bottom. No floor, shadow, annotation or words. Camera and orthographic parallelism priority.

## Verification
Actual 1254×1254 PNG alpha boundary samples at x = 400, 500, 600, 700, 800, 900:
- Upper y = 402, 359, 317, 274, 231, 188.
- Lower y = 1195, 1153, 1111, 1069, 1027, 986.

Shared projection uses long slope -0.423 and short slope +0.75. Both upper and lower sampled runs deviate from the target grid axis by less than one room pixel at the displayed size. Generated raster outlines are not mathematically exact vector edges. Full canvas retained, no clipping. Footprint and saved duplicate positions are unchanged.
