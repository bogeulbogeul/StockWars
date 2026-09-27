# Anna v6: mirrored right-facing frames

Per user request, performed a literal horizontal pixel flip of each left-facing frame from v5 into the right-facing row. No image generation or repainting. Source rectangles: x=180,450,720; y=398; width=260; height=362. Destination rectangles use the same x values and y=760. Frame order is preserved. RGBA comparison of each destination against its mirrored source: zero mismatches. Hair, arm poses and leg shading are all mirrored together. Remaining rows retain v5. Runtime integration is unchanged.
