var init = false;
var isPlaying = false;
var bounded = false;
var p = null;

var rawEntities = null;

var bubbles = new Array();
var select = 0;
var idFile = 1;

var scales = new ScaleData();
var guiData = new GuiData();
var currentAxes = new SelectAxes();
var year = new YearData();
var highlight = new HighlightedData();
var load = new LoadingValues();

var entityYearMin = new Array(null, null, null, null);
var entityYearMax = new Array(null, null, null, null);
var dataEntries = new Array(null, null, null, null);

var HistoricalMap = {};
var OverMap = {};

// Enum for the differents axes
var guiAxes = {
    X: 0,
    Y: 1,
    SIZE: 2,
    COLOR: 3
}

Array.prototype.unset = function(val) {
    var idx = this.indexOf(val);
    if (idx > -1) {
        this.splice(idx, 1);
    }
}

/*
 ** Different objects to stores useful data
 */

function    LoadingValues() {
    this.loaded = false;
    this.loading = false;
    this.axe = -1;
    this.idx = -1;
}

function    HighlightedData() {
    this.bubble = -1;
    this.inHist = null;
}

function    YearData() {
    this.min = 0;
    this.max = 0;
    this.current = 0;
    this.step = 0;
}

function    ScaleData() {
    this.mins = new Array(null, null, null, null);
    this.maxs = new Array(null, null, null, null);
    this.steps = new Array(null, null);
}

function    SelectAxes() {
    this.x = -1;
    this.y = -1;
    this.color = -1;
    this.size = -1;
}

// Data shared between core and gui
function    GuiData() {
    this.entries = null;
    this.entities = null;
    this.files = null;
    this.cursorPos = 0;
    this.cursorSpeed = 20;
    this.colorActivated = true;
    this.sizeActivated = true;
    this.cursorSize = 55;
    this.opacity = 70;
}

function	Bubble(posX, posY, size, col, name, year, yearClicked) {
    this.posX = posX;
    this.posY = posY;
    this.size = size;
    this.col = col;
    this.name = name;
    this.year = year;
    this.isClicked = false;
    if (yearClicked == undefined)
        this.yearClick = -1;
    else
        this.yearClick = yearClicked;
    this.crossed = false;
    this.draw = true;
}

/*
 ** A debug function
 */

Bubble.prototype.print = function() {
    p.println("bubble: x->" + this.posX + " y->" + this.posY + " size->" + this.size
            + " col->" + this.col + " name->" + this.name + " year->" + this.year
            + " clicked->" + this.isClicked);
}

/*
 ** Run the Processing.js components
 */

function	runProcessing() {
    initProcessing();
}

/*
 ** Initialises the Processing.js canvas
 */

function	initProcessing() {
    p = Processing.getInstanceById('ProcessingCanvas');
    if (p) {
        bounded = true;
        p.getBubbleDrawer().loadingWindow();
        p.getBubbleDrawer().display();
        p.bindJavascript(this);
        initData();
        launch();
    }
    if (!bounded)
        setTimeout(initProcessing, 250);
}

/*
 ** Initialises the datas
 */

function    initData() {
    retrieveFilesFromDB();
    retrieveEntriesFromDB();
    retrieveEntitiesFromDB();
    setBeginAxes();
    initAxes();
    scales.steps[guiAxes.X] = 10;
    scales.steps[guiAxes.Y] = 10;
}

/*
 ** Initialises the axes
 */

function    initAxes() {
    if (currentAxes.x != -1 && currentAxes.y != -1 && currentAxes.color != -1 && currentAxes.size != -1) {
        retrieveYearAmpl(guiAxes.X, currentAxes.x);
        retrieveYearAmpl(guiAxes.Y, currentAxes.y);
        retrieveYearAmpl(guiAxes.SIZE, currentAxes.size);
        retrieveYearAmpl(guiAxes.COLOR, currentAxes.color);
        retrieveEntityByIdEntry(guiAxes.X, currentAxes.x);
        retrieveEntityByIdEntry(guiAxes.Y, currentAxes.y);
        retrieveEntityByIdEntry(guiAxes.SIZE, currentAxes.size);
        retrieveEntityByIdEntry(guiAxes.COLOR, currentAxes.color);
        retrieveValueAmpl(guiAxes.X, currentAxes.x);
        retrieveValueAmpl(guiAxes.Y, currentAxes.y);
        retrieveValueAmpl(guiAxes.SIZE, currentAxes.size);
        retrieveValueAmpl(guiAxes.COLOR, currentAxes.color);
    }
    else
        setTimeout(initAxes, 250);
}

/*
 ** To change if no color or no size
 */

function    setBeginAxes() {
    var k = 9999999;
    var nbEntries = 0;
    if (guiData.entries != null) {
        for (var entry in guiData.entries) {
            k = Math.min(k, entry);
            nbEntries = entry;
        }
        if (k != 9999999)
            nbEntries = k + parseInt(nbEntries);
        currentAxes.x = k++;
        currentAxes.y = k;
        if (k + 1 < nbEntries)
            ++k;
        currentAxes.color = k;
        if (k + 1 < nbEntries)
            ++k;
        currentAxes.size = k;
    }
    else
        setTimeout(setBeginAxes, 250);
}

/*
 ** Launch the application, set the GUI, and load the data
 */

