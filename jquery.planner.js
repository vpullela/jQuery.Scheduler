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

(function ($) {
    $.widget("custom.planner", {
        chart: undefined,

        _create: function() {
            this.chart = new Chart(this.options, this.element, this);
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
    function Chart(options, element, widget) {
        this.element = element;
        /* TODO: handle widget parameter passing */
        this.widget = widget;

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

    $.extend(Chart.prototype, {
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
            $("div.planner-vtheader div.planner-vtheader-item:last-child", this.getJquery()).addClass("last");
            $("div.planner-hzheader-days div.planner-hzheader-day:last-child", this.getJquery()).addClass("last");
            $("div.planner-hzheader-months div.planner-hzheader-month:last-child", this.getJquery()).addClass("last");
        },

        setEvents: function() {
            /** TDOD: replase selectors */
            this.getJquery().delegate("div.planner-menu-item.zoomout",
                "click",
                $.proxy(this.onClickOnZoomOut, this));
            this.getJquery().delegate("div.planner-menu-item.zoomin",
                "click",
                $.proxy(this.onClickOnZoomIn, this));
        },

        onClickOnZoomOut: function(event) {
            if (this.options.cellWidth < 3) {
                this.options.cellWidth = 3;
                return;
            }

            this.options.cellWidth--;

            this.slideContainer.render();

            this.widget._trigger("onclickonzoomout", event, {test: 1});
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

    $.extend(VtHeader.prototype, {
        _init: function (options) {
            var headerDiv = $("<div>", {
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
                var itemDiv = $("<div>", {
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

    $.extend(Menu.prototype, {
        _init: function () {
            var menuDiv = $("<div>", {
                "class": "planner-menu planner-nonselectable",
            });

            this.setJquery(menuDiv);

            this.render();
        },

        render: function() {
            var zoomIn = $("<div>", { "class": "planner-menu-item zoomin planner-nonselectable" });
            var zoomOut = $("<div>", { "class": "planner-menu-item zoomout planner-nonselectable" });
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

    $.extend(SlideContainer.prototype, {
        _init: function() {
            var slideContainer = $("<div>", {
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
            this.ganttViewBody = $("<div>", {
                "class" : "planner-body",
                "css" : {
                    "width" : (numberOfDaysAdj+1) * cellWidth  + "px",
                    }
                });
            this.unavailableDiv = $("<div>", {
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
            $(this.contentArray).each(function() {
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

    $.extend(HzHeader.prototype, {
        /* TODO: move to configuration part */
        _monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

        _init: function() {
            var dates = this.getDatePeriod();
            var numberOfDays = this.dataManager.getNumberOfDaysAdjusted();

            var headerDiv = $("<div>", { "class": "planner-hzheader" });
            var monthsDiv = $("<div>", { "class": "planner-hzheader-months" });
            var daysDiv = $("<div>", { "class": "planner-hzheader-days" });

            for (var y in dates) {
                for (var m in dates[y]) {
                    var w = dates[y][m].length * this.cellWidth;
                    monthsDiv.append($("<div>", {
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

    $.extend(HzHeaderDay.prototype, {
        _init: function(date) {
            this.date = date;
            this.cellWidth = this.options.cellWidth;
            this.showWeekends = this.options.showWeekends;

            var day = $("<div>", { "class": "planner-hzheader-day planner-nonselectable" });
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
        this.selectedBlocks = {};
        this.isBlocksDragged = false;
        this.resizedWidth = 0;
        this.resizedLeft = 0;

        this._init();
    }
    ContainerList.prototype = Object.create(JQueryWrapper.prototype);

    $.extend(ContainerList.prototype, {
        _init: function() {
            var numberOfDays = this.dataManager.getNumberOfDays();
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;

            var blocksDiv = $("<div>", {
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
            $(this.containerArray).each(function() {
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
                $.proxy(this.onMouseover, this));

            this.getJquery().delegate("div.planner-block",
                "click",
                $.proxy(this.onClickOnBlock, this));

            this.getJquery().delegate("div.planner-block-container",
                "click",
                $.proxy(this.onClickOnContainer, this));
        },

        onMouseover: function(e) {
            // set resizable/draggable interactions to block
            element = $(e.currentTarget);
            if (!element.data("init")) {
                element.data("init", true);

                element.resizable({
                    grid: this.cellWidth,
                    handles: "e,w",
                    start: $.proxy(this.onResizeBlockStart, this),
                    resize: $.proxy(this.onResizeBlock, this),
                    stop: $.proxy(this.onResizeBlockStop, this)
                });

                element.draggable({
                    scroll: true,
                    axis: "x",
                    grid: [this.cellWidth, this.cellWidth],
                    start: $.proxy(this.onDragBlockStart,this),
                    drag: $.proxy(this.onDragBlock, this),
                    stop: $.proxy(this.onDragBlockStop, this)
                });
            }
        },

        onResizeBlockStart: function(e, ui) {
            var resizedBlock = ui.helper;

            // TODO:: duplication add block to selection
            resizedBlock.addClass("selected");
            var rowNum = resizedBlock.data("rowNum");
            var blockNum = resizedBlock.data("blockNum");

            if (!(rowNum in this.selectedBlocks)) {
                this.selectedBlocks[rowNum] = {};
            }
            if (!(blockNum in this.selectedBlocks[rowNum])) {
                this.selectedBlocks[rowNum][blockNum] = resizedBlock;
            }

            for (var rowNum in this.selectedBlocks) {
                for (var blockNum in this.selectedBlocks[rowNum]) {
                    var block = this.selectedBlocks[rowNum][blockNum];
                    block.css({
                        position: "absolute",
                        top: block.position().top,
                        left: block.position().left,
                    });

                    block.after($("<div>", {
                        "css": {
                            "display": "inline-block",
                            "position": "relative",
                            "border" : "1px solid transparent",
                            "width": block.css("width"),
                            "margin-left": block.css("margin-left"),
                            "margin-right": block.css("margin-right")
                        }
                    }));
                }
            }
            
            this.resizedWidth = ui.helper.width() - 2;
            this.resizedLeft = ui.helper.position().left;
        },
        onResizeBlock: function(e, ui) {
            var resizedBlock = ui.helper;

            var diff = resizedBlock.width() - this.resizedWidth;
            var left = resizedBlock.position().left- this.resizedLeft;

            this.resizedWidth = resizedBlock.width();
            this.resizedLeft = resizedBlock.position().left; 

            if (diff == 0) {
                return;
            }

            for (var rowNum in this.selectedBlocks) {
                for (var blockNum in this.selectedBlocks[rowNum]) {
                    /** workaround: elimination double width calculation  */
                    if (rowNum == resizedBlock.data("rowNum") && blockNum == resizedBlock.data("blockNum")) {
                        continue;
                    }
                    var block = this.selectedBlocks[rowNum][blockNum];
                    block.css({
                        width: block.width() + diff + 2,
                        left: block.position().left + left,
                    });
                }
            }
        },
        onResizeBlockStop: function(e, ui) {
            ui.helper.removeClass("selected");
            ui.element.next().remove();
            
            var grid = this.hzHeader.getGrid();

            for (var rowNum in this.selectedBlocks) {
                for (var blockNum in this.selectedBlocks[rowNum]) {
                    var block = this.selectedBlocks[rowNum][blockNum];
                    block.next().remove();
                }
                
                this.dataManager.updateRow(rowNum, this.selectedBlocks[rowNum], grid);
                this.containerArray[rowNum].render();
            }
        },

        onDragBlockStart: function(e, ui) {
            /* empty */
        },
        onDragBlock: function(e, ui) {
            var draggedBlock = ui.helper;
            var blockLeft = parseInt(draggedBlock.css("left"), 10) || 0;

            if (!this.isBlocksDragged && blockLeft != ui.position.left) {
                this.isBlocksDragged = true;

                // TODO:: duplication add block to selection
                draggedBlock.addClass("selected");
                var rowNum = draggedBlock.data("rowNum");
                var blockNum = draggedBlock.data("blockNum");

                if (!(rowNum in this.selectedBlocks)) {
                    this.selectedBlocks[rowNum] = {};
                }
                if (!(blockNum in this.selectedBlocks[rowNum])) {
                    this.selectedBlocks[rowNum][blockNum] = draggedBlock;
                }
            }
            
            if (this.isBlocksDragged) {
                for (var rowNum in this.selectedBlocks) {
                    for (var blockNum in this.selectedBlocks[rowNum]) {
                        var block = this.selectedBlocks[rowNum][blockNum];

                        block.css({
                            left: ui.position.left
                        });
                    }
                }
            }
        },
        onDragBlockStop: function(e, ui) {
            if (!this.isBlocksDragged) {
                return;
            }
            this.isBlocksDragged = false;

            var grid = this.hzHeader.getGrid();

            for (var rowNum in this.selectedBlocks) {
                this.dataManager.updateRow(rowNum, this.selectedBlocks[rowNum], grid);
                this.containerArray[rowNum].render();
            }
        },

        onClickOnBlock: function(e) {
            e.stopPropagation();
            
            var ui = $(e.currentTarget);
            var grid = this.hzHeader.getGrid();
            var date = grid.getDateByPos(e.pageX);
            var rowNum = ui.data("rowNum");
            var blockNum = ui.data("blockNum");

            if (e.ctrlKey) {
                ui.toggleClass('selected');

                // TODO:: duplication
                if (!(rowNum in this.selectedBlocks)) {
                    this.selectedBlocks[rowNum] = {};
                }
                if (blockNum in this.selectedBlocks[rowNum]) {
                    delete this.selectedBlocks[rowNum][blockNum];
                } else {
                    this.selectedBlocks[rowNum][blockNum] = ui;
                }

                return;
            }


            // undefine start to delete the block while validation
            this.dataManager.updateBlock(rowNum, blockNum, {"start" : null, "end" : null });

            this.containerArray[rowNum].render();
        },
        onClickOnContainer: function(e) {
            var element = $(e.currentTarget)
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

    $.extend(Container.prototype, {
       _init: function() {
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;
            var numberOfDays = this.dataManager.getNumberOfDaysAdjusted();

            var container = $("<div>", {
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
            $(this.blockArray).each(function() {
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

    $.extend(Block.prototype, {
        _init: function(marginShift, blockData) {
            this.cellWidth = this.options.cellWidth;
            this.blockData = blockData;

            var cellHeight = this.options.cellHeight;
            var size = DateUtils.daysBetween(this.blockData.start, this.blockData.end) + 1;
            var offset = DateUtils.daysBetween(marginShift, this.blockData.start);

            var block = $("<div>", {
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
            var textBlock = $("<div>", { "class": "planner-block-text" }).text(size);
            textBlock.addClass("planner-nonselectable");
            block.append(textBlock);

            this.setJquery(block);
        }

    });

    /**
     * DataAgregator class
     */
    function DataAgregator(options, boundary, data) {
        this.options = options;
        this.boundary = boundary;
        this.rowList = [];

        this.minDate = undefined;
        this.maxDate = undefined;

        this.setData(data);
    }
    
    $.extend(DataAgregator.prototype, {
        addRow: function (row) {
            this.rowList.push(this.prepareRowData(row, false));
        },
        
        getAgregate: function() {
            var result = [];
            
            for (rowNum in this.rowList) {
                row = this.rowList[rowNum];
                result = result.concat(row);
            }
            
            return this.prepareRowData(result, false);
        },
        
        setAgregate: function(row) {
            row = this.prepareRowData(row, true);
            for (rowNum in this.rowList) {
                this.rowList[rowNum] = row;
            }
        },
        
        setData: function(data) {
            for (rowNum in data) {
                this.addRow(data[rowNum]);
            }
        },
        
        getData: function() {
            return this.rowList;
        },
        
        getMinDate: function() {
            return this.minDate;
        },
        
        getMaxDate: function() {
            return this.maxDate;
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
    });
    

    /**
     * DataManager class
     */
    function DataManager(options) {
        this.options = options;

        this._init();
    }

    $.extend(DataManager.prototype, {
        _init: function() {
            this.data = [];

            this.boundary = {};
            if (this.options.boundary) {
                this.boundary = {
                    left : DateUtils.convertToDate(this.options.boundary.left, this.options.dateFormat),
                    right : DateUtils.convertToDate(this.options.boundary.right, this.options.dateFormat),
                }
            }
        },

        //table
        setData: function(data) {
            this._init();

            var data = data || [];
            var minDate = undefined;
            var maxDate = undefined;
            for (var rowNum in data) {
                var agregator = new DataAgregator(this.options, this.boundary, data[rowNum].data);

                this.data.push({
                    metadata: (data[rowNum].metadata || []),
                    agregator: agregator
                });
                
                if (!minDate || minDate.compareTo(agregator.getMinDate()) > 0) {
                    minDate = agregator.getMinDate();
                }
                if (!maxDate || maxDate.compareTo(agregator.getMaxDate()) < 0) {
                    maxDate = agregator.getMaxDate();
                }
            }

            this.boundary.left = this.boundary.left || minDate || new Date();
            this.boundary.right = this.boundary.right || maxDate || new Date();
        },

        getData: function() {
            var result = [];
            
            for (rowNum in this.data) {
                var oldRow = this.data[rowNum];
                var newRow = {
                    metadata: oldRow.metadata,
                    data: oldRow.agregator.getData()
                }
                result.push(newRow);
            }
            return result;
        },

        getDataJson: function() {
            var convertedData = [];
            for (var i in this.data) {
                var row  = this.data[i];
                var convertedRow = {
                    metadata: row.metadata,
                    series: []
                };
                for (var j in row.series) {
                    var serie = row.series[j];
                    var convertedSerie = $.extend({}, serie); // clone object
                    
                    convertedSerie.start = serie.start.toString(this.options.dateFormat),
                    convertedSerie.end = serie.end.toString(this.options.dateFormat),

                    convertedRow.series.push(convertedSerie);
                } 
                convertedData.push(convertedRow);
            }
            
           return convertedData;
        },

        // row
        setRowData: function(rowNumber, rowData) {
            this.data[rowNumber].agregator.setAgregate(this.prepareRowData(rowData));
        },
        getRowData: function(rowNumber) {
            return this.data[rowNumber].agregator.getAgregate();
        },
        addBlock: function(rowNumber, blockData) {
            var rowData = this.data[rowNumber].agregator.getAgregate();
            rowData.push(blockData);
            this.data[rowNumber].agregator.setAgregate(rowData);
        },
        deleteBlockList: function(rowNumber, blockNumberList) {
            var rowData = this.data[rowNumber].agregator.getAgregate();

            blockNumberList.sort().reverse();
            for(var key in blockNumberList) {
                blockNumber = parseInt(blockNumberList[key], 10);
                rowData.splice(blockNumber, 1);
            }

            this.data[rowNumber].agregator.setAgregate(rowData);
        },
        updateRow: function(rowNum, selectedBlocks, grid) {
            var rowData = this.data[rowNum].agregator.getAgregate();
            for (var blockNum in selectedBlocks) {
                var block = selectedBlocks[blockNum];

                $.extend(rowData[blockNum], this.calculateDates(block, grid));

                //TODO:: unselect???
                block.removeClass("selected");
                delete selectedBlocks[blockNum];
            }
            this.data[rowNum].agregator.setAgregate(rowData);
        },

        // block
        updateBlock: function (rowNumber, blockNumber, blockData) {
            var rowData = this.data[rowNumber].agregator.getAgregate();
            $.extend(rowData[blockNumber], blockData);
            this.data[rowNumber].agregator.setAgregate(rowData);
        },

        // vtMenu
        getNumberOfRows: function() {
            return this.data.length;
        },
        getRowNames: function() {
            var rowNameList = [];
            for (var i=0; i < this.data.length; i++) {
                rowNameList.push(this.data[i].metadata.name);
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

        getNumberOfDays: function() {
            var boundary = this.getBoundary();
            return numberOfDays = DateUtils.daysBetween(boundary.left, boundary.right);
        },
        getNumberOfDaysAdjusted: function() {
            var boundaryAdj = this.getBoundaryAdjusted();
            return numberOfDays = DateUtils.daysBetween(boundaryAdj.left, boundaryAdj.right);
        },
        
        // help functions
        calculateDates: function(elementJquery, grid) {
            /* calculate left border*/
            var startDate = grid.getDateByPos(elementJquery.offset().left);

            /* calculate right border */
            var blockWidth = parseInt(elementJquery.css('width'), 10);
            // HACK: workaround for date decrease when cellWidth <= 5
            var blockDuration = Math.floor(blockWidth/this.options.cellWidth) + 1 * (this.options.cellWidth < 5) + 1 * (this.options.cellWidth < 3) + 2 * (this.options.cellWidth < 2);
            var endDate = startDate.clone().addDays(blockDuration);

            /* fit to grid */
            var lastDate = grid[grid.length - 1].date;

            if (endDate.compareTo(lastDate) > 0) {
                endDate = lastDate;
            }

            return {"start" : startDate, "end" : endDate };
        }
    });

/*==============================================================================
* Libraries
*=============================================================================*/
    /**
    * jQuery Wrapper
    */
    function JQueryWrapper () {
        this.jQueryElement = $("<div>");
    }

    $.extend(JQueryWrapper.prototype, {
        /* Wrapper */

        getCssProperty: function(fromClass, propertyName) {
            var $inspector = $("<div>").css("display", "none").addClass(fromClass);
            $("body").append($inspector);
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
