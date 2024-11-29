// ==UserScript==
// @name         YouTube Nonstop
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Prevents the "Video paused. Continue watching?" popup on YouTube
// @author       finallycometolife
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Youtube Nonstop.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Youtube Nonstop.js
// @match        *://*.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // Override document visibility properties
    Object.defineProperties(document, {
        hidden: { value: false },
        webkitHidden: { value: false },
        visibilityState: { value: 'visible' },
        webkitVisibilityState: { value: 'visible' }
    });

    // Periodically trigger activity to prevent the popup
    setInterval(() => {
        window.dispatchEvent(new Event('mousemove'));
        document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Shift' }));
    }, 55000); // Trigger every 50 seconds
})