// ==UserScript==
// @name         Simple AD-Shield Blocker
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Block AdShield script execution on websites
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Adshield에서 자주 사용되는 변수나 함수 이름을 차단
    let adshield;                  // Adshield 메인 객체를 차단
    let detectAdblock;             // Adblock 감지 함수 차단
    let blockDetected;             // 광고 차단 감지 여부 변수 차단
    let adblock;
    let blockAdBlock;
    let detectAds;

    // Adshield가 특정 시점에 변수를 설정하는 것을 방지
    Object.defineProperty(window, 'adshield', {
        configurable: false,
        writable: false,
        value: undefined
    });

    Object.defineProperty(window, 'detectAdblock', {
        configurable: false,
        writable: false,
        value: undefined
    });

    Object.defineProperty(window, 'blockDetected', {
        configurable: false,
        writable: false,
        value: undefined
    });

    Object.defineProperty(window, 'adblock', {
        configurable: false,
        writable: false,
        value: undefined
    });

    Object.defineProperty(window, 'blockAdBlock', {
        configurable: false,
        writable: false,
        value: undefined
    });

    Object.defineProperty(window, 'detectAds', {
        configurable: false,
        writable: false,
        value: undefined
    });

    // 추가적인 AdShield 함수나 변수가 있다면 여기에 계속 추가 가능
})();