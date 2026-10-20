$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath 'C:/GitHub/StockWars').Path
$archive = Join-Path $project 'output/retired-cipher-images-2026-10-20'
$roots = @('web', 'electron-app/dist/win-unpacked/resources/web')
$targets = @('assets/interiors/cipher', 'assets/buildings/CipherBuilding.png',
    'assets/buildings/topdown-v1/CipherBuilding.png', 'assets/buildings/topdown-v1/CipherBuilding-door-v2.png')
$manifest = @()
foreach ($root in $roots) {
    foreach ($relative in $targets) {
        $source = Join-Path (Join-Path $project $root) $relative
        if (-not (Test-Path -LiteralPath $source)) { continue }
        $resolved = (Resolve-Path -LiteralPath $source).Path
        $destination = [IO.Path]::GetFullPath((Join-Path (Join-Path $archive $root) $relative))
        if (-not $resolved.StartsWith($project + '\', [StringComparison]::OrdinalIgnoreCase) -or
            -not $destination.StartsWith($archive + '\', [StringComparison]::OrdinalIgnoreCase)) {
            throw "Unexpected archive path: $resolved -> $destination"
        }
        if (Test-Path -LiteralPath $destination) { throw "Archive already exists: $destination" }
        foreach ($file in (Get-ChildItem -LiteralPath $resolved -File -Recurse)) {
            $manifest += [pscustomobject]@{ source=$file.FullName.Substring($project.Length+1);
                sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash }
        }
        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        Move-Item -LiteralPath $resolved -Destination $destination
    }
}
$manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $archive 'manifest.json') -Encoding utf8
Write-Output "Archived $($manifest.Count) files; current 3D and save data untouched."
