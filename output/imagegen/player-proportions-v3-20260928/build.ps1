$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives,System.Private.Windows.GdiPlus,System.Private.Windows.Core -TypeDefinition @'
using System;
using System.Drawing;
public class Proportion {
 static Color C(string s){return ColorTranslator.FromHtml(s);}
 public static void Run(string src,string dest){
 string[] ids={"hair_short_back","base_skin","bottom_shorts_black","shoes_basic_black","top_tshirt_white","face_default","hair_short_front","shoes_body_hide_mask"};
 Bitmap[] a=new Bitmap[8];
 for(int k=0;k<8;k++)using(var old=new Bitmap(src+"/parts/"+ids[k]+"_idle_down.png")){
  a[k]=new Bitmap(1222,1287);
  for(int y=0;y<1280;y+=8)for(int x=0;x<1216;x+=8){
   bool head=k==0||k==5||k==6||(k==1&&y<712);
   double sx=head?608+(x+4-608)/0.72:608+(x+4-608)/0.86;
   double sy=head?744+(y+4-710.4)/0.72:1080+(y+4-1080)/1.10;
   int ix=(int)Math.Floor(sx),iy=(int)Math.Floor(sy);if(ix<0||iy<0||ix>=old.Width||iy>=old.Height)continue;
   var c=old.GetPixel(ix,iy);if(c.A==0)continue;
   for(int j=y;j<y+8;j++)for(int i=x;i<x+8;i++)a[k].SetPixel(i,j,c);
  }
  if(k==5){
   for(int y=664;y<704;y++)for(int x=584;x<632;x++)a[k].SetPixel(x,y,Color.Transparent);
   for(int y=672;y<688;y++)for(int x=592;x<624;x++)if((y<680&&(x<600||x>=616))||(y>=680&&x>=600&&x<616))a[k].SetPixel(x,y,C("#b96155"));
  }
  a[k].Save(dest+"/parts/"+ids[k]+"_idle_down.png");
 }
 using(var canvas=new Bitmap(1222,1287)){
  for(int y=0;y<1287;y++)for(int x=0;x<1222;x++)if(a[7].GetPixel(x,y).A>0)a[1].SetPixel(x,y,Color.Transparent);
  using(var g=Graphics.FromImage(canvas))for(int k=0;k<7;k++)g.DrawImageUnscaled(a[k],0,0);
  canvas.Save(dest+"/player_composite_idle_down.png");
  using(var p=new Bitmap(611,644))using(var g=Graphics.FromImage(p)){
   g.Clear(C("#e0e6ed"));g.InterpolationMode=System.Drawing.Drawing2D.InterpolationMode.NearestNeighbor;g.PixelOffsetMode=System.Drawing.Drawing2D.PixelOffsetMode.Half;
   g.DrawImage(canvas,new Rectangle(0,0,611,644),0,0,1222,1288,GraphicsUnit.Pixel);p.Save(dest+"/preview.png");
  }
 }
 foreach(var b in a)b.Dispose();
 using(var before=new Bitmap(src+"/preview.png"))using(var after=new Bitmap(dest+"/preview.png"))using(var sheet=new Bitmap(1222,688))using(var g=Graphics.FromImage(sheet))using(var font=new Font("Arial",18)){
  g.Clear(C("#e0e6ed"));g.DrawImageUnscaled(before,0,44);g.DrawImageUnscaled(after,611,44);g.DrawString("BEFORE",font,Brushes.Black,24,10);g.DrawString("AFTER",font,Brushes.Black,635,10);sheet.Save(dest+"/comparison.png");
 }
 }
}
'@
New-Item -ItemType Directory -Force "$PSScriptRoot/parts" | Out-Null
[Proportion]::Run('C:/GitHub/StockWars/output/imagegen/player-cleanup-v2-20260928',$PSScriptRoot)
