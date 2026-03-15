# Update WSL port forwarding for Hindsight
# Run as Administrator on startup

$wslIP = (wsl -d Ubuntu -e bash -c "hostname -I") -replace '\s+',''
if ($wslIP) {
    netsh interface portproxy delete v4tov4 listenport=8888 listenaddress=127.0.0.1 2>$null
    netsh interface portproxy add v4tov4 listenport=8888 listenaddress=127.0.0.1 connectport=8888 connectaddress=$wslIP
    Write-Host "Port forwarding updated: 127.0.0.1:8888 -> ${wslIP}:8888"
} else {
    Write-Host "WSL not running"
}
