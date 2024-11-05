// ==UserScript==
// @name         Simplified Anti AD Shield 
// @namespace    https://finallycometolife.github.io
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Simplified-Ad-Shield-Blocker.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Simplified-Ad-Shield-Blocker.js
// @version      1.4
// @description  Block AdShield script execution on websites
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // AdShield 변수 및 함수 이름 차단
    ['adshield', 'detectAdblock', 'blockDetected', 'adblock', 'blockAdBlock', 'detectAds', 'adshield_runtime', 
        'ads-recovery', 'blocker-bypass', 'ad-recovery', 'ads-restoration',
        'bypass-adshield', 'recover-ad', 'adblock-bypass', 'adshield-defuser', 'blockad'].forEach(name => {
        let temp;  //
        Object.defineProperty(window, name, {
            configurable: false,
            writable: false,
            value: undefined
        });
    });
})();
