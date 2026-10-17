"""Run the downloaded Figlyph locally with Python 3."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser

if __name__ == '__main__':
    here = Path(__file__).resolve().parent
    root = here.parent if here.name == 'editor' else here
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    server = None
    for port in range(8000, 8011):
        try:
            server = ThreadingHTTPServer(('127.0.0.1', port), handler)
            break
        except OSError:
            continue
    if server is None:
        raise SystemExit('Ports 8000-8010 are busy. Close another local server and retry.')
    url = f'http://127.0.0.1:{port}/editor/'
    print('Figlyph:', url, '\nPress Ctrl+C to stop.')
    Timer(0.7, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