function    launch() {
    if (guiData.files != null && guiData.entries != null && rawEntities != null && dataEntries[guiAxes.X] != null
            && dataEntries[guiAxes.Y] != null && dataEntries[guiAxes.SIZE] != null && dataEntries[guiAxes.COLOR] != null
            && entityYearMin[guiAxes.X] != null && entityYearMin[guiAxes.Y] != null && entityYearMin[guiAxes.SIZE] != null && entityYearMin[guiAxes.COLOR] != null
            && scales.mins[guiAxes.X] != null && scales.mins[guiAxes.Y] != null && scales.mins[guiAxes.SIZE] != null && scales.mins[guiAxes.COLOR] != null) {
        setMinMaxYear();
        setGuiEntities();
        createBubbles();
        s = $(entityDiv);
        for (var b in guiData.entities) {
            var cb = "<input type=\"checkbox\" id=\"entity[";
            cb += guiData.entities[b];
            cb += "]\" value=\"";
            cb += escape(guiData.entities[b]);
            cb += "\" onClick=\"selectBubbleCheckBox('";
            cb += escape(guiData.entities[b]);
            cb += "');\" onMouseOver=\"mouseOverCheckBox('";
            cb += escape(guiData.entities[b]);
            cb += "');\" /><label for=\"entity[";
            cb += guiData.entities[b];
            cb += "]\" onMouseOver=\"mouseOverCheckBox('";
            cb += escape(guiData.entities[b]);
            cb += "');\">";
            cb += guiData.entities[b];
            cb += "</label><br>";
            s.append(cb);
        }
        var a = new Array();
        for (var b in guiData.entries) {
            a.push({value: guiData.entries[b], id: b});
        }
        var k = 0;
        $("#selectAxeXValue").next("input").autocomplete({source: a});
        $("#selectAxeXValue").next("input").attr("value", a[k].value);

        if (a.length > k + 1)
            ++k;
        $("#selectAxeYValue").next("input").autocomplete("option", "source", a);
        $("#selectAxeYValue").next("input").attr("value", a[k].value);
        if (a.length > k + 1)
            ++k;
        $("#selectColorValue").next("input").autocomplete("option", "source", a);
        $("#selectColorValue").next("input").attr("value", a[k].value);
        if (a.length > k + 1)
            ++k;
        $("#selectSizeValue").next("input").autocomplete("option", "source", a);
        $("#selectSizeValue").next("input").attr("value", a[k].value);
        var f = new Array();
        for (var b in guiData.files) {
            f.push({value: guiData.files[b], id: b});
        }
        
        k = idFile - 1;
        $("#selectFile").next("input").autocomplete({source: f});
        $("#selectFile").next("input").attr("value", f[k].value);

        document.getElementById("minColorValue").innerHTML = scales.mins[guiAxes.COLOR];
        document.getElementById("maxColorValue").innerHTML = scales.maxs[guiAxes.COLOR];
        document.getElementById("colorCheckBox").checked = true;
        $("#selectColorValue").next("input").checked = true;
        p.getBubbleDrawer().useColor(guiData.colorActivated);
        $("#selectSizeValue").next("input").autocomplete("enable");
        document.getElementById("sizeCheckBox").checked = true;
        p.getBubbleDrawer().useSize(guiData.sizeActivated);
        document.getElementById("deselectButton").disabled = true;
        p.getBubbleDrawer().noBubbleSelected();
        p.getBubbleDrawer().resetSize();
        runApplication();
    }
    else
        setTimeout(launch, 250);
}

/*
 ** Set the GUI Entities
 */

function    setGuiEntities() {
    guiData.entities = jQuery.extend({}, rawEntities);
}

/*
 ** Retrieve the data and create the bubbles
 */

function    createBubbles() {
    bubbles = [];
    for (var prop in guiData.entities) {
        bubbles.push(new Bubble(0, 0, 0, 0, guiData.entities[prop], 0));
    }
}

/*
 ** Run the application
 */

function	runApplication() {
    year.current = year.min;
    init = true;
    build_slider('#timeSlider', year.min, year.max, year.value, 1, 1);
    refreshBubbles();
    refreshDisplay();
}

/*
 ** Load axe data
 */

function    loading(axe, idx) {
    if (!load.loading) {
        unselectAll();
        DisableUI();
        load.idx = idx;
        load.axe = axe;
        load.loading = true;
        p.getBubbleDrawer().clear();
        p.getBubbleDrawer().loadingWindow();
        p.getBubbleDrawer().display();
        clearDataForLoading(axe);
        retrieveEntityByIdEntry(axe, idx);
        retrieveValueAmpl(axe, idx);
        retrieveYearAmpl(axe, idx);
    }
    if (dataEntries[load.axe] != null && entityYearMin[load.axe] != null && scales.mins[load.axe] != null) {
        setMinMaxYear();
        year.current = year.min;
        init = true;
        build_slider('#timeSlider', year.min, year.max, year.value, 1, 1);
        if (load.axe == guiAxes.COLOR) {
            document.getElementById("minColorValue").innerHTML = scales.mins[guiAxes.COLOR];
            document.getElementById("maxColorValue").innerHTML = scales.maxs[guiAxes.COLOR];
        }  
        refreshBubbles();
        refreshDisplay();
        load.loading = false;
        load.idx = -1;
        load.axe = -1;
        EnableUI();
    }
    else {
        setTimeout(loading, 250);
    }
}

/*
 ** Clear data from an axe
 */

function    clearDataForLoading(axe) {
    delete dataEntries[axe];
    entityYearMin[axe] = null;
    scales.mins[axe] = null;
    entityYearMax[axe] = null;
    scales.maxs[axe] = null;
}

/*
 ** Draw the bubbles
 */

