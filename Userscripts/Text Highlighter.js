// ==UserScript==
// @name         Text Highlighter with Color Picker
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Highlight selected text with Apple-inspired color picker in Chromium, Firefox mobile
// @author       YourName
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    let highlightButton, colorPicker;

    // Function to highlight selected text
    function highlightSelection(color) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.style.borderRadius = '4px';
        span.style.padding = '0 2px'; // Padding for better visibility
        range.surroundContents(span);

        // Clear selection after highlighting
        selection.removeAllRanges();
    }

    // Create highlight button and color picker
    function createUIElements() {
        // Create highlight button
        highlightButton = document.createElement('button');
        highlightButton.innerText = 'Highlight';
        Object.assign(highlightButton.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: '1000',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            display: 'none',
            opacity: '0',
            transition: 'opacity 0.3s ease',
        });

        // Create Apple-style color picker
        colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = '#FFD1D1';
        Object.assign(colorPicker.style, {
            position: 'fixed',
            bottom: '20px',
            left: '140px',
            zIndex: '1000',
            border: 'none',
            width: '44px',
            height: '44px',
            padding: '0',
            cursor: 'pointer',
            borderRadius: '22px',
            background: 'white',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            display: 'none',
            opacity: '0',
            transition: 'opacity 0.3s ease',
        });

        // Add button click event
        highlightButton.addEventListener('click', () => {
            highlightSelection(colorPicker.value);
            hideHighlightButton();
        });

        // Append elements to body
        document.body.appendChild(highlightButton);
        document.body.appendChild(colorPicker);
    }

    // Show the button and color picker
    function showHighlightButton() {
        highlightButton.style.display = 'block';
        colorPicker.style.display = 'block';
        setTimeout(() => {
            highlightButton.style.opacity = '1';
            colorPicker.style.opacity = '1';
        }, 10);
    }

    // Hide the button and color picker
    function hideHighlightButton() {
        highlightButton.style.opacity = '0';
        colorPicker.style.opacity = '0';
        setTimeout(() => {
            highlightButton.style.display = 'none';
            colorPicker.style.display = 'none';
        }, 300);
    }

    // Monitor selection changes and trigger button display
    function handleUserInteraction() {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            showHighlightButton();
        } else {
            hideHighlightButton();
        }
    }

    // Initialize the script
    function init() {
        createUIElements();

        // Monitor text selection changes
        document.addEventListener('selectionchange', handleUserInteraction);

        // Additional fallback for mouse or touch events
        document.addEventListener('mouseup', handleUserInteraction);
        document.addEventListener('touchend', handleUserInteraction);

        // Hide UI when clicking outside
        document.addEventListener('click', (event) => {
            if (event.target !== highlightButton && event.target !== colorPicker) {
                hideHighlightButton();
            }
        });
    }

    // Run initialization when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();