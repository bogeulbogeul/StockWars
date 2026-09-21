$csharpCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.IO;
using System.Runtime.InteropServices;

public class FemaleSkinProcessor
{
    public class ColorProfile
    {
        public int[] high;
        public int[] mid;
        public int[] low;
        public int[] line;

        public ColorProfile(int[] h, int[] m, int[] l, int[] ln)
        {
            high = h; mid = m; low = l; line = ln;
        }
    }

    public static Bitmap TransformSkin(Bitmap src, ColorProfile p)
    {
        int w = src.Width;
        int h = src.Height;
        Bitmap dst = new Bitmap(w, h, PixelFormat.Format32bppArgb);

        BitmapData srcData = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        BitmapData dstData = dst.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

        int bytes = Math.Abs(srcData.Stride) * h;
        byte[] rgbValues = new byte[bytes];
        byte[] dstValues = new byte[bytes];

        Marshal.Copy(srcData.Scan0, rgbValues, 0, bytes);

        for (int i = 0; i < bytes; i += 4)
        {
            int b = rgbValues[i];
            int g = rgbValues[i + 1];
            int r = rgbValues[i + 2];
            int a = rgbValues[i + 3];

            int minVal = Math.Min(r, Math.Min(g, b));
            int maxVal = Math.Max(r, Math.Max(g, b));
            int diff = maxVal - minVal;

            bool isBg = (minVal > 248) && (diff < 8);
            bool isUnderwear = (diff <= 10) && (minVal >= 185) && !isBg;

            if (isBg)
            {
                dstValues[i] = 255;
                dstValues[i + 1] = 255;
                dstValues[i + 2] = 255;
                dstValues[i + 3] = 255;
            }
            else if (isUnderwear)
            {
                dstValues[i] = (byte)b;
                dstValues[i + 1] = (byte)g;
                dstValues[i + 2] = (byte)r;
                dstValues[i + 3] = 255;
            }
            else
            {
                double lum = (r * 0.299 + g * 0.587 + b * 0.114);
                double normLum = (lum - 100.0) / (253.0 - 100.0);
                if (normLum < 0.0) normLum = 0.0;
                if (normLum > 1.0) normLum = 1.0;

                double outR, outG, outB;
                if (normLum >= 0.78)
                {
                    double t = (normLum - 0.78) / 0.22;
                    outR = p.mid[0] + (p.high[0] - p.mid[0]) * t;
                    outG = p.mid[1] + (p.high[1] - p.mid[1]) * t;
                    outB = p.mid[2] + (p.high[2] - p.mid[2]) * t;
                }
                else if (normLum >= 0.35)
                {
                    double t = (normLum - 0.35) / 0.43;
                    outR = p.low[0] + (p.mid[0] - p.low[0]) * t;
                    outG = p.low[1] + (p.mid[1] - p.low[1]) * t;
                    outB = p.low[2] + (p.mid[2] - p.low[2]) * t;
                }
                else
                {
                    double t = normLum / 0.35;
                    outR = p.line[0] + (p.low[0] - p.line[0]) * t;
                    outG = p.line[1] + (p.low[1] - p.line[1]) * t;
                    outB = p.line[2] + (p.low[2] - p.line[2]) * t;
                }

                dstValues[i] = (byte)Math.Min(255, Math.Max(0, (int)outB));
                dstValues[i + 1] = (byte)Math.Min(255, Math.Max(0, (int)outG));
                dstValues[i + 2] = (byte)Math.Min(255, Math.Max(0, (int)outR));
                dstValues[i + 3] = 255;
            }
        }

        Marshal.Copy(dstValues, 0, dstData.Scan0, bytes);
        src.UnlockBits(srcData);
        dst.UnlockBits(dstData);
        return dst;
    }

