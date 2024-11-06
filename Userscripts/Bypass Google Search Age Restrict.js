// ==UserScript==
// @name         Bypass Google Search Age Restriction
// @namespace    https://finallycometolife.github.io
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Bypass Google Search Age Restrict.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Bypass Google Search Age Restrict.js
// @version      2.3
// @description  Change Google search location and language without excessive redirects
// @match        *://www.google.com/search*
// @match        *://www.google.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 설정: 원하는 국가 및 언어 코드
    const languageCode = 'ko';   // 검색 언어 코드 (예: 한국어는 'ko')
    const countryCode = 'us';    // 국가 코드 (예: 일본은 'jp', 한국은 'kr')

    // 파라미터 강제 설정 함수 (리디렉션 없이)
    function enforceSearchParams() {
        const urlParams = new URLSearchParams(window.location.search);
        let needsUpdate = false;

        // 'hl'과 'gl' 파라미터 강제 설정
        if (urlParams.get('hl') !== languageCode) {
            urlParams.set('hl', languageCode);
            needsUpdate = true;
        }
        if (urlParams.get('gl') !== countryCode) {
            urlParams.set('gl', countryCode);
            needsUpdate = true;
        }

        // URL 업데이트: 리디렉션 대신 히스토리 API를 사용
        if (needsUpdate) {
            const newUrl = window.location.origin + window.location.pathname + '?' + urlParams.toString();
            window.history.replaceState(null, '', newUrl);
        }
    }

    // 최초 로드 시 URL 파라미터 설정 적용
    enforceSearchParams();

    // 검색 페이지 리로드 또는 동적 업데이트 시 설정 유지
    const observer = new MutationObserver(() => {
        enforceSearchParams();
    });

    // DOM 변화를 감지할 요소 지정
    observer.observe(document.body, { childList: true, subtree: true });

    // AJAX로 검색이 업데이트될 때도 설정 유지
    window.addEventListener('popstate', () => {
        enforceSearchParams();
    });
})();