function    drawBubbles() {
    // Print historical bubbles
    drawHistoricalBubbles();
    bubbles.sort(sortBubblesSize);
    for (i = 0; i < bubbles.length; ++i) {
        if (bubbles[i].draw) {
            if (bubbles[i].isClicked) {
                p.getBubbleDrawer().drawBubble(bubbles[i].posX, bubbles[i].posY, bubbles[i].size,
                        bubbles[i].col, bubbles[i].isClicked, bubbles[i].crossed);
                addToOverMap(bubbles[i]);
            }
            else {
                p.getBubbleDrawer().drawBubble(bubbles[i].posX, bubbles[i].posY, bubbles[i].size,
                        bubbles[i].col, bubbles[i].isClicked, bubbles[i].crossed);
            }
        }
    }
    document.getElementById("bubbleSizeValue").innerHTML = "";
    document.getElementById("bubbleColorValue").innerHTML = "";
    // Print highlitedBubble with coord infos
    if (highlight.inHist != null && highlight.bubble != -1) {
        var histBubble = HistoricalMap[highlight.inHist][highlight.bubble];
        p.getBubbleDrawer().drawHighlightBubble(histBubble.posX, histBubble.posY, histBubble.size, histBubble.col, histBubble.crossed);
        p.getBubbleDrawer().drawCoordInfos(dataEntries[guiAxes.X][histBubble.name][histBubble.year], histBubble.posX,
                dataEntries[guiAxes.Y][histBubble.name][histBubble.year], histBubble.posY,
                dataEntries[guiAxes.SIZE][histBubble.name][histBubble.year], histBubble.size,
                dataEntries[guiAxes.COLOR][histBubble.name][histBubble.year], histBubble.col);
        document.getElementById("bubbleSizeValue").innerHTML = dataEntries[guiAxes.SIZE][histBubble.name][histBubble.year];
        document.getElementById("bubbleColorValue").innerHTML = dataEntries[guiAxes.COLOR][histBubble.name][histBubble.year];
    }
    else if (highlight.bubble != -1) {
        p.getBubbleDrawer().drawHighlightBubble(bubbles[highlight.bubble].posX, bubbles[highlight.bubble].posY, bubbles[highlight.bubble].size, bubbles[highlight.bubble].col, bubbles[highlight.bubble].crossed);
        if (bubbles[highlight.bubble].crossed) {
            p.getBubbleDrawer().drawCoordInfos(dataEntries[guiAxes.X][bubbles[highlight.bubble].name][bubbles[highlight.bubble].year], bubbles[highlight.bubble].posX,
                    dataEntries[guiAxes.Y][bubbles[highlight.bubble].name][bubbles[highlight.bubble].year], bubbles[highlight.bubble].posY,
                    dataEntries[guiAxes.SIZE][bubbles[highlight.bubble].name][bubbles[highlight.bubble].year], bubbles[highlight.bubble].size,
                    dataEntries[guiAxes.COLOR][bubbles[highlight.bubble].name][bubbles[highlight.bubble].year], bubbles[highlight.bubble].col);
            document.getElementById("bubbleSizeValue").innerHTML = dataEntries[guiAxes.SIZE][bubbles[highlight.bubble].name][bubbles[highlight.bubble].year];
            document.getElementById("bubbleColorValue").innerHTML = dataEntries[guiAxes.COLOR][bubbles[highlight.bubble].name][bubbles[highlight.bubble].year];
        }
        else {
            p.getBubbleDrawer().drawCoordInfos(coordInfosTranslated(dataEntries[guiAxes.X][bubbles[highlight.bubble].name][year.current], dataEntries[guiAxes.X][bubbles[highlight.bubble].name][year.current + 1]),
                    bubbles[highlight.bubble].posX,
                    coordInfosTranslated(dataEntries[guiAxes.Y][bubbles[highlight.bubble].name][year.current], dataEntries[guiAxes.Y][bubbles[highlight.bubble].name][year.current + 1]),
                    bubbles[highlight.bubble].posY,
                    coordInfosTranslated(dataEntries[guiAxes.SIZE][bubbles[highlight.bubble].name][year.current], dataEntries[guiAxes.SIZE][bubbles[highlight.bubble].name][year.current + 1]),
                    bubbles[highlight.bubble].size,
                    coordInfosTranslated(dataEntries[guiAxes.COLOR][bubbles[highlight.bubble].name][year.current], dataEntries[guiAxes.COLOR][bubbles[highlight.bubble].name][year.current + 1]),
                    bubbles[highlight.bubble].col);
            document.getElementById("bubbleSizeValue").innerHTML = coordInfosTranslated(dataEntries[guiAxes.SIZE][bubbles[highlight.bubble].name][year.current], dataEntries[guiAxes.SIZE][bubbles[highlight.bubble].name][year.current + 1]);
            document.getElementById("bubbleColorValue").innerHTML = coordInfosTranslated(dataEntries[guiAxes.COLOR][bubbles[highlight.bubble].name][year.current], dataEntries[guiAxes.COLOR][bubbles[highlight.bubble].name][year.current + 1]);
        }
    }
}

function    coordInfosTranslated(currVal, nextVal) {
    if (year.step == 0)
        return parseFloat(currVal);
    else
        return parseFloat(currVal) + ((parseFloat(nextVal) - parseFloat(currVal)) * year.step);
}

/*
 ** Draw bubbles from historicals
 */

function    drawHistoricalBubbles() {
    var pos = 0;
    for (var prop in HistoricalMap) {
        HistoricalMap[prop].sort(sortBubblesYear);
        for (j = 0; j < HistoricalMap[prop].length; ++j) {
            for (pos = 0; pos < bubbles.length && bubbles[pos].name != HistoricalMap[prop][j].name; ++pos)
                ;
            if (j + 1 < HistoricalMap[prop].length) {
                p.getBubbleDrawer().drawLine(HistoricalMap[prop][j].posX, HistoricalMap[prop][j].posY,
                        HistoricalMap[prop][j + 1].posX, HistoricalMap[prop][j + 1].posY, HistoricalMap[prop][j].col);
            }
            else if (bubbles[pos].draw) {
                p.getBubbleDrawer().drawLine(HistoricalMap[prop][j].posX, HistoricalMap[prop][j].posY,
                        bubbles[pos].posX, bubbles[pos].posY, HistoricalMap[prop][j].col);
            }
        }
        HistoricalMap[prop].sort(sortBubblesSize);
        for (j = 0; j < HistoricalMap[prop].length; ++j) {
            p.getBubbleDrawer().drawBubble(HistoricalMap[prop][j].posX, HistoricalMap[prop][j].posY, HistoricalMap[prop][j].size,
                    HistoricalMap[prop][j].col, true, HistoricalMap[prop][j].crossed);
        }
    }
}

