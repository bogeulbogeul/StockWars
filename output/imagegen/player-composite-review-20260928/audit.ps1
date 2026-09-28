Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public class LayerAudit {
 public static byte[] Pixels(Bitmap b) {
 var r=new Rectangle(0,0,b.Width,b.Height);var d=b.LockBits(r,ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);byte[] p=new byte[d.Stride*b.Height];Marshal.Copy(d.Scan0,p,0,p.Length);b.UnlockBits(d);return p;
 }
 public static string Stats(Bitmap b){var p=Pixels(b);int x0=b.Width,y0=b.Height,x1=0,y1=0,partial=0,n=0;for(int y=0;y<b.Height;y++)for(int x=0;x<b.Width;x++){int a=p[(y*b.Width+x)*4+3];if(a>0&&a<255)partial++;if(a>=128){n++;x0=Math.Min(x0,x);y0=Math.Min(y0,y);x1=Math.Max(x1,x);y1=Math.Max(y1,y);}}return b.Width+"x"+b.Height+" bounds="+x0+","+y0+","+x1+","+y1+" partial="+partial+" opaque128="+n;}
 public static string Covered(Bitmap a,Bitmap b,int x0,int y0,int x1,int y1){var p=Pixels(a);var q=Pixels(b);int n=0,k=0;for(int y=y0;y<=y1;y++)for(int x=x0;x<=x1;x++){if(x<a.Width&&y<a.Height&&p[(y*a.Width+x)*4+3]>=128){n++;if(x<b.Width&&y<b.Height&&q[(y*b.Width+x)*4+3]>=128)k++;}}return k+"/"+n+" = "+(100.0*k/n).ToString("F1")+"%";}
}
'@
$root='C:/GitHub/StockWars/output/imagegen'
$paths=@(
 "$root/player-hair-short-black-20260928/hair_short_back_idle_down.png",
 'C:/Users/Administrator/Videos/Downloads/ChatGPT 이미지 2026년 9월 28일 오후 02_13_32.png',
 "$root/player-outfit-white-black-20260928/bottom_shorts_black_idle_down.png",
 "$root/player-shoes-black-20260928/shoes_basic_black_idle_down.png",
 "$root/player-outfit-white-black-20260928/top_tshirt_white_idle_down.png",
 "$root/player-face-black-20260928/face_default_idle_down.png",
 "$root/player-hair-short-black-20260928/hair_short_front_idle_down.png"
)
$names=@('hair_back','body','shorts','shoes','shirt','face','hair_front')
$images=@($paths | ForEach-Object {[System.Drawing.Bitmap]::new($_)})
$lines=@()
for($i=0;$i -lt $images.Count;$i++){$lines+= $names[$i]+': '+[LayerAudit]::Stats($images[$i])}
$lines+='face covered by hair: '+[LayerAudit]::Covered($images[5],$images[6],0,0,1221,1286)
$lines+='left eye covered by hair: '+[LayerAudit]::Covered($images[5],$images[6],417,545,560,665)
$lines+='right eye covered by hair: '+[LayerAudit]::Covered($images[5],$images[6],663,545,804,665)
$lines+='shorts covered by shirt: '+[LayerAudit]::Covered($images[2],$images[4],0,0,1221,1287)
$lines | Set-Content -Encoding utf8 "$PSScriptRoot/measurements.txt"
$lines
# Render only an inspection contact sheet; source PNGs are unchanged.
$sheet=[System.Drawing.Bitmap]::new(1222,1368)
$g=[System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::FromArgb(224,230,237))
$font=[System.Drawing.Font]::new('Arial',18)
$sets=@(@(0,1,2,3,4,5,6),@(1,2,3,4,5),@(1,5),@(1,2,3))
$titles=@('A  Original full stack','B  Hair hidden','C  Body + face','D  Body + shorts + shoes')
for($k=0;$k -lt 4;$k++){
 $canvas=[System.Drawing.Bitmap]::new(1222,1288)
 $cg=[System.Drawing.Graphics]::FromImage($canvas)
 foreach($idx in $sets[$k]){$cg.DrawImageUnscaled($images[$idx],0,0)}
 $ox=($k%2)*611;$oy=[Math]::Floor($k/2)*684
 $g.DrawString($titles[$k],$font,[System.Drawing.Brushes]::Black,[single]($ox+12),[single]($oy+8))
 $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
 $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
 $g.DrawImage($canvas,[System.Drawing.Rectangle]::new($ox,$oy+40,611,644),0,0,1222,1288,[System.Drawing.GraphicsUnit]::Pixel)
 $cg.Dispose();$canvas.Dispose()
}
$sheet.Save("$PSScriptRoot/review-contact-sheet.png",[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$sheet.Dispose();$font.Dispose()
foreach($im in $images){$im.Dispose()}
