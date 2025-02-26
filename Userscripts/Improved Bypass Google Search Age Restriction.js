// ==UserScript==
// @name            Improved Bypass Google Search Age Restriction (Images Only)
// @namespace       https://finallycometolife.github.io
// @updateURL       https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Improved Bypass Google Search Age Restriction.js
// @downloadURL     https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Improved Bypass Google Search Age Restriction.js
// @version         2.5
// @description     Change Google search location and language without excessive redirects (Images Only)
// @match           *://www.google.com/search*
// @grant           none
// ==/UserScript==

(function() {
    'use strict';

    // 설정: 원하는 국가 및 언어 코드
    const languageCode = 'ko';   // 검색 언어 코드 (예: 한국어는 'ko')
    const countryCode = 'us';     // 국가 코드 (예: 일본은 'jp', 한국은 'kr')

    // URL 파라미터 업데이트 함수
    function updateSearchParams() {
        try {
            const urlParams = new URLSearchParams(window.location.search);

            if (urlParams.get('hl') !== languageCode || urlParams.get('gl') !== countryCode) {
                urlParams.set('hl', languageCode);
                urlParams.set('gl', countryCode);
                const newUrl = window.location.origin + window.location.pathname + '?' + urlParams.toString();
                window.history.replaceState(null, '', newUrl);
            }
        } catch (error) {
            console.error('URL 파라미터 업데이트 중 오류 발생:', error);
        }
    }

    // 현재 URL이 이미지 검색 탭인지 확인하는 함수
    function isImageSearch() {
        return window.location.search.includes('tbm=isch');
    }

    // 최초 로드 시 URL 파라미터 설정 적용 (이미지 검색 탭인 경우에만)
    if (isImageSearch()) {
        updateSearchParams();
    }

    // 검색 페이지 리로드 또는 동적 업데이트 시 설정 유지 (이미지 검색 탭인 경우에만)
    const searchResultsContainer = document.querySelector('#search'); 
    if (searchResultsContainer && isImageSearch()) {
        const observer = new MutationObserver(() => {
            updateSearchParams();
        });
        observer.observe(searchResultsContainer, { childList: true, subtree: true });
    }

    // AJAX로 검색이 업데이트될 때도 설정 유지 (이미지 검색 탭인 경우에만)
    window.addEventListener('popstate', () => {
        if (isImageSearch()) {
            updateSearchParams();
        }
    });
})();
