$hit = Get-CimInstance Win32_Process | Where-Object {
  $c = $_.CommandLine
  if (-not $c) { return $false }
  if ($c -match 'detect-android-build') { return $false }
  return (
    $c -match 'gradlew(\.bat)?' -or
    $c -match 'GradleWrapperMain' -or
    $c -match 'installDebug' -or
    $c -match 'run-android'
  )
}
if ($hit) { 'YES' } else { 'NO' }