    public static void SliceAndAlign(Bitmap sheet, string skinName, string outDir, int targetCanvasW, int targetCanvasH, int targetFeetY, int targetCharH)
    {
        string[] dirs = new string[] { "front", "right", "back", "left" };
        int w = sheet.Width;
        int h = sheet.Height;
        int colW = w / 4;

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
                    Color p = sheet.GetPixel(x, y);
                    bool isBlack = (p.R < 25 && p.G < 25 && p.B < 25);
                    int minVal = Math.Min(p.R, Math.Min(p.G, p.B));
                    int maxVal = Math.Max(p.R, Math.Max(p.G, p.B));
                    bool isWhite = (minVal > 240) && ((maxVal - minVal) < 15);

                    if (!isBlack && !isWhite)
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

            Bitmap cleanCharBmp = new Bitmap(cropW, cropH, PixelFormat.Format32bppArgb);
            for (int cx = 0; cx < cropW; cx++)
            {
                for (int cy = 0; cy < cropH; cy++)
                {
                    int px = cropX + cx;
                    int py = cropY + cy;
                    Color p = sheet.GetPixel(px, py);
                    int minVal = Math.Min(p.R, Math.Min(p.G, p.B));
                    int maxVal = Math.Max(p.R, Math.Max(p.G, p.B));
                    bool isNearWhite = (minVal > 240) && ((maxVal - minVal) < 15);
                    bool isBlack = (p.R < 25 && p.G < 25 && p.B < 25);

                    if (isNearWhite || isBlack)
                    {
                        cleanCharBmp.SetPixel(cx, cy, Color.FromArgb(0, 0, 0, 0));
                    }
                    else if (minVal > 215 && ((maxVal - minVal) < 25))
                    {
                        int alpha = (int)(255 * (240 - minVal) / 25.0);
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

            Bitmap canvas = new Bitmap(targetCanvasW, targetCanvasH, PixelFormat.Format32bppArgb);
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
            cleanCharBmp.Dispose();

            string skinOutFile = String.Format("female_base_{0}_{1}.png", skinName, dir);
            string skinOutPath = Path.Combine(outDir, skinOutFile);
            canvas.Save(skinOutPath, ImageFormat.Png);
            Console.WriteLine(String.Format("Saved: {0}", skinOutFile));

            if (skinName == "fair")
            {
                string defaultBase = Path.Combine(outDir, String.Format("female_base_{0}.png", dir));
                string defaultChar = Path.Combine(outDir, String.Format("female_{0}.png", dir));
                canvas.Save(defaultBase, ImageFormat.Png);
                canvas.Save(defaultChar, ImageFormat.Png);
                Console.WriteLine(String.Format("Updated Default: female_base_{0}.png & female_{0}.png", dir));
            }

            canvas.Dispose();
        }
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies System.Drawing -Language CSharp

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$femaleFile = "media_1789449863748.png"
$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

$srcPath = Join-Path $srcDir $femaleFile
$srcBmp = New-Object System.Drawing.Bitmap($srcPath)

$profiles = @{
    "pale"    = [FemaleSkinProcessor+ColorProfile]::new(@(253, 242, 237), @(245, 218, 212), @(218, 178, 170), @(130, 80, 80))
    "fair"    = [FemaleSkinProcessor+ColorProfile]::new(@(254, 237, 225), @(246, 210, 192), @(218, 168, 146), @(125, 75, 65))
    "natural" = [FemaleSkinProcessor+ColorProfile]::new(@(247, 213, 185), @(235, 185, 150), @(198, 138, 102), @(108, 62, 42))
    "tan"     = [FemaleSkinProcessor+ColorProfile]::new(@(231, 184, 144), @(212, 155, 112), @(168, 108, 68), @(90, 48, 28))
    "deep"    = [FemaleSkinProcessor+ColorProfile]::new(@(162, 106, 78),  @(138, 84, 56),   @(100, 54, 34),   @(55, 26, 15))
}

$targetCanvasW = 240
$targetCanvasH = 340
$targetFeetY = 324
$targetCharH = 285

foreach ($skin in @("pale", "fair", "natural", "tan", "deep")) {
    Write-Host "=== Processing Female Skin: $skin ==="
    $sheet = [FemaleSkinProcessor]::TransformSkin($srcBmp, $profiles[$skin])
    [FemaleSkinProcessor]::SliceAndAlign($sheet, $skin, $outDir, $targetCanvasW, $targetCanvasH, $targetFeetY, $targetCharH)
    $sheet.Dispose()
}

$srcBmp.Dispose()
Write-Host "All female skins generated & sliced successfully!"
