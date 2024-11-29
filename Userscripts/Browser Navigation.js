// ==UserScript==
// @name         Browser Navigation
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Adds a navigation toggle visible only during scrolling. Includes smooth animations for a better UX.
// @author       finallycometolife
// @updateURL    https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Browser Navigation.js
// @downloadURL  https://finallycometolife.github.io/honeysaeromFilter/Userscripts/Browser Navigation.js
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Create toggle button container
    const navContainer = document.createElement('div');
    navContainer.style.position = 'fixed';
    navContainer.style.bottom = '12px'; // Adjusted padding
    navContainer.style.left = '90%';
    navContainer.style.transform = 'translateX(-50%) translateY(20px)';
    navContainer.style.zIndex = '9999';
    navContainer.style.display = 'flex';
    navContainer.style.gap = '6px'; // Compact spacing
    navContainer.style.opacity = '0'; // Initially hidden
    navContainer.style.transition = 'opacity 0.3s, transform 0.3s';
    navContainer.style.padding = '4px 8px';
    navContainer.style.borderRadius = '8px';
    navContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
    navContainer.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    navContainer.style.border = '1px solid rgba(0, 0, 0, 0.1)';

    // Create "Back" button
    const backButton = document.createElement('button');
    backButton.innerText = '🤩';
    backButton.style.padding = '6px';
    backButton.style.border = 'none';
    backButton.style.borderRadius = '6px';
    backButton.style.backgroundColor = '#f3f3f3';
    backButton.style.color = '#333';
    backButton.style.cursor = 'pointer';
    backButton.style.fontSize = '12px';
    backButton.style.fontWeight = '500';
    backButton.style.transition = 'background-color 0.2s';
    backButton.addEventListener('mouseenter', () => {
        backButton.style.backgroundColor = '#e0e0e0';
    });
    backButton.addEventListener('mouseleave', () => {
        backButton.style.backgroundColor = '#f3f3f3';
    });

    // Create "Forward" button
    const forwardButton = document.createElement('button');
    forwardButton.innerText = '🥰';
    forwardButton.style.cssText = backButton.style.cssText; // Same style as back button
    forwardButton.addEventListener('mouseenter', () => {
        forwardButton.style.backgroundColor = '#e0e0e0';
    });
    forwardButton.addEventListener('mouseleave', () => {
        forwardButton.style.backgroundColor = '#f3f3f3';
    });

    // Append buttons to container
    navContainer.appendChild(backButton);
    navContainer.appendChild(forwardButton);

    // Append container to body
    document.body.appendChild(navContainer);

    // Add click events for navigation
    backButton.addEventListener('click', () => {
        if (history.length > 1) history.back();
        else alert('No previous page available.');
    });

    forwardButton.addEventListener('click', () => {
        history.forward();
    });

    // Show buttons only during scroll
    let isScrolling;
    const showButtonsOnScroll = () => {
        clearTimeout(isScrolling);

        // Show buttons while scrolling
        navContainer.style.opacity = '1';
        navContainer.style.transform = 'translateX(-50%) translateY(0)';

        // Hide buttons after 500ms of no scrolling
        isScrolling = setTimeout(() => {
            navContainer.style.opacity = '0';
            navContainer.style.transform = 'translateX(-50%) translateY(20px)';
        }, 500);
    };

    window.addEventListener('scroll', showButtonsOnScroll);
})();