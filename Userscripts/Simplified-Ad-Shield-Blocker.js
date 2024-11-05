// ==UserScript==
// @name         Simplified Ad-Shield Blocker
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Block AdShield script execution on websites
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // AdShield 변수 및 함수 이름 차단
    ['adshield', 'detectAdblock', 'blockDetected', 'adblock', 'blockAdBlock', 'detectAds'].forEach(name => {
        let temp;  // let을 이용해 변수 선언
        Object.defineProperty(window, name, {
            configurable: false,
            writable: false,
            value: undefined
        });
    });
})();
