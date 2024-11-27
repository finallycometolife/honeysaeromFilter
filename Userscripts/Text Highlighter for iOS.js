// ==UserScript==
// @name         Syntax Highlighter for iOS
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  모바일 Safari 및 Mac Safari에서 작동하고 심미성을 개선한 텍스트 하이라이터.
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter for iOS.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter for iOS.js
// @author       finallycometolife
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let highlightUI, selectedRange, colorOptions;
    let ignoreClickEvent = false; // 플래그: 특정 상황에서 click 이벤트 무시

    // Highlight selected text with the given color
    function highlightSelection(color) {
        if (!selectedRange) {
            console.warn('No valid range selected for highlighting.');
            return;
        }

        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.style.borderRadius = '3px';
        span.style.padding = '1px';

        try {
            // Wrap the range contents in the span
            selectedRange.surroundContents(span);
        } catch (error) {
            console.error('Error highlighting selection:', error);
        }

        selectedRange = null;
        window.getSelection().removeAllRanges();
        hideHighlightUI();
    }

    // Create the UI for color selection
    function createHighlightUI() {
        highlightUI = document.createElement('div');
        Object.assign(highlightUI.style, {
            position: 'absolute',
            display: 'none',
            flexDirection: 'row',
            gap: '15px',
            padding: '10px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'auto',
            zIndex: '1000',
        });

        // Add color buttons
        colorOptions = document.createElement('div');
        const colors = ['#FFD1D1', '#D1E8FF', '#FFFF52', '#A5D6A7', '#FFAB91'];
        colors.forEach((color) => {
            const colorButton = document.createElement('button');
            Object.assign(colorButton.style, {
                width: '30px',
                height: '30px',
                backgroundColor: color,
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            });

            colorButton.addEventListener('click', () => {
                highlightSelection(color);
            });

            colorOptions.appendChild(colorButton);
        });

        highlightUI.appendChild(colorOptions);
        document.body.appendChild(highlightUI);
    }

    // Show the UI near the selected text
    function showHighlightUI(x, y) {
        highlightUI.style.left = `${x}px`;
        highlightUI.style.top = `${y}px`;
        highlightUI.style.display = 'flex';
        ignoreClickEvent = true; // 클릭 이벤트를 잠시 무시
        setTimeout(() => {
            ignoreClickEvent = false; // 500ms 후 클릭 이벤트 활성화
        }, 500);
    }

    // Hide the UI
    function hideHighlightUI() {
        highlightUI.style.display = 'none';
    }

    // Handle text selection and save the selected range (debounced)
    let selectionTimeout;
    function handleSelection() {
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
                selectedRange = selection.getRangeAt(0);

                const rect = selectedRange.getBoundingClientRect();
                const x = window.scrollX + rect.left;
                const y = window.scrollY + rect.bottom;

                showHighlightUI(x, y + 10); // Adjust position slightly below selection
            } else {
                selectedRange = null;
                hideHighlightUI();
            }
        }, 100); // Delay ensures stable selection
    }

    // Enable touch-based text selection for mobile Safari
    function enableTouchSupport() {
        document.addEventListener('touchend', () => {
            setTimeout(() => handleSelection(), 200); // Increased delay for Safari stability
        });
    }

    // Initialize the script
    function init() {
        createHighlightUI();

        // Add selection event listeners
        document.addEventListener('selectionchange', handleSelection);

        // Hide the UI when clicking outside
        document.addEventListener('click', (event) => {
            if (!ignoreClickEvent && !highlightUI.contains(event.target)) {
                hideHighlightUI();
            }
        });

        // Enable touch support for mobile Safari
        if ('ontouchstart' in window) {
            enableTouchSupport();
        }
    }

    // Run the initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
