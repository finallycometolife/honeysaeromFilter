// ==UserScript==
// @name         Syntax Highlighter for iOS
// @namespace    http://tampermonkey.net/
// @version      1.6.0
// @description  모바일 Safari에서 완벽히 작동하고 심미성을 개선한 텍스트 하이라이터.
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter for iOS.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter for iOS.js
// @author       finallycometolife
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let highlightUI, selectedRange, colorOptions, debounceTimer;

    // Highlight selected text with the given color
    function highlightSelection(color) {
        if (!selectedRange) {
            console.warn('No valid range selected for highlighting.');
            return;
        }

        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.style.borderRadius = '3px';
        span.style.padding = '0.5px'; // Optional: small padding for visibility

        // Clone the selected content and wrap it in the span
        const fragment = selectedRange.cloneContents();
        span.appendChild(fragment);

        // Replace the selected range with the span
        selectedRange.deleteContents();
        selectedRange.insertNode(span);

        // Clear the selection and hide the UI
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
            gap: '15px', // Adjusted spacing between buttons
            padding: '8px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            zIndex: '1000',
        });

        // Add color buttons
        colorOptions = document.createElement('div');
        const colors = ['#FFD1D1', '#D1E8FF', '#FFFF52', '#A5D6A7', '#FFAB91'];
        colors.forEach((color) => {
            const colorButton = document.createElement('button');
            Object.assign(colorButton.style, {
                width: '25px', // Reduced size
                height: '25px', // Reduced size
                backgroundColor: color,
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s ease', // Hover animation
            });

            colorButton.addEventListener('mouseover', () => {
                colorButton.style.transform = 'scale(1.2)';
            });
            colorButton.addEventListener('mouseout', () => {
                colorButton.style.transform = 'scale(1)';
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
        highlightUI.style.left = `${Math.max(x, 10)}px`;
        highlightUI.style.top = `${Math.max(y, 10)}px`;
        highlightUI.style.display = 'flex';
    }

    // Hide the UI
    function hideHighlightUI() {
        highlightUI.style.display = 'none';
    }

    // Handle text selection and save the selected range
    function handleSelection() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
                selectedRange = selection.getRangeAt(0);

                const rect = selectedRange.getBoundingClientRect();
                showHighlightUI(
                    window.scrollX + rect.left,
                    window.scrollY + rect.bottom + 10
                );
            } else {
                selectedRange = null;
                hideHighlightUI();
            }
        }, 150); // Debounce for performance
    }

    // Enable touch-based text selection
    function enableTouchSupport() {
        document.addEventListener('touchend', () => {
            setTimeout(() => handleSelection(), 100); // Delay ensures selection is finalized
        });
    }

    // Initialize the script
    function init() {
        createHighlightUI();

        // Event listeners
        document.addEventListener('selectionchange', handleSelection);
        document.addEventListener('click', (event) => {
            if (!highlightUI.contains(event.target)) {
                hideHighlightUI();
            }
        });

        enableTouchSupport(); // Mobile-specific
    }

    // Run the initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