function    addToOverMap(b) {
    OverMap[b.name] = (jQuery.extend({}, b));
}

/*
 ** Draw bubbles names
 */

function    drawBubblesNames() {
    var highlightName = null;
    for (var b in OverMap) {
        if (highlight.inHist == null && highlight.bubble != -1 && OverMap[b].name == bubbles[highlight.bubble].name)
            highlightName = b;
        else {
            p.getBubbleDrawer().drawBubbleName(OverMap[b].posX, OverMap[b].posY, OverMap[b].size, OverMap[b].col, OverMap[b].crossed ? OverMap[b].name + ": " + OverMap[b].year : OverMap[b].name);
            delete OverMap[b];
        }
    }
    if (highlightName != null) {
        p.getBubbleDrawer().drawBubbleName(OverMap[highlightName].posX, OverMap[highlightName].posY, OverMap[highlightName].size,
                OverMap[highlightName].col, OverMap[highlightName].crossed ? OverMap[highlightName].name + ": " + OverMap[highlightName].year : OverMap[highlightName].name);
        delete OverMap[highlightName];
    }
    else if (highlight.inHist != null) {
        var bubble = HistoricalMap[highlight.inHist][highlight.bubble];
        p.getBubbleDrawer().drawBubbleName(bubble.posX, bubble.posY, bubble.size, bubble.col, bubble.year);
    }
}

/*
 ** Called when the mouse is over the plot
 */

function	overOnPlot(mX, mY) {
    var i;
    var res = -1;
    var resSize = 999999;
    var hist = null;

    for (i = 0; i < bubbles.length; ++i)
        if (bubbles[i].draw && bubbles[i].size < resSize
                && overCircle(mX, mY, bubbles[i].posX, bubbles[i].posY, bubbles[i].size / 2)) {
            res = i;
            resSize = bubbles[res].size;
        }
    if (res == -1) {
        for (var prop in HistoricalMap) {
            for (j = 0; j < HistoricalMap[prop].length; ++j)
                if (HistoricalMap[prop][j].draw && HistoricalMap[prop][j].size < resSize
                        && overCircle(mX, mY, HistoricalMap[prop][j].posX, HistoricalMap[prop][j].posY, HistoricalMap[prop][j].size / 2)) {
                    res = j;
                    resSize = HistoricalMap[prop][j].size;
                    hist = prop;
                }
        }
    }
    // Set infos for highlightedBubble print
    if (res >= 0) {
        highlight.bubble = res;
        if (hist != null) {
            highlight.inHist = hist;
        }
        else {
            highlight.inHist = null;
            if (select != 0 && guiData.opacity == 0 && !bubbles[highlight.bubble].isClicked)
                highlight.bubble = -1;
            else
                addToOverMap(bubbles[highlight.bubble]);
        }
    }
    else {
        highlight.bubble = -1;
        highlight.inHist = null;
    }
}

/*
 ** Test for mouse over bubble
 */

function	overCircle(mX, mY, x, y, radius) {
    var disX = x - mX;
    var disY = y - mY;
    if (mX < x - radius || mX > x + radius)
        return false;
    if (mY < y - radius || mY > y + radius)
        return false;
    if (Math.sqrt(Math.pow(disX, 2) + Math.pow(disY, 2)) < radius)
        return true;
    return false;
}

/*
 ** Called if user click on a bubble
 */

function	clickOnPlot() {
    var i;
    var found = false;
    if (highlight.bubble >= 0) {
        if (highlight.inHist != null) {
            for (i = 0; i < bubbles.length && !found; ++i) {
                if (bubbles[i].name == HistoricalMap[highlight.inHist][highlight.bubble].name) {
                    found = true;
                    break;
                }
            }
            if (found && bubbles[i].isClicked)
                removeFromHistorical(HistoricalMap[highlight.inHist][highlight.bubble].name);
            if (bubbles[i].isClicked) {
                document.getElementById("entity[" + [bubbles[i].name] + "]").checked = false;
                bubbles[i].yearClick = -1;
                --select;
            }
            else {
                document.getElementById("entity[" + [bubbles[i].name] + "]").checked = true;
                bubbles[i].yearClick = year.current;
                ++select;
            }
            bubbles[i].isClicked = !bubbles[i].isClicked;
        }
        else {
            if (bubbles[highlight.bubble].isClicked)
                removeFromHistorical(bubbles[highlight.bubble].name);
            if (bubbles[highlight.bubble].isClicked) {
                document.getElementById("entity[" + [bubbles[highlight.bubble].name] + "]").checked = false;
                bubbles[highlight.bubble].yearClick = -1;
                --select;
            }
            else {
                document.getElementById("entity[" + [bubbles[highlight.bubble].name] + "]").checked = true;
                bubbles[highlight.bubble].yearClick = year.current;
                ++select;
            }
            bubbles[highlight.bubble].isClicked = !bubbles[highlight.bubble].isClicked;
        }
    }
    updateSelectBubble();
    refreshDisplay();
}

/*
 ** Called when the mouse moves
 */

function    mouveMove() {
    refreshDisplay();
}

/*
 ** Draw the scales X and Y
 */

function    drawScales() {
    p.getBubbleDrawer().drawScale(guiAxes.X, scales.mins[guiAxes.X], scales.maxs[guiAxes.X], scales.steps[guiAxes.X]);
    p.getBubbleDrawer().drawScale(guiAxes.Y, scales.mins[guiAxes.Y], scales.maxs[guiAxes.Y], scales.steps[guiAxes.Y]);
}

/*
 ** Unselect all the bubbles (called by the button)
 */

