/*
 * 뷰잇 소개 모션 — 렌더러 (세로 1080×1920, 28초)
 *
 * 시간 t(초)를 받아 한 프레임을 그린다(결정적). 미리보기와 MP4 인코딩이 같이 쓴다.
 * 흐름은 소개 페이지(/posts/about/, 2026-10-30)의 고장 해결 방향 그대로.
 * 점검 순서(메인 브러시 → 사이드브러시 → 앞바퀴 → 구동 바퀴는 고객지원)는
 * «로보락에서 끼익 소리가 날 때» 글(로보락 고객지원 안내)과 같다.
 * 2장의 엇갈리는 조언 카드는 특정 글이 아닌 흔한 검색 결과를 흉내 낸 것이다.
 * 로봇청소기 그림은 특정 브랜드가 아닌 일반형.
 */
;(function (root) {
  'use strict'

  const W = 1080
  const H = 1920
  const DURATION = 28

  const C = {
    top: '#1E40AF',
    bottom: '#4C1D95',
    blue: '#2563EB',
    violet: '#7C3AED',
    amber: '#F59E0B',
    amberHi: '#FBBF24',
    white: '#FFFFFF',
    soft: 'rgba(255,255,255,0.72)',
    faint: 'rgba(255,255,255,0.14)',
    ink: '#0F172A',
    red: '#F87171',
    green: '#34D399',
    robot: '#F1F5F9',
    robotEdge: '#94A3B8',
  }
  const KR = "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"

  const CHAPTERS = [
    { t: 0, label: '갑자기 이상할 때' },
    { t: 5.4, label: '방법이 제각각' },
    { t: 10.6, label: '설명서대로, 순서대로' },
    { t: 17.0, label: '다시 돈다' },
    { t: 21.6, label: '뷰잇' },
  ]

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
  const p = (t, a, b) => clamp((t - a) / (b - a))
  const lerp = (a, b, k) => a + (b - a) * k
  const eo3 = (k) => 1 - Math.pow(1 - k, 3)
  const eio3 = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
  const ei2 = (k) => k * k
  const eoBack = (k) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2)
  }

  function rng(seed) {
    return function () {
      seed |= 0
      seed = (seed + 0x6d2b79f5) | 0
      let x = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296
    }
  }

  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
    else {
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    }
  }

  function text(ctx, s, x, y, o = {}) {
    const alpha = o.alpha ?? 1
    if (alpha <= 0) return
    ctx.save()
    ctx.globalAlpha *= alpha
    ctx.font = `${o.weight || 500} ${o.size || 40}px ${KR}`
    ctx.fillStyle = o.color || C.white
    ctx.textAlign = o.align || 'center'
    ctx.textBaseline = 'alphabetic'
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${o.ls || 0}px`
    ctx.fillText(s, x, y)
    ctx.restore()
  }

  function measure(ctx, s, size, weight) {
    ctx.save()
    ctx.font = `${weight} ${size}px ${KR}`
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
    const w = ctx.measureText(s).width
    ctx.restore()
    return w
  }

  // ── 배경: 표지와 같은 파랑 → 보라 그라데이션 + 옅은 점 격자 ──
  function background(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, C.top)
    g.addColorStop(1, C.bottom)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    for (let y = 60; y < H; y += 80) for (let x = 60; x < W; x += 80) ctx.fillRect(x - 2, y - 2, 4, 4)
    ctx.restore()
  }

  function wordmark(ctx, x, y, size, alpha = 1, align = 'center') {
    const w1 = measure(ctx, 'View', size, 900)
    const w2 = measure(ctx, 'It', size, 900)
    const x0 = align === 'center' ? x - (w1 + w2) / 2 : x
    text(ctx, 'View', x0, y, { weight: 900, size, align: 'left', alpha })
    text(ctx, 'It', x0 + w1, y, { weight: 900, size, align: 'left', color: C.amber, alpha })
  }

  function watermark(ctx, t) {
    const a = eo3(p(t, 0.1, 0.6)) * (1 - eo3(p(t, 21.2, 21.7)))
    if (a <= 0) return
    wordmark(ctx, 72, 150, 52, a, 'left')
  }

  // 자막 — [ ] 안은 노란색
  function caption(ctx, t, a, b, lines, o = {}) {
    const k = eo3(p(t, a, a + 0.4))
    const out = eo3(p(t, b, b + 0.3))
    const alpha = k * (1 - out)
    if (alpha <= 0) return
    const size = o.size || 60
    const lh = size * 1.38
    const y0 = 1430 - ((lines.length - 1) * lh) / 2 + (1 - k) * 24 - out * 12
    lines.forEach((ln, i) => {
      const segs = ln.split(/(\[[^\]]+\])/).filter(Boolean).map((s) => (s[0] === '[' ? { t: s.slice(1, -1), hi: true } : { t: s }))
      const total = segs.reduce((w, s) => w + measure(ctx, s.t, size, 800), 0)
      let x = W / 2 - total / 2
      segs.forEach((s) => {
        text(ctx, s.t, x, y0 + i * lh, { weight: 800, size, align: 'left', color: s.hi ? C.amberHi : C.white, alpha })
        x += measure(ctx, s.t, size, 800)
      })
    })
  }

  // ── 로봇청소기 (위에서 본 일반형) ──
  function robot(ctx, x, y, r, ang, spin, o = {}) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    // 그림자
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 14
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = C.robot
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.lineWidth = r * 0.04
    ctx.strokeStyle = C.robotEdge
    ctx.stroke()
    // 앞 범퍼 (앞 = -y 방향)
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.93, -Math.PI * 0.85, -Math.PI * 0.15)
    ctx.lineWidth = r * 0.07
    ctx.strokeStyle = '#CBD5E1'
    ctx.stroke()
    // 가운데 원판과 라이다
    ctx.beginPath()
    ctx.arc(0, r * 0.08, r * 0.62, 0, Math.PI * 2)
    ctx.lineWidth = r * 0.02
    ctx.strokeStyle = '#CBD5E1'
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, -r * 0.3, r * 0.2, 0, Math.PI * 2)
    ctx.fillStyle = '#334155'
    ctx.fill()
    // 표시등
    ctx.beginPath()
    ctx.arc(0, r * 0.25, r * 0.05, 0, Math.PI * 2)
    ctx.fillStyle = o.led || C.blue
    ctx.fill()
    // 사이드브러시 (앞 왼쪽)
    const bx = -r * 0.62
    const by = -r * 0.62
    ctx.save()
    ctx.translate(bx, by)
    ctx.rotate(spin)
    ctx.strokeStyle = '#64748B'
    ctx.lineWidth = r * 0.025
    ctx.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.07, 0, Math.PI * 2)
    ctx.fillStyle = '#475569'
    ctx.fill()
    ctx.restore()
    ctx.restore()
  }

  function bubble(ctx, s, x, y, k, o = {}) {
    if (k <= 0) return
    const size = o.size || 44
    const tw = measure(ctx, s, size, 800) + (o.icon ? 124 : 64)
    const h = size + 44
    ctx.save()
    ctx.translate(x, y)
    const sc = lerp(0.5, 1, eoBack(k))
    ctx.scale(sc, sc)
    if (o.rot) ctx.rotate(o.rot)
    ctx.globalAlpha *= eo3(k) * (o.alpha ?? 1)
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 8
    rrect(ctx, -tw / 2, -h / 2, tw, h, 22)
    ctx.fillStyle = o.bg || C.white
    ctx.fill()
    ctx.shadowColor = 'transparent'
    let tx = 0
    if (o.icon) {
      const ix = -tw / 2 + 52
      ctx.beginPath()
      ctx.arc(ix, 0, 24, 0, Math.PI * 2)
      ctx.fillStyle = o.iconBg || C.red
      ctx.fill()
      text(ctx, o.icon, ix, 13, { weight: 900, size: 34, color: C.white })
      tx = 30
    }
    text(ctx, s, tx, size * 0.36, { weight: 800, size, color: o.color || C.ink })
    ctx.restore()
  }

  // ── 1장: 갑자기 이상할 때 ──
  function sceneTrouble(ctx, t) {
    if (t > 5.8) return
    const a = 1 - eo3(p(t, 5.0, 5.5))
    if (a <= 0) return
    ctx.save()
    ctx.globalAlpha = a
    // 왼쪽에서 들어와 가운데서 멈추고, 흔들린다
    const move = eio3(p(t, 0.2, 1.8))
    const x = lerp(-200, W / 2, move)
    const shake = t > 1.8 ? Math.sin(t * 40) * 5 * (1 - p(t, 4.6, 5.2)) : 0
    const spin = t < 1.8 ? t * 9 : 1.8 * 9 // 멈추면 사이드브러시도 멈춘다
    robot(ctx, x + shake, 720, 230, Math.PI / 2 + Math.sin(t * 1.3) * 0.05 * (1 - move), spin, { led: t > 1.9 ? C.red : C.blue })
    const items = [
      { s: '끼익… 끼익…', x: 300, y: 380, at: 2.0, icon: '!', rot: -0.05 },
      { s: '사이드브러시 멈춤', x: 690, y: 1040, at: 2.5, icon: '!', rot: 0.04 },
      { s: '도크로 안 돌아감', x: 380, y: 1150, at: 3.0, icon: '!', rot: -0.03 },
    ]
    items.forEach((b) => bubble(ctx, b.s, b.x, b.y, p(t, b.at, b.at + 0.4), { icon: b.icon, rot: b.rot }))
    ctx.restore()
  }

  // ── 2장: 검색해 보면 방법이 제각각 ──
  const ADVICE = (() => {
    const r = rng(1029)
    const list = [
      ['기름칠 하세요', true],
      ['기름은 절대 금지', false],
      ['그냥 분해하세요', true],
      ['바로 A/S 맡기세요', false],
      ['초기화하면 돼요', true],
      ['새로 사는 게 낫다', false],
      ['바퀴만 바꾸세요', true],
      ['브러시 문제예요', false],
    ]
    return list.map(([s, left], i) => ({
      s,
      x: left ? 300 + (r() - 0.5) * 80 : 780 + (r() - 0.5) * 80,
      y: 330 + Math.floor(i / 2) * 210 + (left ? 0 : 90),
      at: 5.7 + i * 0.22,
      rot: (r() - 0.5) * 0.14,
      ph: r() * 6.28,
    }))
  })()

  function sceneSearch(ctx, t) {
    if (t < 5.4 || t > 11) return
    const a = eo3(p(t, 5.5, 5.9)) * (1 - eo3(p(t, 10.2, 10.7)))
    if (a <= 0) return
    ctx.save()
    ctx.globalAlpha = a
    ADVICE.forEach((c) => {
      const k = p(t, c.at, c.at + 0.4)
      if (k <= 0) return
      const jx = Math.sin(t * 2.6 + c.ph) * 5
      bubble(ctx, c.s, c.x + jx, c.y, k, { rot: c.rot, size: 42, bg: 'rgba(255,255,255,0.95)' })
    })
    // 서로 반대라는 표시: 가운데 «?» 와 엇갈린 화살표
    const q = eo3(p(t, 8.0, 8.4))
    if (q > 0) {
      ctx.save()
      ctx.globalAlpha *= q
      ctx.translate(W / 2, 1110)
      ctx.rotate(Math.sin(t * 3) * 0.06)
      ctx.beginPath()
      ctx.arc(0, 0, 70, 0, Math.PI * 2)
      ctx.fillStyle = C.amber
      ctx.fill()
      text(ctx, '?', 0, 34, { weight: 900, size: 100, color: C.ink })
      ctx.restore()
    }
    ctx.restore()
  }

  // ── 3장: 설명서대로, 순서대로 ──
  const STEPS = [
    ['메인 브러시', '빼고 잠깐 돌려 보기'],
    ['사이드브러시', '축에 감긴 머리카락'],
    ['앞바퀴', '물로 헹구고 말리기'],
    ['구동 바퀴', '집에서 분해 말고 A/S'],
  ]

  function sceneSteps(ctx, t) {
    if (t < 10.4 || t > 17.4) return
    const a = eo3(p(t, 10.7, 11.1)) * (1 - eo3(p(t, 16.6, 17.0)))
    if (a <= 0) return
    ctx.save()
    ctx.globalAlpha = a
    // 출처 꼬리표 두 개
    const tags = [
      ['제조사 설명서', 330],
      ['고객지원 안내', 750],
    ]
    tags.forEach(([s, x], i) => {
      const k = p(t, 10.8 + i * 0.2, 11.3 + i * 0.2)
      if (k <= 0) return
      const tw = measure(ctx, s, 40, 800) + 70
      ctx.save()
      ctx.translate(x, 290)
      const sc = lerp(0.6, 1, eoBack(k))
      ctx.scale(sc, sc)
      ctx.globalAlpha *= eo3(k)
      rrect(ctx, -tw / 2, -38, tw, 76, 38)
      ctx.fillStyle = C.amber
      ctx.fill()
      text(ctx, s, 0, 14, { weight: 800, size: 40, color: C.ink })
      ctx.restore()
    })
    // 순서 카드
    STEPS.forEach(([h, d], i) => {
      const at = 11.6 + i * 0.55
      const k = p(t, at, at + 0.45)
      if (k <= 0) return
      const y = 400 + i * 182
      const last = i === STEPS.length - 1
      ctx.save()
      ctx.translate((1 - eo3(k)) * 60, 0)
      ctx.globalAlpha *= eo3(k)
      rrect(ctx, 120, y, 840, 150, 28)
      ctx.fillStyle = 'rgba(255,255,255,0.96)'
      ctx.fill()
      // 번호
      ctx.beginPath()
      ctx.arc(205, y + 75, 46, 0, Math.PI * 2)
      ctx.fillStyle = last ? C.violet : C.blue
      ctx.fill()
      text(ctx, String(i + 1), 205, y + 93, { weight: 900, size: 52, color: C.white })
      text(ctx, h, 280, y + 70, { weight: 900, size: 48, align: 'left', color: C.ink })
      text(ctx, d, 280, y + 120, { weight: 500, size: 34, align: 'left', color: '#475569' })
      // 확인 표시
      const ck = eo3(p(t, at + 0.35, at + 0.7))
      if (ck > 0) {
        ctx.save()
        ctx.globalAlpha *= ck
        ctx.beginPath()
        ctx.arc(885, y + 75, 34, 0, Math.PI * 2)
        ctx.fillStyle = last ? 'rgba(124,58,237,0.14)' : 'rgba(52,211,153,0.18)'
        ctx.fill()
        if (last) {
          text(ctx, 'A/S', 885, y + 88, { weight: 900, size: 30, color: C.violet })
        } else {
          ctx.beginPath()
          ctx.moveTo(868, y + 76)
          ctx.lineTo(880, y + 89)
          ctx.lineTo(903, y + 62)
          ctx.lineWidth = 8
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.strokeStyle = '#059669'
          ctx.stroke()
        }
        ctx.restore()
      }
      ctx.restore()
    })
    ctx.restore()
  }

  // ── 4장: 다시 돈다 ──
  function sceneFixed(ctx, t) {
    if (t < 16.8 || t > 22) return
    const a = eo3(p(t, 17.0, 17.4)) * (1 - eo3(p(t, 21.1, 21.6)))
    if (a <= 0) return
    ctx.save()
    ctx.globalAlpha = a
    // 부드럽게 원을 그리며 돈다. 지나간 자리에 옅은 길
    const u = (t - 17.0) * 0.9
    const cx = W / 2
    const cy = 680
    const rx = 260
    const ry = 250
    const path = (s) => [cx + Math.cos(s) * rx, cy + Math.sin(s) * ry]
    ctx.save()
    ctx.lineWidth = 150
    ctx.lineCap = 'round'
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.beginPath()
    for (let s = 0; s <= u; s += 0.05) {
      const [x, y] = path(s - Math.PI / 2)
      if (s === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.restore()
    const [x, y] = path(u - Math.PI / 2)
    const [x2, y2] = path(u - Math.PI / 2 + 0.01)
    const ang = Math.atan2(y2 - y, x2 - x) + Math.PI / 2
    robot(ctx, x, y, 170, ang, t * 14, { led: C.green })
    const k = p(t, 17.8, 18.3)
    bubble(ctx, '다시 정상', W / 2, 1200, k, { icon: '✓', iconBg: '#059669', size: 46 })
    ctx.restore()
  }

  // ── 5장: 뷰잇 ──
  function sceneBrand(ctx, t) {
    if (t < 21.5) return
    const n = p(t, 21.9, 22.6)
    if (n > 0) {
      ctx.save()
      ctx.translate(W / 2, 760)
      const sc = lerp(0.8, 1, eoBack(n))
      ctx.scale(sc, sc)
      wordmark(ctx, 0, 0, 220, eo3(n))
      ctx.restore()
    }
    const ul = eo3(p(t, 22.5, 23.1))
    if (ul > 0) {
      ctx.fillStyle = C.amber
      rrect(ctx, W / 2 - 260 * ul, 815, 520 * ul, 10, 5)
      ctx.fill()
    }
    const s1 = eo3(p(t, 22.9, 23.4))
    text(ctx, '가전 고장, 순서대로 해결', W / 2, 930 + (1 - s1) * 20, { weight: 800, size: 60, alpha: s1 })
    const u = p(t, 23.4, 23.9)
    if (u > 0) {
      const tw = measure(ctx, 'viewit.co.kr', 50, 700) + 96
      ctx.save()
      ctx.translate(W / 2, 1050)
      const sc = lerp(0.8, 1, eoBack(u))
      ctx.scale(sc, sc)
      ctx.globalAlpha = eo3(u)
      rrect(ctx, -tw / 2, -46, tw, 92, 46)
      ctx.fillStyle = '#000000'
      ctx.fill()
      text(ctx, 'viewit.co.kr', 0, 17, { weight: 700, size: 50, color: C.amberHi })
      ctx.restore()
    }
  }

  function render(ctx, t) {
    t = clamp(t, 0, DURATION - 1e-6)
    ctx.save()
    background(ctx)
    watermark(ctx, t)
    sceneTrouble(ctx, t)
    sceneSearch(ctx, t)
    sceneSteps(ctx, t)
    sceneFixed(ctx, t)
    sceneBrand(ctx, t)

    caption(ctx, t, 0.4, 2.6, ['멀쩡하던 로봇청소기가'])
    caption(ctx, t, 2.8, 5.1, ['[갑자기 이상할 때]'])
    caption(ctx, t, 5.6, 7.9, ['검색해 보면'])
    caption(ctx, t, 8.1, 10.3, ['[방법이 제각각]입니다'])
    caption(ctx, t, 10.9, 13.6, ['뷰잇은', '[제조사 설명서·고객지원] 안내대로'])
    caption(ctx, t, 13.8, 16.7, ['무엇부터 볼지', '[순서대로] 정리합니다'])
    caption(ctx, t, 17.2, 21.2, ['집에서 해 볼 것부터', '[A/S 맡길 때]까지'])
    caption(ctx, t, 24.1, 27.3, ['일주일에 한 편씩', '[새 고장 해결 글]을 올립니다'], { size: 56 })

    const fade = Math.max(1 - eo3(p(t, 0, 0.35)), eo3(p(t, 27.4, 28)))
    if (fade > 0) {
      ctx.fillStyle = `rgba(30,27,75,${fade})`
      ctx.fillRect(0, 0, W, H)
    }
    ctx.restore()
  }

  const TEXTS = [
    'ViewIt 멀쩡하던 로봇청소기가 갑자기 이상할 때 검색해 보면 방법이 제각각입니다',
    '뷰잇은 제조사 설명서·고객지원 안내대로 무엇부터 볼지 순서대로 정리합니다',
    '집에서 해 볼 것부터 A/S 맡길 때까지 일주일에 한 편씩 새 고장 해결 글을 올립니다',
    '끼익… 사이드브러시 멈춤 도크로 안 돌아감 다시 정상 가전 고장, 순서대로 해결 viewit.co.kr',
    ADVICE.map((c) => c.s).join(' '),
    STEPS.map((s) => s.join(' ')).join(' '),
    '!?✓1234',
  ].join(' ')

  function loadFonts(doc, timeoutMs = 8000) {
    if (!doc.fonts || !doc.fonts.load) return Promise.resolve()
    const jobs = [500, 700, 800, 900].map((w) => doc.fonts.load(`${w} 40px 'Noto Sans KR'`, TEXTS))
    const all = Promise.all(jobs).catch(() => {})
    return Promise.race([all, new Promise((r) => setTimeout(r, timeoutMs))])
  }

  // export.html·sheet.html 을 팩트뷰와 같이 쓰려고 이름을 맞춘다
  root.FVPromo = { W, H, DURATION, CHAPTERS, render, loadFonts }
})(typeof window !== 'undefined' ? window : globalThis)
