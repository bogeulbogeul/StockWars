Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;

public class CleanCloudSlicer {
    public static void SliceCleanIslands(string srcPath, string outDir, string prefix) {
        using (Bitmap srcBmp = new Bitmap(srcPath)) {
            int w = srcBmp.Width;
            int h = srcBmp.Height;
            int[,] labels = new int[w, h];
            int currentLabel = 1;

            Dictionary<int, List<Point>> labelPixels = new Dictionary<int, List<Point>>();

            // 1. Connected Component Labeling (8-way connectivity with alpha threshold)
            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    if (labels[x, y] == 0) {
                        Color c = srcBmp.GetPixel(x, y);
                        if (c.A > 25) {
                            int labelId = currentLabel++;
                            List<Point> pixels = new List<Point>();
                            Queue<Point> q = new Queue<Point>();

                            labels[x, y] = labelId;
                            q.Enqueue(new Point(x, y));

                            while (q.Count > 0) {
                                Point pt = q.Dequeue();
                                pixels.Add(pt);

                                for (int dy = -1; dy <= 1; dy++) {
                                    for (int dx = -1; dx <= 1; dx++) {
                                        if (dx == 0 && dy == 0) continue;
                                        int nx = pt.X + dx;
                                        int ny = pt.Y + dy;

                                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                            if (labels[nx, ny] == 0) {
                                                Color nc = srcBmp.GetPixel(nx, ny);
                                                if (nc.A > 25) {
                                                    labels[nx, ny] = labelId;
                                                    q.Enqueue(new Point(nx, ny));
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            // Filter out tiny noise (only real clouds)
                            if (pixels.Count > 1200) {
                                labelPixels[labelId] = pixels;
                            }
                        }
                    }
                }
            }

            Console.WriteLine("Found " + labelPixels.Count + " isolated clouds for " + prefix);

            // 2. Sort islands top-to-bottom, left-to-right
            List<KeyValuePair<int, List<Point>>> sortedClouds = new List<KeyValuePair<int, List<Point>>>(labelPixels);
            sortedClouds.Sort((a, b) => {
                int minY_a = h, minX_a = w;
                foreach (var p in a.Value) { if (p.Y < minY_a) minY_a = p.Y; if (p.X < minX_a) minX_a = p.X; }
                int minY_b = h, minX_b = w;
                foreach (var p in b.Value) { if (p.Y < minY_b) minY_b = p.Y; if (p.X < minX_b) minX_b = p.X; }

                int rowA = minY_a / 150;
                int rowB = minY_b / 150;
                if (rowA != rowB) return rowA.CompareTo(rowB);
                return minX_a.CompareTo(minX_b);
            });

            // 3. Render each cloud with EXACT pixel mask (no bleeding of neighbor clouds)
            int outIdx = 1;
            foreach (var kvp in sortedClouds) {
                var pixels = kvp.Value;
                int labelId = kvp.Key;

                int minX = w, maxX = 0, minY = h, maxY = 0;
                foreach (var p in pixels) {
                    if (p.X < minX) minX = p.X;
                    if (p.X > maxX) maxX = p.X;
                    if (p.Y < minY) minY = p.Y;
                    if (p.Y > maxY) maxY = p.Y;
                }

                int cropW = maxX - minX + 1;
                int cropH = maxY - minY + 1;

                using (Bitmap cloudBmp = new Bitmap(cropW, cropH, PixelFormat.Format32bppArgb)) {
                    // Initialize with fully transparent pixels
                    using (Graphics g = Graphics.FromImage(cloudBmp)) {
                        g.Clear(Color.Transparent);
                    }

                    // Copy ONLY pixels belonging to this specific cloud island
                    foreach (var p in pixels) {
                        Color c = srcBmp.GetPixel(p.X, p.Y);
                        cloudBmp.SetPixel(p.X - minX, p.Y - minY, c);
                    }

                    string outPath = Path.Combine(outDir, prefix + "_" + outIdx + ".png");
                    cloudBmp.Save(outPath, ImageFormat.Png);
                    Console.WriteLine("Saved cleanly: " + outPath + " (" + cropW + "x" + cropH + ", " + pixels.Count + " px)");
                    outIdx++;
                }
            }
        }
    }
}
"@ -ReferencedAssemblies "System.Drawing.dll"

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\55929f9f-455c-4f12-8b4c-3002acd2c56d\.user_uploaded"
$destDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\weather"

# Clean previous slice files first
Get-ChildItem -Path "$destDir\cloud_*.png" | Remove-Item -Force

[CleanCloudSlicer]::SliceCleanIslands("$srcDir\media_1790403254389.png", $destDir, "cloud_white")
[CleanCloudSlicer]::SliceCleanIslands("$srcDir\media_1790403254532.png", $destDir, "cloud_dark")

Write-Output "=== Slicing complete! ==="
Get-ChildItem -Path "$destDir\cloud_*.png" | Select-Object Name, Length
