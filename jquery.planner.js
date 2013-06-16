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
            this.chartView = new ChartView(this.options, this.element, this);
        },

        setData: function(data) {
            this.chartView.setData(data);
        },

        getData: function() {
            return this.chartView.getData();
        },
        
        addBlockCommand: function(name, callback) {
            this.chartView.addBlockCommand(name, callback);
        },

        _setOption: function (name, value) {
            if (name === "width") {
                this.chartView.setWidth(value);
            }
            if (name === "boundary") {
                this.chartView.setBoundaries(value);
                return;
            }

            $.Widget.prototype._setOption.apply(this, arguments);
        }
    });

/*==============================================================================
* Components
*=============================================================================*/
    /**
     * ChartView class
     */
    function ChartView(options, element, widget) {
        this.element = element;
        /* TODO: handle widget parameter passing */
        this.widget = widget;

        /** Geometry Handling */
        // get the geometry properties from css
        var cellSize = this.getCssProperty("planner-workbench", "background-size").split(" ");
        var cellWidth = parseInt(cellSize[0]);
        var cellHeight = parseInt(cellSize[1]);
        var width = parseInt(this.getCssProperty("planner", "width"), 10);
        var vtHeaderWidth = parseInt(this.getCssProperty("planner-vtheader", "width"), 10);

        // set default geometry (order: params -> css -> hardcode)
        options.cellWidth      = options.cellWidth      || cellWidth     || 21;
        options.cellHeight     = options.cellHeight     || cellHeight    || 32;
        options.width          = options.width          || width         || 600;
        options.vtHeaderWidth  = options.vtHeaderWidth  || vtHeaderWidth || 100;
        options.showWeekends   = options.showWeekends   && true;         // false
        options.dateFormat     = options.dateFormat                      || "yyyy-MM-dd";
        options.expandBodrer   = options.expandBorder   && true;         // false
        options.mergeNeighbors = options.mergeNeighbors && true;         // false
        options.disabledPast   = options.disabledPast   && true;         // false

        // calculabe options
        options.rowWidth = function () { return options.width - options.vtHeaderWidth - 2 };

        // set default baundaries
        var minDays = Math.floor(options.rowWidth()/options.cellWidth);
        var left = new Date().clearTime();
        var right = left.clone().addDays(minDays);
        if (options.boundary && options.boundary.left) {
            left = DateUtils.convertToDate(options.boundary.left, options.dateFormat).clearTime();
        }
        if (options.boundary && options.boundary.right) {
            right = DateUtils.convertToDate(options.boundary.right, options.dateFormat).clearTime();
        }
        options.boundary = new Boundary(left, right, minDays);

        // set frame begginging date
        if (options.scrollToDate) {
            options.scrollToDate = DateUtils.convertToDate(options.scrollToDate, options.dateFormat).clearTime();
        }

        this.options = options;
        this.workbenchModel = new WorkbenchModel(options);

        this._init();
    }
    ChartView.prototype = Object.create(AbstractView.prototype);

    $.extend(ChartView.prototype, {
        _init: function() {
            this.element.addClass("planner");
            this.setJquery(this.element);

            this.setData(this.options.data);

            this.setEvents();
        },

        render: function() {
            this.removeContent();
            this.element.css("width", this.options.width);

            this.vtHeader = new VtHeaderView(this.options, this.workbenchModel);
            this.slideView = new SlideView(this.options, this.workbenchModel);

            this.appendJquery(this.vtHeader);
            this.appendJquery(this.slideView);

            this.applyLastClass();
        },

        removeContent: function() {
            if (this.vtHeader) {
                this.vtHeader.removeContent();
                this.vtHeader.destroyJquery();
            }

            if (this.slideView) {
                this.slideView.removeContent();
                this.slideView.destroyJquery();
            }
        },

        applyLastClass: function() {
            $("div.planner-vtheader div.planner-vtheader-agregator:last-child", this.getJquery()).addClass("last");
            $("div.planner-hzheader-days div.planner-hzheader-day:last-child", this.getJquery()).addClass("last");
            $("div.planner-hzheader-months div.planner-hzheader-month:last-child", this.getJquery()).addClass("last");
        },

        setEvents: function() {
            /* TODO: replase selectors - use event function*/
            this.getJquery().delegate("div.planner-menu-item.zoomout",
                "click",
                $.proxy(this.onClickOnZoomOut, this));
            this.getJquery().delegate("div.planner-menu-item.zoomin",
                "click",
                $.proxy(this.onClickOnZoomIn, this));
            this.getJquery().delegate("div.planner-menu-item.delete",
                "click",
                $.proxy(this.onClickOnDelete, this));
            this.getJquery().delegate("div.planner-menu-item.copy",
                "click",
                $.proxy(this.onClickOnCopy, this));
        },

        onClickOnZoomOut: function(event) {
            if (this.options.cellWidth < 3) {
                this.options.cellWidth = 3;
                return;
            }

            this.options.cellWidth--;
            this.options.boundary.setMinDays(Math.floor(this.options.rowWidth()/this.options.cellWidth));

            this.slideView.render();

            this.widget._trigger("onclickonzoomout", event, {test: 1});
        },

        onClickOnZoomIn: function() {
            this.options.cellWidth++;
            this.options.boundary.setMinDays(Math.floor(this.options.rowWidth()/this.options.cellWidth));

            this.slideView.render();
        },

        onClickOnDelete: function() {
            this.workbenchModel.deleteSelectedBlocks();
        },
        
        onClickOnCopy: function() {
            this.workbenchModel.copySelectedBlocks();
        },

        getData: function() {
            return this.workbenchModel.getDataJson();
        },

        setData: function(data) {
            this.workbenchModel.setData(data);
            this.render();
        },

        setWidth: function(width) {
            this.options.width = width;

            this.render();
        },

        addBlockCommand: function(name, callback) {
            this.workbenchModel.blockMenuModel.addCommand(new CommandModel(name, callback));
        },

        setBoundaries: function(boundary) {
            if (!boundary) {
                return;
            }

            this.options.boundary.setLeft(DateUtils.convertToDate(boundary.left, this.options.dateFormat));
            this.options.boundary.setRight(DateUtils.convertToDate(boundary.right, this.options.dateFormat));

            // recalculate data table with new boundary
            this.workbenchModel.setData(this.workbenchModel.getData());
            this.render();
        }
    });

    /**
     * VtHeaderView class
     */
    function VtHeaderView(options, workbenchModel) {
        this.options = options;
        this.model = workbenchModel;

        this._init();
    }
    VtHeaderView.prototype = Object.create(AbstractView.prototype);

    $.extend(VtHeaderView.prototype, {
        _init: function (options) {
            var headerDiv = $("<div>", {
                "class": "planner-vtheader",
                "css": {
                    "width" : this.options.vtHeaderWidth
                }
            });

            this.setJquery(headerDiv);

            this.render();
            this.setEvents();
        },

        render: function() {
            var cellHeight = this.options.cellHeight;

            var menu = new MenuView(this.options, this.model);
            this.appendJquery(menu);

            var agregatorIterator = this.model.getIterator();
            while (agregatorIterator.hasNext()) {
                var agregator = agregatorIterator.next();

                var vtHeaderAgregatorVeiw = new VtHeaderAgregatorView(agregator);
                this.appendJquery(vtHeaderAgregatorVeiw);
            }
        },

        removeContent: function() {
            /* empty */
        },
        /** Event Handlers */
        setEvents: function() {
            /* TODO: replace selectors */
            this.getJquery().delegate("div.planner-vtheader-agregator",
                "click",
                $.proxy(this.onClickOnAgregator, this));
        },
        onClickOnAgregator: function(e) {
            var position = $(e.currentTarget).data("position");
            var agregatorModel = this.model.getAgregator(position.agregator);

            agregatorModel.toggle();
        }
    });

    /**
     * VtHeaderAgregatorView class
     */
    function VtHeaderAgregatorView(agregatorModel) {
        this.model = agregatorModel;
        this.options = this.model.getWorkbench().options;

        this._init();
    }
    VtHeaderAgregatorView.prototype = Object.create(AbstractView.prototype);
    $.extend(VtHeaderAgregatorView.prototype, {
        _init: function() {
            var agregatorDiv = $("<div>", {
                "class": "planner-vtheader-agregator",
                "css" : {
                    "height": this.options.cellHeight + "px"
                }
            });
            agregatorDiv.data("position", {agregator: this.model.order});

            this.setJquery(agregatorDiv);
            this.startObserveModel();

            this.render();
        },

        render: function() {
            this.removeContent();

            var agregatorNameDiv = $("<div>", {
                "class": "planner-vtheader-agregator-name planner-nonselectable"
            });
            agregatorNameDiv.append(this.model.getName());
            this.getJquery().append(agregatorNameDiv);

            var rowIterator = this.model.getIterator();

            /* TODO:: (duplicaion) make agregatorRow iterable */
            var rowDiv = $("<div>", {
                "class": "planner-vtheader-agregate-row planner-nonselectable",
                "css" : {
                    "height" : (this.options.cellHeight - 1) + "px"
                }
            });
            this.getJquery().append(rowDiv);

            while (rowIterator.hasNext()) {
                var row = rowIterator.next();
                var rowDiv = $("<div>", {
                    "class": "planner-vtheader-row planner-nonselectable",
                    "css" : {
                        "height" : this.options.cellHeight + "px"
                    }
                });
                /*TODO:: add getters/setters to model */
                rowDiv.append(row.metadata.name);
                this.getJquery().append(rowDiv);
            }

            this.toggleSlide();
        },
        toggleSlide: function() {
            if (this.model.expanded) {
                this.getJquery().animate({height: this.options.cellHeight * this.model.getNumberOfRows()});
            } else {
                this.getJquery().animate({height: this.options.cellHeight});
            }
        },
        removeContent: function() {
            this.getJquery().empty();
        },
        update: function() {
            this.toggleSlide();
        }
    });

    /**
     * MenuView Class
     */
    function MenuView(options, model) {
        this.options = options;
        this.model = model;

        this._init();
    }
    MenuView.prototype = Object.create(AbstractView.prototype);

    $.extend(MenuView.prototype, {
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
            var deleteSelected = $("<div>", { "class": "planner-menu-item delete planner-nonselectable" });
            var copySelected = $("<div>", { "class": "planner-menu-item copy planner-nonselectable" });
            this.getJquery().append(zoomIn);
            this.getJquery().append(zoomOut);
            this.getJquery().append(deleteSelected);
            this.getJquery().append(copySelected);
        }
    });

    /**
     *  SlideView Class
     */
    function SlideView(options, model) {
        this.options = options;
        this.model = model;

        this.contentArray = [];

        this._init();
    }
    SlideView.prototype = Object.create(AbstractView.prototype);

    $.extend(SlideView.prototype, {
        _init: function() {
            var slideContainer = $("<div>", {
                "class": "planner-slide",
                "css": {
                    "width": this.options.rowWidth() + "px"
                }
            });
            this.setJquery(slideContainer);

            this.render();

            if (this.options.scrollToDate) {
                this.scrollToDate(this.options.scrollToDate);
            }
        },

        render: function() {
            this.removeContent();

            var hzHeader = new HzHeaderView(this.options, this.model);
            var workbenchView = new WorkbenchView(this.options, this.model);

            this.contentArray.push(workbenchView);
            this.contentArray.push(hzHeader);

            this.appendJquery(hzHeader);
            this.appendJquery(workbenchView);
        },
        scrollToDate: function(date) {
            // 500 - scroll speed
            this.getJquery().animate({scrollLeft: this.model.grid.getPosByDate(date)}, 500);
        },

        removeContent: function() {
            $(this.contentArray).each(function() {
                this.removeContent();
                this.destroyJquery();
            });
            this.contentArray = []
        }
    });

    /**
     *  HzHeaderView class
     */
    function HzHeaderView(options, model) {
        this.options = options;
        this.model = model;
        this.daysArray = [];
        this.cellWidth = options.cellWidth;

        this._init();
    }
    HzHeaderView.prototype = Object.create(AbstractView.prototype);

    $.extend(HzHeaderView.prototype, {
        /* TODO: move to configuration part */
        _monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

        _init: function() {
            /*TODO: move getDatePeriod in model layer  */
            var dates = this.getDatePeriod();
            var numberOfDays = this.options.boundary.getNumberOfDays(true);

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
                        var day = new HzHeaderDayView(this.options, dates[y][m][d]);
                        this.daysArray.push(day);
                        this.appendJquery(day, daysDiv);
                    }
                }
            }

            monthsDiv.css("width", (numberOfDays+1) * this.cellWidth + "px");
            daysDiv.css("width", (numberOfDays+1) * this.cellWidth + "px");
            headerDiv.append(monthsDiv).append(daysDiv);

            this.setJquery(headerDiv);
            
            var grid = new Grid(this.options, this.daysArray);
            this.model.grid = grid;
        },

        removeContent: function() {
            /* EMPTY */
        },

        // Creates a 3 dimensional array [year][month][day] of every day
        // between the given start and end dates
        getDatePeriod: function() {
            var dates = [];
            var left = this.options.boundary.getLeft();
            var rightAdj = this.options.boundary.getRight(true);

            dates[left.getFullYear()] = [];
            dates[left.getFullYear()][left.getMonth()] = [left]

            var last = left;
            while (last.compareTo(rightAdj) == -1) {
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
    * HzHeaderDayView Class
    */
    function HzHeaderDayView(options, date) {
        this.options = options;
        this._init(date);
    }
    HzHeaderDayView.prototype = Object.create(AbstractView.prototype);

    $.extend(HzHeaderDayView.prototype, {
        _init: function(date) {
            this.date = date;
            this.cellWidth = this.options.cellWidth;
            this.showWeekends = this.options.showWeekends;

            var day = $("<div>", { "class": "planner-hzheader-day planner-nonselectable" });
            day.css("width", this.cellWidth);
            if (this.showWeekends && this.isWeekend()) {
                day.addClass("planner-weekend");
            }
            
            /* font size adjusting */
            var date = this.date.getDate();
            if (this.cellWidth < 9) {
                date = "";
            } else if (this.cellWidth < 12) {
                day.css("font-size", "0.7em");
            } else if (this.cellWidth < 17) {
                day.css("font-size", "0.8em");
            }

            day.append(date);

            this.setJquery(day);
        },

        isWeekend: function () {
            return this.date.getDay() % 6 == 0;
        }
    });

    /**
     * MouseSelectorView class 
     */
    function MouseSelectorView(options, workbenchView) {
        this.options = options;
        this.workbenchView = workbenchView;
        this.model = workbenchView.model;

        this.baseX = 0;
        this.baseY = 0;
        
        this.selectionStarted = false;

        this._init();
        this.setEvents();
    }
    MouseSelectorView.prototype = Object.create(AbstractView.prototype);
    
    $.extend(MouseSelectorView.prototype, {
        _init: function() {
            var selectorDiv = $("<div>", {
                "class" : "planner-mouse-selector",
            });
            this.setJquery(selectorDiv);
        },
        setEvents: function() {
            /** TODO:  check 2 calls case */
            this.workbenchView.getJquery().delegate("div.planner-row",
                "mousedown",
                $.proxy(this.onMouseDownOnContainer, this));
                
            this.workbenchView.getJquery().delegate("div.planner-row",
                "mouseup",
                $.proxy(this.onMouseUpOnContainer, this));
        },
        onMouseDownOnContainer: function(e) {
            if (e.ctrlKey != true) {
                return;
            }
            this.selectionStarted = true;
            this.workbenchView.getJquery().bind(
                "mousemove",
                $.proxy(this.onMouseMoveOnWorkbench, this));

            this.showAt(e.pageX, e.pageY);

            var element = $(e.currentTarget)
            
            this.basePosition = element.data("position");
            this.baseDate = this.model.grid.getDateByPos(e.pageX);

            this.baseX = e.pageX;
            this.baseY = e.pageY;
            
        },
        onMouseUpOnContainer: function(e) {
            if (!this.selectionStarted) {
                return;
            }
            this.selectionStarted = false;
            
            this.workbenchView.getJquery().unbind(
                "mousemove",
                $.proxy(this.onMouseMoveOnWorkbench, this));

            this.hide();

            var element = $(e.currentTarget)
            
            var position = element.data("position");
            var date = this.model.grid.getDateByPos(e.pageX);
            
            this.startDate = undefined;
            this.endDate = undefined;
            this.topPosition = undefined;
            this.bottomPosition = undefined;
            
            if (e.pageX > this.baseX) {
                this.startDate = this.baseDate;
                this.endDate = date;
            } else {
                this.startDate = date;
                this.endDate = this.baseDate;
            }

            if (e.pageY > this.baseY) {
                this.topPosition = this.basePosition;
                this.bottomPosition = position;
            } else {
                this.topPosition = postion;
                this.bottomPosition = this.basePostion;
            }
            
            this.model.selectArea(
                this.topPosition,
                this.startDate,
                this.bottomPosition,
                this.endDate
            );
        },
        onMouseMoveOnWorkbench: function(e) {
            if (e.pageX >= this.baseX && e.pageY >= this.baseY) {
                this.getJquery().css({
                    "width" : e.pageX - this.baseX,
                    "height" : e.pageY- this.baseY
                });
            } else if (e.pageX < this.baseX && e.pageY >= this.baseY) {
                this.getJquery().css({
                    "left" : e.pageX - this.workbenchView.getJquery().offset().left,
                    "width" : this.baseX - e.pageX,
                    "height" : e.pageY- this.baseY
                });
            } else if (e.pageX >= this.baseX && e.pageY < this.baseY) {
                this.getJquery().css({
                    "top" : e.pageY - this.workbenchView.getJquery().offset().top,
                    "width" : e.pageX - this.baseX,
                    "height" : this.baseY - e.pageY 
                });
            } else { //e.pageX < this.baseX && e.pageY < this.baseY
                this.getJquery().css({
                    "left" : e.pageX - this.workbenchView.getJquery().offset().left,
                    "top" : e.pageY - this.workbenchView.getJquery().offset().top,
                    "width" : this.baseX - e.pageX,
                    "height" : this.baseY - e.pageY 
                });
            }
        },
        showAt: function(posX, posY) {
            this.getJquery().css({
                "display" : "inline",
                "left" : posX - this.workbenchView.getJquery().offset().left,
                "top" : posY- this.workbenchView.getJquery().offset().top
            });
        },
        hide: function() {
            this.getJquery().css({
                "display" : "",
                "left" : "",
                "top" : "",
                "width" : 0,
                "height" : 0
            });
        },

    });
    
    /**
     * WorkbenchView class
     */
    function WorkbenchView(options, model) {
        this.options = options;
        this.model = model;

        this.cellWidth = this.options.cellWidth;
        this.contentArray = [];

        this.isBlocksDragged = false;

        this._init();
    }
    WorkbenchView.prototype = Object.create(AbstractView.prototype);

    $.extend(WorkbenchView.prototype, {
        _init: function() {
            var numberOfDays = this.options.boundary.getNumberOfDays(true);
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;

            var blocksDiv = $("<div>", {
                "class": "planner-workbench",
                "css": {
                    "border" : 0,
                    "width" : (numberOfDays+1) * cellWidth + "px",
                    "background-size" : cellWidth + "px " +  (cellHeight)  + "px",
                    "background-position" : cellWidth + "px " +  (cellHeight + 1) + "px" }
                });

            this.setJquery(blocksDiv);

            /* current day ruller */
            var rullerLeft = 0;
            if (this.options.scrollToDate) {
                rullerLeft = this.model.grid.getPosByDate(this.options.scrollToDate);
            }
            var rullerDiv = $("<div>", {
                "class" : "planner-ruller",
                "css": {
                    "left" : rullerLeft + "px",
                    "width" : cellWidth + "px",
                }
            });
            this.getJquery().append(rullerDiv);

            this.mouseSelector = new MouseSelectorView(this.options, this);
            this.appendJquery(this.mouseSelector);

            this.render();
            this.setEvents();
        },

        render: function() {
            this.removeContent();

            this.blockMenuView = new BlockMenuView(this.options, this.model.blockMenuModel);
            this.appendJquery(this.blockMenuView);
            
            this.workbenchMenuView = new BlockMenuView(this.options, this.model.workbenchMenuModel);
            this.appendJquery(this.workbenchMenuView);

            var agregatorIterator = this.model.getIterator();
            while (agregatorIterator.hasNext()) {
                var dataAgregator = agregatorIterator.next();
                var agregatorView = new AgregatorView(this.options, dataAgregator);

                this.appendJquery(agregatorView);
                this.contentArray.push(agregatorView);
            }
        },

        removeContent: function() {
            $(this.contentArray).each(function() {
                this.removeContent();
                this.destroyJquery();
                this.stopObserveModel();
            });

            if (this.blockMenuView) {
                this.blockMenuView.destroyJquery();
            }

            this.contentArray.length = 0;
        },

        /** Event Handlers */
        setEvents: function() {
            /* TODO: replace selectors */
            /* TODO: ?undelegate events on removeContent */
            this.getJquery().delegate("div:not(.disabled).planner-block",
                "mouseover",
                $.proxy(this.onMouseover, this));

            this.getJquery().delegate("div:not(.disabled).planner-block",
                "click",
                $.proxy(this.onClickOnBlock, this));

            this.getJquery().delegate("div.planner-block",
                "mousedown",
                $.proxy(this.onMouseDownOnBlock, this));

            this.getJquery().delegate("div.planner-row",
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
            // select block on resizexs 
            var blockModel = this.model.getBlockByPosition(ui.helper.data("position"));
            blockModel.isDragged = true;
            blockModel.select();
        },
        onResizeBlock: function(e, ui) {
            var resizedBlockModel = this.model.getBlockByPosition(ui.helper.data("position"));
            
            // return if dragging is not horisontal
            if (ui.helper.width() == resizedBlockModel.width) {
                return;
            }
            var blockIterator = this.model.selectedBlocks.getIterator();
            while (blockIterator.hasNext()) {
                var blockModel = blockIterator.next();
                blockModel.resize(ui.helper.position().left, ui.helper.width());
            }
        },
        onResizeBlockStop: function(e, ui) {
            var blockModel = this.model.getBlockByPosition(ui.helper.data("position"));
            
            blockModel.isDragged = false;
            this.model.updateSelectedBlocks();
        },

        onDragBlockStart: function(e, ui) {
        },
        onDragBlock: function(e, ui) {
            // return if dragging is not horisontal
            if (ui.helper.position().left == ui.position.left) {
                return;
            }

            // select block on first Horisontal movement
            var draggedBlockModel = this.model.getBlockByPosition(ui.helper.data("position"));
            if (!draggedBlockModel.isDragged) {
                draggedBlockModel.isDragged = true;
                draggedBlockModel.select();
            }
            
            var blockIterator = this.model.selectedBlocks.getIterator();
            while (blockIterator.hasNext()) {
                var blockModel = blockIterator.next();
                blockModel.resize(ui.position.left, ui.helper.width());
            }
        },
        onDragBlockStop: function(e, ui) {
            var blockModel = this.model.getBlockByPosition(ui.helper.data("position"));
            if (!blockModel.isDragged) {
                return;
            }
            
            blockModel.isDragged = false;
            this.model.updateSelectedBlocks();
        },

        onClickOnBlock: function(e) {
            e.stopPropagation();
            var blockModel = this.model.getBlockByPosition($(e.currentTarget).data("position"));
            if (e.ctrlKey == true) {
                if (!blockModel.selected) {
                    blockModel.select();
                } else {
                    blockModel.unselect();
                }
                return;
            }

            this.blockMenuView.showAt(blockModel, e.pageX - this.getJquery().offset().left - 3, e.pageY - this.getJquery().offset().top - 3);
        },
        
        onMouseDownOnBlock: function(e) {
            if (e.ctrlKey == true) {
                e.stopPropagation();
            }
        },
        
        onClickOnContainer: function(e) {
            if (e.ctrlKey == true) {
                return;
            }
            
            if (!this.model.selectedBlocks.isEmpty()) {
                this.model.selectedBlocks.empty();
                return;
            }
            
            if (this.options.disabledPast && this.options.scrollToDate) { 
                var clickDate = this.model.grid.getDateByPos(e.pageX);
                if (clickDate.compareTo(this.options.scrollToDate) < 0) {
                    return;
                }
            }

            var data = {
                workbenchModel: this.model,
                event: e,
            }

            this.workbenchMenuView.showAt(data, e.pageX - this.getJquery().offset().left - 3, e.pageY - this.getJquery().offset().top - 3);
            return;
        },
    });

    /**
     * AgregatorView class
     */
    function AgregatorView(options, agregatorModel) {
        this.options = options;
        this.model = agregatorModel;

        this.cellWidth = this.options.cellWidth;
        this.contentArray = [];
        this.isBlocksDragged = false;
        this.resizedWidth = 0;
        this.resizedLeft = 0;

        this._init();
    }
    AgregatorView.prototype = Object.create(AbstractView.prototype);

    $.extend(AgregatorView.prototype, {
        _init: function() {
            var numberOfDays = this.options.boundary.getNumberOfDays(true);
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;

            var blocksDiv = $("<div>", {
                "class": "planner-agregator",
                "css": {
                    "border" : 0,
                    "width" : (numberOfDays+1) * cellWidth + "px",
                    "height" : this.options.cellHeight + "px",
                    }
                });

            this.setJquery(blocksDiv);
            this.startObserveModel();

            this.render();
        },
        render: function() {
            this.removeContent();

            // Unavailable Zones
            /** TODO:: add left unavailable zone functinality */
            /*
            this.leftUnavailableZone = $("<div>", {
            "class": "planner-unavailable",
            "css": {
                "width" : (3) * this.options.cellWidth + "px",
                "height" : this.model.getNumberOfRows() * this.options.cellHeight + "px",
                }
            });
            */
            var unavailableDaysNumber = this.options.boundary.getNumberOfDays(true) - this.options.boundary.getNumberOfDays();
            if (unavailableDaysNumber > 0) {
                this.rightUnavailableZone = $("<div>", {
                "class": "planner-unavailable",
                "css": {
                    "left" : (this.options.boundary.getNumberOfDays(true) - unavailableDaysNumber) * this.options.cellWidth + "px",
                    "width" : (unavailableDaysNumber + 1) * this.options.cellWidth + "px",
                    "height" : this.model.getNumberOfRows() * this.options.cellHeight + "px",
                    }
                });
            }
            
            this.getJquery().append(this.leftUnavailableZone);
            this.getJquery().append(this.rightUnavailableZone);
            
            // rows
            this.agregatorRowView = new RowView(this.options, this.model.getAgregatorRow());
            this.appendJquery(this.agregatorRowView);

            var rowIterator = this.model.getIterator();
            while (rowIterator.hasNext()) {
                var rowModel = rowIterator.next();
                var rowView = new RowView(this.options, rowModel);

                this.appendJquery(rowView);
                this.contentArray.push(rowView);
            }
            
            this.toggleSlide();
        },
        removeContent: function() {
            /* TODO: WORKAROUND bug with selected while toggeling */
            this.model.getWorkbench().selectedBlocks.empty();

            /* TODO:: removeContent refactoring */
            $(this.contentArray).each(function() {
                this.removeContent();
                this.destroyJquery();
                this.stopObserveModel();
            });

            if (this.agregatorRowView) {
                this.agregatorRowView.removeContent();
                this.agregatorRowView.destroyJquery();
                this.agregatorRowView.stopObserveModel();
            }

            if (this.leftUnavailableZone) {
                this.leftUnavailableZone.remove();
            }
            
            if (this.rightUnavailableZone) {
                this.rightUnavailableZone.remove();
            }

            this.contentArray = [];
        },
        toggleSlide: function() {
            if (this.model.expanded) {
                this.getJquery().animate({height: this.options.cellHeight * this.model.getNumberOfRows()});

                var rowViewIterator = new ArrayIterator(this.contentArray);
                while(rowViewIterator.hasNext()) {
                    rowView = rowViewIterator.next();
                    rowView.show();
                }
                
                if (this.rightUnavailableZone) {
                    this.rightUnavailableZone.animate({height: this.options.cellHeight * this.model.getNumberOfRows()});
                }
            } else {
                this.getJquery().animate({height: this.options.cellHeight});

                var rowViewIterator = new ArrayIterator(this.contentArray);
                while(rowViewIterator.hasNext()) {
                    rowView = rowViewIterator.next();
                    rowView.hide();
                }
                
                if (this.rightUnavailableZone) {
                    this.rightUnavailableZone.animate({height: this.options.cellHeight});
                }
            }
        },
        update: function() {
            this.toggleSlide();
        }
    });

    /**
     * RowView class
     */
    function RowView(options, model) {
        this.options = options;
        this.model = model;

        this.numberOfDays = this.options.boundary.getNumberOfDays(true);

        this.contentArray = [];
        this._init();
    }
    RowView.prototype = Object.create(AbstractView.prototype);

    $.extend(RowView.prototype, {
        _init: function() {
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;

            var row = $("<div>", {
                "class": "planner-row",
                "css" : {
                    "height": cellHeight + "px",
                    "width": (this.numberOfDays+1) * cellWidth + "px",
                    "background-size" : cellWidth + "px " +  cellHeight  + "px",
                    "background-position" : cellWidth + "px " +  cellHeight + "px"
                }
            });
            // TODO:: data method
            row.data("position", this.model.getPosition());

            this.setJquery(row);
            this.startObserveModel();

            this.render();

            if (!this.model.getAgregator().expanded && this.model.order != -1) {
                this.hide();
            }
        },
        hide: function() {
            this.getJquery().css({
                "z-index" : 0
            });
        },
        show: function() {
            this.getJquery().css({
                "z-index" : ""
            });
        },
        render: function() {
            this.removeContent();

            var blockIterator = this.model.getIterator();
            while (blockIterator.hasNext()) {
                var blockModel = blockIterator.next();
                var block = new BlockView(this.options, blockModel);
                this.contentArray.push(block);
            }

            for (var i = 0; i < this.contentArray.length; i++) {
                this.appendJquery(this.contentArray[i]);
            }
        },

        removeContent: function() {
            $(this.contentArray).each(function() {
                this.destroyJquery();
                this.stopObserveModel();
            });
            this.contentArray = [];
        },

        update: function() {
            this.render();
        }
    });

    /**
     * BlockView class
     */
    function BlockView(options, model) {
        this.options = options;
        this.model = model;
        this.blockController = undefined;

        this.startObserveModel();

        this._init();
    }
    BlockView.prototype = Object.create(AbstractView.prototype);

    $.extend(BlockView.prototype, {
        _init: function() {
            var block = $("<div>", {
                "class": "planner-block"
            });

            // block in the past not active
            if (this.options.disabledPast && this.options.scrollToDate) {
                if (this.model.end().compareTo(this.options.scrollToDate) <= 0) {
                    block.addClass("disabled");
                }
            }

            this.setJquery(block);
            
            // duration
            this.textBlock = $("<div>", { "class": "planner-block-text" });
            this.textBlock.addClass("planner-nonselectable");
            
            this.getJquery().append(this.textBlock);
            
            this.render();
        },
        render: function() {
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;
            var size = DateUtils.daysBetween(this.model.start(), this.model.end());
            var offset = DateUtils.daysBetween(this.options.boundary.getLeft(), this.model.start());

            this.getJquery().css({
                "width": ((size * cellWidth) - 3) + "px",
                "height": (cellHeight - 7) + "px",
                "margin-left": ((offset * cellWidth)) + 1 + "px",
                "margin-right" : "2px"
            });
            
            this.getJquery().attr("title", "start:\t" + this.model.start().toString(this.options.dateFormat) + "\nend:\t" + this.model.end().toString(this.options.dateFormat));
            
            if (this.model.color()) {
                this.getJquery().css("background-color", this.model.color());
            }
            
            // TODO:: data method
            this.getJquery().data("position", this.model.getPosition());
            
            // duration & agregation solid
            var notSolidNotificator = "";
            if (this.model.getRow().order == -1 && !this.model.isAgregationSolid()) {
                notSolidNotificator = "*";
            }
            this.textBlock.text(size + notSolidNotificator);

            // selected
            if (this.model.selected) {
                this.getJquery().addClass("selected");
            } else {
                this.getJquery().removeClass("selected");
            }
        },
        update:  function() {
            this.render();
        }
    });

    /**
     * BlockMenuView class
     */
    function BlockMenuView(options, model) {
        this.options = options;
        this.model = model;

        this.content = [];

        this._init();
    }
    BlockMenuView.prototype = Object.create(AbstractView.prototype);

    $.extend(BlockMenuView.prototype, {
        _init: function() {
            var menu = $("<div>", {
                "class" : "planner-block-menu",
            });
            this.setJquery(menu);

            this.render();
            this.setEvents();
        },
        render: function() {
            /*TODO: add removeContent function */
            this.getJquery().empty();
            var commandIterator = this.model.getIterator();
            while (commandIterator.hasNext()) {
                command = commandIterator.next();
                var menuItem = new BlockMenuItemView(this.options, command);
                this.appendJquery(menuItem);
                this.content.push(menuItem);
            }
        },
        setEvents: function() {
            this.getJquery().bind("mouseleave", $.proxy(this.onMouseLeave, this));
            this.getJquery().bind("click", $.proxy(this.onMouseLeave, this));
        },
        showAt: function(blockModel, left, top) {
            /* TODO: optimize rerendering using notification */
            this.render();
            this.setBlockModel(blockModel);

            this.getJquery().css({
                "display" : "inline",
                "left": left,
                "top": top,
            });
        },
        onMouseLeave: function() {
            this.getJquery().css("display", "none");
        },
        setBlockModel: function(blockModel) {
            var menuItemIterator = new ArrayIterator(this.content);
            while(menuItemIterator.hasNext()) {
                var menuItem = menuItemIterator.next();
                menuItem.setBlockView(blockModel);
            }
        }
    });

    /**
     * BlockMenuItemView class
     */
    function BlockMenuItemView(options, command) {
        this.options = options;
        this.command = command;
        this.blockModel = undefined;

        this._init();
    }
    BlockMenuItemView.prototype = Object.create(AbstractView.prototype);

    $.extend(BlockMenuItemView.prototype, {
        _init: function() {
            var menu = $("<div>", {
                "class" : "planner-block-menu-item",
            }).text(this.command.getName());

            this.setJquery(menu);
            this.setEvents();
        },
        setBlockView: function(blockModel) {
            this.blockModel = blockModel;
        },
        setEvents: function() {
            this.getJquery().bind("mouseover", $.proxy(this.onMouseOver, this));
            this.getJquery().bind("mouseleave", $.proxy(this.onMouseLeave, this));
            this.getJquery().bind("click", $.proxy(this.onClick, this));
        },
        onMouseOver: function() {
            this.getJquery().addClass("selected");
        },
        onMouseLeave: function(e) {
            this.getJquery().removeClass("selected");
        },
        onClick: function() {
            this.command.execute(this.blockModel);
        }
    });
    
    /**
     * WorkbenchModel class
     */
    function WorkbenchModel(options) {
        this.options = options;
        this.data = [];

        this.blockMenuModel = new BlockMenuModel();
        this.workbenchMenuModel = new WorkbenchMenuModel();
        this.selectedBlocks = new SelectedBlocks();
        this.copiedBlocks = undefined;
    }

    $.extend(WorkbenchModel.prototype, {
        //table
        setData: function(data) {
            this.data = [];

            for (var rowNum in data) {
                var agregator = new AgregatorModel(this, rowNum, data[rowNum].metadata, data[rowNum].data);
                this.data.push(agregator);
            }
        },

        getData: function() {
            var result = [];

            var agregatorIterator = this.getIterator();
            while (agregatorIterator.hasNext()) {
                var agregator = agregatorIterator.next();
                var rowIterator = agregator.getIterator();
                var data = [];
                while (rowIterator.hasNext()) {
                    var row = rowIterator.next();
                    data.push({metadata: row.metadata, data: row.getBlockList()});
                }

                var dataRow = {
                    metadata: agregator.metadata,
                    data: data
                }
                result.push(dataRow);
            }
            return result;
        },
        /* TODO: fix dupliction getData */
        getDataJson: function() {
            var result = [];

            var agregatorIterator = this.getIterator();
            while (agregatorIterator.hasNext()) {
                var agregator = agregatorIterator.next();
                var rowIterator = agregator.getIterator();
                var data = [];
                while (rowIterator.hasNext()) {
                    var row = rowIterator.next();
                    data.push({metadata: row.metadata, data: row.getBlockListJson()});
                }

                var dataRow = {
                    metadata: agregator.metadata,
                    data: data
                }
                result.push(dataRow);
            }
            return result;
        },

        getAgregator: function(order) {
            return this.data[order];
        },
        getBlockByPosition: function(position) {
            var agregator = this.getAgregator(position.agregator);
            var row = agregator.getRow(position.row);
            var block = row.getBlock(position.block);
            return block;
        },
        addBlock: function(position, blockData) {
            var agregator = this.getAgregator(position.agregator);
            if (!agregator) {
                return false;
            }
            /*TODO: optimize if statement */
            if (position.row == -1) {
                var rowIterator = agregator.getIterator();
                while (rowIterator.hasNext()) {
                    var row = rowIterator.next();
                    var blockList = row.getBlockList();
                    blockData.start = blockData.start.clone();
                    blockData.end = blockData.end.clone();
                    
                    blockList.push(blockData);
                    row.setBlockList(blockList);
                    row.notifyObservers();
                }
            } else {
                var row = agregator.getRow(position.row);
                if (!row) {
                    return false;
                }
                var blockList = row.getBlockList();

                blockList.push(blockData);
                row.setBlockList(blockList);
                row.notifyObservers();
            }

            agregator.updateAgregatorRow();
        },
        selectArea: function(topPosition, startDate, bottomPosition, endDate) {
            /** TODO: add row selection */
            var agregatorIterator = this.getIterator();
            for (var i = topPosition.agregator; i <= bottomPosition.agregator; i++) {
                this.getAgregator(i).getAgregatorRow().selectPeriod(startDate, endDate);
            }
        },
        updateSelectedBlocks: function() {
            this.update();
            this.selectedBlocks.empty();
        },
        deleteSelectedBlocks: function() {
            var rowsToUpdate = [];
            var blockIterator = this.selectedBlocks.getIterator();
            while (blockIterator.hasNext()) {
                var selectedBlockModel = blockIterator.next();
                selectedBlockModel.remove();
            }
            this.update();
            this.selectedBlocks.empty();
        },
        copySelectedBlocks: function() {
            this.selectedBlocks.sort();

            if (!this.selectedBlocks.isEmpty()) {
                this.copiedBlocks = $.extend(true, {}, this.selectedBlocks);
                
                this.selectedBlocks.empty();
            }
        },
        pasteCopiedBlocks: function(position, startDate) {
            if (!this.copiedBlocks) {
                return;
            }

            var startDateDiff = undefined;
            var rowDiff = undefined;
            
            var copiedBlockIterator = this.copiedBlocks.getIterator();
            while (copiedBlockIterator.hasNext()) {
                var copiedBlock = copiedBlockIterator.next();
                if (startDateDiff === undefined) {
                    startDateDiff = DateUtils.daysBetween(copiedBlock.start(), startDate);
                    agregatorDiff = position.agregator - copiedBlock.getPosition().agregator;
                }
                
                if (position.row == -1 && copiedBlock.getPosition().row == -1) {
                    continue;
                }

                if (rowDiff === undefined) {
                    rowDiff = position.row == -1 ? 0 : position.row - copiedBlock.getPosition().row;
                }

                var newPosition = {
                    "agregator" : parseInt(copiedBlock.getPosition().agregator, 10) + agregatorDiff,
                    "row" : parseInt(copiedBlock.getPosition().row, 10) + rowDiff 
                }
                
                var newBlockData = {
                    "start" : copiedBlock.start().clone().addDays(startDateDiff),
                    "end" : copiedBlock.end().clone().addDays(startDateDiff)
                };

                this.addBlock(newPosition, newBlockData);
            }
        },
        
        update: function() {
            var agregatorIterator = this.getIterator();
            while (agregatorIterator.hasNext()) {
                var agregator = agregatorIterator.next();
                agregator.update();
            }
        },
        getIterator: function() {
            return new ArrayIterator(this.data);
        }
    });

    /**
     * AgregatorModel class
     */
    function AgregatorModel(parent, order, metadata, data) {
        AbstractModel.apply(this, arguments);
        
        this.parent = parent;
        this.options = this.getWorkbench().options;
        this.order = order;
        
        this.rowList = [];
        this.agregatorRow = new AgregatorRowModel(this, -1, {}, []);

        this.metadata = metadata
        this.setData(data);

        /* TODO: move to configuration part */
        this.expanded = false;
    }
    AgregatorModel.prototype = Object.create(AbstractModel.prototype);
    $.extend(AgregatorModel.prototype, {
        getWorkbench: function() {
            return this.parent;
        },
        getAgregatorRow: function() {
            return this.agregatorRow;
        },
        updateAgregatorRow: function() {
            this.agregatorRow.agregateBlocks();
            this.agregatorRow.notifyObservers();
        },
        toggle: function() {
            this.expanded = !this.expanded;
            this.notifyObservers();
        },

        setData: function(data) {
            var blockList = []
            for (rowNum in data) {
                var row = new RowModel(this, rowNum, data[rowNum].metadata, data[rowNum].data);
                this.rowList.push(row);
            }
            this.updateAgregatorRow();
        },
        getData: function() {
            return this.rowList;
        },
        getRow: function(order) {
            if (order == -1) {
                return this.agregatorRow;
            }
            return this.rowList[order];
        },

        getMinDate: function() {
            return this.minDate;
        },
        getMaxDate: function() {
            return this.maxDate;
        },
        getName: function() {
            return this.metadata.name;
        },
        getNumberOfRows: function() {
            return this.rowList.length + 1;
        },
        update: function() {
            var needToUpdate = false
            var rowIterator = this.getIterator();
            while (rowIterator.hasNext()) {
                var row = rowIterator.next(); 
                if (row.needToUpdate) {
                    row.update();
                    needToUpdate = true;
                }
            }
            
            if (needToUpdate) {
                this.updateAgregatorRow();
            }
        },

        // TODO:: move to RowModel class
        getIterator: function() {
            return new ArrayIterator(this.rowList);
        }
    });

    /**
     *  AbstractRowModel class
     */
    function AbstractRowModel(parent, rowNum, metadata, blockList) {
        AbstractModel.apply(this, arguments);

        this.parent = parent;
        this.order = rowNum;

        this.needToUpdate = false;

        this.options = this.getAgregator().options;

        this.metadata = metadata;
        this.blockList = [];
    }
    AbstractRowModel.prototype = Object.create(AbstractModel.prototype);
    
    $.extend(AbstractRowModel.prototype, {
        getBlockList: function() {
            var result = [];
            var blockIterator = this.getIterator();
            while (blockIterator.hasNext()) {
                var block = blockIterator.next();
                result.push(block.getBlockData());
            }
            return result;
        },
        getBlockListJson: function() {
            var result = [];
            var blockIterator = this.getIterator();
            while (blockIterator.hasNext()) {
                var block = blockIterator.next();
                result.push(block.getBlockDataJson());
            }
            return result;
        },

        getBlock: function(blockNum) {
            var blockIterator = this.getIterator();
            while (blockIterator.hasNext()) {
                var block = blockIterator.next();
                if (block.order == blockNum) {
                    return block;
                }
            }
            return false;
        },

        getPosition: function() {
            return {
                row: this.order,
                agregator: this.getAgregator().order
            };
        },

        update: function() {
            this.setBlockList(this.getBlockList());
            this.notifyObservers();
            this.needToUpdate = false;
        },

        selectPeriod: function(startDate, endDate) {
            var blockIterator = this.getIterator();
            while (blockIterator.hasNext()) {
                var block = blockIterator.next();
                if ((block.start().compareTo(startDate) >= 0 && block.start().compareTo(endDate) <= 0)
                || (block.end().compareTo(startDate) >= 0 && block.end().compareTo(endDate) <= 0)) {
                    block.select();
                }
            }
        },
        
        getAgregator: function() {
            return this.parent;
        },

        sortBlockList: function(blockList) {
            blockList.sort(function(leftBlock, rightBlock) {
                return leftBlock.start().compareTo(rightBlock.start());
            });
            return blockList;
        },

        getIterator: function() {
            return new ArrayIterator(this.blockList);
        },
    });

    /**
     *  RowModel class
     */
    function RowModel(parent, rowNum, metadata, blockList) {
        AbstractRowModel.apply(this, arguments);

        this.setBlockList(blockList);
    }
    RowModel.prototype = Object.create(AbstractRowModel.prototype);
    $.extend(RowModel.prototype, {
        setBlockList: function(blockList) {
            blockList = $.extend(true, [], blockList);

            this.blockList = [];

            for (blockNum in blockList) {
                try {
                    var block = new BlockModel(this, blockNum, blockList[blockNum]);
                    this.blockList.push(block);
                } catch (e) {
                    /* do nothing */
                }
            }

            this.mergeBlocks();
        },
        mergeBlocks: function() {
            this.blockList = this.sortBlockList(this.blockList);
            
            var previousBlock = undefined;
            
            var blockToDelete = [];
            var blockIterator = this.getIterator();
            while (blockIterator.hasNext()) {
                var block = blockIterator.next();
                if (previousBlock && previousBlock.end().compareTo(block.end()) >= 0) {
                    blockToDelete.push(block);
                }
                else if (previousBlock && previousBlock.end().clone().compareTo(block.start()) > 0 ||
                        (this.options.mergeNeighbors && previousBlock && previousBlock.end().clone().compareTo(block.start()) == 0)) {
                    previousBlock.blockData.end = block.end().clone();
                    blockToDelete.push(block);
                }
                else {
                    previousBlock = block;
                }
            }
            
            blockIterator = new ArrayIterator(blockToDelete);
            while (blockIterator.hasNext()) {
                block = blockIterator.next();
                block.remove();
            } 
        },
    });

    /**
     *  AgregatorRowModel class
     */
    function AgregatorRowModel(parent, rowNum, metadata, blockList) {
        AbstractRowModel.apply(this, arguments);
    }
    AgregatorRowModel.prototype = Object.create(AbstractRowModel.prototype);
    $.extend(AgregatorRowModel.prototype, {
        agregateBlocks: function() {
            var newBlockList = [];
            var rowIterator = this.getAgregator().getIterator();
            while (rowIterator.hasNext()) {
                var rowModel = rowIterator.next();
                var blockIterator = rowModel.getIterator();
                while (blockIterator.hasNext()) {
                    var block = blockIterator.next();
                    newBlockList.push(block);
                }
            }
            
            newBlockList = this.sortBlockList(newBlockList);
            
            this.blockList = [];

            var agregatorBlock = undefined;
            var order = 0;

            var blockIterator = new ArrayIterator(newBlockList);
            /* TODO: merge block duplication */ 
            while (blockIterator.hasNext()) {
                var block = blockIterator.next();
                if (agregatorBlock && agregatorBlock.end().compareTo(block.end()) >= 0) {
                    agregatorBlock.blockData.agregatedBlocks.push(block);
                    block.agregatorBlock = agregatorBlock;
                }
                else if (agregatorBlock && agregatorBlock.end().clone().compareTo(block.start()) > 0 ||
                        (this.options.mergeNeighbors && agregatorBlock && agregatorBlock.end().clone().compareTo(block.start()) == 0)) {
                    /* TODO: add 2 setter to update all the agregated blocks and just for agregator */
                    agregatorBlock.blockData.end = block.end().clone();
                    agregatorBlock.blockData.agregatedBlocks.push(block);
                    block.agregatorBlock = agregatorBlock;
                }
                else {
                    var blockData = $.extend(true, {}, block.getBlockData());
                    blockData.start = blockData.start.clone();
                    blockData.end = blockData.end.clone(); 
                    
                    agregatorBlock = new AgregatorBlockModel(this, order, blockData);
                    order++;
                    agregatorBlock.blockData.agregatedBlocks = [];
                    agregatorBlock.blockData.agregatedBlocks.push(block);
                    block.agregatorBlock = agregatorBlock;
                    
                    this.blockList.push(agregatorBlock);
                }
            }
        },
    });

    /**
     * AbstractBlockModel class 
     */
    function AbstractBlockModel(parent, blockNum, blockData) {
        AbstractModel.apply(this, arguments);

        this.parent = parent;
        this.options = this.getRow().getAgregator().getWorkbench().options;
        this.order = blockNum;
        this.blockData = blockData;
        
        /* convert if dates in string */
        this.blockData.start = DateUtils.convertToDate(this.blockData.start, this.options.dateFormat);
        this.blockData.end = DateUtils.convertToDate(this.blockData.end, this.options.dateFormat);

        if (!this.options.expandBorder) {
            /* fit to boundary */
            if (this.start().compareTo(this.options.boundary.getLeft()) < 0
                && this.end().compareTo(this.options.boundary.getLeft()) < 0) {
                throw "wrong period";
            }
            if (this.start().compareTo(this.options.boundary.getRight()) > 0
                && this.end().compareTo(this.options.boundary.getRight()) > 0) {
                throw "wrong period";
            }
            if (this.start().compareTo(this.options.boundary.getLeft()) < 0) {
                this.blockData.start = this.options.boundary.getLeft().clone();
            }
            if (this.end().compareTo(this.options.boundary.getRight()) > 0) {
                this.blockData.end = this.options.boundary.getRight().clone();
            }
        } else {
            /* calculate max/min dates  */
            if (this.start().compareTo(this.options.boundary.getLeft()) < 0) {
                this.options.boundary.setLeft(this.start().clone());
            }
            if (this.end().compareTo(this.options.boundary.getRight()) > 0) {
                this.options.boundary.setRight(this.end().clone());
            }
        }

        this.selected = false;
        this.isDragged = false;
        
        this.left = 0;
        this.width = 0;

        this.observerList = [];
    }
    AbstractBlockModel.prototype = Object.create(AbstractModel.prototype);

    $.extend(AbstractBlockModel.prototype, {
        start: function() {
            return this.blockData.start;
        },
        setStart: function(date, format) {
            /*TODO: 
             * duplication isAgregatorSolid, setEnd
             * agregatorBlock functionality need to create a class
             */
            if (this.getRow().order == -1) {
                var blockIterator = new ArrayIterator(this.getAgregatedBlocks());
                while (blockIterator.hasNext()) {
                    var block = blockIterator.next();
                    
                    block.setStart(date, format);
                }
            }
            
            if (!format) {
                format = this.options.dateFormat;
            }
            this.blockData.start = DateUtils.convertToDate(date, format).clearTime();
            this.getRow().needToUpdate = true;
        },
        end: function() {
            return this.blockData.end;
        },
        setEnd: function(date, format) {
            /*TODO: 
             * duplication isAgregatorSolid, setStart
             * agregatorBlock functionality need to create a class
             */
            if (this.getRow().order == -1) {
                var blockIterator = new ArrayIterator(this.getAgregatedBlocks());
                while (blockIterator.hasNext()) {
                    var block = blockIterator.next();
                    
                    block.setEnd(date, format);
                }
            }
            
            if (!format) {
                format = this.options.dateFormat;
            }
            this.blockData.end = DateUtils.convertToDate(date, format).clearTime();
            this.getRow().needToUpdate = true;
        },
        color: function() {
            return this.blockData.color;
        },

        getBlockData: function() {
            return this.blockData;
        },
        getBlockDataJson: function() {
            var jsonData = $.extend(true, {}, this.blockData);
            jsonData.start = jsonData.start.toString(this.options.dateFormat);
            jsonData.end = jsonData.end.toString(this.options.dateFormat);

            return jsonData;
        },
        getRow: function() {
            return this.parent;
        },
        getPosition: function() {
            return {
                block: this.order,
                row: this.getRow().order,
                agregator: this.getRow().getAgregator().order
            };
        },

        resize: function(left, width) {
            var deltaWidth = this.width ? width - this.width : this.width;
            var deltaLeft = left - this.left;

            this.width = width;
            this.left = left;

            var blockChanged = false;
            if (deltaWidth == 0 && deltaLeft != 0)
            {
                this.drag(deltaLeft / this.options.cellWidth);
                blockChanged = true;
            }
            else if (deltaWidth != 0 && deltaLeft == 0 )
            {
                this.resizeRight(deltaWidth / this.options.cellWidth);
                blockChanged = true;
            }
            else if (deltaWidth != 0 && deltaLeft != 0)
            {
                this.resizeLeft((-1) * deltaWidth / this.options.cellWidth)
                blockChanged = true;
            }
            
            /* isDragged checks if block is moved by jquery facilities: to prevent double view update */
            if (blockChanged && !this.isDragged) {
                this.notifyObservers();
            }
        },
        stopResize: function() {
            this.resizedWidth = 0;
            this.resizedLeft = 0;
        },

        resizeLeft: function(days) {
            if (this.fitToLeftBoundary(days)) {
                return;
            }
            
            this.start().addDays(days);
            this.getRow().needToUpdate = true;

            if (this.start().compareTo(this.end()) > 0) {
                this.end().addDays(days);
            }
        },
        resizeRight: function(days) {
            if (this.fitToRightBoundary(days)) {
                return;
            }
            
            this.end().addDays(days);
            this.getRow().needToUpdate = true;

            if (this.end().compareTo(this.start()) < 0) {
                this.start().addDays(days);
            }
        },
        drag: function(days) {
            if (this.fitToLeftBoundary(days) || this.fitToRightBoundary(days)) {
                return;
            }

            this.start().addDays(days);
            this.end().addDays(days);
            this.getRow().needToUpdate = true;
        },
        
        fitToLeftBoundary: function(days) {
            if (this.start().clone().addDays(days).compareTo(this.options.boundary.left) < 0) {
                this.blockData.start = this.options.boundary.left.clone();
                this.getRow().needToUpdate = true;
                return true;
            }
            return false;
        },
        fitToRightBoundary: function(days) {
            if (this.end().clone().addDays(days).compareTo(this.options.boundary.right) > 0) {
                this.blockData.end = this.options.boundary.right.clone();
                this.getRow().needToUpdate = true;
                return true;
            }
            return false
        },
        
        select: function() {
            var workbenchModel = this.getRow().getAgregator().getWorkbench();
            workbenchModel.selectedBlocks.addBlock(this);
            this.selected = true;
            this.notifyObservers();
        },
        unselect: function() {
            this.selected = false;
            this.notifyObservers();
        }, 
        remove: function() {
            /* TODO: ? move the metod to RowModel ?*/ 
            this.getRow().blockList.splice($.inArray(this, this.getRow().blockList), 1);
            this.getRow().needToUpdate = true;
        },
    });


    /**
     * BlockModel class
     */
    function BlockModel(parent, blockNum, blockData) {
        AbstractBlockModel.apply(this, arguments);

        this.agregatorBlock = false;
    }
    BlockModel.prototype = Object.create(AbstractBlockModel.prototype);

    $.extend(BlockModel.prototype, {
        getAgregatorBlock: function() {
            return this.agregatorBlock;
        },
        fitToAgregator: function() {
            var agregatorBlock = this.getAgregatorBlock();
            var startDiff = agregatorBlock.start() - this.start();
            
            var blockChanged = false;
            if (startDiff > 0) {
                this.start().add({ "milliseconds": startDiff});
                this.end().add({ "milliseconds": startDiff });

                startDiff = 0;
                blockChanged = true;
                this.getRow().needToUpdate = true;
            }

            var endDiff = agregatorBlock.end() - this.end();
            if (endDiff < 0) {
                this.end().add({ "milliseconds": endDiff});
                this.start().add({ "milliseconds": Math.max(endDiff, startDiff)});
                
                blockChanged = true;
                this.getRow().needToUpdate = true;
            }

            if (blockChanged) {
                this.notifyObservers();
            }
        },
        resize: function(left, right) {
            AbstractBlockModel.prototype.resize.apply(this, arguments);
            if (this.getAgregatorBlock().isDragged) {
                this.fitToAgregator();
            }
        }
    });

    /**
     * AgregatorBlockModel class
     */
    function AgregatorBlockModel(parent, blockNum, blockData) {
        AbstractBlockModel.apply(this, arguments);
        
        /* TODO: move to configuration part */
        this.blockData.color = "#CFE3BF";
    }
    AgregatorBlockModel.prototype = Object.create(AbstractBlockModel.prototype);

    $.extend(AgregatorBlockModel.prototype, {
        isAgregationSolid: function() {
            var agregatedBlocks = this.getAgregatedBlocks();

            if (!agregatedBlocks) {
                return false;
            }

            var rowIterator = this.getRow().getAgregator().getIterator();
            while (rowIterator.hasNext()) {
                var row = rowIterator.next();
                var blockInRow = false;

                var blockIterator = new ArrayIterator(agregatedBlocks);
                while (blockIterator.hasNext()) {
                    var block = blockIterator.next();

                    if (block.getRow() == row) {
                        blockInRow = block;
                    }
                }

                if (!blockInRow || !this.start().equals(blockInRow.start()) || !this.end().equals(blockInRow.end()) ) {
                    return false;
                }
            }

            return true;
        },
        select: function() {
            AbstractBlockModel.prototype.select.apply(this, arguments);
    
            var workbenchModel = this.getRow().getAgregator().getWorkbench();
            var blockIterator = new ArrayIterator(this.blockData.agregatedBlocks);
            while(blockIterator.hasNext()) {
                var block = blockIterator.next();

                workbenchModel.selectedBlocks.addBlock(block);
                block.selected = true;
                block.notifyObservers();
            }
        },
        getAgregatedBlocks: function() {
            if (this.blockData.agregatedBlocks) {
                return this.blockData.agregatedBlocks;
            } else {
                return false;
            }
        },
        resizeLeft: function(days) {
            if (this.fitToLeftBoundary(days)) {
                return;
            }
            
            if (this.start().clone().addDays(days).compareTo(this.end()) > 0) {
                return;
            }

            this.start().addDays(days);
            this.getRow().needToUpdate = true;
        },
        resizeRight: function(days) {
            if (this.fitToRightBoundary(days)) {
                return;
            }
            
            if (this.end().clone().addDays(days).compareTo(this.start()) < 0) {
                return;
            }
            
            this.end().addDays(days);
            this.getRow().needToUpdate = true;
        },
    });

    /**
     * BlockMenuModel class
     */
    function BlockMenuModel() {
        this.commandList = [];

        this.addDefaultComands();
    }
    $.extend(BlockMenuModel.prototype, {
        addDefaultComands: function() {
            this.addCommand(new CommandModel("select", function(blockModel) {
                blockModel.select();
            }));

            this.addCommand(new CommandModel("delete", function(blockModel) {
                blockModel.select();
                var workbenchModel = blockModel.getRow().getAgregator().getWorkbench();
                workbenchModel.deleteSelectedBlocks();
            }));
        },
        /*TODO: abstracat model menu */
        addCommand: function(command) {
            this.commandList.push(command);
        },
        getIterator: function() {
            return new ArrayIterator(this.commandList);
        }
    });
    
    /**
     * WorkbenchMenuModel class
     */
    function WorkbenchMenuModel() {
        this.commandList = [];

        this.addDefaultComands();
    }
    $.extend(WorkbenchMenuModel.prototype, {
        addDefaultComands: function() {
            this.addCommand(new CommandModel("new", function(data) {
                var element = $(data.event.currentTarget)
                var position = element.data("position");

                var startDate = data.workbenchModel.grid.getDateByPos(data.event.pageX);

                var newBlockData = {
                    "start" : startDate,
                    "end" : startDate.clone().addDays(1)
                };

                data.workbenchModel.addBlock(position, newBlockData);
            }));
            this.addCommand(new CommandModel("past", function(data) {
                var element = $(data.event.currentTarget)
                var position = element.data("position");

                var startDate = data.workbenchModel.grid.getDateByPos(data.event.pageX);
            
                data.workbenchModel.pasteCopiedBlocks(position, startDate)
            }));
        },
        addCommand: function(command) {
            this.commandList.push(command);
        },
        getIterator: function() {
            return new ArrayIterator(this.commandList);
        }
    });
    

    /**
     * CommandModel class
     */
    function CommandModel(name, callback) {
        this.name = name;
        this.callback = callback;
    }
    $.extend(CommandModel.prototype, {
        getName: function() {
            return this.name;
        },
        execute: function(data) {
            this.callback(data);
        },
    });

    /**
     * ArrayIterator class
     */
    function ArrayIterator(array) {
        this.array = array;
        this.index = 0;
    }
    $.extend(ArrayIterator.prototype, {
        hasNext: function() {
            return this.index < this.array.length;
        },
        next: function() {
            return this.array[this.index++];
        },
    });

    /**
     * SelectedBlocks class
     */
    function SelectedBlocks() {
        this.selectedBlocks = [];
        this.isSorted = false;
    }
    $.extend(SelectedBlocks.prototype, {
        addBlock: function(block) {
            if (this.isSelected(block)) {
                return;
            }

            this.selectedBlocks.push(block);
            this.isSorted = false;
        },

        isSelected: function(block) {
            var blockIterator = this.getIterator();
            while (blockIterator.hasNext()) {
                /*TODO: redo verification using model data */
                selectedBlock = blockIterator.next();

                if (selectedBlock == block) {
                    return true;
                }
            }
            return false;
        },
        
        sort: function() {
            if (this.isSorted) {
                return;
            }
            this.selectedBlocks.sort(function(leftBlock, rightBlock) {
                leftPosition = leftBlock.getPosition();
                rightPosition = rightBlock.getPosition();
                
                leftPosition.agregator = parseInt(leftPosition.agregator, 10);
                rightPosition.agregator = parseInt(rightPosition.agregator, 10);
                if (leftPosition.agregator < rightPosition.agregator) {
                    return -1;
                } else if (leftPosition.agregator > rightPosition.agregator) {
                    return 1;
                }
                
                leftPosition.row = parseInt(leftPosition.row, 10);
                rightPosition.row = parseInt(rightPosition.row, 10);
                if (leftPosition.row < rightPosition.row) {
                    return -1;
                } else if (leftPosition.row > rightPosition.row) {
                    return 1;
                }

                leftPosition.block = parseInt(leftPosition.block, 10);
                rightPosition.block = parseInt(rightPosition.block, 10);
                if (leftPosition.block < rightPosition.block) {
                    return -1;
                } else if (leftPosition.block > rightPosition.block) {
                    return 1;
                }

                return 0
            });
            this.isSorted = true;
        },

        isEmpty: function() {
            return (this.selectedBlocks.length == 0);
        },

        empty: function() {
            var blockIterator = this.getIterator();
            while (blockIterator.hasNext()) {
                selectedBlock = blockIterator.next();
                if (selectedBlock) {
                    selectedBlock.unselect();
                }
            }
            this.selectedBlocks.length = 0;
        },

        getIterator: function() {
            return new ArrayIterator(this.selectedBlocks);
        },
    });

    /**
     * Grid class
     */
    function Grid(options, daysArray) {
        this.options = options;
        this.daysArray = daysArray;

        this.grid = [];
    }
    $.extend(Grid.prototype, {
        calculateOffset: function() {
            this.grid.length = 0;
            var firstDayOffset = 0;
            for (var i=0; i < this.daysArray.length; i++) {
                var day = this.daysArray[i];
                if (i == 0) {
                    firstDayOffset = day.getJquery().offset().left;
                }
                this.grid.push({
                    "date": day.date,
                    "offset": firstDayOffset + this.options.cellWidth * i
                });
            }

        },

        getDateByPos: function (posX, halfUp) {
            this.calculateOffset();

            var shift = this.options.cellWidth;

            if (halfUp) {
                shift = shift/2;
            }

            var date = this.grid[this.grid.length-1].date.clone();
            for(var i=0; i < this.grid.length; i++) {
                if (this.grid[i].offset + shift > posX) {
                    date = this.grid[i].date.clone();
                    break;
                }
            }
            return date.clone();
        },
        getPosByDate: function (date) {
            this.calculateOffset();

            for(var i=0; i < this.grid.length; i++) {
                if (date.compareTo(this.grid[i].date) < 0) {
                    return this.grid[i].offset - this.options.cellWidth;
                }
            }
            return this.grid[this.grid.length-1].offset;
        }
    });

    /**
     * Boundary class
     */
    function Boundary(left, right, minDays) {
        this.left = new Date();
        this.right = new Date();
        this.minDays = 0;
        this.numberOfDays = 0;

        this.setLeft(left);
        this.setRight(right);
        this.setMinDays(minDays);
    }

    $.extend(Boundary.prototype, {
        setLeft: function(left) {
            this.left = left;
            this.calculateNumberOfDays();
        },
        getLeft: function() {
            return this.left;
        },

        setRight: function(right) {
            this.right = right;
            this.calculateNumberOfDays();
        },
        getRight: function(adjusted) {
            if (adjusted && this.numberOfDays < this.minDays) {
                return this.getLeft().clone().addDays(this.minDays);
            }
            return this.right;
        },

        setMinDays: function(minDays) {
            this.minDays = minDays;
        },

        calculateNumberOfDays: function() {
            this.numberOfDays = DateUtils.daysBetween(this.left, this.right);
        },

        getNumberOfDays: function(adjusted) {
            if (adjusted && this.numberOfDays < this.minDays) {
                return this.minDays;
            }
            return this.numberOfDays;
        },
    });

/*==============================================================================
* Libraries
*=============================================================================*/
    /**
    * AbstractModel
    */
    function AbstractModel () {
        this.observerList = [];
    }

    $.extend(AbstractModel.prototype, {
        addObserver: function(observer) {
            return this.observerList.push(observer);
        },
        removeObserver: function(observer) {
            for (var index in this.observerList) {
                if (observer == this.observerList[index]) {
                    this.observerList.splice(index, 1);
                }
            }
        },
        notifyObservers: function() {
            var observerIterator = new ArrayIterator(this.observerList);
            while (observerIterator.hasNext()) {
                var observer = observerIterator.next();
                observer.update();
            }
        },
    });


    /**
    * AbstractView
    */
    function AbstractView () {
        this.jQueryElement = $("<div>");
    }

    $.extend(AbstractView.prototype, {
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

        startObserveModel: function() {
            this.model.addObserver(this);
        },
        stopObserveModel: function() {
            this.model.removeObserver(this);
        },
    });

    /**
    * Date Lib
    */
    var DateUtils = {
        daysBetween: function (start, end) {
            if (!start || !end) { return 0; }
            start = Date.parse(start); end = Date.parse(end);
            
            var multiplicator = 1;
            if (start.compareTo(end) > 0) {
                var temp = start;
                start = end;
                end = temp;
                multiplicator = -1;
            }
            
            if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
            var count = 0, date = start.clone();
            while (date.compareTo(end) == -1) { count = count + 1; date.addDays(1); }
            return multiplicator * count;
        },
        convertToDate: function(date, format) {
            if (typeof date == "string") {
                date = Date.parseExact(date, format);
            }
            return date.clone();
        }
    };

})(jQuery);
