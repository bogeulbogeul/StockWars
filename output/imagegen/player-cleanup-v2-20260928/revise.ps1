$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives,System.Private.Windows.GdiPlus,System.Private.Windows.Core -TypeDefinition @'
using System;
using System.Drawing;
public class Revise {
 static Color C(string h){return ColorTranslator.FromHtml(h);}
 static void Rect(Bitmap b,int x,int y,int w,int h,Color c){for(int j=y;j<y+h;j++)for(int i=x;i<x+w;i++)b.SetPixel(i,j,c);}
 public static void Run(string src,string dest){
 string[] ids={"hair_short_back","base_skin","bottom_shorts_black","shoes_basic_black","top_tshirt_white","face_default","hair_short_front"};
 Bitmap[] a=new Bitmap[7];for(int i=0;i<7;i++)a[i]=new Bitmap(src+"/parts/"+ids[i]+"_idle_down.png");
 // Lengthen fringe with crown registration fixed; keep eye rectangles clear.
 using(var old=(Bitmap)a[6].Clone()){
  for(int y=320;y<704;y++)for(int x=0;x<1222;x++){
   int sy=320+((y-320)/8*4/5)*8+(y%8);var c=old.GetPixel(x,sy);
   if(y>=544&&((x>=416&&x<568)||(x>=664&&x<808)))c=Color.Transparent;
   a[6].SetPixel(x,y,c);
  }
 }
 // Neutral eye palette only. Keep brows, replace eye forms and mouth deliberately.
 var ink=C("#26232d");var black=C("#202126");var gray=C("#4b4d55");var white=C("#fffaf1");
 for(int y=0;y<536;y++)for(int x=0;x<1222;x++)if(a[5].GetPixel(x,y).A>0)a[5].SetPixel(x,y,ink);
 Rect(a[5],0,536,1222,751,Color.Transparent);
 string[] eye={
 "....##########....",
 "..##############..",
 ".################.",
 ".#WWKKWWWKKKKKWW#.",
 "##WWKKWWWKKKKKWW##",
 "##WWKKWWWKKKKKWW##",
 "##WWKKKKKKKKKKWW##",
 "##WWKKKKKKKKKKWW##",
 "##WWKKKKKKKKKKWW##",
 "##WWKKKKKKKKKKWW##",
 "##WWKKKKKKKKKKWW##",
 ".#WWKGGGGGGGKKWW#.",
 ".#WWWGGGGGGGGWWW#.",
 "..#WWWGGGGGGWWW#..",
 "...###WWWWWW###...",
 ".....########....."};
 foreach(int ox in new int[]{416,664})for(int y=0;y<eye.Length;y++)for(int x=0;x<18;x++){
  char ch=eye[y][x];if(ch=='.')continue;var c=ch=='#'?ink:ch=='W'?white:ch=='G'?gray:black;Rect(a[5],ox+x*8,544+y*8,8,8,c);
 }
 var mouth=C("#b96155");Rect(a[5],584,688,8,8,mouth);Rect(a[5],592,696,24,8,mouth);Rect(a[5],616,688,8,8,mouth);
 // Fill tiny central waistband hole and align the crotch/inner leg edges.
 Rect(a[2],584,920,48,40,black);
 Rect(a[2],600,952,16,24,ink);
 // Simple small slip-on shoes, no laces or scattered reflections.
 a[3].Dispose();a[3]=new Bitmap(1222,1287);
 foreach(int ox in new int[]{496,632}){
  Rect(a[3],ox+8,1016,80,8,ink);Rect(a[3],ox,1024,96,48,ink);Rect(a[3],ox+8,1072,80,8,ink);
  Rect(a[3],ox+8,1024,80,40,black);Rect(a[3],ox+16,1024,56,8,C("#3b3d45"));
 }
 for(int i=0;i<7;i++)a[i].Save(dest+"/parts/"+ids[i]+"_idle_down.png");
 using(var mask=new Bitmap(1222,1287)){
  Rect(mask,0,1016,1222,271,Color.White);mask.Save(dest+"/parts/shoes_body_hide_mask_idle_down.png");
 }
 Rect(a[1],0,1016,1222,271,Color.Transparent);
 using(var all=new Bitmap(1222,1287)){
  using(var g=Graphics.FromImage(all))foreach(var b in a)g.DrawImageUnscaled(b,0,0);
  all.Save(dest+"/player_composite_idle_down.png");
  using(var p=new Bitmap(611,644))using(var g=Graphics.FromImage(p)){
   g.Clear(C("#e0e6ed"));g.InterpolationMode=System.Drawing.Drawing2D.InterpolationMode.NearestNeighbor;g.PixelOffsetMode=System.Drawing.Drawing2D.PixelOffsetMode.Half;
   g.DrawImage(all,new Rectangle(0,0,611,644),0,0,1222,1288,GraphicsUnit.Pixel);p.Save(dest+"/preview.png");
  }
 }
 foreach(var b in a)b.Dispose();
 }
}
'@
New-Item -ItemType Directory -Force "$PSScriptRoot/parts" | Out-Null
[Revise]::Run('C:/GitHub/StockWars/output/imagegen/player-outfit-cleanup-20260928',$PSScriptRoot)
