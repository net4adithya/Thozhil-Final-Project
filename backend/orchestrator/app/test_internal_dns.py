import urllib.request

services = [
    ("resume-service", "http://resume-service:8001/health"),
    ("project-service", "http://project-service:8002/health"),
    ("coding-service", "http://coding-service:8003/health"),
    ("video-service", "http://video-service:8004/health"),
]

print("=== CONTAINER INTERNAL DNS & NETWORKING TEST ===")
for name, url in services:
    try:
        with urllib.request.urlopen(url, timeout=5) as res:
            print(f"[{name}] -> {url} : HTTP {res.status} -> {res.read().decode()}")
    except Exception as e:
        print(f"[{name}] -> {url} : ERROR ({e})")