function	unselectAll() {
    for (i = 0; i < bubbles.length; ++i) {
        if (bubbles[i].isClicked)
            removeFromHistorical(bubbles[i].name);
        bubbles[i].yearClick = -1;
        bubbles[i].isClicked = false;
        document.getElementById("entity[" + [bubbles[i].name] + "]").checked = false;
    }
    select = 0;
    updateSelectBubble();
    refreshDisplay();
}

/*
 ** Update selected bubbles
 */

function    updateSelectBubble() {
    if (select > 0) {
        $("#opacitySlider").slider("enable");
        p.getBubbleDrawer().bubbleSelected();
        document.getElementById("deselectButton").disabled = false;
    }
    else {
        $("#opacitySlider").slider("disable");
        p.getBubbleDrawer().noBubbleSelected();
        document.getElementById("deselectButton").disabled = true;
    }
}

/*
 ** Update values of bubbles if valid data
 ** also add bubble to historicalMap if selected
 */

function    refreshBubbles() {
    var i;
    var x;
    var y;
    var size;
    var col;
    removeYearFromHistorical(year.current);
    for (i = 0; i < bubbles.length; ++i) {
        if (dataEntries[guiAxes.X][bubbles[i].name] == null || dataEntries[guiAxes.X][bubbles[i].name][year.current] == null
                || dataEntries[guiAxes.Y][bubbles[i].name] == null || dataEntries[guiAxes.Y][bubbles[i].name][year.current] == null
                || dataEntries[guiAxes.COLOR][bubbles[i].name] == null || dataEntries[guiAxes.COLOR][bubbles[i].name][year.current] == null
                || dataEntries[guiAxes.SIZE][bubbles[i].name] == null || dataEntries[guiAxes.SIZE][bubbles[i].name][year.current] == null) {
            if (!updateBubbleToLastAvailableYear(bubbles[i])) {
                if (bubbles[i].crossed == false || bubbles[i].year > year.current) {
                    bubbles[i].draw = false;
                    document.getElementById("entity[" + bubbles[i].name + "]").disabled = true;
                }
            }
            else {
                bubbles[i].draw = true;
                bubbles[i].crossed = true;
            }
        }
        else {
            x = updateAxeX(dataEntries[guiAxes.X][bubbles[i].name][year.current]);
            y = updateAxeY(dataEntries[guiAxes.Y][bubbles[i].name][year.current]);
            size = updateAxeSize(dataEntries[guiAxes.SIZE][bubbles[i].name][year.current]);
            col = updateAxeColor(dataEntries[guiAxes.COLOR][bubbles[i].name][year.current]);
            if (year.step == 0) {
                document.getElementById("entity[" + bubbles[i].name + "]").disabled = false;
                bubbles[i].crossed = false;
                bubbles[i].draw = true;
                bubbles[i].year = year.current;
                bubbles[i].posX = x;
                bubbles[i].posY = y;
                bubbles[i].size = size;
                bubbles[i].col = col;
                if (bubbles[i].yearClick > year.current)
                    bubbles[i].yearClick = year.current;
            }
            else {
                if (bubbles[i].yearClick > year.current + 1)
                    bubbles[i].yearClick = year.current;
                if (bubbles[i].draw && bubbles[i].isClicked && bubbles[i].year == year.current)
                    addToHistorical(bubbles[i]);
                if (year.current + 1 <= year.max && (dataEntries[guiAxes.X][bubbles[i].name] == null || dataEntries[guiAxes.X][bubbles[i].name][year.current + 1] == null
                        || dataEntries[guiAxes.Y][bubbles[i].name] == null || dataEntries[guiAxes.Y][bubbles[i].name][year.current + 1] == null
                        || dataEntries[guiAxes.COLOR][bubbles[i].name] == null || dataEntries[guiAxes.COLOR][bubbles[i].name][year.current + 1] == null
                        || dataEntries[guiAxes.SIZE][bubbles[i].name] == null || dataEntries[guiAxes.SIZE][bubbles[i].name][year.current + 1] == null)) {
                    if (bubbles[i].draw) {
                        bubbles[i].crossed = true;
                    }
                    bubbles[i].draw = true;
                    updateBubbleToLastAvailableYear(bubbles[i]);
                }
                else {
                    document.getElementById("entity[" + bubbles[i].name + "]").disabled = false;
                    bubbles[i].crossed = false;
                    bubbles[i].draw = true;
                    bubbles[i].year = -1;
                    bubbles[i].posX = x + (updateAxeX(dataEntries[guiAxes.X][bubbles[i].name][year.current + 1]) - x) * year.step;
                    bubbles[i].posY = y + (updateAxeY(dataEntries[guiAxes.Y][bubbles[i].name][year.current + 1]) - y) * year.step;
                    bubbles[i].size = size + (updateAxeSize(dataEntries[guiAxes.SIZE][bubbles[i].name][year.current + 1]) - size) * year.step;
                    bubbles[i].col = col + (updateAxeColor(dataEntries[guiAxes.COLOR][bubbles[i].name][year.current + 1]) - col) * year.step;
                }
            }
        }
    }
    addPreviousYearToHistory();
}

/*
 ** The following four functions udpate axes
 */

function    updateAxeX(value) {
    return (value - scales.mins[guiAxes.X]) * p.getBubbleWidth() / (scales.maxs[guiAxes.X] - scales.mins[guiAxes.X]);
}

function    updateAxeY(value) {
    return p.getBubbleHeight() - ((value - scales.mins[guiAxes.Y]) * p.getBubbleHeight() / (scales.maxs[guiAxes.Y] - scales.mins[guiAxes.Y]));
}

function    updateAxeSize(value) {
    return (guiData.cursorSize / 10) + (value - scales.mins[guiAxes.SIZE]) * guiData.cursorSize / (scales.maxs[guiAxes.SIZE] - scales.mins[guiAxes.SIZE]);
}

