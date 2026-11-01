"""Serves the repository root for the mock-ups, like `python3 -m http.server`, but tells the
browser never to cache: after a change, a reload always gets every file of the mock-up (pages and
shared/), never a mix of old and new ones. Copy it to docs/mockups/serve.py, then, from the
repository root, on the port of the project (docs/technical-choices.md, Commands):

    python3 docs/mockups/serve.py 8781

and open http://127.0.0.1:8781/docs/mockups/<name>.html. To check the mock-up on a phone on the
same Wi-Fi, for the time of the check only, serve it on the local network:

    python3 docs/mockups/serve.py 8781 0.0.0.0

and open http://<address of the computer>:8781/docs/mockups/<name>.html on the phone (the
firewall of the computer may have to allow the port); then serve it on 127.0.0.1 again.
"""

import http.server
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8781
host = sys.argv[2] if len(sys.argv) > 2 else "127.0.0.1"
http.server.ThreadingHTTPServer((host, port), NoCache).serve_forever()
