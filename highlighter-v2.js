// ==UserScript==
// @name         Advanced TiddlyWiki Highlighter
// @description  Highlighter that exports to TiddlyWiki with advanced features.
// @namespace    
// @match        http://*/*
// @match        https://*/*
// @connect      *
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
var highlightedRuns = JSON.parse(localStorage.getItem('highlightedRuns')) || [];
var highlightColor = 'yellow';

function textInRun(run) {
    var text = "";
    for (var range of run) {
        text += range.cloneContents().textContent;
    }
    text = text.replace('\n', ' ');
    return text;
}

function updateDownloadButton() {
    let dl = document.getElementById('advanced-download');

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

    let string = JSON.stringify(out);
    var data = "data:text/json;charset=utf-8," + encodeURIComponent(string);
    let filename = out.title + ".json";

    dl.setAttribute("href", data);
    dl.setAttribute("download", filename);
}

function updateHighlightsList() {
    let list = document.getElementById('advanced-highlight-list');
    list.innerHTML = 'no highlights';

    if (highlightedRuns.length > 0) {
        list.innerHTML = "";
    }

    for (var i = 0; i < highlightedRuns.length; i++) {
        let run = highlightedRuns[i];
        let listItem = document.createElement('li');
        listItem.className = 'advanced-highlight-list-item';
        listItem.innerHTML = textInRun(run);

        let deleteButton = document.createElement('a');
        let index = i;
        deleteButton.addEventListener('click', function() {
            removeHighlightedRun(index);
        });
        deleteButton.innerHTML = "[x]";
        deleteButton.className = 'advanced-menu-button advanced-delete';
        listItem.prepend(deleteButton);

        list.appendChild(listItem);
    }

    document.getElementById('advanced-toggle-highlights').innerHTML = 'highlights (' + highlightedRuns.length + ')';
}

function updateMenuVisibility() {
    let menu = document.getElementById('advanced-highlight-menu');
    if (highlightedRuns.length > 0) {
        menu.classList.remove('advanced-hidden');
    } else {
        menu.classList.add('advanced-hidden');
    }
}

function removeDrawnHighlights() {
    let highlights = Array.from(document.getElementsByClassName('advanced-highlight'));
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
                highlight.className = 'advanced-highlight';
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
    updateDownloadButton();
    updateHighlightsList();
    redrawHighlights();
    updateMenuVisibility();
    localStorage.setItem('highlightedRuns', JSON.stringify(highlightedRuns));
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
            for (var i = 0, len = node.childNodes.length; !reachedEndNode && i < len; ++i)

 {
                getTextNodes(node.childNodes[i]);
            }
        }
    }

    getTextNodes(rootNode);
    return textNodes;
}

function getSelectedTextNodes() {
    var sel = document.getSelection();
    var startNode = sel.anchorNode;
    var endNode = sel.focusNode;

    if (startNode === endNode) {
        return [startNode];
    } else {
        return getTextNodesBetween(sel.getRangeAt(0).commonAncestorContainer, startNode, endNode);
    }
}

function handleMouseUp(e) {
    var sel = document.getSelection();
    if (sel.toString().length === 0) {
        currentSelection = null;
    } else {
        let ranges = [];
        for (var i = 0; i < sel.rangeCount; i++) {
            let range = sel.getRangeAt(i);
            ranges.push(range);
        }
        currentSelection = ranges;
    }
}

function toggleHighlights() {
    let highlights = document.getElementsByClassName('advanced-highlight');
    for (var highlight of highlights) {
        highlight.classList.toggle('advanced-hidden');
    }
}

function clearHighlights() {
    highlightedRuns = [];
    update();
}

function setupMenu() {
    let menu = document.createElement('div');
    menu.id = 'advanced-highlight-menu';
    menu.className = 'advanced-highlight-menu advanced-hidden';

    let buttonContainer = document.createElement('div');
    buttonContainer.id = 'advanced-button-container';

    let highlightButton = document.createElement('a');
    highlightButton.innerHTML = "highlight";
    highlightButton.addEventListener('click', function() {
        addHighlightedRun(currentSelection);
    });
    highlightButton.className = 'advanced-menu-button';

    let downloadButton = document.createElement('a');
    downloadButton.innerHTML = "download";
    downloadButton.className = 'advanced-menu-button';
    downloadButton.id = 'advanced-download';

    let toggleButton = document.createElement('a');
    toggleButton.innerHTML = 'highlights';
    toggleButton.className = 'advanced-menu-button';
    toggleButton.id = 'advanced-toggle-highlights';
    toggleButton.addEventListener('click', toggleHighlights);

    let clearButton = document.createElement('a');
    clearButton.innerHTML = 'clear';
    clearButton.className = 'advanced-menu-button';
    clearButton.addEventListener('click', clearHighlights);

    let colorPickerLabel = document.createElement('label');
    colorPickerLabel.innerHTML = 'Color:';
    let colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = highlightColor;
    colorPicker.addEventListener('input', function() {
        highlightColor = colorPicker.value;
        update();
    });
    colorPickerLabel.appendChild(colorPicker);

    let list = document.createElement('ul');
    list.id = 'advanced-highlight-list';

    buttonContainer.appendChild(highlightButton);
    buttonContainer.appendChild(downloadButton);
    buttonContainer.appendChild(toggleButton);
    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(colorPickerLabel);
    menu.appendChild(buttonContainer);
    menu.appendChild(list);
    document.body.appendChild(menu);
}

function setup() {
    let style = `
        .advanced-highlight-menu {
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

        .advanced-highlight-menu * {
            all: revert;
        }

        #advanced-dimming-view {
            position: fixed;
            top: 0px;
            left: 0px;
            width: 100%;
            height: 100%;
            z-index: 9000;
            background-color: black;
            opacity: 0.4;
        }

        .advanced-menu-button {
            padding: 8px;
        }

        .advanced-delete {
            color: red;
            font-weight: bolder;
        }

        .advanced-highlight {
            z-index: 8000;
            position: absolute;
            background-color: ${highlightColor};
            background-blend-mode: multiply;
            opacity: 0.4;
        }

        #advanced-highlight-list {
            padding: 0;
            list-style-type: none;
            overflow: scroll;
        }

        .advanced-highlight-list-item {

        }

        .advanced-hidden {
            display: none;
        }

        .advanced-disabled {
            user-select: none;
            pointer-events: none;
        }
    `;

    var styleSheet = document.createElement("style");
    styleSheet.innerText = style;
    document.head.appendChild(styleSheet);

    document.addEventListener('mouseup', handleMouseUp);

    setupMenu();
    update();
}

setup();
```