function    updateAxeColor(value) {
    return (scales.maxs[guiAxes.COLOR] - value) * 255 / (scales.maxs[guiAxes.COLOR] - scales.mins[guiAxes.COLOR]);
}

/*
 ** Update the bubble with datas from the last available year
 */

function    updateBubbleToLastAvailableYear(b) {
    for (var y = year.current; y > year.min; --y) {
        if ((dataEntries[guiAxes.X][b.name] && dataEntries[guiAxes.X][b.name][y] != null)
                && (dataEntries[guiAxes.Y][b.name] && dataEntries[guiAxes.Y][b.name][y] != null)
                && (dataEntries[guiAxes.COLOR][b.name] && dataEntries[guiAxes.COLOR][b.name][y] != null)
                && (dataEntries[guiAxes.SIZE][b.name] && dataEntries[guiAxes.SIZE][b.name][y] != null)) {
            b.posX = updateAxeX(dataEntries[guiAxes.X][b.name][y]);
            b.posY = updateAxeY(dataEntries[guiAxes.Y][b.name][y]);
            b.size = updateAxeSize(dataEntries[guiAxes.SIZE][b.name][y]);
            b.col = updateAxeColor(dataEntries[guiAxes.COLOR][b.name][y]);
            b.year = y;
            return true;
        }
    }
    return false;
}

/*
 ** Select the highest year value between the two lower
 ** Select the lowest year value between the two higher
 */

function    setMinMaxYear() {
    year.min = Math.max(Math.max(Math.max(entityYearMin[guiAxes.X], entityYearMin[guiAxes.Y]), entityYearMin[guiAxes.COLOR]), entityYearMin[guiAxes.SIZE]);
    year.max = Math.min(Math.min(Math.min(entityYearMax[guiAxes.X], entityYearMax[guiAxes.Y]), entityYearMax[guiAxes.COLOR]), entityYearMax[guiAxes.SIZE]);
}

/*
 ** Refresh display
 */

function	refreshDisplay() {
    p.getBubbleDrawer().clear();
    drawScales();
    p.getBubbleDrawer().drawDate(year.current);
    overOnPlot(p.getMouseX(), p.getMouseY());
    drawBubbles();
    drawBubblesNames();
    p.getBubbleDrawer().display();
}

/*
 ** Refresh display without overviewed bubble
 */

function    refreshDisplayNoOver() {
    p.getBubbleDrawer().clear();
    drawScales();
    p.getBubbleDrawer().drawDate(year.current);
    drawBubbles();
    drawBubblesNames();
    p.getBubbleDrawer().display();
}

/*
 ** Used to sort bubbles by size
 */

function    sortBubblesSize(b1, b2) {
    return b2.size - b1.size;
}

/*
 ** Used to sort bubbles by year
 */

function    sortBubblesYear(b1, b2) {
    return b1.year - b2.year;
}

/*
 ** HISTORICAL METHODS
 */

/*
 ** add a bubble to the historical
 */

function    addToHistorical(bubble) {
    if (!(bubble.name in HistoricalMap))
        HistoricalMap[bubble.name] = new Array();
    for (var i = 0; i < HistoricalMap[bubble.name].length; ++i)
        if (HistoricalMap[bubble.name][i].year == bubble.year)
            return;
    HistoricalMap[bubble.name].push(jQuery.extend({}, bubble));
}

/*
 ** Add a previous year to the history
 */

function    addPreviousYearToHistory() {
    var j;
    var found = false;
    var years = {};
    for (var i = 0; i < bubbles.length; ++i) {
        if (bubbles[i].isClicked && bubbles[i].yearClick <= year.current) {
            if (dataEntries[guiAxes.X][bubbles[i].name] != null || dataEntries[guiAxes.X][bubbles[i].name][bubbles[i].yearClick] != null
                    || dataEntries[guiAxes.Y][bubbles[i].name] != null || dataEntries[guiAxes.Y][bubbles[i].name][bubbles[i].yearClick] != null
                    || dataEntries[guiAxes.COLOR][bubbles[i].name] != null || dataEntries[guiAxes.COLOR][bubbles[i].name][bubbles[i].yearClick] != null
                    || dataEntries[guiAxes.SIZE][bubbles[i].name] != null || dataEntries[guiAxes.SIZE][bubbles[i].name][bubbles[i].yearClick] != null) {
                addToHistorical(new Bubble(updateAxeX(dataEntries[guiAxes.X][bubbles[i].name][bubbles[i].yearClick]), updateAxeY(dataEntries[guiAxes.Y][bubbles[i].name][bubbles[i].yearClick]),
                        updateAxeSize(dataEntries[guiAxes.SIZE][bubbles[i].name][bubbles[i].yearClick]), updateAxeColor(dataEntries[guiAxes.COLOR][bubbles[i].name][bubbles[i].yearClick]),
                        bubbles[i].name, bubbles[i].yearClick, bubbles[i].yearClick));
            }
        }
    }
    for (var b in HistoricalMap) {
        if (HistoricalMap[b].length > 0) {
            for (j = HistoricalMap[b][0].yearClick; j <= year.current; ++j) {
                years[j] = 0;
            }
            for (j = 0; j < HistoricalMap[b].length; ++j) {
                delete years[HistoricalMap[b][j].year];
            }
            for (var yearToAdd in years) {
                if (dataEntries[guiAxes.X][HistoricalMap[b][0].name] != null && dataEntries[guiAxes.X][HistoricalMap[b][0].name][yearToAdd] != null
                        && dataEntries[guiAxes.Y][HistoricalMap[b][0].name] != null && dataEntries[guiAxes.Y][HistoricalMap[b][0].name][yearToAdd] != null
                        && dataEntries[guiAxes.COLOR][HistoricalMap[b][0].name] != null && dataEntries[guiAxes.COLOR][HistoricalMap[b][0].name][yearToAdd] != null
                        && dataEntries[guiAxes.SIZE][HistoricalMap[b][0].name] != null && dataEntries[guiAxes.SIZE][HistoricalMap[b][0].name][yearToAdd] != null) {
                    HistoricalMap[b].push(new Bubble(updateAxeX(dataEntries[guiAxes.X][HistoricalMap[b][0].name][yearToAdd]), updateAxeY(dataEntries[guiAxes.Y][HistoricalMap[b][0].name][yearToAdd]),
                            updateAxeSize(dataEntries[guiAxes.SIZE][HistoricalMap[b][0].name][yearToAdd]), updateAxeColor(dataEntries[guiAxes.COLOR][HistoricalMap[b][0].name][yearToAdd]),
                            HistoricalMap[b][0].name, yearToAdd, HistoricalMap[b][0].yearClick));
                }
            }
        }
    }
}

