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
$lines=@()
foreach($p in Get-ChildItem "$PSScriptRoot/parts" -Filter '*.png'){
 $b=[System.Drawing.Bitmap]::new($p.FullName)
 $stats=[LayerAudit]::Stats($b)
 if($b.Width -ne 1222 -or $b.Height -ne 1287 -or $stats -notmatch 'partial=0 '){throw "Invalid part: $($p.Name)"}
 $lines+=$p.Name+': '+$stats
 $b.Dispose()
}
$f=[System.Drawing.Bitmap]::new("$PSScriptRoot/parts/face_default_idle_down.png")
$h=[System.Drawing.Bitmap]::new("$PSScriptRoot/parts/hair_short_front_idle_down.png")
$lines+='left eye hair overlap: '+[LayerAudit]::Covered($f,$h,472,568,575,663)
$lines+='right eye hair overlap: '+[LayerAudit]::Covered($f,$h,648,568,751,663)
$f.Dispose();$h.Dispose()
$lines | Set-Content "$PSScriptRoot/measurements.txt"
$lines

