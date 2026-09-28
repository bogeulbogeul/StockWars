$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives,System.Private.Windows.GdiPlus,System.Private.Windows.Core -TypeDefinition @'
using System;
using System.Drawing;
public class CleanParts {
 public static Bitmap Make(string path,double sx,double sy,double ox,double oy,string[] colors){
  using(var src=new Bitmap(path)){
   var dst=new Bitmap(1222,1287); var pal=Array.ConvertAll(colors,ColorTranslator.FromHtml);
   for(int y=0;y<1287;y+=8)for(int x=0;x<1222;x+=8){
    int n=0,r=0,g=0,b=0;
    for(int j=0;j<8;j+=2)for(int i=0;i<8;i+=2){int px=(int)Math.Floor((x+i-ox)/sx),py=(int)Math.Floor((y+j-oy)/sy);if(px<0||py<0||px>=src.Width||py>=src.Height)continue;var c=src.GetPixel(px,py);if(c.A<128)continue;n++;r+=c.R;g+=c.G;b+=c.B;}
    if(n<8)continue;r/=n;g/=n;b/=n;Color best=pal[0];int dist=int.MaxValue;
    foreach(var c in pal){int d=(c.R-r)*(c.R-r)+(c.G-g)*(c.G-g)+(c.B-b)*(c.B-b);if(d<dist){dist=d;best=c;}}
    for(int j=y;j<Math.Min(y+8,1287);j++)for(int i=x;i<Math.Min(x+8,1222);i++)dst.SetPixel(i,j,best);
   }
   if(path.Contains("02_13_32")){
    for(int pass=0;pass<2;pass++){
     using(var prev=(Bitmap)dst.Clone()){
      for(int y=8;y<1272;y+=8)for(int x=8;x<1208;x+=8){
       if(prev.GetPixel(x,y).A==0)continue;
       int[] counts=new int[pal.Length];bool interior=true;
       for(int dy=-8;dy<=8;dy+=8)for(int dx=-8;dx<=8;dx+=8){if(dx==0&&dy==0)continue;var c=prev.GetPixel(x+dx,y+dy);if(c.A==0){interior=false;continue;}for(int k=0;k<pal.Length;k++)if(c.ToArgb()==pal[k].ToArgb())counts[k]++;}
       if(!interior)continue;
       for(int k=1;k<pal.Length;k++)if(counts[k]>=5){for(int j=y;j<y+8;j++)for(int i=x;i<x+8;i++)dst.SetPixel(i,j,pal[k]);break;}
      }
     }
    }
   }
   return dst;
  }
 }
}
'@
$root='C:/GitHub/StockWars/output/imagegen'
$dest="$PSScriptRoot/parts"
New-Item -ItemType Directory -Force $dest | Out-Null
$outline='#291623'
$hair=@($outline,'#202023','#414144','#7a7a7d')
$skin=@($outline,'#eda58f','#ffd2b9','#ffe7cf')
$dark=@($outline,'#202126','#32343b','#50525a')
$white=@($outline,'#bfc0ce','#e1e2ea','#fffcf7')
$face=@($outline,'#202025','#4b4b51','#fff9ef','#b96155')
$specs=@(
 @('hair_short_back_idle_down',"$root/player-hair-short-black-20260928/hair_short_back_idle_down.png",1,1,0,0,$hair),
 @('base_skin_idle_down','C:/Users/Administrator/Videos/Downloads/ChatGPT 이미지 2026년 9월 28일 오후 02_13_32.png',1,1,0,0,$skin),
 @('bottom_shorts_black_idle_down',"$root/player-outfit-white-black-20260928/bottom_shorts_black_idle_down.png",1,0.72,0,244,$dark),
 @('shoes_basic_black_idle_down',"$root/player-shoes-black-20260928/shoes_basic_black_idle_down.png",1,0.70,0,295,$dark),
 @('top_tshirt_white_idle_down',"$root/player-outfit-white-black-20260928/top_tshirt_white_idle_down.png",1.08,0.84,-49,95,$white),
 @('face_default_idle_down',"$root/player-face-black-20260928/face_default_idle_down.png",1,1,0,0,$face),
 @('hair_short_front_idle_down',"$root/player-hair-short-black-v2-20260928/hair_short_front_idle_down_v3.png",1,1,0,0,$hair)
)
$imgs=@()
foreach($s in $specs){$im=[CleanParts]::Make($s[1],$s[2],$s[3],$s[4],$s[5],$s[6]);$im.Save("$dest/$($s[0]).png");$imgs+=,$im}
$mask=[System.Drawing.Bitmap]::new(1222,1287)
$mg=[System.Drawing.Graphics]::FromImage($mask)
$mg.FillRectangle([System.Drawing.Brushes]::White,0,1024,1222,263)
$mask.Save("$dest/shoes_body_hide_mask_idle_down.png")
$mg.Dispose();$mask.Dispose()
# Mask applies only to body while these shoes are equipped; keep bare body intact.
for($y=1024;$y -lt 1287;$y++){for($x=0;$x -lt 1222;$x++){$imgs[1].SetPixel($x,$y,[System.Drawing.Color]::Transparent)}}
$canvas=[System.Drawing.Bitmap]::new(1222,1287)
$cg=[System.Drawing.Graphics]::FromImage($canvas)
foreach($im in $imgs){$cg.DrawImageUnscaled($im,0,0)}
$canvas.Save("$PSScriptRoot/player_composite_idle_down.png")
$preview=[System.Drawing.Bitmap]::new(611,644)
$g=[System.Drawing.Graphics]::FromImage($preview)
$g.Clear([System.Drawing.Color]::FromArgb(224,230,237))
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$g.DrawImage($canvas,[System.Drawing.Rectangle]::new(0,0,611,644),0,0,1222,1288,[System.Drawing.GraphicsUnit]::Pixel)
$preview.Save("$PSScriptRoot/preview.png")
$g.Dispose();$preview.Dispose();$cg.Dispose();$canvas.Dispose()
foreach($im in $imgs){$im.Dispose()}

