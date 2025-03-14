// ==UserScript==
// @name         Twitter 원본 URL 복사 방지 t.co 우회
// @namespace    https://finallycometolife.github.io
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Bypass twitter shorter url.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Bypass twitter shorter url.js
// @version      1.2
// @description  트위터에서 링크를 복사할 때 t.co 단축 URL이 아니라 원본 URL이 복사되도록 합니다.
// @author       YourName
// @match        *://twitter.com/*
// @match        *://x.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    function replaceLinks() {
        document.querySelectorAll('a[href*="t.co/"]').forEach(link => {
            const realUrl = link.getAttribute('data-expanded-url') || link.getAttribute('title') || link.textContent;
            if (realUrl && realUrl.startsWith('http')) {
                link.setAttribute('href', realUrl);
                link.setAttribute('target', '_blank'); // 새 탭에서 열리도록 설정
                link.style.wordBreak = 'break-all'; // 긴 URL이 잘리거나 깨지지 않도록 스타일 적용
            }
        });
    }

    // 초기에 한 번 실행
    replaceLinks();

    // MutationObserver를 사용하여 동적 변경 감지
    const observer = new MutationObserver(replaceLinks);
    observer.observe(document.body, { childList: true, subtree: true });
})();
