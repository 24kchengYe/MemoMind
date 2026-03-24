# MemoMind: Update WSL port forwarding
# Run as Administrator on startup

$wslIP = (wsl -d Ubuntu -e bash -c "hostname -I").Trim().Split()[0]
if ($wslIP) {
    # Forward 8888 (MemoMind API) from Windows localhost to WSL
    netsh interface portproxy delete v4tov4 listenport=18888 listenaddress=127.0.0.1 2>$null
    netsh interface portproxy add v4tov4 listenport=18888 listenaddress=127.0.0.1 connectport=18888 connectaddress=$wslIP
    Write-Host "Port forwarding updated: 127.0.0.1:8888 -> ${wslIP}:8888"
} else {
    Write-Host "WSL not running"
}
