// ==UserScript==
// @name         Syntax Highlighter for IOS
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  문장, 단어 등 텍스트를 선택하여 하이라이팅 기능을 사용할 수 있는 유저스크립트 (Safari 호환).
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/TextHighlighter_v2.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/TextHighlighter_v2.js
// @author       finallycometolife
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let highlightUI, iconButton, colorOptions, clearButton, debounceTimer;

    // Function to highlight selected text
    function highlightSelection(color) {
        const selection = window.getSelection();
        if (!selection.rangeCount || selection.toString().trim().length === 0) return;

        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.style.borderRadius = '3px';
        span.style.padding = '1.5px';

        const fragment = range.cloneContents();
        span.appendChild(fragment);
        range.deleteContents();
        range.insertNode(span);

        selection.removeAllRanges();
        hideHighlightUI();
    }

    // Function to clear all highlights
    function clearHighlights() {
        const highlights = document.querySelectorAll('span[style*="background-color"]');
        highlights.forEach((highlight) => {
            const parent = highlight.parentNode;
            while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
            }
            parent.removeChild(highlight);
        });
    }

    // Create the highlight UI
    function createHighlightUI() {
        highlightUI = document.createElement('div');
        Object.assign(highlightUI.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: '1000',
            display: 'none',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        });

        iconButton = document.createElement('button');
        Object.assign(iconButton.style, {
            width: '40px',
            height: '40px',
            backgroundImage: `url('https://raw.githubusercontent.com/finallycometolife/honeysaeromFilter/2ab364a07d564b3e03cd227e5e1b59d6208fec7b/smile.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            outline: 'none',
        });
        iconButton.title = 'Select Highlight Color';

        colorOptions = document.createElement('div');
        Object.assign(colorOptions.style, {
            display: 'flex',
            gap: '10px',
        });

        const colors = ['#FFD1D1', '#D1E8FF', '#FFFF52'];
        colors.forEach((color) => {
            const colorButton = document.createElement('button');
            Object.assign(colorButton.style, {
                width: '30px',
                height: '30px',
                backgroundColor: color,
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            });
            colorButton.title = `Highlight with ${color}`;
            colorButton.addEventListener('click', () => highlightSelection(color));
            colorOptions.appendChild(colorButton);
        });

        clearButton = document.createElement('button');
        clearButton.textContent = 'Clear Highlights';
        Object.assign(clearButton.style, {
            padding: '5px 10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
            backgroundColor: '#f5f5f5',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        });
        clearButton.title = 'Remove All Highlights';
        clearButton.addEventListener('click', clearHighlights);

        highlightUI.appendChild(iconButton);
        highlightUI.appendChild(colorOptions);
        highlightUI.appendChild(clearButton);
        document.body.appendChild(highlightUI);
    }

    // Show the highlight UI
    function showHighlightUI() {
        highlightUI.style.display = 'flex';
    }

    // Hide the highlight UI
    function hideHighlightUI() {
        highlightUI.style.display = 'none';
    }

    // Handle text selection
    function handleSelection() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
                showHighlightUI();
            } else {
                hideHighlightUI();
            }
        }, 100); // Debounce delay for performance
    }

    // Initialize the script
    function init() {
        createHighlightUI();

        document.addEventListener('selectionchange', handleSelection);
        document.addEventListener('click', (event) => {
            if (!highlightUI.contains(event.target)) {
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
