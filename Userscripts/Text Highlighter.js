// ==UserScript==
// @name         Text Highlight
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Unified highlight button and color picker for Firefox compatibility(+ chromium)
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter.js
// @author       finallycometolife
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let highlightUI, iconButton, colorPickerButton, colorPicker;

    // Function to highlight selected text
    function highlightSelection(color) {
        const selection = window.getSelection();

        if (!selection.rangeCount || selection.toString().trim().length === 0) return;

        const range = selection.getRangeAt(0);

        // Create a wrapper span element
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.style.borderRadius = '4px';
        span.style.padding = '2px'; // Optional: padding for better visibility

        // Use a DocumentFragment for safe DOM manipulation
        const fragment = range.cloneContents();

        // Append the cloned content into the new span
        span.appendChild(fragment);

        // Replace the original range content with the span
        range.deleteContents();
        range.insertNode(span);

        // Clear selection after applying highlight
        selection.removeAllRanges();
        hideHighlightUI();
    }

    // Create unified highlight UI
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

        // Custom icon button for highlight
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
        });

        // Custom icon button for color picker
        colorPickerButton = document.createElement('button');
        Object.assign(colorPickerButton.style, {
            width: '40px',
            height: '40px',
            backgroundImage: `url('https://raw.githubusercontent.com/finallycometolife/honeysaeromFilter/refs/heads/main/color-selection.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
        });

        // Hidden color picker
        colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = '#FFD1D1'; // Default color
        Object.assign(colorPicker.style, {
            display: 'none', // Hidden by default
        });

        // Append elements to UI
        highlightUI.appendChild(iconButton);
        highlightUI.appendChild(colorPickerButton);
        highlightUI.appendChild(colorPicker);
        document.body.appendChild(highlightUI);

        // Add event listeners
        iconButton.addEventListener('click', () => {
            highlightSelection(colorPicker.value);
        });

        colorPickerButton.addEventListener('click', () => {
            colorPicker.click();
        });

        colorPicker.addEventListener('input', () => {
            colorPickerButton.style.borderColor = colorPicker.value; // Optional: Show selected color
        });
    }

    // Show the UI
    function showHighlightUI() {
        highlightUI.style.display = 'flex';
    }

    // Hide the UI
    function hideHighlightUI() {
        highlightUI.style.display = 'none';
    }

    // Monitor selection changes
    function handleSelection() {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            showHighlightUI();
        } else {
            hideHighlightUI();
        }
    }

    // Ensure script compatibility with Firefox
    function ensureFirefoxCompatibility() {
        // Detect whether running in a content security policy-restricted environment
        if (typeof window.getSelection !== 'function') {
            console.warn('Highlight script is not supported in this browser.');
        }
    }

    // Initialize the script
    function init() {
        ensureFirefoxCompatibility();
        createHighlightUI();

        // Add selection and click event listeners
        document.addEventListener('selectionchange', handleSelection);

        // Hide UI when clicking outside
        document.addEventListener('click', (event) => {
            if (!highlightUI.contains(event.target)) {
                hideHighlightUI();
            }
        });
    }

    // Check if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();