$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidRoot = Join-Path $projectRoot 'android'
$gradleUserHome = Join-Path $projectRoot '.gradle-user'
$apkPath = Join-Path $androidRoot 'app\build\outputs\apk\debug\app-debug.apk'

$env:GRADLE_USER_HOME = $gradleUserHome
$env:JAVA_TOOL_OPTIONS = '--enable-native-access=ALL-UNNAMED'

Push-Location $androidRoot
try {
  & '.\gradlew.bat' ':app:assembleDebug' '--no-daemon'
  if ($LASTEXITCODE -ne 0) {
    throw "Gradle build failed with exit code $LASTEXITCODE."
  }
}
finally {
  Pop-Location
}

if (-not (Test-Path -LiteralPath $apkPath)) {
  throw "APK was not created: $apkPath"
}

Get-Item -LiteralPath $apkPath | Select-Object FullName, Length, LastWriteTime
