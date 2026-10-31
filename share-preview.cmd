@echo off
rem Starts the TravelMateVR preview and a public Cloudflare link for people outside your Wi-Fi.
rem Keep both windows that open running; closing them (or sleep/restart) stops the link.
cd /d "%~dp0"
if not exist dist\index.html (
  echo Building the site first...
  call npm run build || goto :eof
)
start "TravelMateVR preview server (visitor log)" /min cmd /c "node scripts\preview-server.mjs 4173"
timeout /t 6 /nobreak >nul
if not exist .tunnel\cloudflared.exe (
  echo Downloading cloudflared...
  mkdir .tunnel 2>nul
  powershell -NoProfile -Command "Invoke-WebRequest -Uri https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -OutFile .tunnel\cloudflared.exe"
)
if exist .tunnel\tunnel.log del .tunnel\tunnel.log
start "TravelMateVR public link (keep open)" /min .tunnel\cloudflared.exe tunnel --no-autoupdate --url http://127.0.0.1:4173 --logfile .tunnel\tunnel.log
echo Waiting for the public link...
powershell -NoProfile -Command "for($i=0;$i -lt 30;$i++){Start-Sleep 2; if(Test-Path .tunnel\tunnel.log){$m=Select-String .tunnel\tunnel.log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com'|Select-Object -First 1; if($m){$u=$m.Matches[0].Value; Set-Content .tunnel\link.txt $u; Write-Host ''; Write-Host ('Share this link: ' + $u) -ForegroundColor Green; Set-Clipboard $u; Write-Host '(copied to clipboard)'; exit}}}; Write-Host 'No link yet - check .tunnel\tunnel.log' -ForegroundColor Yellow"
echo.
echo See who visits: http://localhost:4173/__visitors (only works on this computer)
start "" http://localhost:4173/__visitors
echo.
pause
