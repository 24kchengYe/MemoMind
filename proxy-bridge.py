"""
Proxy bridge: binds 0.0.0.0:2081 and forwards to 127.0.0.1:2080 (Clash).
Run on Windows so WSL can reach Clash proxy via {Windows_IP}:2081.
"""
import socket, threading, sys

LOCAL_PORT = 12080
TARGET_HOST = "127.0.0.1"
TARGET_PORT = 2080

def forward(src, dst):
    try:
        while True:
            data = src.recv(65536)
            if not data:
                break
            dst.sendall(data)
    except:
        pass
    finally:
        try: src.shutdown(socket.SHUT_RD)
        except: pass
        try: dst.shutdown(socket.SHUT_WR)
        except: pass

def handle(client):
    try:
        target = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        target.settimeout(30)
        target.connect((TARGET_HOST, TARGET_PORT))
        t1 = threading.Thread(target=forward, args=(client, target), daemon=True)
        t2 = threading.Thread(target=forward, args=(target, client), daemon=True)
        t1.start()
        t2.start()
        t1.join()
        t2.join()
    except Exception as e:
        pass
    finally:
        try: client.close()
        except: pass
        try: target.close()
        except: pass

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", LOCAL_PORT))
    server.listen(32)
    print(f"[proxy-bridge] 0.0.0.0:{LOCAL_PORT} -> {TARGET_HOST}:{TARGET_PORT}")
    while True:
        client, _ = server.accept()
        threading.Thread(target=handle, args=(client,), daemon=True).start()

if __name__ == "__main__":
    main()