/*
 ** Remove a year from historial
 */

function    removeYearFromHistorical(y) {
    for (var b in HistoricalMap) {
        for (var i = 0; i < HistoricalMap[b].length; ++i) {
            if (HistoricalMap[b][i].year > y)
                HistoricalMap[b].splice(i, 1);
        }
    }
}

/*
 ** Remove an element from historical
 */

function    removeFromHistorical(n) {
    delete HistoricalMap[n];
}

/*
 ** Sort all the bubbles from historical
 */

function    sortHistoricalBubblesBySize() {
    for (var prop in HistoricalMap)
        HistoricalMap[prop].sort(sortBubblesSize);
}



/*
 ** DATABASE COMMUNICATIONS
 */

/*
 ** Retrieve the list of files from the server
 */

function    retrieveFilesFromDB() {
    $.ajax(
            {
                dataType: "json",
                type: "GET",
                url: "../server/GetFiles.php",
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Error on GetFiles [" + errorThrown + "] [" + textStatus + "]");
                },
                success: function(d) {
                    guiData.files = d;
                }
            });
}

/*
 ** Retrieve all the entries from the server
 */

function    retrieveEntriesFromDB() {
    $.ajax(
            {
                dataType: "json",
                data: {idFile: idFile},
                type: "GET",
                url: "../server/GetEntries.php",
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Error on GetEntries [" + errorThrown + "] [" + textStatus + "]");
                },
                success: function(d) {
                    guiData.entries = d;
                }
            });
}

/*
 ** Retrieve all the entities from the server
 */

function    retrieveEntitiesFromDB() {
    $.ajax(
            {
                dataType: "json",
                data: {idFile: idFile},
                type: "GET",
                url: "../server/GetEntities.php",
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Error on GetEntities [" + errorThrown + "] [" + textStatus + "]");
                },
                success: function(d) {
                    rawEntities = d;
                }
            });
}

/*
 ** Retrieve an entity from the server
 */

        function    retrieveEntityByIdEntry(axe, idx) {
    $.ajax(
            {
                dataType: "json",
                data: {idFile: idFile, idEntry: idx},
                type: "GET",
                url: "../server/GetDataByIdEntry.php",
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Error on GetEntities [" + errorThrown + "] [" + textStatus + "]");
                },
                success: function(data) {
                    dataEntries[axe] = data;
                }
            });
}

/*
 ** Retrieve the years amplitudes from the server
 */

function    retrieveYearAmpl(axe, idx) {
    $.ajax(
            {
                dataType: "json",
                data: {idFile: idFile, idEntry: idx},
                type: "GET",
                url: "../server/GetYearAmplByEntry.php",
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Error on GetYearAmplByEntry [" + errorThrown + "] [" + textStatus + "]");
                },
                success: function(data) {
                    entityYearMin[axe] = parseInt(data.min);
                    entityYearMax[axe] = parseInt(data.max);
                }
            });
}

/*
 ** Retrieve the amplitudes values from the server
 */

function    retrieveValueAmpl(axe, idx) {
    $.ajax(
            {
                dataType: "json",
                data: {idFile: idFile, idEntry: idx},
                type: "GET",
                url: "../server/GetValueAmplByEntry.php",
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Error on GetValueAmplByEntry [" + errorThrown + "] [" + textStatus + "]");
                },
                success: function(data) {
                    var max = parseFloat(data.max);
                    var min = parseFloat(data.min);
                    scales.mins[axe] = min - (Math.abs(min) * 10 / 100);
                    scales.maxs[axe] = (Math.abs(max) * 10 / 100) + Math.abs(max);
                }
            });
}

/*
 ** GUI METHODS
 */

/*
 ** Called when the mouse moves over the plot
 */

// 0 -> X AXIS || 1 -> Y AXIS
function    MoveCursor(pos, step) {
    guiData.cursorPos = pos;
    year.current = pos;
    year.step = step;
    refreshBubbles();
    refreshDisplay();
}

/*
 ** Called when the mouse select an item of the checkBoxes list
 */

function    selectBubbleCheckBox(name) {
    if (!load.loading) {
        name = unescape(name);
        for (var i = 0; i < bubbles.length; ++i) {
            if (bubbles[i].name == name) {
                bubbles[i].isClicked = !bubbles[i].isClicked;
                if (bubbles[i].isClicked) {
                    bubbles[i].yearClick = year.current;
                    ++select;
                }
                else {
                    removeFromHistorical(bubbles[i].name);
                    bubbles[i].yearClick = -1;
                    --select;
                }
                updateSelectBubble();
                refreshDisplay();
                return;
            }
        }
    }
}

/*
 ** Called when the mouse is over the checkBoxes list
 */

function    mouseOverCheckBox(name) {
    if (!load.loading) {
        name = unescape(name);
        for (var i = 0; i < bubbles.length; ++i) {
            if (bubbles[i].name == name) {
                if (!bubbles[i].draw)
                    return;
                highlight.bubble = i;
                highlight.inHist = null;
                addToOverMap(bubbles[highlight.bubble]);
                refreshDisplayNoOver();
                return;
            }
        }
    }
}

