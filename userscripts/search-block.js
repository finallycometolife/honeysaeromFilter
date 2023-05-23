// ==UserScript==
// @name         Search Result Blocker
// @namespace    yournamespace
// @version      1.0
// @description  Blocks specific sites from search results
// @author       Your Name
// @match        https://www.google.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Blocked site domains
    var blockedSites = [
        '.pl',
        '.tr',
		'.online'
    ];

    // Function to block sites
    function blockSites() {
        var searchResults = document.querySelectorAll('div.rc');
        for (var i = 0; i < searchResults.length; i++) {
            var result = searchResults[i];
            var link = result.querySelector('a');
            var url = link.href;
            var domain = getDomain(url);
            if (blockedSites.includes(domain)) {
                result.style.display = 'none';
            }
        }
    }

    // Function to extract domain from URL
    function getDomain(url) {
        var a = document.createElement('a');
        a.href = url;
        return a.hostname;
    }

    // Block sites on page load
    blockSites();

    // Block sites on page update (AJAX)
    var observer = new MutationObserver(function(mutations) {
        blockSites();
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();