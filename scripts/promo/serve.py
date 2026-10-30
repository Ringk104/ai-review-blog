"""팩트뷰 소개 모션 내보내기용 로컬 서버 — 이 폴더를 서빙하고 POST /save 로 받은 파일을 저장한다. 127.0.0.1 전용."""
import http.server, os, sys, urllib.parse
ROOT = os.path.dirname(os.path.abspath(__file__))
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def end_headers(s):
        s.send_header('Cache-Control', 'no-store'); super().end_headers()
    def do_POST(s):
        u = urllib.parse.urlparse(s.path)
        if u.path != '/save': return s.send_error(404)
        name = os.path.basename(urllib.parse.parse_qs(u.query).get('name', ['out.bin'])[0])
        data = s.rfile.read(int(s.headers.get('Content-Length', 0)))
        open(os.path.join(ROOT, name), 'wb').write(data)
        s.send_response(200); s.end_headers(); s.wfile.write(b'ok')
if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8771), H).serve_forever()
