$csharpCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.IO;

public class CleanPaleFixer
{
    public static void GenerateCleanPale(string fairPath, string outDir, int targetCanvasW, int targetCanvasH, int targetFeetY, int targetCharH)
    {
        string[] dirs = new string[] { "front", "right", "back", "left" };

        using (Bitmap bmp = new Bitmap(fairPath))
        {
            int w = bmp.Width;
            int h = bmp.Height;
            int colW = w / 4;

            // Generate pale tint: slightly brighter (+6), softer pink undertone from clean fair
            Bitmap paleSheet = new Bitmap(w, h, PixelFormat.Format32bppArgb);
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    Color p = bmp.GetPixel(x, y);
                    int minVal = Math.Min(p.R, Math.Min(p.G, p.B));
                    int maxVal = Math.Max(p.R, Math.Max(p.G, p.B));
                    int diff = maxVal - minVal;

                    bool isPureBg = (minVal >= 244) && (diff < 12);
                    bool isUnderwear = (diff <= 10) && (minVal >= 185) && !isPureBg;

                    if (isPureBg)
                    {
                        paleSheet.SetPixel(x, y, p);
                    }
                    else if (isUnderwear)
                    {
                        paleSheet.SetPixel(x, y, p);
                    }
                    else
                    {
                        // Skin: shift towards porcelain ivory/pale (+4 brightness, slightly cooler)
                        int r = Math.Min(255, p.R + 3);
                        int g = Math.Min(255, p.G + 5);
                        int b = Math.Min(255, p.B + 8);
                        paleSheet.SetPixel(x, y, Color.FromArgb(255, r, g, b));
                    }
                }
            }

            for (int c = 0; c < 4; c++)
            {
                string dir = dirs[c];
                int x0 = c * colW;
                int x1 = Math.Min(x0 + colW - 1, w - 1);

                int minX = 9999, maxX = 0, minY = 9999, maxY = 0;

                for (int x = x0; x <= x1; x++)
                {
                    for (int y = 0; y < h; y++)
                    {
                        Color p = paleSheet.GetPixel(x, y);
                        int minVal = Math.Min(p.R, Math.Min(p.G, p.B));
                        int maxVal = Math.Max(p.R, Math.Max(p.G, p.B));
                        int diff = maxVal - minVal;

                        bool isPureBg = (minVal >= 244) && (diff < 12);
                        bool isFaintShadow = (y > h * 0.75) && (minVal >= 235) && (diff < 10);

                        if (!isPureBg && !isFaintShadow)
                        {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }

                if (minX >= maxX || minY >= maxY) continue;

                int pad = 2;
                int cropX = Math.Max(x0, minX - pad);
                int cropY = Math.Max(0, minY - pad);
                int cropW = Math.Min(w - cropX, (maxX - minX + 1) + (pad * 2));
                int cropH = Math.Min(h - cropY, (maxY - minY + 1) + (pad * 2));

                using (Bitmap cleanCharBmp = new Bitmap(cropW, cropH, PixelFormat.Format32bppArgb))
                {
                    for (int cx = 0; cx < cropW; cx++)
                    {
                        for (int cy = 0; cy < cropH; cy++)
                        {
                            int px = cropX + cx;
                            int py = cropY + cy;
                            Color p = paleSheet.GetPixel(px, py);

                            int minVal = Math.Min(p.R, Math.Min(p.G, p.B));
                            int maxVal = Math.Max(p.R, Math.Max(p.G, p.B));
                            int diff = maxVal - minVal;

                            bool isNearWhite = (minVal >= 245) && (diff < 12);

                            if (isNearWhite)
                            {
                                cleanCharBmp.SetPixel(cx, cy, Color.FromArgb(0, 0, 0, 0));
                            }
                            else if (minVal >= 225 && diff < 16)
                            {
                                int alpha = (int)(255 * (245 - minVal) / 20.0);
                                if (alpha < 0) alpha = 0;
                                if (alpha > 255) alpha = 255;
                                cleanCharBmp.SetPixel(cx, cy, Color.FromArgb(alpha, p.R, p.G, p.B));
                            }
                            else
                            {
                                cleanCharBmp.SetPixel(cx, cy, Color.FromArgb(255, p.R, p.G, p.B));
                            }
                        }
                    }

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
                            Rectangle srcRect = new Rectangle(0, 0, cropW, cropH);
                            g.DrawImage(cleanCharBmp, destRect, srcRect, GraphicsUnit.Pixel);
                        }

                        string skinOutFile = String.Format("female_base_pale_{0}.png", dir);
                        string skinOutPath = Path.Combine(outDir, skinOutFile);
                        canvas.Save(skinOutPath, ImageFormat.Png);
                        Console.WriteLine(String.Format("Clean Pale Fixed: {0}", skinOutFile));
                    }
                }
            }

            paleSheet.Dispose();
        }
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies System.Drawing -Language CSharp

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$fairFile = "media_1789453620850.png"
$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"

$targetCanvasW = 240
$targetCanvasH = 340
$targetFeetY = 324
$targetCharH = 285

$srcPath = Join-Path $baseDir $fairFile
[CleanPaleFixer]::GenerateCleanPale($srcPath, $outDir, $targetCanvasW, $targetCanvasH, $targetFeetY, $targetCharH)

Write-Host "Pale skin tone cleaned and regenerated successfully!"
