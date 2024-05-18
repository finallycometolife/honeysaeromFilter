// ==UserScript==
// @name AdvancedHighlighter
// @description Highlighter with customizable colors and local storage support.
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
    var pastStartNode = false, reachedEndNode =
