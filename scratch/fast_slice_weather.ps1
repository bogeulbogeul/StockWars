Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;

public class WeatherSlicer {
    public static void TrimAndSave(string srcPath, string outPath) {
        using (Bitmap bmp = new Bitmap(srcPath)) {
            int minX = bmp.Width, maxX = 0, minY = bmp.Height, maxY = 0;
            for (int y = 0; y < bmp.Height; y++) {
                for (int x = 0; x < bmp.Width; x++) {
                    Color c = bmp.GetPixel(x, y);
                    if (c.A > 15) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            if (maxX > minX && maxY > minY) {
                int w = maxX - minX + 1;
                int h = maxY - minY + 1;
                Rectangle rect = new Rectangle(minX, minY, w, h);
                using (Bitmap cropped = bmp.Clone(rect, PixelFormat.Format32bppArgb)) {
                    cropped.Save(outPath, ImageFormat.Png);
                    Console.WriteLine("Saved: " + outPath + " (" + w + "x" + h + ")");
                }
            }
        }
    }

    public static void ExtractIslands(string srcPath, string outDir, string prefix) {
        using (Bitmap bmp = new Bitmap(srcPath)) {
            int w = bmp.Width;
            int h = bmp.Height;
            bool[,] visited = new bool[w, h];
            List<Rectangle> islands = new List<Rectangle>();

            for (int y = 0; y < h; y += 2) {
                for (int x = 0; x < w; x += 2) {
                    if (!visited[x, y]) {
                        Color c = bmp.GetPixel(x, y);
                        if (c.A > 20) {
                            Queue<Point> q = new Queue<Point>();
                            q.Enqueue(new Point(x, y));
                            visited[x, y] = true;

                            int minX = x, maxX = x, minY = y, maxY = y;
                            int pixelCount = 0;

                            while (q.Count > 0) {
                                Point pt = q.Dequeue();
                                pixelCount++;

                                if (pt.X < minX) minX = pt.X;
                                if (pt.X > maxX) maxX = pt.X;
                                if (pt.Y < minY) minY = pt.Y;
                                if (pt.Y > maxY) maxY = pt.Y;

                                int px = pt.X, py = pt.Y;
                                if (px + 1 < w && !visited[px + 1, py] && bmp.GetPixel(px + 1, py).A > 20) {
                                    visited[px + 1, py] = true; q.Enqueue(new Point(px + 1, py));
                                }
                                if (px - 1 >= 0 && !visited[px - 1, py] && bmp.GetPixel(px - 1, py).A > 20) {
                                    visited[px - 1, py] = true; q.Enqueue(new Point(px - 1, py));
                                }
                                if (py + 1 < h && !visited[px, py + 1] && bmp.GetPixel(px, py + 1).A > 20) {
                                    visited[px, py + 1] = true; q.Enqueue(new Point(px, py + 1));
                                }
                                if (py - 1 >= 0 && !visited[px, py - 1] && bmp.GetPixel(px, py - 1).A > 20) {
                                    visited[px, py - 1] = true; q.Enqueue(new Point(px, py - 1));
                                }
                            }

                            if (pixelCount > 500 && (maxX - minX) > 40 && (maxY - minY) > 20) {
                                islands.Add(new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1));
                            }
                        }
                    }
                }
            }

            // Sort by top-to-bottom, left-to-right
            islands.Sort((a, b) => {
                int rowA = a.Y / 150;
                int rowB = b.Y / 150;
                if (rowA != rowB) return rowA.CompareTo(rowB);
                return a.X.CompareTo(b.X);
            });

            int idx = 1;
            foreach (var r in islands) {
                using (Bitmap cropped = bmp.Clone(r, PixelFormat.Format32bppArgb)) {
                    string outPath = Path.Combine(outDir, prefix + "_" + idx + ".png");
                    cropped.Save(outPath, ImageFormat.Png);
                    Console.WriteLine("Saved: " + outPath + " (" + r.Width + "x" + r.Height + ")");
                    idx++;
                }
            }
        }
    }
}
"@ -ReferencedAssemblies "System.Drawing.dll"

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\55929f9f-455c-4f12-8b4c-3002acd2c56d\.user_uploaded"
$destDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\weather"
if (!(Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

[WeatherSlicer]::TrimAndSave("$srcDir\media_1790403254258.png", "$destDir\sun.png")
[WeatherSlicer]::ExtractIslands("$srcDir\media_1790403254389.png", $destDir, "cloud_white")
[WeatherSlicer]::ExtractIslands("$srcDir\media_1790403254532.png", $destDir, "cloud_dark")
