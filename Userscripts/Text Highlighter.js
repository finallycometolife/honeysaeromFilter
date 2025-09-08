// ==UserScript==
// @name         Syntax Highlighter (Mobile-Optimized, Below-First)
// @namespace    http://tampermonkey.net/
// @version      2.3.0
// @description  선택 텍스트 하이라이트: 모바일 최적 UI, 네이티브 메뉴 겹침 회피, 경계 클램핑/플립, Shadow DOM 격리. 팔레트는 기본적으로 선택 영역 '아래'에 표시됨.
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter.js
// @author       finallycometolife
// @match        *://*/*
// @grant        none
// @run-at       document-end
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  /** ========================
   *  Config
   *  ======================== */
  // 대중적·범용·가독 좋은 파스텔 톤 5색 (Yellow, Blue, Pink, Green, Lavender)
  const COLORS = ['#FFF59D', '#D1E8FF', '#FFD1D1', '#A5F1A7', '#E6D5FF'];
  const DEFAULT_COLOR = localStorage.getItem('sh:lastColor') || COLORS[0];
  const UI_Z = 2147483647;
  const SELECTION_DEBOUNCE = 120;

  // 안드로이드 네이티브 선택 메뉴는 보통 '윗쪽'에 뜸 → 위 배치 시 여유를 더 준다
  const IS_ANDROID = /Android/i.test(navigator.userAgent);
  const GAP = 8;                           // 대상과 팔레트 간격
  const GAP_MENU_UP = IS_ANDROID ? 64 : 8; // 위쪽 배치 시 메뉴 회피용 추가 간격
  const EDGE = 8;                          // 화면 테두리 여백

  /** ========================
   *  Helpers
   *  ======================== */
  const isEditable = (el) => {
    if (!el) return false;
    if (el.closest && el.closest('[contenteditable="true"]')) return true;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA';
  };

  const saveLastColor = (c) => localStorage.setItem('sh:lastColor', c);

  const debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  };

  const vp = () => {
    const vv = window.visualViewport;
    return vv
      ? { w: vv.width, h: vv.height, x: vv.offsetLeft, y: vv.offsetTop, scale: vv.scale || 1 }
      : { w: window.innerWidth, h: window.innerHeight, x: 0, y: 0, scale: 1 };
  };

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const getSelectionRect = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const r = sel.getRangeAt(0);
    const rect = r.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      const rects = r.getClientRects();
      if (!rects || rects.length === 0) return null;
      return rects[0];
    }
    return rect;
  };

  const isShMark = (node) => node && node.nodeType === 1 && node.tagName === 'MARK' && node.hasAttribute('data-sh');

  // Range에 교차하는 기존 mark 분해(중첩 최소화)
  const splitIntersectingMarks = (range) => {
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      { acceptNode: (n) => (isShMark(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) }
    );
    const list = [];
    let n;
    while ((n = walker.nextNode())) {
      try {
        const nr = document.createRange();
        nr.selectNodeContents(n);
        const hit =
          range.compareBoundaryPoints(Range.END_TO_START, nr) < 0 &&
          range.compareBoundaryPoints(Range.START_TO_END, nr) > 0;
        if (hit) list.push(n);
      } catch {}
    }
    list.forEach((mark) => {
      const all = document.createRange();
      all.selectNodeContents(mark);

      if (range.compareBoundaryPoints(Range.START_TO_START, all) > 0 &&
          range.compareBoundaryPoints(Range.START_TO_END, all) < 0) {
        const before = document.createRange();
        before.setStart(all.startContainer, all.startOffset);
        before.setEnd(range.startContainer, range.startOffset);
        const w = document.createElement('mark');
        w.setAttribute('data-sh', '');
        w.style.background = mark.style.background;
        before.surroundContents(w);
      }

      if (range.compareBoundaryPoints(Range.END_TO_START, all) > 0 &&
          range.compareBoundaryPoints(Range.END_TO_END, all) < 0) {
        const after = document.createRange();
        after.setStart(range.endContainer, range.endOffset);
        after.setEnd(all.endContainer, all.endOffset);
        const w = document.createElement('mark');
        w.setAttribute('data-sh', '');
        w.style.background = mark.style.background;
        after.surroundContents(w);
      }

      const p = mark.parentNode;
      while (mark.firstChild) p.insertBefore(mark.firstChild, mark);
      p.removeChild(mark);
    });
  };

  const removeSameColorMarksInRange = (range, color) => {
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      { acceptNode: (n) => (isShMark(n) && n.style.background === color ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) }
    );
    const targets = [];
    let m;
    while ((m = walker.nextNode())) {
      const nr = document.createRange();
      nr.selectNodeContents(m);
      const inside =
        range.compareBoundaryPoints(Range.START_TO_START, nr) <= 0 &&
        range.compareBoundaryPoints(Range.END_TO_END, nr) >= 0;
      if (inside) targets.push(m);
    }
    targets.forEach((mark) => {
      const p = mark.parentNode;
      while (mark.firstChild) p.insertBefore(mark.firstChild, mark);
      p.removeChild(mark);
    });
  };

  const surroundWithMark = (range, color) => {
    splitIntersectingMarks(range);
    const mark = document.createElement('mark');
    mark.setAttribute('data-sh', '');
    mark.style.background = color;
    mark.style.borderRadius = '4px';
    mark.style.padding = '0 2px';
    try {
      range.surroundContents(mark);
    } catch {
      const frag = range.cloneContents();
      mark.appendChild(frag);
      range.deleteContents();
      range.insertNode(mark);
    }
  };

  const mergeAdjacentMarks = (root) => {
    const marks = root.querySelectorAll('mark[data-sh]');
    marks.forEach((m) => {
      const next = m.nextSibling;
      if (next && isShMark(next) && next.style.background === m.style.background) {
        while (next.firstChild) m.appendChild(next.firstChild);
        next.remove();
      }
    });
  };

  /** ========================
   *  Shadow UI (No FAB, only palette)
   *  ======================== */
  let host, shadow, wrapper, palette;

  const createUI = () => {
    host = document.createElement('div');
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.inset = '0';
    host.style.pointerEvents = 'none';
    host.style.zIndex = UI_Z;
    document.documentElement.appendChild(host);

    shadow = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      :root { color-scheme: light dark; }
      .wrap { position: fixed; display: none; max-width: 96vw; pointer-events: auto; }
      .palette {
        display: flex; align-items: center; gap: 10px; padding: 8px 10px;
        background: rgba(255,255,255,0.98);
        border: 1px solid #e5e7eb; border-radius: 12px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        touch-action: none;
      }
      .sw { border-radius: 50%; width: 36px; height: 36px; border: none; }
      @media (prefers-color-scheme: dark) {
        .palette { background: rgba(28,28,30,0.98); border-color: #3a3a3c; }
      }
    `;

    wrapper = document.createElement('div');
    wrapper.className = 'wrap';

    palette = document.createElement('div');
    palette.className = 'palette';

    // 색상 스와치(5개)
    COLORS.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'sw';
      b.style.background = c;
      b.title = c;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        applyHighlight(c);
      }, { passive: false });
      palette.appendChild(b);
    });

    wrapper.appendChild(palette);
    shadow.append(style, wrapper);

    // 페이지 터치 시 팔레트 닫기 (UI 내부 제외)
    document.addEventListener('pointerdown', (e) => {
      const path = e.composedPath ? e.composedPath() : [];
      if (!path.includes(host)) hidePalette();
    }, { capture: true });
  };

  // 팔레트 크기 측정
  const measurePalette = () => {
    wrapper.style.visibility = 'hidden';
    wrapper.style.display = 'block';
    const rect = wrapper.getBoundingClientRect();
    wrapper.style.display = 'none';
    wrapper.style.visibility = '';
    return { w: rect.width, h: rect.height };
  };

  /**
   * 배치 전략 (요청대로 '아래쪽 우선'):
   * 1) 아래(below) 시도
   * 2) 위(above) 시도 (위로 올릴 때는 안드로이드 메뉴(GAP_MENU_UP) 추가로 띄움)
   * 3) 좌/우 측면 시도
   * 모든 경우 화면 경계 클램핑
   */
  const placePalette = (targetRect) => {
    const { w: vpw, h: vph, x: vpx, y: vpy } = vp();
    const { w: pw, h: ph } = measurePalette();

    let left = targetRect.left + (targetRect.width - pw) / 2;
    let top;

    const fitsBelow = () => (targetRect.bottom + GAP + ph <= vpy + vph - EDGE);
    const fitsAbove = () => (targetRect.top - ph - GAP - GAP_MENU_UP >= vpy + EDGE);

    // 1) 아래
    if (fitsBelow()) {
      top = targetRect.bottom + GAP;
      left = clamp(left, vpx + EDGE, vpx + vpw - pw - EDGE);
    } else if (fitsAbove()) {
      // 2) 위 (메뉴 회피 여유 포함)
      top = targetRect.top - ph - GAP - GAP_MENU_UP;
      left = clamp(left, vpx + EDGE, vpx + vpw - pw - EDGE);
    } else {
      // 3) 좌/우 측면
      const rightX = targetRect.right + GAP;
      const leftX  = targetRect.left - GAP - pw;

      // 세로 중앙 정렬
      top = targetRect.top + (targetRect.height - ph) / 2;
      top = clamp(top, vpy + EDGE, vpy + vph - ph - EDGE);

      if (rightX + pw <= vpx + vpw - EDGE) {
        left = rightX;
      } else if (leftX >= vpx + EDGE) {
        left = leftX;
      } else {
        // 마지막 폴백: 아래에 최대한 맞춰 넣기
        top = clamp(targetRect.bottom + GAP, vpy + EDGE, vpy + vph - ph - EDGE);
        left = clamp(left, vpx + EDGE, vpx + vpw - pw - EDGE);
      }
    }

    wrapper.style.left = `${left}px`;
    wrapper.style.top  = `${top}px`;
    wrapper.style.display = 'block';
  };

  const showPaletteNearSelection = () => {
    const r = getSelectionRect();
    if (!r) return hidePalette();
    placePalette(r);
  };

  const hidePalette = () => { wrapper.style.display = 'none'; };

  /** ========================
   *  Highlight core
   *  ======================== */
  const applyHighlight = (color) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!sel.toString().trim()) return;

    const range = sel.getRangeAt(0);
    const anchorNode = sel.anchorNode;
    const anchorEl = (anchorNode && anchorNode.nodeType === 1)
      ? anchorNode
      : (anchorNode ? anchorNode.parentElement : null);
    if (isEditable(anchorEl)) return;

    // 같은 색이 이미 감싸고 있던 부분은 토글 해제
    removeSameColorMarksInRange(range, color);

    // 남은 텍스트 감싸기
    if (sel.toString().trim().length) {
      surroundWithMark(range, color);
      mergeAdjacentMarks(document.body);
      saveLastColor(color);
    }

    sel.removeAllRanges();
    hidePalette();
  };

  /** ========================
   *  Selection watcher
   *  ======================== */
  const onSelectionChange = debounce(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { hidePalette(); return; }
    const text = sel.toString().trim();
    if (!text) { hidePalette(); return; }

    const anchorNode = sel.anchorNode;
    const anchorEl = (anchorNode && anchorNode.nodeType === 1)
      ? anchorNode
      : (anchorNode ? anchorNode.parentElement : null);
    if (isEditable(anchorEl)) { hidePalette(); return; }

    showPaletteNearSelection();
  }, SELECTION_DEBOUNCE);

  /** ========================
   *  Init
   *  ======================== */
  const init = () => {
    createUI();
    document.addEventListener('selectionchange', onSelectionChange, { passive: true });

    // 뷰포트 변화(주소창/줌/스크롤) 시 재배치
    const reposition = debounce(() => {
      if (wrapper.style.display === 'block') showPaletteNearSelection();
    }, 80);

    window.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('resize', reposition, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', reposition);
      window.visualViewport.addEventListener('scroll', reposition);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();