/*
 ** Called when the mouse leaves the checkBoxes list
 */

function    mouveLeaveCheckBoxes() {
    highlight.bubble = -1;
    highlight.inHist = null;
    refreshDisplay();
}

/*
 ** Called when the spped changed (when the value of the speedSlider change)
 */

function    SetSpeed(speed) {
    guiData.cursorSpeed = speed;
}

/*
 ** Call when the "Play" button is clicked
 */

function    SetPlayState() {
    isPlaying = !isPlaying;
    if (!isPlaying)			// STOP
        $("#playButton").attr("value", "Play");
    else {					// PLAY
        $("#playButton").attr("value", "Stop");
        if ($("#sliderDiv").slider("value") == $("#sliderDiv").slider("option", "max"))
            $("#sliderDiv").slider("value", $("#sliderDiv").slider("option", "min"));
        Loop();
    }
}

/*
 ** Called when the opacity of the bubbles changed (when the value of the opacitySlider change)
 */

function    ChangeOpacity(value) {
    guiData.opacity = value;
    p.getBubbleDrawer().adjustOpacity(value);
    if (!isPlaying)
        refreshDisplay();
}

/*
 ** Called when the size of the bubbles changed (when the value of the sizeSlider change)
 */

function    ChangeSize(value) {
    if (document.getElementById("sizeCheckBox").checked == true) {
        guiData.cursorSize = value;
        if (!isPlaying) {
            refreshBubbles();
            refreshDisplay();
        }
    }
    else {
        p.getBubbleDrawer().setSize(value);
        if (!isPlaying) {
            refreshBubbles();
            refreshDisplay();
        }
    }
}

/*
 ** Called when an other file is selectionned
 */

function    ChangeIdFile(id) {
    DisableUI();
    idFile = id;
    if (isPlaying) {
        isPlaying = false;
        $("#playButton").attr("value", "Play");
    }
    $("#sliderDiv").slider("value", $("#sliderDiv").slider("option", "min"));
    p.getBubbleDrawer().clear();
    p.getBubbleDrawer().loadingWindow();
    p.getBubbleDrawer().display();
    resetData();
    initData();
    launch();
    EnableUI();
}

/*
 ** reset all datas
 */

function    resetData() {
    guiData.entries = null;
    guiData.entities = null;
    rawEntities = null;
    entityYearMin = [];
    entityYearMax = [];
    scales = new ScaleData();
    guiData = new GuiData();
    currentAxes = new SelectAxes();
    year = new YearData();
    highlight = new HighlightedData();
    load = new LoadingValues();
    HistoricalMap = {};
    OverMap = {};
    dataEntries = [];
    $(entityDiv).empty();
    $('#timeSlider').empty();
}

/*
 ** Called when an Axe is selectionned
 */

function    AxeChanged(axe, idx) {
    if (isPlaying) {
        isPlaying = false;
        $("#playButton").attr("value", "Play");
    }
    $("#sliderDiv").slider("value", $("#sliderDiv").slider("option", "min"));
    p.getBubbleDrawer().clear();
    p.getBubbleDrawer().loadingWindow();
    p.getBubbleDrawer().display();
    $('#timeSlider').empty();
    loading(axe, idx);
}

/*
 ** Enable or diable the Color of the bubble (call with a checkBox)
 */

function    ColorCheckBox(e) {
    guiData.colorActivated = !guiData.colorActivated;
    p.getBubbleDrawer().useColor(guiData.colorActivated);
    if (guiData.colorActivated)
    {
        $("#selectColorValue").next("input").autocomplete("enable");
    }
    else
    {
        $("#selectColorValue").next("input").autocomplete("disable");
    }
    if (!isPlaying)
        refreshDisplay();
}

/*
 ** Enable or diable the Size of the bubble (call with a checkBox)
 */

function    SizeCheckBox() {
    guiData.sizeActivated = !guiData.sizeActivated;
    p.getBubbleDrawer().useSize(guiData.sizeActivated);
    if (guiData.sizeActivated)
    {
        $("#selectSizeValue").next("input").autocomplete("enable");
    }
    else
    {
        $("#selectSizeValue").next("input").autocomplete("disable");
    }
    if (!isPlaying)
        refreshDisplay();
}

/*
 ** Disable the GUI
 */

function    DisableUI() {
    $("#sliderDiv").slider("disable");
    $("#speedSlider").slider("disable");
    $("#opacitySlider").slider("disable");
    $("#selectAxeXValue").next("input").autocomplete("disable");
    $("#selectAxeYValue").next("input").autocomplete("disable");
    $("#selectColorValue").next("input").autocomplete("disable");
    $("#selectSizeValue").next("input").autocomplete("disable");
    document.getElementById("deselectButton").disabled = true;
}

/*
 ** Enable the GUI
 */

function    EnableUI() {
    $("#sliderDiv").slider("enable");
    $("#speedSlider").slider("enable");
    $("#selectAxeXValue").next("input").autocomplete("enable");
    $("#selectAxeYValue").next("input").autocomplete("enable");
    $("#selectColorValue").next("input").autocomplete("enable");
    $("#selectSizeValue").next("input").autocomplete("enable");
}

/*
 ** Main loop of program
 */

function    Loop() {
    if (isPlaying) {
        if ($("#sliderDiv").slider("value") == $("#sliderDiv").slider("option", "max")) {
            SetPlayState();
            return;
        }
        $("#sliderDiv").slider("value", $("#sliderDiv").slider("value") + nbsteps);
        refreshBubbles();
        refreshDisplay();
        var speed = ($("#speedSlider").slider("option", "max") - $("#speedSlider").slider("value"));
        setTimeout(Loop, speed * speed / 2);
    }
}