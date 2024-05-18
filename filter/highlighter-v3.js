// ==UserScript==
// @name         AdvancedHighlighter
// @description  Highlighter with customizable colors and local storage support.
// @namespace    http://tampermonkey.net/
// @version      0.1
// @match        http://*/*
// @match        https://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var currentSelection = null;
    var highlightedRuns = [];
    var highlightColor = "#ff0"; // Default highlight color

    function textInRun(run) {
        var text = "";
        for (var range of run) {
            text += range.cloneContents().textContent;
        }
        text = text.replace('\n', ' ');
        return text;
    }

    function updateHighlightsList() {
        let list = document.getElementById('highlight-list');
        list.innerHTML = 'no highlights';

        if (highlightedRuns.length > 0) {
            list.innerHTML = "";
        }

        for (var i = 0; i < highlightedRuns.length; i++) {
            let run = highlightedRuns[i];
            let listItem = document.createElement('li');
            listItem.className = 'highlight-list-item';
            listItem.innerHTML = textInRun(run);

            let deleteButton = document.createElement('a');
            deleteButton.addEventListener('click', function() {
                removeHighlightedRun(i);
            });
            deleteButton.innerHTML = "[x]";
            deleteButton.className = 'menu-button delete';
            listItem.prepend(deleteButton);

            list.appendChild(listItem);
        }

        document.getElementById('toggle-highlights').innerHTML = 'highlights (' + highlightedRuns.length + ')';
    }

    function updateMenuVisibility() {
        let menu = document.getElementById('highlight-menu');
        if (highlightedRuns.length > 0) {
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
    }

    function removeDrawnHighlights() {
        let highlights = Array.from(document.getElementsByClassName('highlight'));
        for (var highlight of highlights) {
            highlight.parentNode.removeChild(highlight);
        }
    }

    function redrawHighlights() {
        for (var i = 0; i < highlightedRuns.length; i++) {
            let run = highlightedRuns[i];
            for (var j = 0; j < run.length; j++) {
                let range = run[j];
                for (var rect of range.getClientRects()) {
                    let x = rect.x + window.scrollX;
                    let y = rect.y + window.scrollY;
                    let w = rect.width;
                    let h = rect.height;

                    let highlight = document.createElement('div');
                    highlight.className = 'highlight';
                    highlight.style.left = `${x}px`;
                    highlight.style.top = `${y}px`;
                    highlight.style.width = `${w}px`;
                    highlight.style.height = `${h}px`;
                    highlight.style.backgroundColor = highlightColor;

                    let index = i;
                    highlight.addEventListener('click', function() {
                        removeHighlightedRun(index);
                    });
                    document.body.appendChild(highlight);
                }
            }
        }
    }

    function update() {
        removeDrawnHighlights();
        updateHighlightsList();
        redrawHighlights();
        updateMenuVisibility();
        saveHighlights();
    }

    function rangesIntersect(a, b) {
        if ((a.startContainer != b.startContainer) ||
            (a.endContainer != b.endContainer)) {
            return false;
        }
        let aStart = a.startOffset;
        let aEnd = a.endOffset;
        let bStart = b.startOffset;
        let bEnd = b.endOffset;

        return !((aStart < bStart && aEnd < bStart) ||
            (aStart > bEnd && aEnd > bEnd));
    }

    function runsIntersect(a, b) {
        for (var aRange of a) {
            for (var bRange of b) {
                if (rangesIntersect(aRange, bRange)) {
                    return true;
                }
            }
        }
        return false;
    }

    function mergedRange(a, b) {
        let newRange = document.createRange();
        if ((a.startContainer != b.startContainer) ||
            (a.endContainer != b.endContainer)) {
            console.log('containers do not match');
        }

        newRange.setStart(a.startContainer, Math.min(a.startOffset, b.startOffset));
        newRange.setEnd(a.endContainer, Math.max(a.endOffset, b.endOffset));

        return newRange;
    }

    function mergedRun(a, b) {
        var outRun = new Array();
        outRun = outRun.concat(a);

        for (var i = 0; i < outRun.length; i++) {
            var range = outRun[i];
            for (var bRange of b) {
                if (rangesIntersect(range, bRange)) {
                    range = mergedRange(range, bRange);
                }
            }
            outRun[i] = range;
        }

        return outRun;
    }

    function combineRunsIfPossible() {
        var runs = new Array();

        for (var i = 0; i < highlightedRuns.length; i++) {
            var highlightedRun = highlightedRuns[i];
            var merged = false;
            for (var j = 0; j < runs.length; j++) {
                var run = runs[j];
                if (runsIntersect(highlightedRun, run)) {
                    run = mergedRun(highlightedRun, run);
                    merged = true;
                }
                if (merged) {
                    runs[j] = run;
                }
            }
            if (!merged) {
                runs.push(highlightedRun);
            }
        }

        highlightedRuns = runs;
    }

    function addHighlightedRun(run) {
        run = run.filter(range => range.startOffset != range.endOffset);
        if (run.length == 0) { return; }

        run.sort(function(a, b) {
            return a.compareBoundaryPoints(Range.START_TO_START, b);
        });
        highlightedRuns.push(run);
        combineRunsIfPossible();
        combineRunsIfPossible();
        highlightedRuns.sort(function(a, b) {
            return a[0].compareBoundaryPoints(Range.START_TO_START, b[0]);
        });

        update();
    }

    function removeHighlightedRun(index) {
        highlightedRuns.splice(index, 1);
        update();
    }

    function getTextNodesBetween(rootNode, startNode, endNode) {
        var pastStartNode = false, reachedEndNode = false, textNodes = [];

        function getTextNodes(node) {
            if (node == startNode) {
                pastStartNode = true;
            } else if (node == endNode) {
                reachedEndNode = true;
            } else if (node.nodeType == 3) {
                if (pastStartNode && !reachedEndNode && !/^\s*$/.test(node.nodeValue)) {
                    textNodes.push(node);
                }
            } else {
                for (var i = 0, len = node.childNodes.length; !reachedEndNode && i < len; ++i) {
                    getTextNodes(node.childNodes[i]);
                }
            }
        }

        getTextNodes(rootNode);
        return textNodes;
    }

    function highlightCurrentSelection() {
        if (currentSelection == null) { return; }
        if (currentSelection.isCollapsed) { return; }

        let anchorNode = currentSelection.anchorNode;
        let focusNode = currentSelection.focusNode;

        var run = new Array();

        if (anchorNode != focusNode) {
            let position = anchorNode.compareDocumentPosition(focusNode);
            var startNode = anchorNode;
            var endNode = focusNode;
            var startOffset = currentSelection.anchorOffset;
            var endOffset = currentSelection.focusOffset;
            if (position & 0x02) {
                startNode = focusNode;
                endNode = anchorNode;
                startOffset = endOffset;
                endOffset = currentSelection.anchorOffset;
            }

            let startLength = startNode.length;
            let startRange = document.createRange();
            startRange.setStart(startNode, startOffset);
            startRange.setEnd(startNode, startLength);

            let endRange = document.createRange();
            endRange.setStart(endNode, 0);
            endRange.setEnd(endNode, endOffset);
            let nodesBetween = getTextNodesBetween(document.body, startNode, endNode);

            for (var between of nodesBetween) {
                if (between == startNode) { continue; }
                if (between == endNode) { continue; }
                let betweenRange = document.createRange();
                betweenRange.setStart(between, 0);
                betweenRange.setEnd(between, between.length);
                run.push(betweenRange);
            }

            run.push(startRange);
            run.push(endRange);
        } else {
            let range = document.createRange();
            range.setStart(anchorNode, currentSelection.anchorOffset);
            range.setEnd(focusNode, currentSelection.focusOffset);
            run.push(range);
        }

        addHighlightedRun(run);
    }

    function setHighlightsEnabled(enabled) {
        let highlights = Array.from(document.getElementsByClassName('highlight'));
        for (var highlight of highlights) {
            if (enabled) {
                highlight.classList.remove('disabled');
            } else {
                highlight.classList.add('disabled');
            }
        }
    }

    function handleDown(e) {
        if (!e.target.classList.contains('highlight')) {
            setHighlightsEnabled(false);
        }
    }

    function handleUp(e) {
        currentSelection = document.getSelection();
        highlightCurrentSelection();
        setHighlightsEnabled(true);
    }

    function saveHighlights() {
        localStorage.setItem('highlightedRuns', JSON.stringify(highlightedRuns));
    }

    function loadHighlights() {
        let savedRuns = localStorage.getItem('highlightedRuns');
        if (savedRuns) {
            highlightedRuns = JSON.parse(savedRuns);
        }
    }

    function setup() {
        loadHighlights();

        let menu = document.createElement('div');
        menu.id = 'highlight-menu';
        menu.className = 'highlight-menu';
        document.body.appendChild(menu);

        function toggleList() {
            document.getElementById('highlight-list').classList.toggle('hidden');
            document.getElementById('dimming-view').classList.toggle('hidden');
        }

        let dimmingView = document.createElement('div');
        dimmingView.className = 'hidden';
        dimmingView.id = 'dimming-view';
        dimmingView.onclick = function() {
            toggleList();
        };
        document.body.appendChild(dimmingView);

        let highlightsList = document.createElement('ul');
        highlightsList.id = 'highlight-list';
        highlightsList.className = 'hidden';
        menu.appendChild(highlightsList);

        let toggleHighlightListButton = document.createElement('a');
        toggleHighlightListButton.id = 'toggle-highlights';
        toggleHighlightListButton.className = 'menu-button';
        toggleHighlightListButton.innerHTML = "highlights";
        toggleHighlightListButton.onclick = function() {
            toggleList();
        };
        menu.appendChild(toggleHighlightListButton);

        let colorPicker = document.createElement('input');
        colorPicker.id = 'color-picker';
        colorPicker.type = 'color';
        colorPicker.value = highlightColor;
        colorPicker.className = 'menu-button';
        colorPicker.oninput = function() {
            highlightColor = colorPicker.value;
            update();
        };
        menu.appendChild(colorPicker);

        let style = `
            .highlight-menu {
                all: initial;
                z-index: 10000;
                position: fixed;
                bottom: 20px;
                left: 20px;
                padding: 15px;
                border-radius: 22px;
                max-width: 300px;
                background-color: white;
                filter: drop-shadow(1px 1px 8px rgba(0,0,0,0.2));
                -moz-user-select: none;
                -webkit-user-select: none;
                user-select: none;
            }

            .highlight-menu * {
                all: revert;
            }

            #dimming-view {
                position: fixed;
                top: 0px;
                left: 0px;
                width: 100%;
                height: 100%;
                z-index: 9000;
                background-color: black;
                opacity: 0.4;
            }

            .menu-button {
                padding: 8px;
            }

            .delete {
                color: red;
                font-weight: bolder;
            }

            .highlight {
                z-index: 8000;
                position: absolute;
                background-color: pink;
                background-blend-mode: multiply;
                opacity: 0.4;
            }

            #highlight-list {
                padding: 0;
                list-style-type: none;
                overflow: scroll;
            }

            .highlight-list-item {

            }

            .hidden {
                display: none;
            }

            .disabled {
                user-select: none;
                pointer-events: none;
            }
        `;
        var styleSheet = document.createElement("style");
        styleSheet.innerText = style;
        document.head.appendChild(styleSheet);

        document.addEventListener('pointerdown', (e) => {
            handleDown(e);
        });

        document.addEventListener('pointerup', (e) => {
            handleUp(e);
        });

        window.addEventListener('resize', () => {
            removeDrawnHighlights();
            redrawHighlights();
        });

        update();
    }

    if (document.body != null) {
        setup();
    }
})();
