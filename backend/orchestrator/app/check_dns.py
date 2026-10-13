import urllib.request

for name, url in [
    ("resume-service", "http://resume-service:8001/health"),
    ("project-service", "http://project-service:8002/health"),
    ("coding-service", "http://coding-service:8003/health"),
    ("video-service", "http://video-service:8004/health"),
]:
    with urllib.request.urlopen(url) as r:
        print(f"{name}: {r.status} -> {r.read().decode().strip()}")
