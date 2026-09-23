param(
    [string]$Url = 'https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Field-of-Study_06102026.zip'
)

$ErrorActionPreference = 'Stop'
$dataDir = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')) 'data'
$zipPath = Join-Path $dataDir 'scorecard-field-of-study-2026.zip'
Invoke-WebRequest -Uri $Url -OutFile $zipPath
Expand-Archive -LiteralPath $zipPath -DestinationPath $dataDir -Force
Write-Output "Downloaded and extracted College Scorecard field-of-study data to $dataDir"
