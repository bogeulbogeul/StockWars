Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing;
public class RabbitBounds {
public static void Scan(string path) {using(var b=new Bitmap(path)) {
Console.WriteLine(b.Width+" x "+b.Height);
int[] ys={220,440,650,870,1080,1300,1530,1750};
foreach(int target in ys){int best=target,min=int.MaxValue;for(int y=target-25;y<=target+25;y++){int n=0;for(int x=0;x<b.Width;x++)if(b.GetPixel(x,y).A>128)n++;if(n<min){min=n;best=y;}}Console.WriteLine(target+" -> "+best+" count "+min);}
}}
}
'@
[RabbitBounds]::Scan((Join-Path $PSScriptRoot 'sprite-sheet.png'))
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
public class RabbitFrames {
public static string Build(string path) {using(var b=new System.Drawing.Bitmap(path)) {
int[] ys={0,220,441,646,872,1076,1304,1528,1754,2103}; int[] xs={0,190,380,566,748}; int[] counts={1,3,1,3,1,3,4,1,2};
var rows=new System.Collections.Generic.List<string>();
for(int r=0;r<9;r++){var fs=new System.Collections.Generic.List<string>();int baseline=0;for(int c=0;c<counts[r];c++){int x0=xs[c+1],y0=ys[r+1],x1=0,y1=0;for(int y=ys[r];y<ys[r+1];y++)for(int x=xs[c];x<xs[c+1];x++){if(b.GetPixel(x,y).A>180){x0=System.Math.Min(x0,x);x1=System.Math.Max(x1,x);y0=System.Math.Min(y0,y);y1=System.Math.Max(y1,y);}}baseline=System.Math.Max(baseline,y1);fs.Add("{\"x\":"+x0+",\"y\":"+y0+",\"w\":"+(x1-x0+1)+",\"h\":"+(y1-y0+1)+",\"centerX\":"+((xs[c]+xs[c+1])/2)+"}");}rows.Add("{\"baseline\":"+baseline+",\"frames\":["+string.Join(",",fs)+"]}");}
return "{\"image\":\"sprite-sheet.png\",\"rows\":["+string.Join(",",rows)+"]}";
}}
}
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'frames.json'),[RabbitFrames]::Build((Join-Path $PSScriptRoot 'sprite-sheet.png')))
