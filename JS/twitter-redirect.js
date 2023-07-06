// ==UserScript==
// @name         Twitter to Embed Redirector
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Redirects Twitter links to embedded tweets platform.
// @author       udontkn0wme
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// ==/UserScript==
 
(function() {
 
    var a = window.location.href.split("/")
window.location.href="https://platform.twitter.com/embed/Tweet.html?id="+a[a.length - 1]
 
 
 
 
})();