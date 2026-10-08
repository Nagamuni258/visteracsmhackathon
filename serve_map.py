#!/usr/bin/env python3
"""
Simple HTTP server to serve the live map demo
"""
import http.server
import socketserver
import os
import webbrowser
import threading
import time

PORT = 8080
DIRECTORY = "/c/Users/nagam/OneDrive/ドキュメント/projects/visteriacsmhackathon"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def open_browser():
    time.sleep(1)
    webbrowser.open(f'http://localhost:{PORT}/live_map_demo.html')

if __name__ == "__main__":
    os.chdir(DIRECTORY)

    # Open browser in background
    thread = threading.Thread(target=open_browser)
    thread.daemon = True
    thread.start()

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving live map demo at http://localhost:{PORT}/live_map_demo.html")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")