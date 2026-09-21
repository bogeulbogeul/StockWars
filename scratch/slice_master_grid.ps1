$csharpCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.IO;

public class MasterGridSlicer
{
    public static void Slice5x4Grid(string srcPath, string outDir, int targetCanvasW, int targetCanvasH, int targetFeetY, int targetCharH)
    {
        string[] skinNames = new string[] { "pale", "fair", "natural", "tan", "deep" };
        string[] dirNames = new string[] { "front", "right", "back", "left" };

        // Column X search ranges
        int[][] colRanges = new int[][] {
            new int[] { 90, 225 },   // Front
            new int[] { 270, 390 },  // Right
            new int[] { 420, 560 },  // Back
            new int[] { 590, 720 }   // Left
        };

        // Row Y search ranges
        int[][] rowRanges = new int[][] {
            new int[] { 0, 204 },    // Pale
            new int[] { 205, 409 },  // Fair
            new int[] { 410, 614 },  // Natural
            new int[] { 615, 819 },  // Tan
            new int[] { 820, 1023 }  // Deep
        };

        using (Bitmap master = new Bitmap(srcPath))
        {
            int w = master.Width;
            int h = master.Height;

            for (int r = 0; r < 5; r++)
            {
                string skin = skinNames[r];
                int ySearchMin = rowRanges[r][0];
                int ySearchMax = Math.Min(h - 1, rowRanges[r][1]);

                for (int c = 0; c < 4; c++)
                {
                    string dir = dirNames[c];
                    int xSearchMin = colRanges[c][0];
                    int xSearchMax = Math.Min(w - 1, colRanges[c][1]);

                    // Find precise non-transparent bounding box
                    int minX = 9999, maxX = 0, minY = 9999, maxY = 0;

                    for (int x = xSearchMin; x <= xSearchMax; x++)
                    {
                        for (int y = ySearchMin; y <= ySearchMax; y++)
                        {
                            Color p = master.GetPixel(x, y);
                            if (p.A > 20)
                            {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }

                    if (minX >= maxX || minY >= maxY)
                    {
                        Console.WriteLine(String.Format("Warning: Could not find bounds for [{0},{1}] ({2} {3})", r, c, skin, dir));
                        continue;
                    }

                    int pad = 2;
                    int cropX = Math.Max(0, minX - pad);
                    int cropY = Math.Max(0, minY - pad);
                    int cropW = Math.Min(w - cropX, (maxX - minX + 1) + (pad * 2));
                    int cropH = Math.Min(h - cropY, (maxY - minY + 1) + (pad * 2));

                    // Scale & fit onto 240x340 standard canvas aligned to feet
                    double scale = (double)targetCharH / (double)cropH;
                    int destW = (int)Math.Round(cropW * scale);
                    int destH = (int)Math.Round(cropH * scale);
                    int destX = (targetCanvasW - destW) / 2;
                    int destY = targetFeetY - destH;

                    using (Bitmap canvas = new Bitmap(targetCanvasW, targetCanvasH, PixelFormat.Format32bppArgb))
                    {
                        using (Graphics g = Graphics.FromImage(canvas))
                        {
                            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                            g.SmoothingMode = SmoothingMode.HighQuality;
                            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                            g.Clear(Color.Transparent);

                            Rectangle destRect = new Rectangle(destX, destY, destW, destH);
                            Rectangle srcRect = new Rectangle(cropX, cropY, cropW, cropH);
                            g.DrawImage(master, destRect, srcRect, GraphicsUnit.Pixel);
                        }

                        // Save both male_base and female_base filenames for 100% unified compatibility
                        string maleFile = Path.Combine(outDir, String.Format("male_base_{0}_{1}.png", skin, dir));
                        string femaleFile = Path.Combine(outDir, String.Format("female_base_{0}_{1}.png", skin, dir));

                        canvas.Save(maleFile, ImageFormat.Png);
                        canvas.Save(femaleFile, ImageFormat.Png);

                        // If fair skin, also update default fallback files
                        if (skin == "fair")
                        {
                            canvas.Save(Path.Combine(outDir, String.Format("male_base_{0}.png", dir)), ImageFormat.Png);
                            canvas.Save(Path.Combine(outDir, String.Format("male_{0}.png", dir)), ImageFormat.Png);
                            canvas.Save(Path.Combine(outDir, String.Format("female_base_{0}.png", dir)), ImageFormat.Png);
                            canvas.Save(Path.Combine(outDir, String.Format("female_{0}.png", dir)), ImageFormat.Png);
                        }

                        Console.WriteLine(String.Format("Sliced [{0},{1}] -> {2} {3} (W={4}, H={5})", r, c, skin, dir, destW, destH));
                    }
                }
            }
        }
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies System.Drawing -Language CSharp

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$file = "media_1789456231270.png"
$srcPath = Join-Path $baseDir $file

$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

$targetCanvasW = 240
$targetCanvasH = 340
$targetFeetY = 324
$targetCharH = 285

Write-Host "=== Slicing 5x4 Master Sprite Sheet ==="
[MasterGridSlicer]::Slice5x4Grid($srcPath, $outDir, $targetCanvasW, $targetCanvasH, $targetFeetY, $targetCharH)

Write-Host "All 20 master sprites sliced, aligned, and deployed successfully!"
