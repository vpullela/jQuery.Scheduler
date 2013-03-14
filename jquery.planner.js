/*
jQuery.Planner
Copyright (c) 2013 S Bondaryev - sbondaryev@gmail.com
MIT License Applies
*/

/*
Options
-----------------
showWeekends: boolean
data: object
cellWidth: number
cellHeight: number
width: number
boundary: {left : object/string right: object/string}
*/

(function (jQuery) {
    jQuery.widget("custom.planner", {
        chart: undefined,

        _create: function() {
            this.chart = new Chart(this.options, this.element);
        },

        setData: function(data) {
            this.chart.setData(data);
        },

        getData: function() {
            return this.chart.getData();
        },

        _setOption: function (name, value) {
            if (name === "width") {
                this.chart.setWidth(value);
            }
            if (name === "boundary") {
                this.chart.setBoundaries(value);
            }

            $.Widget.prototype._setOption.apply(this, arguments);
        }
    });

/*==============================================================================
* Components
*=============================================================================*/
    /**
     * Chart class
     */
    function Chart(options, element) {
        this.element = element

        /** Geometry Handling */
        // get the geometry properties from css
        var cellSize = this.getCssProperty("planner-blocks", "background-size").split(" ");
        var cellWidth = parseInt(cellSize[0]);
        var cellHeight = parseInt(cellSize[1]);
        var width = parseInt(this.getCssProperty("planner", "width"), 10);
        var vtHeaderWidth = parseInt(this.getCssProperty("planner-vtheader", "width"), 10);

        // set default geometry (order: params -> css -> hardcode)
        options.cellWidth     = options.cellWidth     || cellWidth     || 21;
        options.cellHeight    = options.cellHeight    || cellHeight    || 32;
        options.width         = options.width         || width         || 600;
        options.vtHeaderWidth = options.vtHeaderWidth || vtHeaderWidth || 100;
        options.showWeekends  = options.showWeekends  && true;         // false
        options.dateFormat    = options.dateFormat                     || "yyyy-MM-dd"
        // calculabe options
        options.containerWidth = function () { return options.width - options.vtHeaderWidth - 2 };

        this.options = options;
        this.dataManager = new DataManager(options);

        this._init();
    }
    Chart.prototype = Object.create(JQueryWrapper.prototype);

    jQuery.extend(Chart.prototype, {
        _init: function() {
            this.element.addClass("planner");
            this.setJquery(this.element);

            this.setData(this.options.data);

            this.setEvents();
        },

        render: function() {
            this.removeContent();
            this.element.css("width", this.options.width);

            this.vtHeader = new VtHeader(this.options, this.dataManager);
            this.slideContainer = new SlideContainer(this.options, this.dataManager);

            this.appendJquery(this.vtHeader);
            this.appendJquery(this.slideContainer);

            this.applyLastClass();
        },

        removeContent: function() {
            if (this.vtHeader) {
                this.vtHeader.removeContent();
                this.vtHeader.destroyJquery();
            }

            if (this.slideContainer) {
                this.slideContainer.removeContent();
                this.slideContainer.destroyJquery();
            }
        },

        applyLastClass: function() {
            jQuery("div.planner-vtheader div.planner-vtheader-item:last-child", this.getJquery()).addClass("last");
            jQuery("div.planner-hzheader-days div.planner-hzheader-day:last-child", this.getJquery()).addClass("last");
            jQuery("div.planner-hzheader-months div.planner-hzheader-month:last-child", this.getJquery()).addClass("last");
        },

        setEvents: function() {
            /** TDOD: replase selectors */
            this.getJquery().delegate("div.planner-menu-item.zoomout",
                "click",
                jQuery.proxy(this.onClickOnZoomOut, this));
            this.getJquery().delegate("div.planner-menu-item.zoomin",
                "click",
                jQuery.proxy(this.onClickOnZoomIn, this));
        },

        onClickOnZoomOut: function() {
            if (this.options.cellWidth < 3) {
                this.options.cellWidth = 3;
                return;
            }

            this.options.cellWidth--;

            this.slideContainer.render();
        },

        onClickOnZoomIn: function() {
            this.options.cellWidth++;

            this.slideContainer.render();
        },

        getData: function() {
            return this.dataManager.getData();
        },

        setData: function(data) {
            this.dataManager.setData(data);
            this.render();
        },

        setWidth: function(width) {
            this.options.width = width;

            this.render();
        },

        setBoundaries: function(boundary) {
            /* TODO : duplication */
            this.options.boundary = boundary;

            // recalculate data table with new boundary
            this.dataManager.setData(this.dataManager.getData());
            this.render()
        }
    });

    /**
     * VtHeader class
     */
    function VtHeader(options, dataManager) {
        this.options = options;
        this.dataManager = dataManager;

        this._init();
    }
    VtHeader.prototype = Object.create(JQueryWrapper.prototype);

    jQuery.extend(VtHeader.prototype, {
        _init: function (options) {
            var headerDiv = jQuery("<div>", {
                "class": "planner-vtheader",
                "css": {
                    "width" : this.options.vtHeaderWidth
                }
            });

            this.setJquery(headerDiv);

            this.render();
        },

        render: function() {
            var data = this.dataManager.getRowNames();
            var cellHeight = this.options.cellHeight;

            var menu = new Menu(this.options, this.dataManager);
            this.appendJquery(menu);

            for (var i = 0; i < data.length; i++) {
                var itemDiv = jQuery("<div>", {
                    "class": "planner-vtheader-item planner-nonselectable",
                    "css" : {
                        "height" : cellHeight + "px"
                    }
                });
                itemDiv.append(data[i]);
                this.getJquery().append(itemDiv);
            }
        },

        removeContent: function() {
            /* empty */
        }
    });

    /**
     * Menu Class
     */
    function Menu(options, dataManager) {
        this.options = options;
        this.dataManager = dataManager;

        this._init();
    }
    Menu.prototype = Object.create(JQueryWrapper.prototype);

    jQuery.extend(Menu.prototype, {
        _init: function () {
            var menuDiv = jQuery("<div>", {
                "class": "planner-menu planner-nonselectable",
            });

            this.setJquery(menuDiv);

            this.render();
        },

        render: function() {
            var zoomIn = jQuery("<div>", { "class": "planner-menu-item zoomin planner-nonselectable" });
            var zoomOut = jQuery("<div>", { "class": "planner-menu-item zoomout planner-nonselectable" });
            this.getJquery().append(zoomIn);
            this.getJquery().append(zoomOut);
        }
    });

    /**
     *  SlideContainer Class
     */
    function SlideContainer(options, dataManager) {
        this.options = options;
        this.dataManager = dataManager;

        this.contentArray = [];

        this._init();
    }
    SlideContainer.prototype = Object.create(JQueryWrapper.prototype);

    jQuery.extend(SlideContainer.prototype, {
        _init: function() {
            var slideContainer = jQuery("<div>", {
                "class": "planner-slide-container",
                "css": {
                    "width": this.options.containerWidth() + "px"
                }
            });

            this.setJquery(slideContainer);

            this.render();
        },

        render: function() {
            this.removeContent();

            var hzHeader = new HzHeader(this.options, this.dataManager);
            var containerList = new ContainerList(this.options, this.dataManager, hzHeader);

            var numberOfDays = this.dataManager.getNumberOfDays();
            var numberOfDaysAdj = this.dataManager.getNumberOfDaysAdjusted();
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;
            var numberOfRows = this.dataManager.getNumberOfRows();

            var unavailableDays = numberOfDaysAdj - numberOfDays;
            this.ganttViewBody = jQuery("<div>", {
                "class" : "planner-body",
                "css" : {
                    "width" : (numberOfDaysAdj+1) * cellWidth  + "px",
                    }
                });
            this.unavailableDiv = jQuery("<div>", {
                "class": "planner-blocks-unavailable",
                "css": {
                    "border" : 0,
                    "width" : (unavailableDays * cellWidth)+ "px",
                    "height" : (numberOfRows * cellHeight) + "px",
                    "background-size" : cellWidth + "px " +  cellHeight  + "px",
                    "background-position" : cellWidth + "px " +  (cellHeight + 1) + "px"
                    }
                });

            this.contentArray.push(hzHeader);
            this.contentArray.push(containerList);

            this.appendJquery(hzHeader);
            this.ganttViewBody.append(containerList.getJquery());
            this.ganttViewBody.append(this.unavailableDiv);
            this.getJquery().append(this.ganttViewBody);

            containerList.setEvents();
        },

        removeContent: function() {
            jQuery(this.contentArray).each(function() {
                this.removeContent();
                this.destroyJquery();
            });
            this.contentArray = []
            if (this.unavailableDiv) {
                this.unavailableDiv.remove();
            }
            if (this.ganttViewBody) {
                this.ganttViewBody.remove();
            }
        }
    });

    /**
     *  HzHeader class
     */
    function HzHeader(options, dataManager) {
        this.options = options;
        this.dataManager = dataManager;
        this.daysArray = [];
        this.cellWidth = options.cellWidth;

        this._init();
    }
    HzHeader.prototype = Object.create(JQueryWrapper.prototype);

    jQuery.extend(HzHeader.prototype, {
        _monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

        _init: function() {
            var dates = this.getDatePeriod();
            var numberOfDays = this.dataManager.getNumberOfDaysAdjusted();

            var headerDiv = jQuery("<div>", { "class": "planner-hzheader" });
            var monthsDiv = jQuery("<div>", { "class": "planner-hzheader-months" });
            var daysDiv = jQuery("<div>", { "class": "planner-hzheader-days" });

            for (var y in dates) {
                for (var m in dates[y]) {
                    var w = dates[y][m].length * this.cellWidth;
                    monthsDiv.append(jQuery("<div>", {
                        "class": "planner-hzheader-month planner-nonselectable",
                        "css": { "width": w + "px" }
                    }).append(this._monthNames[m] + "/" + y));
                    for (var d in dates[y][m]) {
                        var day = new HzHeaderDay(this.options, dates[y][m][d]);
                        this.daysArray.push(day);
                        this.appendJquery(day, daysDiv);
                    }
                }
            }

            monthsDiv.css("width", (numberOfDays+1) * this.cellWidth + "px");
            daysDiv.css("width", (numberOfDays+1) * this.cellWidth + "px");
            headerDiv.append(monthsDiv).append(daysDiv);

            this.setJquery(headerDiv);
        },

        removeContent: function() {
            /* EMPTY */
        },

        getGrid: function() {
            var grid = [];

            var firstDayOffset = 0;
            for (var i=0; i < this.daysArray.length; i++) {
                var day = this.daysArray[i];
                if (i == 0) {
                    firstDayOffset = day.getJquery().offset().left;
                }
                grid.push({
                    "date": day.date,
                    "offset": firstDayOffset + this.cellWidth * i
                });
            }

            grid.cellWidth = this.cellWidth;

            grid.getDateByPos = function (posX, halfUp) {
                var shift = grid.cellWidth;

                if (halfUp) {
                    shift = shift/2;
                }

                var date = grid[grid.length-1].date;
                for(var i=0; i < grid.length; i++) {
                    if (grid[i].offset + shift > posX) {
                        date = grid[i].date;
                        break;
                    }
                }
                return date;
            }

            return grid;
        },

        // Creates a 3 dimensional array [year][month][day] of every day
        // between the given start and end dates
        getDatePeriod: function() {
            var dates = [];
            var boundaryAdj = this.dataManager.getBoundaryAdjusted();

            dates[boundaryAdj.left.getFullYear()] = [];
            dates[boundaryAdj.left.getFullYear()][boundaryAdj.left.getMonth()] = [boundaryAdj.left]

            var last = boundaryAdj.left;
            while (last.compareTo(boundaryAdj.right) == -1) {
                var next = last.clone().addDays(1);
                if (!dates[next.getFullYear()]) { dates[next.getFullYear()] = []; }
                if (!dates[next.getFullYear()][next.getMonth()]) {
                    dates[next.getFullYear()][next.getMonth()] = [];
                }
                dates[next.getFullYear()][next.getMonth()].push(next);
                last = next;
            }

            return dates;
        },
    });

    /**
    * HzHeaderDay Class
    */
    function HzHeaderDay(options, date) {
        this.options = options;
        this._init(date);
    }
    HzHeaderDay.prototype = Object.create(JQueryWrapper.prototype);

    jQuery.extend(HzHeaderDay.prototype, {
        _init: function(date) {
            this.date = date;
            this.cellWidth = this.options.cellWidth;
            this.showWeekends = this.options.showWeekends;

            var day = jQuery("<div>", { "class": "planner-hzheader-day planner-nonselectable" });
            day.css("width", this.cellWidth);
            if (this.showWeekends && this.isWeekend()) {
                day.addClass("planner-weekend");
            }
            day.append(this.date.getDate());

            this.setJquery(day);
        },

        isWeekend: function () {
            return this.date.getDay() % 6 == 0;
        }
    });

    /**
     * ContainerList class
     */
    function ContainerList(options, dataManager, hzHeader) {
        this.options = options;
        this.dataManager = dataManager;
        this.hzHeader = hzHeader;
        this.cellWidth = this.options.cellWidth;
        this.containerArray = [];

        this._init();
    }
    ContainerList.prototype = Object.create(JQueryWrapper.prototype);

    jQuery.extend(ContainerList.prototype, {
        _init: function() {
            var numberOfDays = this.dataManager.getNumberOfDays();
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;

            var blocksDiv = jQuery("<div>", {
                "class": "planner-blocks",
                "css": {
                    "border" : 0,
                    "width" : (numberOfDays+1) * cellWidth + "px",
                    "background-size" : cellWidth + "px " +  (cellHeight)  + "px",
                    "background-position" : cellWidth + "px " +  (cellHeight + 1) + "px" }
                });

            this.setJquery(blocksDiv);

            this.render();
        },

        render: function() {
            this.removeContent();

            var numberOfRows = this.dataManager.getNumberOfRows();
            for (var rowNumber = 0; rowNumber < numberOfRows; rowNumber++) {
                var container = new Container(this.options, this.dataManager, this.hzHeader, rowNumber);
                this.appendJquery(container);
                this.containerArray.push(container);
            }
        },

        removeContent: function() {
            jQuery(this.containerArray).each(function() {
                this.removeContent();
                this.destroyJquery();
            });

            this.containerArray = [];
        },

        /** Event Handlers */
        setEvents: function() {
            /* TODO: replace selectors */
            /* TODO: ?undelegate events on removeContent */
            this.getJquery().delegate("div.planner-block",
                "mouseover",
                jQuery.proxy(this.onMouseover, this));

            this.getJquery().delegate("div.planner-block",
                "click",
                jQuery.proxy(this.onClickOnBlock, this));

            this.getJquery().delegate("div.planner-block-container",
                "click",
                jQuery.proxy(this.onClickOnContainer, this));
        },

        onMouseover: function(e) {
            // set resizable/draggable interactions to block
            element = jQuery(e.currentTarget);
            if (!element.data("init")) {
                element.data("init", true);

                element.resizable({
                    grid: this.cellWidth,
                    handles: "e,w",
                    start: $.proxy(this.onResizeBlockStart, this),
                    stop: $.proxy(this.onResizeBlockStop, this)
                });

                element.draggable({
                    scroll: true,
                    axis: "x",
                    grid: [this.cellWidth, this.cellWidth],
                    start: $.proxy(this.onDragBlockStart,this),
                    stop: $.proxy(this.onDragBlockStop, this)
                });
            }
        },

        onResizeBlockStart: function(e, ui) {
            ui.element.after(jQuery("<div>", {
                "css": {
                    "display": "inline-block",
                    "position": "relative",
                    "border" : "1px solid transparent",
                    "width": ui.element.css("width"),
                    "margin-left": ui.element.css("margin-left"),
                    "margin-right": ui.element.css("margin-right")
                }
            }));
            ui.helper.addClass("active");
        },
        onResizeBlockStop: function(e, ui) {
            ui.helper.removeClass("active");
            ui.element.next().remove();

            var rowNum = ui.element.data("rowNum");
            var blockNum = ui.element.data("blockNum");
            this.dataManager.updateBlock(rowNum, blockNum, this.calculateDates(ui.element));

            this.containerArray[rowNum].render();
        },

        onDragBlockStart: function(e, ui) {
            ui.helper.addClass("active");
        },
        onDragBlockStop: function(e, ui) {
            ui.helper.removeClass("active");

            var rowNum = ui.helper.data("rowNum");
            var blockNum = ui.helper.data("blockNum");
            this.dataManager.updateBlock(rowNum, blockNum, this.calculateDates(ui.helper));

            this.containerArray[rowNum].render();
        },

        onClickOnBlock: function(e) {
            e.stopPropagation();
            var ui = jQuery(e.currentTarget);
            var grid = this.hzHeader.getGrid();
            var date = grid.getDateByPos(e.pageX);


            var rowNum = ui.data("rowNum");
            var blockNum = ui.data("blockNum");
            // undefine start to delete the block while validation
            this.dataManager.updateBlock(rowNum, blockNum, {"start" : null, "end" : null });

            this.containerArray[rowNum].render();
        },
        onClickOnContainer: function(e) {
            var element = jQuery(e.currentTarget)
            var grid = this.hzHeader.getGrid();
            var startDate = grid.getDateByPos(e.pageX);
            var newBlockData = {
                "name" : "new",
                "start" : startDate,
                "end" : startDate
            };
            var rowNumber = element.data("rowNum");
            this.dataManager.addBlock(rowNumber, newBlockData);

            this.containerArray[rowNumber].render();
        },

        calculateDates: function(elementJquery) {
            var grid = this.hzHeader.getGrid();

            /* calculate left border*/
            var startDate = grid.getDateByPos(elementJquery.offset().left);

            /* calculate right border */
            var blockWidth = parseInt(elementJquery.css('width'), 10);
            // HACK: workaround for date decrease when cellWidth <= 5
            var blockDuration = Math.floor(blockWidth/this.cellWidth) + 1 * (this.cellWidth < 5) + 1 * (this.cellWidth < 3) + 2 * (this.cellWidth < 2);
            var endDate = startDate.clone().addDays(blockDuration);

            /* fit to grid */
            var lastDate = grid[grid.length - 1].date;
            if (endDate.compareTo(lastDate) > 0) {
                endDate = lastDate;
            }

            return {"start" : startDate, "end" : endDate };
        }
    });

    /**
     * Container class
     */
    function Container(options, dataManager, hzHeader, order) {
        this.options = options;
        this.dataManager = dataManager;
        this.hzHeader = hzHeader;

        this.order = order;

        this.blockArray = [];
        this._init();
    }
    Container.prototype = Object.create(JQueryWrapper.prototype);

    jQuery.extend(Container.prototype, {
       _init: function() {
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;
            var numberOfDays = this.dataManager.getNumberOfDaysAdjusted();

            var container = jQuery("<div>", {
                "class": "planner-block-container",
                "css" : {
                    "height": cellHeight + "px",
                    "width": (numberOfDays+1) * cellWidth + "px"
                }
            });
            // TODO:: data method
            container.data("rowNum", this.order);

            this.setJquery(container);

            this.render();
        },

        render: function() {
            this.removeContent();

            var marginShift = this.dataManager.getBoundary().left;
            var data = this.dataManager.getRowData(this.order);

            for (var blockNumber = 0; blockNumber < data.length; blockNumber++) {
                var blockData = data[blockNumber];

                var block = new Block(this.options, marginShift, blockData, this.order, blockNumber);
                this.blockArray.push(block);

                marginShift = blockData.end.clone().addDays(1);
            }

            for (var i = 0; i < this.blockArray.length; i++) {
                this.appendJquery(this.blockArray[i]);
            }
        },

        removeContent: function() {
            jQuery(this.blockArray).each(function() {
                this.destroyJquery()
            });
            this.blockArray = [];
        },
    });

    /**
     * Block class
     */
    function Block(options, marginShift, blockData, rowNum, blockNum) {
        this.options = options;
        this.rowNum = rowNum;
        this.blockNum = blockNum;

        this._init(marginShift, blockData);
    }
    Block.prototype = Object.create(JQueryWrapper.prototype);

    jQuery.extend(Block.prototype, {
        _init: function(marginShift, blockData) {
            this.cellWidth = this.options.cellWidth;
            this.blockData = blockData;

            var cellHeight = this.options.cellHeight;
            var size = DateUtils.daysBetween(this.blockData.start, this.blockData.end) + 1;
            var offset = DateUtils.daysBetween(marginShift, this.blockData.start);

            var block = jQuery("<div>", {
                "class": "planner-block",
                "title": "publication",
                "css": {
                    "width": ((size * this.cellWidth) - 3) + "px",
                    "height": (cellHeight - 7) + "px",
                    "margin-left": ((offset * this.cellWidth)) + 1 + "px",
                    "margin-right" : "2px"
                }
            });
            if (this.blockData.color) {
                block.css("background-color", this.blockData.color);
            }
            // TODO:: data method
            block.data("rowNum", this.rowNum);
            block.data("blockNum", this.blockNum);

            // duration
            var textBlock = jQuery("<div>", { "class": "planner-block-text" }).text(size);
            textBlock.addClass("planner-nonselectable");
            block.append(textBlock);

            this.setJquery(block);
        }

    });

    /**
     * DataManager class
     */
    function DataManager(options) {
        this.options = options;

        this._init();
    }

    jQuery.extend(DataManager.prototype, {
        _init: function() {
            this.data = [];

            this.boundary = {};
            if (this.options.boundary) {
                this.boundary = {
                    left : DateUtils.convertToDate(this.options.boundary.left, this.options.dateFormat),
                    right : DateUtils.convertToDate(this.options.boundary.right, this.options.dateFormat),
                }
            }

            this.minDate = undefined;
            this.maxDate = undefined;
        },

        //table
        setData: function(data) {
            this._init();

            var data = data || []
            for (var i=0; i < data.length; i++) {
                var series  = data[i].series || [];
                series = this.prepareRowData(series, false);

                this.data.push({
                    "name" : (data[i].name || ""),
                    "series" : series
                });
            }

            this.boundary.left = this.boundary.left || this.minDate || new Date();
            this.boundary.right = this.boundary.right || this.maxDate || new Date();
        },

        getData: function() {
            return this.data;
        },

        // row
        setRowData: function(rowNumber, rowData) {
            this.data[rowNumber].series = this.prepareRowData(rowData);
        },
        getRowData: function(rowNumber) {
            return this.data[rowNumber].series;
        },
        addBlock: function(rowNumber, blockData) {
            var rowData = this.data[rowNumber].series;
            rowData.push(blockData);
            this.data[rowNumber].series = this.prepareRowData(rowData);
        },
        deleteBlock: function(rowNumber, date) {
            var rowData = this.data[rowNumber].series;
            for(var i=0; i < rowData.length; i++) {
                if (data.between(rowData[i].start, rowData[i].end)) {
                    rowData.splice(i, 1);
                }
            }
        },

        // block
        updateBlock: function (rowNumber, blockNumber, blockData) {
            var rowData = this.data[rowNumber].series;
            jQuery.extend(rowData[blockNumber], blockData);
            this.data[rowNumber].series = this.prepareRowData(rowData);
        },

        // vtMenu
        getNumberOfRows: function() {
            return this.data.length;
        },
        getRowNames: function() {
            var rowNameList = [];
            for (var i=0; i < this.data.length; i++) {
                rowNameList.push(this.data[i].name);
            }
            return rowNameList;
        },

        // hzMenu
        getBoundary: function() {
            return this.boundary;
        },
        getBoundaryAdjusted: function() {
            var minDays = Math.floor(this.options.containerWidth()/this.options.cellWidth);
            var minBoundaryRight = this.boundary.left.clone().addDays(minDays);

            var boundaryAdj = {};
            boundaryAdj.left = this.boundary.left;
            boundaryAdj.right = this.boundary.right;
            if (minBoundaryRight.compareTo(boundaryAdj.right) > 0) {
                boundaryAdj.right = minBoundaryRight;
            }

            return boundaryAdj;
        },

        // helper functions
        prepareRowData: function(rowData, checkBoundary) {
            var correctArr = [];
            /* TODO: ? move to separete function */
            for(var i=0; i< rowData.length; i++) {
                /* skip if period is not set */
                if (!rowData[i].start || !rowData[i].end) {
                    continue;
                }

                /* convert if dates in string */
                rowData[i].start = DateUtils.convertToDate(rowData[i].start, this.options.dateFormat);
                rowData[i].end = DateUtils.convertToDate(rowData[i].end, this.options.dateFormat);

                /* remove intervals with switched date */
                if (!rowData[i].start || !rowData[i].end || rowData[i].start.isAfter(rowData[i].end)) {
                    continue;
                }

                /* fit to boundary */
                if (this.boundary.left && this.boundary.right) {

                    if (rowData[i].start.compareTo(this.boundary.left) < 0
                        && rowData[i].end.compareTo(this.boundary.left) < 0) {
                        continue;
                    }
                    if (rowData[i].start.compareTo(this.boundary.right) > 0
                        && rowData[i].end.compareTo(this.boundary.right) > 0) {
                        continue;
                    }
                    if (rowData[i].start.compareTo(this.boundary.left) < 0) {
                        rowData[i].start = this.boundary.left;
                    }
                    if (rowData[i].end.compareTo(this.boundary.right) > 0) {
                        rowData[i].end = this.boundary.right;
                    }
                }

                /* calculate max/min dates  */
                if (!this.minDate || this.minDate.compareTo(rowData[i].start) >= 0) {
                    this.minDate = rowData[i].start;
                }
                if (!this.maxDate || this.maxDate.compareTo(rowData[i].end) <= 0) {
                    this.maxDate = rowData[i].end;
                }

                correctArr.push(rowData[i]);
            }

            if (correctArr.length < 2) {
                return correctArr;
            }

            /* sort by start date */
            correctArr.sort(function(leftBlock, rightBlock) {
                var leftStartDate = leftBlock.start.getTime();
                var rightStartDate = rightBlock.start.getTime();
                if (leftStartDate < rightStartDate) {
                    return -1;
                } else if (leftStartDate > rightStartDate) {
                    return 1;
                } else {
                    return 0;
                }
            });

            /* merge crossed intervals (TODO: can be optimized) */
            var currentBlock = correctArr[0];
            var mergedArr = [];
            for (var i=1; i < correctArr.length; i++) {
                var nextBlock = correctArr[i];
                var currentStartDate = currentBlock.start;
                var currentEndDate = currentBlock.end;
                var nextStartDate = nextBlock.start;
                var nextEndDate = nextBlock.end;

                if (currentEndDate.compareTo(nextEndDate) >= 0) {
                    continue;
                }
                if (currentEndDate.clone().addDays(1).compareTo(nextStartDate) >= 0) { // add 1 day to merge neighbors
                    currentBlock.end = nextBlock.end;
                    continue;
                }
                mergedArr.push(currentBlock);
                currentBlock = nextBlock;
            }
            mergedArr.push(currentBlock);

            return mergedArr;
        },
        getNumberOfDays: function() {
            var boundary = this.getBoundary();
            return numberOfDays = DateUtils.daysBetween(boundary.left, boundary.right);
        },
        getNumberOfDaysAdjusted: function() {
            var boundaryAdj = this.getBoundaryAdjusted();
            return numberOfDays = DateUtils.daysBetween(boundaryAdj.left, boundaryAdj.right);
        }
    });

/*==============================================================================
* Libraries
*=============================================================================*/
    /**
    * jQuery Wrapper
    */
    function JQueryWrapper () {
        this.jQueryElement = jQuery("<div>");
    }

    jQuery.extend(JQueryWrapper.prototype, {
        /* Wrapper */

        getCssProperty: function(fromClass, propertyName) {
            var $inspector = jQuery("<div>").css("display", "none").addClass(fromClass);
            jQuery("body").append($inspector);
            try {
                return $inspector.css(propertyName);
            } finally {
                $inspector.remove();
            }
        },

        setJquery: function(jQueryElement) {
            this.jQueryElement = jQueryElement;
        },

        getJquery: function() {
            return this.jQueryElement;
        },

        destroyJquery: function() {
            this.getJquery().remove();
            delete this.jQueryElement;
        },

        getSelector: function(showParents) {
            var selector = "";

            if (showParents)  {
                selector = this.getJquery().parents()
                    .map(function() { return this.tagName; })
                    .get().reverse().join(" ") + " ";
            }

            selector +=  this.getJquery()[0].nodeName;

            var id = this.getJquery().attr("id");
            if (id) {
              selector += "#"+ id;
            }

            var classNames = this.getJquery().attr("class");
            if (classNames) {
              selector += "." + $.trim(classNames).replace(/\s/gi, ".");
            }

            return selector;
        },

        appendJquery: function(jQueryWrapper, customJquery) {
            if (customJquery) {
                customJquery.append(jQueryWrapper.getJquery());
            } else {
                this.getJquery().append(jQueryWrapper.getJquery());
            }
        },
    });

    /**
    * Date Lib
    */
    var DateUtils = {
        daysBetween: function (start, end) {
            if (!start || !end) { return 0; }
            start = Date.parse(start); end = Date.parse(end);
            if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
            var count = 0, date = start.clone();
            while (date.compareTo(end) == -1) { count = count + 1; date.addDays(1); }
            return count;
        },
        convertToDate: function(date, format) {
            if (typeof date == "string") {
                date = Date.parseExact(date, format);
            }
            return date;
        }
    };

})(jQuery);
