$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$sourceRoot = Join-Path $taskRoot 'web'
$runtimeRoot = Join-Path $taskRoot 'electron-app/dist/win-unpacked/resources/web'
if (!(Test-Path -LiteralPath (Join-Path $runtimeRoot 'index.html'))) { throw 'Existing runtime not found' }
$modules = @(
    'js/components/town3d/SomangiAssets.js',
    'js/components/town3d/SomangiExpressions.js',
    'js/components/town3d/MoaCharacter.js',
    'js/components/town3d/SleepingAnna.js',
    'js/components/town3d/TownModelScene.js',
    'js/components/information3d/InformationModelRoom.js',
    'js/components/cipher3d/CipherLobbyScene.js',
    'js/data/moaModels.js',
    'js/data/informationModelRoom.js',
    'js/app/InformationModelEntrance.js',
    'js/app/exhibition/Arrival.js',
    'js/app/exhibition/SomangiPresentation.js'
)
foreach ($relative in $modules) {
    $target = Join-Path $runtimeRoot $relative
    New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $sourceRoot $relative) -Destination $target -Force
}
$assetSource = Join-Path $sourceRoot 'assets/characters/3d/moa'
foreach ($file in Get-ChildItem -LiteralPath $assetSource -Recurse -File) {
    $relative = [IO.Path]::GetRelativePath($sourceRoot, $file.FullName)
    $target = Join-Path $runtimeRoot $relative
    New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
    Copy-Item -LiteralPath $file.FullName -Destination $target -Force
}
Write-Output 'Updated Moa assets and 12 character-related modules in the existing runtime.'
