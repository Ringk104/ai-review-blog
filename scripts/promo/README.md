# 뷰잇 소개 모션 (세로 1080×1920, 28초, 소리 없음)

- `render.js` — 시간 t 를 받아 한 프레임을 그리는 렌더러. 문구·숫자는 여기서 고친다
- `sheet.html?t=1,5,9` — 지정한 시점의 프레임을 한 화면에 모아 보기
- `export.html?w=720&h=1280&vb=2500000&name=viewit-intro.mp4` — 브라우저(WebCodecs + mp4-muxer)로 MP4 와 포스터 JPG 를 만들어 `/save` 로 이 폴더에 저장

순서: `python scripts/promo/serve.py 8771` → 브라우저로 `http://127.0.0.1:8771/export.html?...` 열기 → 생긴 파일을 `static/videos/` 로 복사.
사이트용은 720×1280(약 5.2MB), 쇼츠용은 `w=1080&h=1920&vb=5000000`.
