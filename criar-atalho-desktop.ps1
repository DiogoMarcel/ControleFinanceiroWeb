$batPath = Join-Path $PSScriptRoot "iniciar.bat"
$shortcutPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "Controle Financeiro.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.Description = "Iniciar Controle Financeiro Web"
$shortcut.IconLocation = "shell32.dll,175"
$shortcut.Save()

Write-Host "Atalho criado em: $shortcutPath" -ForegroundColor Green
