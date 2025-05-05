// ==UserScript==
// @name         Syntax Highlighter for iOS (Improved)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  모바일 Safari 및 Mac Safari에서 작동하는 향상된 텍스트 하이라이터
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter for iOS.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter for iOS.js
// @author       finallycometolife
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let highlightUI, selectedRange;
    let ignoreClickEvent = false;

    // 기존 하이라이트 중복 방지
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

        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.style.borderRadius = '3px';
        span.style.padding = '1px 2px';
        span.style.display = 'inline';

        try {
            selectedRange.surroundContents(span);
        } catch (e) {
            console.error('하이라이트 실패:', e);
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
            gap: '15px',
            padding: '10px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
            zIndex: '9999',
        });

        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            highlightUI.style.backgroundColor = '#2c2c2e';
            highlightUI.style.border = '1px solid #555';
        }

        const colors = ['#FFD1D1', '#D1E8FF', '#FFFF52', '#A5D6A7', '#FFAB91'];
        colors.forEach((color, i) => {
            const btn = document.createElement('button');
            Object.assign(btn.style, {
                width: '30px',
                height: '30px',
                backgroundColor: color,
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            });
            btn.setAttribute('aria-label', `색상 ${i + 1}로 하이라이트`);
            btn.addEventListener('click', () => highlightSelection(color));
            highlightUI.appendChild(btn);
        });

        document.body.appendChild(highlightUI);
    }

    function showHighlightUI(x, y) {
        highlightUI.style.left = `${x}px`;
        highlightUI.style.top = `${y}px`;
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

            if (rect && rect.width > 0 && rect.height > 0) {
                selectedRange = range;
                const x = window.scrollX + rect.left;
                const y = window.scrollY + rect.bottom;
                showHighlightUI(x, y + 8);
            } else {
                selectedRange = null;
                hideHighlightUI();
            }
        } else {
            selectedRange = null;
            hideHighlightUI();
        }
    }

    function init() {
        createHighlightUI();

        document.addEventListener('selectionchange', handleSelection);
        document.addEventListener('mouseup', () => setTimeout(handleSelection, 150));
        document.addEventListener('touchend', () => setTimeout(handleSelection, 300));

        document.addEventListener('click', (e) => {
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
