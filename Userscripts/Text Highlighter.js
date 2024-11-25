// ==UserScript==
// @name         Syntax Highlighter
// @namespace    http://tampermonkey.net/
// @version      1.4.1
// @description  문장, 단어 등 텍스트를 선택하여 하이라이팅 기능을 사용할 수 있는 유저스크립트.
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Text Highlighter.js
// @author       finallycometolife
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let highlightUI, iconButton, colorPickerButton, colorPicker, colorOptions;

    // Function to highlight selected text
    function highlightSelection(color) {
        const selection = window.getSelection();

        if (!selection.rangeCount || selection.toString().trim().length === 0) return;

        const range = selection.getRangeAt(0);

        // Create a wrapper span element
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.style.borderRadius = '3px';
        span.style.padding = '1.5px'; // Optional: padding for better visibility

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

        // Hidden color picker (fallback)
        colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = '#FFD1D1'; // Default fallback color
        Object.assign(colorPicker.style, {
            display: 'none', // Hidden by default
        });

        // Color options (default and new colors)
        colorOptions = document.createElement('div');
        Object.assign(colorOptions.style, {
            display: 'flex',
            gap: '10px',
        });

        // Create color option buttons
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

            // Apply the selected color when clicked
            colorButton.addEventListener('click', () => {
                highlightSelection(color);
            });

            colorOptions.appendChild(colorButton);
        });

        // Append elements to UI
        highlightUI.appendChild(iconButton);
        highlightUI.appendChild(colorOptions);
        highlightUI.appendChild(colorPicker);
        document.body.appendChild(highlightUI);

        // Add event listeners
        iconButton.addEventListener('click', () => {
            colorPicker.click();
        });

        colorPicker.addEventListener('input', () => {
            highlightSelection(colorPicker.value);
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