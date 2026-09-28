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
$dir=$PSScriptRoot
$names=@('hair_short_back','base_skin','bottom_shorts_black','shoes_basic_black','top_tshirt_white','face_default','hair_short_front')
$imgs=@($names | ForEach-Object {[System.Drawing.Bitmap]::new("$dir/parts/$($_)_idle_down.png")})
$lines=@()
for($i=0;$i -lt $imgs.Count;$i++){$lines+=$names[$i]+': '+[LayerAudit]::Stats($imgs[$i])}
$lines+='face covered by hair: '+[LayerAudit]::Covered($imgs[5],$imgs[6],0,0,1221,1286)
$lines+='shorts covered by shirt: '+[LayerAudit]::Covered($imgs[2],$imgs[4],0,0,1221,1286)
$lines+='feet covered by shoes (below y1024): '+[LayerAudit]::Covered($imgs[1],$imgs[3],460,1024,760,1286)
$mask=[System.Drawing.Bitmap]::new("$dir/parts/shoes_body_hide_mask_idle_down.png")
$lines+='shoe mask: '+[LayerAudit]::Stats($mask)
$lines+='feet covered by hide mask (below y1024): '+[LayerAudit]::Covered($imgs[1],$mask,460,1024,760,1286)
$mask.Dispose()
$lines | Set-Content "$dir/measurements.txt"
$lines
foreach($im in $imgs){$im.Dispose()}

