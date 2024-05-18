// ==UserScript==
// @name -highlighter
// @description Highlighter 
// @namespace http://
// @match http://*/*
// @match https://*/*
// @connect *
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @grant        GM.openInTab
// @grant        GM.xmlHttpRequest
// ==/UserScript==
//
// No warranty! Use at your own risk!

var currentSelection = null;
// array of array of ranges
var highlightedRuns = new Array();

function textInRun(run) {
    var text = "";
    for (var range of run) {
        text += range.cloneContents().textContent;
    }
    text = text.replace('\n', ' ');
    return text;
}

function updateDownloadButton() {
    let dl = document.getElementById('phajas-download');

    var out = { };
    
    var title = "";
    for (var word of document.title.split(' ')) {
        if (word.length == 0) { continue; }
        let firstLetter = word.charAt(0).toUpperCase();
        let capitalizedWord = firstLetter + word.substring(1);
        title = title + capitalizedWord;
    }

    let badStrings = [' ', '|', '-', ',', '\'', '&'];
    for (var bad of badStrings) {
        title = title.replace(bad, '');
    }

    out.title = title;
    out.text = "";
    out.url = document.URL;

    for (var run of highlightedRuns) {
        out.text += textInRun(run);
        out.text += "\n\n";
    }
    /*
    // let string = JSON.stringify(out);
    // var data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(out));
    // let filename = out.title + " .json";

    // dl.setAttribute("href", data);
    // dl.setAttribute("download", filename);
    */
}

function updateHighlightsList() {
    let list = document.getElementById('phajas-highlight-list');
    list.innerHTML = 'no highlights';

    if (highlightedRuns.length > 0) {
        list.innerHTML = "";
    }

    for (var i = 0; i < highlightedRuns.length; i++) {
        let run = highlightedRuns[i];
        let listItem = document.createElement('li');
        listItem.className = 'phajas-highlight-list-item';
        listItem.innerHTML = textInRun(run);

        let deleteButton = document.createElement('a');
        let index = i;
        deleteButton.addEventListener('click', function() {
            removeHighlightedRun(index);
        });
        deleteButton.innerHTML = "[x]";
        deleteButton.className = 'phajas-menu-button phajas-delete';
        listItem.prepend(deleteButton);

        list.appendChild(listItem);
    }

    document.getElementById('phajas-toggle-highlights').innerHTML = 'highlights (' + highlightedRuns.length + ')';
}

function updateMenuVisibility() {
    let menu = document.getElementById('phajas-highlight-menu');
    if (highlightedRuns.length > 0) {
        menu.classList.remove('phajas-hidden');
    } else {
        menu.classList.add('phajas-hidden');
    }
}

function removeDrawnHighlights() {
    let highlights = Array.from(document.getElementsByClassName('phajas-highlight'));
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
                highlight.className = 'phajas-highlight';
                highlight.style.left = '' + x + 'px';
                highlight.style.top = '' + y + 'px';
                highlight.style.width = '' + w + 'px';
                highlight.style.height = '' + h + 'px';

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
    updateDownloadButton();
    updateHighlightsList();
    redrawHighlights();
    updateMenuVisibility();
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

    if ((aStart < bStart && aEnd < bStart) ||
        (aStart > bEnd && aEnd > bEnd)) {
        return false;
    }
    else {
        return true;
    }
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
    let removed = highlightedRuns.splice(index, 1);
    update();
}

function getTextNodesBetween(rootNode, startNode, endNode) { /* https://stackoverflow.com/a/4399286 */
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

    /* The highlight runs from anchor to offset */
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
            let range = document.createRange();
            range.selectNodeContents(between);
            run.push(range);
        }

        run.push(startRange);
        run.push(endRange);
    }
    else {
        for (var i = 0; i < currentSelection.rangeCount; i++) {
            let range = currentSelection.getRangeAt(i).cloneRange();
            run.push(range);
        }
    }

    addHighlightedRun(run);

    currentSelection = null;
}

function setHighlightsEnabled(enabled) {
    for (var highlight of document.getElementsByClassName('phajas-highlight')) {
        if (enabled) {
            highlight.classList.remove('phajas-disabled');
        }
        else {
            highlight.classList.add('phajas-disabled');
        }
    }
}

function handleDown(e) {
    if (!e.target.classList.contains('phajas-highlight')) {
        setHighlightsEnabled(false);
    }
}

function handleUp(e) {
    currentSelection = document.getSelection();
    highlightCurrentSelection();
    setHighlightsEnabled(true);
}

function setup() {
    let menu = document.createElement('div');
    menu.id = 'phajas-highlight-menu';
    menu.className = 'phajas-highlight-menu';
    document.body.appendChild(menu);

    function toggleList() {
        document.getElementById('phajas-highlight-list').classList.toggle('phajas-hidden');
        document.getElementById('phajas-dimming-view').classList.toggle('phajas-hidden');
    }

    let dimmingView = document.createElement('div');
    dimmingView.className = 'phajas-hidden';
    dimmingView.id = 'phajas-dimming-view';
    dimmingView.onclick = function() {
        toggleList();
    };
    document.body.appendChild(dimmingView);

    let highlightsList = document.createElement('ul');
    highlightsList.id = 'phajas-highlight-list';
    highlightsList.className = 'phajas-hidden';
    menu.appendChild(highlightsList);

    let toggleHighlightListButton = document.createElement('a');
    toggleHighlightListButton.id = 'phajas-toggle-highlights';
    toggleHighlightListButton.className = 'phajas-menu-button';
    toggleHighlightListButton.innerHTML = "highlights";
    toggleHighlightListButton.onclick = function() {
        toggleList();
    };
    menu.appendChild(toggleHighlightListButton);
    /*
    let downloadButton = document.createElement('a');
    downloadButton.id = 'phajas-download';
    downloadButton.className = 'phajas-menu-button';
    downloadButton.innerHTML = "download";
    menu.appendChild(downloadButton);
    */
    let style = `
        .phajas-highlight-menu {
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

        .phajas-highlight-menu * {
            all: revert;
        }

        #phajas-dimming-view {
            position: fixed;
            top: 0px;
            left: 0px;
            width: 100%;
            height: 100%;
            z-index: 9000;
            background-color: black;
            opacity: 0.4;
        }

        .phajas-menu-button {
            padding: 8px;
        }

        .phajas-delete {
            color: red;
            font-weight: bolder;
        }

        .phajas-highlight {
            z-index: 8000;
            position: absolute;
            background-color: pink;
            background-blend-mode: multiply;
            opacity: 0.4;
        }

        #phajas-highlight-list {
            padding: 0;
            list-style-type: none;
            overflow: scroll;
        }

        .phajas-highlight-list-item {

        }

        .phajas-hidden {
            display: none;
        }

        .phajas-disabled {
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

