---
title: "검색"
layout: "search"
placeholder: "글 제목, 키워드로 검색..."
# robots.txt 가 /search/ 를 Disallow 하는데 사이트맵에는 실려 있었다.
# 색인하지 말라면서 색인하라고 제출한 셈이라 GSC 가 '사이트맵에 포함된
# 페이지가 robots.txt 에 의해 차단됨' 으로 경고했다(2026-08-17 알림).
# 검색 페이지는 색인 가치가 없으므로 사이트맵에서 뺀다.
sitemap:
  disable: true
---
