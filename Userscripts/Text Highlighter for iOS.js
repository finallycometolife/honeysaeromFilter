// ==UserScript==
// @name         Syntax Highlighter for iOS (Improved) v2
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  모바일 Safari 및 Mac Safari에서 작동하는 향상된 텍스트 하이라이터 (커스텀 색상 지원 및 위치 최적화)
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text%20Highlighter%20for%20iOS.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text%20Highlighter%20for%20iOS.js
// @author       finallycometolife
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let highlightUI, selectedRange;
    let ignoreClickEvent = false;

    function isInsideHighlight(node) {
        while (node) {
            if (node.nodeType === 1 && node.tagName === 'SPAN' && node.style.backgroundColor) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    function highlightSelection(color) {
        if (!selectedRange) return;
        if (isInsideHighlight(selectedRange.commonAncestorContainer)) {
            console.warn('이미 하이라이트된 영역입니다.');
            return;
        }
        const spanStyles = {
            backgroundColor: color,
            borderRadius: '3px',
            padding: '1px 2px',
            display: 'inline'
        };
        try {
            const span = document.createElement('span');
            Object.assign(span.style, spanStyles);
            selectedRange.surroundContents(span);
        } catch (err) {
            const fragment = selectedRange.cloneContents();
            const wrapper = document.createElement('span');
            Object.assign(wrapper.style, spanStyles);
            wrapper.appendChild(fragment);
            selectedRange.deleteContents();
            selectedRange.insertNode(wrapper);
        }
        selectedRange = null;
        window.getSelection().removeAllRanges();
        hideHighlightUI();
    }

    function createHighlightUI() {
        highlightUI = document.createElement('div');
        Object.assign(highlightUI.style, {
            position: 'absolute',
            display: 'none',
            flexDirection: 'row',
            gap: '10px',
            padding: '8px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
            zIndex: '9999',
            maxWidth: '90vw',
            overflowX: 'auto'
        });
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            highlightUI.style.backgroundColor = '#2c2c2e';
            highlightUI.style.border = '1px solid #555';
        }
        const presetColors = ['#FFD1D1', '#D1E8FF', '#FFFF52', '#A5D6A7', '#FFAB91'];
        presetColors.forEach(color => {
            const btn = document.createElement('button');
            Object.assign(btn.style, {
                width: '28px',
                height: '28px',
                backgroundColor: color,
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            });
            btn.setAttribute('aria-label', `Highlight with ${color}`);
            btn.addEventListener('click', () => highlightSelection(color));
            highlightUI.appendChild(btn);
        });
        const customBtn = document.createElement('button');
        customBtn.textContent = '🎨';
        Object.assign(customBtn.style, {
            width: '28px',
            height: '28px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            backgroundColor: 'transparent'
        });
        customBtn.setAttribute('aria-label', 'Custom highlight color');
        customBtn.addEventListener('click', () => {
            const input = prompt('하이라이트할 색상 hex 코드를 입력하세요 (예: #FF00FF):');
            if (!input) return;
            const hex = input.trim();
            const isValid = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(hex);
            if (isValid) {
                highlightSelection(hex);
            } else {
                alert('유효한 hex 코드가 아닙니다. #RRGGBB 또는 #RGB 형식이어야 합니다.');
            }
        });
        highlightUI.appendChild(customBtn);
        document.body.appendChild(highlightUI);
    }

    function showHighlightUI(x, y, rect) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const uiWidth = highlightUI.offsetWidth;
        const uiHeight = highlightUI.offsetHeight;
        const left = Math.min(x, vw - uiWidth - 8);
        // 화면 하단을 벗어날 경우, 선택 영역 위에 표시
        const selectionBottomScreen = y - window.scrollY;
        let top;
        if (selectionBottomScreen + uiHeight + 8 > vh) {
            const selectionTop = window.scrollY + rect.top;
            top = selectionTop - uiHeight - 8;
        } else {
            top = y + 8;
        }
        // 화면 상단 고정
        top = Math.max(window.scrollY + 8, top);
        highlightUI.style.left = `${left}px`;
        highlightUI.style.top = `${top}px`;
        highlightUI.style.display = 'flex';
        ignoreClickEvent = true;
        setTimeout(() => ignoreClickEvent = false, 400);
    }

    function hideHighlightUI() {
        highlightUI.style.display = 'none';
    }

    function handleSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().trim()) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                selectedRange = range;
                const xPos = window.scrollX + rect.left;
                const yPos = window.scrollY + rect.bottom;
                showHighlightUI(xPos, yPos, rect);
                return;
            }
        }
        selectedRange = null;
        hideHighlightUI();
    }

    function init() {
        createHighlightUI();
        document.addEventListener('selectionchange', handleSelection);
        document.addEventListener('mouseup', () => setTimeout(handleSelection, 150));
        document.addEventListener('touchend', () => setTimeout(handleSelection, 300));
        document.addEventListener('click', e => {
            if (!ignoreClickEvent && !highlightUI.contains(e.target)) {
                hideHighlightUI();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
