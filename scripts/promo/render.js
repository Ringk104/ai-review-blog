/*
 * 뷰잇 소개 모션 — 렌더러 (세로 1080×1920, 28초)
 *
 * 시간 t(초)를 받아 한 프레임을 그린다(결정적). 미리보기와 MP4 인코딩이 같이 쓴다.
 * 흐름은 소개 페이지(/posts/about/, 2026-10-30 «로봇청소기 전문»)와 같다:
 * 고를 때 막막 → 고장 날 때 막막 → 뷰잇은 고를 때(실구매 리뷰·공식 사양)도
 * 고장 날 때(제조사 설명서·고객지원, 순서대로)도.
 * 점검 순서(메인 브러시 → 사이드브러시 → 앞바퀴 → 구동 바퀴는 고객지원)는
 * «로보락에서 끼익 소리가 날 때» 글(로보락 고객지원 안내)과 같다.
 * 리뷰 카드는 «정리 예시»라 수치를 넣지 않는다. 로봇청소기 그림은 특정 브랜드가 아닌 일반형.
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
    { t: 0, label: '고를 때' },
    { t: 5.3, label: '고장 날 때' },
    { t: 10.6, label: '리뷰와 사양으로' },
    { t: 16.2, label: '설명서대로, 순서대로' },
    { t: 22.6, label: '뷰잇' },
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
    const a = eo3(p(t, 0.1, 0.6)) * (1 - eo3(p(t, 22.1, 22.6)))
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

  // ── 1장: 고를 때 — 모델이 너무 많다 ──
  const SPECS = ['흡입력?', '물걸레?', '자동 비움?', '장애물 회피?', '가격?', '소음?']

  function sceneChoose(ctx, t) {
    if (t > 5.6) return
    const a = 1 - eo3(p(t, 4.8, 5.3))
    if (a <= 0) return
    ctx.save()
    ctx.globalAlpha = a
    for (let i = 0; i < 6; i++) {
      const at = 0.3 + i * 0.22
      const k = p(t, at, at + 0.45)
      if (k <= 0) continue
      const x = i % 2 ? 760 : 320
      const y = 400 + Math.floor(i / 2) * 290
      ctx.save()
      ctx.globalAlpha *= eo3(k)
      const sc = lerp(0.5, 1, eoBack(k))
      robot(ctx, x, y + Math.sin(t * 2 + i) * 6, 100 * sc, Math.PI / 2 + i * 0.7, t * 3 + i, { led: [C.blue, C.green, C.amber][i % 3] })
      bubble(ctx, '모델 ' + 'ABCDEF'[i], x, y + 145, k, { size: 34, bg: 'rgba(255,255,255,0.92)' })
      ctx.restore()
    }
    SPECS.forEach((sp, i) => {
      const at = 2.3 + i * 0.25
      const k = p(t, at, at + 0.4)
      const x = [540, 160, 920, 540, 170, 910][i]
      const y = [560, 820, 840, 1110, 300, 300][i]
      bubble(ctx, sp, x + Math.sin(t * 2.4 + i) * 6, y, k, { size: 38, bg: C.amber, rot: (i % 2 ? 1 : -1) * 0.06 })
    })
    ctx.restore()
  }

  // ── 2장: 고장 날 때 (로컬 시간 0~5.5) ──
  function sceneTrouble(ctx, t) {
    if (t > 5.8) return
    const a = eo3(p(t, 0, 0.3)) * (1 - eo3(p(t, 5.0, 5.5)))
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

  // ── 3장: 고를 때는 실구매 리뷰와 공식 사양으로 ──
  const PROS = ['흡입력', '앱 사용']
  const CONS = ['소음', '문턱 넘기']

  function sceneReview(ctx, t) {
    if (t < 10.4 || t > 16.6) return
    const a = eo3(p(t, 10.7, 11.1)) * (1 - eo3(p(t, 15.8, 16.2)))
    if (a <= 0) return
    ctx.save()
    ctx.globalAlpha = a
    ;[['실구매 리뷰', 340], ['공식 사양', 740]].forEach(([s, x], i) => {
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
    const ck = eo3(p(t, 11.3, 11.8))
    ctx.save()
    ctx.globalAlpha *= ck
    ctx.translate(0, (1 - ck) * 50)
    rrect(ctx, 120, 380, 840, 730, 32)
    ctx.fillStyle = 'rgba(255,255,255,0.97)'
    ctx.fill()
    text(ctx, '리뷰 정리 예시', 180, 465, { weight: 900, size: 46, align: 'left', color: C.ink })
    robot(ctx, 860, 450, 46, Math.PI / 2, 0, { led: C.blue })
    const rows = [
      ['장점', PROS, '#059669', 'rgba(52,211,153,0.16)', 11.9, [0.86, 0.7]],
      ['단점', CONS, '#DC2626', 'rgba(248,113,113,0.16)', 13.4, [0.62, 0.48]],
    ]
    rows.forEach(([h, items, ink, bg, at, lens], r) => {
      const y0 = 550 + r * 290
      const hk = eo3(p(t, at, at + 0.35))
      ctx.save()
      ctx.globalAlpha *= hk
      rrect(ctx, 180, y0, 120, 58, 29)
      ctx.fillStyle = bg
      ctx.fill()
      text(ctx, h, 240, y0 + 41, { weight: 900, size: 34, color: ink })
      ctx.restore()
      items.forEach((it, i) => {
        const k = eo3(p(t, at + 0.2 + i * 0.3, at + 0.8 + i * 0.3))
        const y = y0 + 120 + i * 90
        text(ctx, it, 180, y + 12, { weight: 700, size: 38, align: 'left', color: C.ink, alpha: k })
        ctx.save()
        ctx.globalAlpha *= k
        rrect(ctx, 400, y - 16, 500, 30, 15)
        ctx.fillStyle = '#E2E8F0'
        ctx.fill()
        rrect(ctx, 400, y - 16, Math.max(1, 500 * lens[i] * k), 30, 15)
        ctx.fillStyle = ink
        ctx.fill()
        ctx.restore()
      })
    })
    ctx.restore()
    ctx.restore()
  }

  // ── 4장: 고장 날 때는 설명서대로, 순서대로 (로컬 시간 = 절대 시간 − 5.6) ──
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

  // ── 5장: 뷰잇 ──
  function sceneBrand(ctx, t) {
    if (t < 22.4) return
    const k0 = eo3(p(t, 22.7, 23.2))
    text(ctx, '로봇청소기 전문', W / 2, 560 + (1 - k0) * 20, { weight: 800, size: 52, color: C.amberHi, alpha: k0 })
    const n = p(t, 22.9, 23.6)
    if (n > 0) {
      ctx.save()
      ctx.translate(W / 2, 780)
      const sc = lerp(0.8, 1, eoBack(n))
      ctx.scale(sc, sc)
      wordmark(ctx, 0, 0, 220, eo3(n))
      ctx.restore()
    }
    const ul = eo3(p(t, 23.5, 24.1))
    if (ul > 0) {
      ctx.fillStyle = C.amber
      rrect(ctx, W / 2 - 260 * ul, 835, 520 * ul, 10, 5)
      ctx.fill()
    }
    const s1 = eo3(p(t, 23.9, 24.4))
    text(ctx, '고를 때도, 고장 날 때도', W / 2, 950 + (1 - s1) * 20, { weight: 800, size: 62, alpha: s1 })
    const u = p(t, 24.3, 24.8)
    if (u > 0) {
      const tw = measure(ctx, 'viewit.co.kr', 50, 700) + 96
      ctx.save()
      ctx.translate(W / 2, 1075)
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
    sceneChoose(ctx, t)
    if (t >= 5.3 && t < 11) sceneTrouble(ctx, t - 5.3)
    sceneReview(ctx, t)
    if (t >= 15.8 && t < 23) sceneSteps(ctx, t - 5.6)
    sceneBrand(ctx, t)

    caption(ctx, t, 0.4, 2.55, ['로봇청소기는 고를 때 한 번'])
    caption(ctx, t, 2.75, 5.0, ['[모델이 너무 많아] 막막하고'])
    caption(ctx, t, 5.6, 7.9, ['쓰다가 고장 날 때 또 한 번'])
    caption(ctx, t, 8.1, 10.3, ['검색하면 [방법이 제각각]입니다'])
    caption(ctx, t, 10.9, 13.4, ['뷰잇은 고를 때', '[실구매 리뷰와 공식 사양]으로'])
    caption(ctx, t, 13.6, 16.0, ['장점도 [단점도]', '그대로 적습니다'])
    caption(ctx, t, 16.5, 19.2, ['고장 날 때는', '[제조사 설명서·고객지원] 안내대로'])
    caption(ctx, t, 19.4, 22.2, ['무엇부터 볼지', '[순서대로] 정리합니다'])
    caption(ctx, t, 25.0, 27.3, ['일주일에 한 편씩', '[새 글]을 올립니다'], { size: 56 })

    const fade = Math.max(1 - eo3(p(t, 0, 0.35)), eo3(p(t, 27.4, 28)))
    if (fade > 0) {
      ctx.fillStyle = `rgba(30,27,75,${fade})`
      ctx.fillRect(0, 0, W, H)
    }
    ctx.restore()
  }

  const TEXTS = [
    'ViewIt 로봇청소기는 고를 때 한 번 모델이 너무 많아 막막하고 쓰다가 고장 날 때 또 한 번',
    '검색하면 방법이 제각각입니다 뷰잇은 고를 때 실구매 리뷰와 공식 사양으로 장점도 단점도 그대로 적습니다',
    '고장 날 때는 제조사 설명서·고객지원 안내대로 무엇부터 볼지 순서대로 정리합니다',
    '일주일에 한 편씩 새 글을 올립니다 로봇청소기 전문 고를 때도, 고장 날 때도 viewit.co.kr',
    '끼익… 사이드브러시 멈춤 도크로 안 돌아감 리뷰 정리 예시 장점 단점 모델 ABCDEF',
    SPECS.join(' ') + ' ' + PROS.join(' ') + ' ' + CONS.join(' '),
    STEPS.map((s) => s.join(' ')).join(' '),
    '!?✓1234 고객지원 안내 제조사 설명서 A/S',
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
