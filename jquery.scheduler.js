/*
jQuery.Scheduler
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
    $.widget("custom.scheduler", {
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
        
        updateData: function(data) {
            return this.chartView.updateData(data);
        },

        getAgregatorMetadata: function(data) {
            return this.chartView.getAgregatorMetadata();
        },
        
        addBlockCommand: function(name, callback) {
            this.chartView.addBlockCommand(name, callback);
        },

        addWorkbenchCommand: function(name, callback) {
            this.chartView.addWorkbenchCommand(name, callback);
        },

        getOffsetByDate: function(date, format) {
            return this.chartView.getOffsetByDate(date, format);
        },

        getCurrentDate: function() {
            return this.chartView.getCurrentDate();
        }, 

        getBlockData: function(position) {
            return this.chartView.getBlockData(position);
        },

        resizeBlockTesting: function(position, leftDelta, widthDelta) {
            this.chartView.resizeBlockTesting(position, leftDelta, widthDelta);
        },

        selectDatePeriod: function(startDate, endDate, format) {
            this.chartView.selectDatePeriod(startDate, endDate, format);
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
        var cellSize = this.getCssProperty("scheduler-workbench", "background-size").split(" ");
        var cellWidth = parseInt(cellSize[0]);
        var cellHeight = parseInt(cellSize[1]);
        var width = parseInt(this.getCssProperty("scheduler", "width"), 10);
        var vtHeaderWidth = parseInt(this.getCssProperty("scheduler-vtheader", "width"), 10);

        // set default geometry (order: params -> css -> hardcode)
        options.cellWidth      = options.cellWidth      || cellWidth     || 21;
        options.cellHeight     = options.cellHeight     || cellHeight    || 32;
        options.vtHeaderWidth  = options.vtHeaderWidth  || vtHeaderWidth || 100;
        options.showWeekends   = options.showWeekends   && true;         // false
        options.dateFormat     = options.dateFormat                      || "YYYY-MM-DD HH:mm";
        options.expandBodrer   = options.expandBorder   && true;         // false
        options.mergeNeighbors = options.mergeNeighbors && true;         // false
        options.disabledPast   = options.disabledPast   && true;         // false
        options.language       = options.language                        || "en";

        if (options.widthInDays) {
            options.width = options.widthInDays * options.cellWidth + options.vtHeaderWidth;
        } else {
            options.width = options.width || width || 600;
        }

        // calculabe options
        options.rowWidth = function () { return options.width - options.vtHeaderWidth - 2 };

        // set default baundaries
        var minDays = Math.floor(options.rowWidth()/options.cellWidth);
        var left = moment().startOf('day');
        var right = left.clone().add('days', minDays);
        if (options.boundary && options.boundary.left) {
            left = DateUtils.convertToDate(options.boundary.left, options.dateFormat).startOf('day');
        }
        if (options.boundary && options.boundary.right) {
            right = DateUtils.convertToDate(options.boundary.right, options.dateFormat).startOf('day');
        }
        options.boundary = new Boundary(left, right, minDays);

        // set frame begginging date
        if (options.currentDate) {
            options.currentDate = DateUtils.convertToDate(options.currentDate, options.dateFormat).startOf('day');
        }

        // set internationalization
        options.i18n = new I18n(options.language); 

        this.options = options;
        this.workbenchModel = new WorkbenchModel(options);

        this._init();
    }
    ChartView.prototype = Object.create(AbstractView.prototype);

    $.extend(ChartView.prototype, {
        _init: function() {
            this.element.addClass("scheduler");
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
            $("div.scheduler-vtheader div.scheduler-vtheader-agregator:last-child", this.getJquery()).addClass("last");
            $("div.scheduler-hzheader-days div.scheduler-hzheader-day:last-child", this.getJquery()).addClass("last");
            $("div.scheduler-hzheader-months div.scheduler-hzheader-month:last-child", this.getJquery()).addClass("last");
        },

        setEvents: function() {
            /* TODO: replase selectors - use event function*/
            this.getJquery().delegate("div.scheduler-menu-item.zoomout",
                "click",
                $.proxy(this.onClickOnZoomOut, this));
            this.getJquery().delegate("div.scheduler-menu-item.zoomin",
                "click",
                $.proxy(this.onClickOnZoomIn, this));
            this.getJquery().delegate("div.scheduler-menu-item.delete",
                "click",
                $.proxy(this.onClickOnDelete, this));
            this.getJquery().delegate("div.scheduler-menu-item.copy",
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

        updateData: function(data) {
            this.workbenchModel.updateData(data);
        },

        getAgregatorMetadata: function(data) {
            return this.workbenchModel.getAgregatorMetadata();
        },

        getOffsetByDate: function(date, format) {
            if (!format) {
                format = this.options.dateFormat;
            }

            date = DateUtils.convertToDate(date, format);
            return this.workbenchModel.grid.getPosByDate(date);
        },

        getCurrentDate: function() {
            return this.options.currentDate.format(this.options.dateFormat);
        },

        getBlockData: function(position) {
            blockData = {};

            block =  this.workbenchModel.getBlockByPosition(position);
            if (block && block.blockData) {
                blockData = block.blockData;
                blockData.start = blockData.start.format(this.options.dateFormat);
                blockData.end = blockData.end.format(this.options.dateFormat);
            }

            return blockData;
        },

        resizeBlockTesting: function(position, leftDelta, widthDelta) {
            this.workbenchModel.resizeBlockTesting(position, leftDelta, widthDelta);
        },

        setWidth: function(width) {
            this.options.width = width;

            this.render();
        },

        addBlockCommand: function(name, callback) {
            this.workbenchModel.blockMenuModel.addCommand(new CommandModel(name, callback));
        },

        addWorkbenchCommand: function(name, callback) {
            this.workbenchModel.workbenchMenuModel.addCommand(new CommandModel(name, callback));
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
        },

        selectDatePeriod: function(startDate, endDate, format) {
            startDate = DateUtils.convertToDate(startDate, format);
            endDate = DateUtils.convertToDate(endDate, format);
            this.workbenchModel.selectDatePeriod(startDate, endDate);
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
                "class": "scheduler-vtheader",
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
            this.getJquery().delegate("div.scheduler-vtheader-agregator",
                "click",
                $.proxy(this.onClickOnAgregator, this));
            this.getJquery().delegate("a.scheduler-vtheader-agregator-name",
                "click",
                $.proxy(this.onClickOnAgregatorLink, this));
        },
        onClickOnAgregator: function(e) {
            var position = $(e.currentTarget).data("position");
            var agregatorModel = this.model.getAgregator(position.agregator);

            agregatorModel.toggle();
        },
        onClickOnAgregatorLink: function(e) {
            e.stopPropagation();
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
                "class": "scheduler-vtheader-agregator",
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
            
            /* name */
            var agregatorNameContainer = undefined;
            if (this.model.metadata.link) {
                agregatorNameContainer = $("<a>", {
                    "class" : "scheduler-vtheader-agregator-name scheduler-nonselectable",
                    "href" : this.model.metadata.link,
                    "target" : "blank" 
                });
            } else {
                agregatorNameContainer = $("<div>", {
                    "class": "scheduler-vtheader-agregator-name scheduler-nonselectable"
                });
            }

            agregatorNameContainer.append(this.model.getName());

            this.getJquery().append(agregatorNameContainer);

            /* toggle button */
            this.buttonDiv = $("<div>", {
                "class": "scheduler-vtheader-agregator-toggle"
            });
            this.getJquery().append(this.buttonDiv);

            /* rows */
            /* TODO:: (duplicaion) make agregatorRow iterable */
            var rowDiv = $("<div>", {
                "class": "scheduler-vtheader-agregate-row scheduler-nonselectable",
                "css" : {
                    "height" : (this.options.cellHeight - 1) + "px"
                }
            });
            this.getJquery().append(rowDiv);

            var rowIterator = this.model.getIterator();
            while (rowIterator.hasNext()) {
                var row = rowIterator.next();
                var rowDiv = $("<div>", {
                    "class": "scheduler-vtheader-row scheduler-nonselectable",
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
                this.buttonDiv.addClass("up");
            } else {
                this.getJquery().animate({height: this.options.cellHeight});
                this.buttonDiv.removeClass("up");
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
                "class": "scheduler-menu scheduler-nonselectable",
            });

            this.setJquery(menuDiv);

            this.render();
        },

        render: function() {
            var zoomIn = $("<div>", {
                "title": this.options.i18n.zoomIn,
                "class": "scheduler-menu-item zoomin scheduler-nonselectable" });
            var zoomOut = $("<div>", {
                "title": this.options.i18n.zoomOut,
                "class": "scheduler-menu-item zoomout scheduler-nonselectable" });
            var deleteSelected = $("<div>", { 
                "title": this.options.i18n.deleteSelectedBlocks,
                "class": "scheduler-menu-item delete scheduler-nonselectable" });
            var copySelected = $("<div>", {
                "title": this.options.i18n.copySelectedBlocks,
                "class": "scheduler-menu-item copy scheduler-nonselectable" });
                
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
                "class": "scheduler-slide",
                "css": {
                    "width": this.options.rowWidth() + "px"
                }
            });
            this.setJquery(slideContainer);

            this.render();

            if (this.options.currentDate) {
                this.currentDate(this.options.currentDate);
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
        currentDate: function(date) {
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
        _init: function() {
            /*TODO: move getDatePeriod in model layer  */
            var dates = this.getDatePeriod();
            var numberOfDays = this.options.boundary.getNumberOfDays();

            var headerDiv = $("<div>", { "class": "scheduler-hzheader" });
            var monthsDiv = $("<div>", { "class": "scheduler-hzheader-months" });
            var daysDiv = $("<div>", { "class": "scheduler-hzheader-days" });

            for (var y in dates) {
                for (var m in dates[y]) {
                    var w = dates[y][m].length * this.cellWidth;
                    monthsDiv.append($("<div>", {
                        "class": "scheduler-hzheader-month scheduler-nonselectable",
                        "css": {
                            "width": w + "px",
                            "overflow": "hidden"
                         }
                    }).append(this.options.i18n.month[m] + "/" + y));
                    
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
            var right = this.options.boundary.getRight();

            dates[left.year()] = [];
            dates[left.year()][left.month()] = [left]

            var last = left;
            while (last < right) {
                var next = last.clone().add('days',1);
                if (!dates[next.year()]) { dates[next.year()] = []; }
                if (!dates[next.year()][next.month()]) {
                    dates[next.year()][next.month()] = [];
                }
                dates[next.year()][next.month()].push(next);
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

            var day = $("<div>", { "class": "scheduler-hzheader-day scheduler-nonselectable" });
            day.css("width", this.cellWidth);
            if (this.showWeekends && this.isWeekend()) {
                day.addClass("scheduler-weekend");
            }
            
            /* font size adjusting */
            var date = this.date.date();
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
            return this.date.day() % 6 == 0;
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
                "class" : "scheduler-mouse-selector",
            });
            this.setJquery(selectorDiv);
        },
        setEvents: function() {
            /** TODO:  check 2 calls case */
            this.workbenchView.getJquery().delegate("div.scheduler-row",
                "mousedown",
                $.proxy(this.onMouseDownOnContainer, this));
                
            this.workbenchView.getJquery().delegate("div.scheduler-row",
                "mouseup",
                $.proxy(this.onMouseUpOnContainer, this));
        },
        onMouseDownOnContainer: function(e) {
            if (e.shiftKey != true) {
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
                this.topPosition = position;
                this.bottomPosition = this.basePosition;
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
            var numberOfDays = this.options.boundary.getNumberOfDays();
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;

            var blocksDiv = $("<div>", {
                "class": "scheduler-workbench",
                "css": {
                    "border" : 0,
                    "width" : (numberOfDays+1) * cellWidth + "px",
                    "background-size" : cellWidth + "px " +  (cellHeight)  + "px",
                    "background-position" : cellWidth + "px " +  (cellHeight + 1) + "px" }
                });

            this.setJquery(blocksDiv);

            /* current day ruller */
            var rullerLeft = 0;
            if (this.options.currentDate) {
                rullerLeft = this.model.grid.getPosByDate(this.options.currentDate);
            }
            var rullerDiv = $("<div>", {
                "class" : "scheduler-ruller",
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

            this.blockMenuView = new ContextMenuView(this.options, this.model.blockMenuModel);
            this.blockMenuView.getJquery().addClass("block-menu");
            this.appendJquery(this.blockMenuView);
            
            this.workbenchMenuView = new ContextMenuView(this.options, this.model.workbenchMenuModel);
            this.workbenchMenuView.getJquery().addClass("workbench-menu");
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

            if (this.workbenchMenu) {
                this.workbenchMenu.destroyJquery();
            }

            this.contentArray.length = 0;
        },

        /** Event Handlers */
        setEvents: function() {
            /* TODO: replace selectors */
            /* TODO: ?undelegate events on removeContent */
            this.getJquery().delegate("div:not(.disabled).scheduler-block",
                "mouseover",
                $.proxy(this.onMouseover, this));

            this.getJquery().delegate("div:not(.disabled).scheduler-block",
                "click",
                $.proxy(this.onClickOnBlock, this));

            this.getJquery().delegate("div.scheduler-row",
                "click",
                $.proxy(this.onClickOnContainer, this));
             
        },

        onMouseover: function(e) {
            // set resizable/draggable interactions to block
            element = $(e.currentTarget);
            if (!element.data("init")) {
                element.data("init", true);

                var blockModel = this.model.getBlockByPosition(element.data("position"));
                if (blockModel.isStarted()) {
                    element.resizable({
                        grid: this.cellWidth,
                        handles: "e",
                        start: $.proxy(this.onResizeBlockStart, this),
                        resize: $.proxy(this.onResizeBlock, this),
                        stop: $.proxy(this.onResizeBlockStop, this)
                    });
                } else {
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
                blockModel.incrementalResize(ui.helper.position().left, ui.helper.width());
            }
        },
        onResizeBlockStop: function(e, ui) {
            var blockModel = this.model.getBlockByPosition(ui.helper.data("position"));
            
            blockModel.isDragged = false;
            this.model.updateSelectedBlocks();
        },

        onDragBlockStart: function(e, ui) {
            if(e.ctrlKey || e.shiftKey) {
                return false;
            }
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
                blockModel.incrementalResize(ui.position.left, ui.helper.width());
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

            var menuCoord = this.calculateMenuCoordinates(e.pageX, e.pageY, this.blockMenuView);

            this.blockMenuView.showAt(blockModel, menuCoord);
        },

        onClickOnContainer: function(e) {
            if (e.shiftKey == true) {
                return;
            }
            
            if (!this.model.selectedBlocks.isEmpty()) {
                this.model.selectedBlocks.empty();
                return;
            }
            
            if (this.options.disabledPast && this.options.currentDate) { 
                var clickDate = this.model.grid.getDateByPos(e.pageX);
                if (clickDate < this.options.currentDate) {
                    return;
                }
            }

            var data = {
                workbenchModel: this.model,
                event: e,
            }

            var menuCoord = this.calculateMenuCoordinates(e.pageX, e.pageY, this.workbenchMenuView);

            this.workbenchMenuView.showAt(data, menuCoord);
            return;
        },

        calculateMenuCoordinates: function(pageX, pageY, menuView) {
            var coord = {
                x : pageX - this.getJquery().offset().left - 3,
                y : pageY - this.getJquery().offset().top - 3
            }
            var menuHeight = menuView.getJquery().height();
            var menuWidth = menuView.getJquery().width();
            
            if (coord.x + menuWidth > this.getJquery().width()) {
                coord.x  = this.getJquery().width() - menuWidth - 2;
            }

            if (coord.y + menuHeight > this.getJquery().height()) {
                coord.y = this.getJquery().height() - menuHeight;
            }

            return coord;
        }
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
            var numberOfDays = this.options.boundary.getNumberOfDays();
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;

            var blocksDiv = $("<div>", {
                "class": "scheduler-agregator",
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
            var unavailableDaysNumber = DateUtils.daysBetween(this.options.boundary.getLeft(), this.model.boundary.getLeft());
            if (unavailableDaysNumber > 0) {
                this.leftUnavailableZone = $("<div>", {
                "class": "scheduler-unavailable",
                "css": {
                    "width" : unavailableDaysNumber * this.options.cellWidth + "px",
                    "height" : this.model.getNumberOfRows() * this.options.cellHeight + "px",
                    }
                })

                this.getJquery().append(this.leftUnavailableZone);
            };

            var unavailableDaysNumber = DateUtils.daysBetween(this.model.boundary.getRight(), this.options.boundary.getRight());
            if (unavailableDaysNumber > 0) {
                this.rightUnavailableZone = $("<div>", {
                "class": "scheduler-unavailable",
                "css": {
                    "left" : (this.options.boundary.getNumberOfDays() - unavailableDaysNumber) * this.options.cellWidth + "px",
                    "width" : (unavailableDaysNumber + 1) * this.options.cellWidth + "px",
                    "height" : this.model.getNumberOfRows() * this.options.cellHeight + "px",
                    }
                });

                this.getJquery().append(this.rightUnavailableZone);
            }
            
            
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
                
                if (this.leftUnavailableZone) {
                    this.leftUnavailableZone.animate({height: this.options.cellHeight * this.model.getNumberOfRows()});
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
                
                if (this.leftUnavailableZone) {
                    this.leftUnavailableZone.animate({height: this.options.cellHeight});
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

        this.numberOfDays = this.options.boundary.getNumberOfDays();

        this.contentArray = [];
        this._init();
    }
    RowView.prototype = Object.create(AbstractView.prototype);

    $.extend(RowView.prototype, {
        _init: function() {
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;

            var row = $("<div>", {
                "class": "scheduler-row",
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
                "class": "scheduler-block"
            });

            this.status = this.options.i18n.planned;
            if (this.model.isDisabled()) {
                block.addClass("disabled");
                this.status = this.options.i18n.finished;
            } else if (this.model.isStarted()) {
                block.addClass("started");
                this.status = this.options.i18n.started;
            }

            this.setJquery(block);
            
            // duration
            this.textBlock = $("<div>", { "class": "scheduler-block-text" });
            this.textBlock.addClass("scheduler-nonselectable");
            
            this.getJquery().append(this.textBlock);
            
            this.render();
        },
        render: function() {
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;
            

            var size = DateUtils.daysBetween(this.model.startDay(), this.model.endDay());
            var offset = DateUtils.daysBetween(this.options.boundary.getLeft().clone().startOf('day'), this.model.startDay());

            this.getJquery().css({
                "width": ((size * cellWidth) - 3) + "px",
                "height": (cellHeight - 7) + "px",
                "margin-left": ((offset * cellWidth)) + 1 + "px",
                "margin-right" : "2px"
            });
            
            this.getJquery().attr(
                "title", this.options.i18n.startBlock + ":\t" + this.model.start().format(this.options.i18n.dateFormat) 
                + "\n" + this.options.i18n.endBlock + ":\t" + this.model.end().format(this.options.i18n.dateFormat)
                + "\n" + this.options.i18n.status +": " + this.status
            );
            
            if (this.model.color()) {
                this.getJquery().css("background-color", this.model.color());
            }
            
            // TODO:: data method
            this.getJquery().data("position", this.model.getPosition());
            
            // duration & agregation solid
            var days = DateUtils.daysBetween(this.model.start(), this.model.end(), true);
            var notSolidNotificator = "";
            if (this.model.getRow().order == -1 && !this.model.isAgregationSolid()) {
                notSolidNotificator = "*";
            }
            this.textBlock.text(days + notSolidNotificator);

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
     * ContextMenuView class
     */
    function ContextMenuView(options, model) {
        this.options = options;
        this.model = model;

        this.content = [];

        this._init();
    }
    ContextMenuView.prototype = Object.create(AbstractView.prototype);

    $.extend(ContextMenuView.prototype, {
        _init: function() {
            var menu = $("<div>", {
                "class" : "scheduler-context-menu",
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
                var menuItem = new ContextMenuItemView(this.options, command);
                this.appendJquery(menuItem);
                this.content.push(menuItem);
            }
        },
        setEvents: function() {
            this.getJquery().bind("mouseleave", $.proxy(this.onMouseLeave, this));
            this.getJquery().bind("click", $.proxy(this.onMouseLeave, this));
        },
        showAt: function(blockModel, coord) {
            /* TODO: optimize rerendering using notification */
            this.render();
            this.setBlockModel(blockModel);

            this.getJquery().css({
                "display" : "inline",
                "left": coord.x,
                "top": coord.y,
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
     * ContextMenuItemView class
     */
    function ContextMenuItemView(options, command) {
        this.options = options;
        this.command = command;
        this.blockModel = undefined;

        this._init();
    }
    ContextMenuItemView.prototype = Object.create(AbstractView.prototype);

    $.extend(ContextMenuItemView.prototype, {
        _init: function() {
            var menu = $("<div>", {
                "class" : "scheduler-context-menu-item",
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

        this.blockMenuModel = new BlockMenuModel(this.options);
        this.workbenchMenuModel = new WorkbenchMenuModel(this.options);
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
        
        updateData: function (data) {
            var agregatorDataIterator = new ArrayIterator(data);
            while (agregatorDataIterator.hasNext()) {
                var agregatorData = agregatorDataIterator.next();
                var agregator = this.getAgregatorByMetadata(agregatorData.metafilter);
                if (!agregator) {
                    continue;
                }
                
                var agregatorRow = agregator.getAgregatorRow();
                blockDataIterator = new ArrayIterator(agregatorData.data);
                while (blockDataIterator.hasNext()) {
                    blockData = blockDataIterator.next();
                    agregatorRow.addBlock(blockData);
                }
                
                agregator.updateAgregatorRow();
            } 
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

        getAgregatorMetadata: function() {
            var result= [];

            var agregatorIterator = this.getIterator();
            while (agregatorIterator.hasNext()) {
                var agregator = agregatorIterator.next();
                result.push(agregator.metadata);
            }

            return result;
        },

        getAgregator: function(order) {
            return this.data[order];
        },
        getAgregatorByMetadata: function(metafilter) {
            var agregatorIterator = this.getIterator();
            while (agregatorIterator.hasNext()) {
                var agregator = agregatorIterator.next();
                
                if (agregator.filterMetadata(metafilter)) {
                    return agregator;
                }
            }
            
            return false;
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
            
            var row = agregator.getRow(position.row);
            if (!row) {
                return false;
            }
            
            row.addBlock(blockData);

            agregator.updateAgregatorRow();
        },
        selectRow: function (position) {
            var agregator = this.getAgregator(position.agregator);
            var row = agregator.getRow(position.row);
            var blockIterator = row.getIterator();

            while (blockIterator.hasNext()) {
                var block = blockIterator.next();
                block.select();
            }
        },
        selectDatePeriod: function(startDate, endDate) {
            var agregatorIterator = this.getIterator();
            while (agregatorIterator.hasNext()) {
                var agregator = agregatorIterator.next();
                agregator.getAgregatorRow().selectPeriod(startDate, endDate);
            }
        },
        selectArea: function(topPosition, startDate, bottomPosition, endDate) {
            /** TODO: add row selection */
            for (var i = parseInt(topPosition.agregator, 10); i <= parseInt(bottomPosition.agregator, 10); i++) {
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
                    "start" : copiedBlock.start().add('days',startDateDiff),
                    "end" : copiedBlock.end().add('days',startDateDiff)
                };

                this.addBlock(newPosition, newBlockData);
            }
        },
        resizeBlockTesting: function(position, leftDelta, widthDelta) {
            // @TODO: workaroud function for testing resizing blocks
            // emulates functuinality of set functuins onResizeBlockStart, onResizeBlock, onResizeBlockStop
            var resizedBlockModel = this.getBlockByPosition(position);
            resizedBlockModel.select();

            var blockIterator = this.selectedBlocks.getIterator();
            while (blockIterator.hasNext()) {
                var blockModel = blockIterator.next();
                blockModel.deltaResize(leftDelta, widthDelta);
            }
 
            this.updateSelectedBlocks();
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

        /* TODO: move to configuration part */
        this.expanded = false;
        
        // boundary
        if (this.metadata.boundary) {
            this.boundary = $.extend(true, {}, this.options.boundary);
            this.boundary.setMinDays(0);

            if (this.metadata.boundary.left) {
                this.boundary.setLeft(DateUtils.convertToDate(this.metadata.boundary.left, this.options.dateFormat));
            }
            if (this.metadata.boundary.right) {
                this.boundary.setRight(DateUtils.convertToDate(this.metadata.boundary.right, this.options.dateFormat));
            }
        } else {
            this.boundary = this.options.boundary;
        }

        this.setData(data);
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
        
        filterMetadata: function(metafilter) {
            for (var key in metafilter) {
                if (this.metadata[key] != metafilter[key]) {
                    return false;
                }
            }
            return true;
        }, 

        setData: function(data) {
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

        addBlock: function(blockData) {
            var blockDataNew = $.extend(true, {}, blockData);
            blockDataNew.start = DateUtils.convertToDate(blockData.start, this.options.dateFormat);
            blockDataNew.end = DateUtils.convertToDate(blockData.end, this.options.dateFormat);

            var blockList = this.getBlockList();
            blockList.push(blockDataNew);

            this.setBlockList(blockList);
            this.notifyObservers();
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
                if ((block.start() > startDate && block.start() < endDate)
                || (block.end() > startDate && block.end() < endDate)
                || (block.start() <= startDate && block.end() > endDate)) {
                    block.select();
                }
            }
        },
        
        getAgregator: function() {
            return this.parent;
        },

        sortBlockList: function(blockList) {
            blockList.sort(function(leftBlock, rightBlock) {
                return leftBlock.start() > rightBlock.start();
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
                if (previousBlock && previousBlock.end() >= block.end()) {
                    blockToDelete.push(block);
                }
                else if (previousBlock && previousBlock.endDay() > block.startDay() ||
                        (this.options.mergeNeighbors && previousBlock && previousBlock.end().isSame(block.start()) )) {
                    //make end time the same as the start time 
                    var endDate = block.end();
                    endDate.hours(previousBlock.start().hours());
                    endDate.minutes(previousBlock.start().minutes());

                    previousBlock.setEnd(endDate);
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
                if (agregatorBlock && agregatorBlock.end() >= block.end()) {
                    agregatorBlock.blockData.agregatedBlocks.push(block);
                    block.agregatorBlock = agregatorBlock;
                }
                else if (agregatorBlock && agregatorBlock.end() >= block.start() ||
                        (this.options.mergeNeighbors && agregatorBlock && agregatorBlock.end().isSame(block.start()) )) {
                    /* TODO: add 2 setter to update all the agregated blocks and just for agregator */
                    agregatorBlock.setEnd(block.end());
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
        addBlock: function(blockData) {
            var rowIterator = this.getAgregator().getIterator();
            while (rowIterator.hasNext()) {
                var row = rowIterator.next();
                row.addBlock(blockData);
            }
        }
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
        this.setStart(this.blockData.start, this.options.dateFormat);
        this.setEnd(this.blockData.end, this.options.dateFormat);
        
        /* boundary */
        this.boundary = this.getRow().getAgregator().boundary;

        if (!this.options.expandBorder) {
            /* fit to boundary */
            if (this.start() < this.boundary.getLeft()
                && this.end() < this.boundary.getLeft()) {
                throw "wrong period";
            }
            if (this.start() > this.boundary.getRight()
                && this.end() > this.boundary.getRight()) {
                throw "wrong period";
            }
            if (this.start() < this.boundary.getLeft()) {
                this.blockData.start = this.boundary.getLeft().clone();
            }
            if (this.end() > this.boundary.getRight()) {
                this.blockData.end = this.boundary.getRight().clone();
            }
        } else {
            /* calculate max/min dates  */
            if (this.start() < this.options.boundary.getLeft()) {
                this.options.boundary.setLeft(this.start());
            }
            if (this.end() > this.options.boundary.getRight()) {
                this.options.boundary.setRight(this.end());
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
            return moment(this.blockData.start);
        },
        startDay: function() {
            return this.start().startOf('day');
        },
        setStart: function(date, format) {
            if (!format) {
                format = this.options.dateFormat;
            }
            this.blockData.start = DateUtils.convertToDate(date, format);
            this.getRow().needToUpdate = true;
        },
        end: function() {
            return moment(this.blockData.end);
        },
        endDay: function() {
            var end = this.end();

            if (end.startOf('day') < this.end()) {
                return end.add('days',1);
            }

            return this.end();
        },
        setEnd: function(date, format) {
            if (!format) {
                format = this.options.dateFormat;
            }
            this.blockData.end = DateUtils.convertToDate(date, format);
            this.getRow().needToUpdate = true;
        },
        color: function() {
            return this.blockData.color;
        },

        update: function(start, end, format) {
            this.setStart(start, format);
            this.setEnd(end, format);
        },

        getBlockData: function() {
            return this.blockData;
        },
        getBlockDataJson: function() {
            var jsonData = $.extend(true, {}, this.blockData);
            jsonData.start = jsonData.start.format(this.options.dateFormat);
            jsonData.end = jsonData.end.format(this.options.dateFormat);

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

        incrementalResize: function(left, width) {
            var deltaWidth = this.width ? width - this.width : this.width;
            var deltaLeft = left - this.left;
            this.width = width;
            this.left = left;
            
            this.deltaResize(deltaLeft, deltaWidth);
        },
        deltaResize: function(deltaLeft, deltaWidth) {
            var blockChanged = false;

            if (deltaLeft < 0)
            {
                this.resizeLeft(deltaLeft / this.options.cellWidth)
                this.resizeRight(deltaLeft / this.options.cellWidth);
                blockChanged = true;
            }
            else if (deltaLeft > 0) {
                this.resizeRight(deltaLeft / this.options.cellWidth);
                this.resizeLeft(deltaLeft / this.options.cellWidth)
                blockChanged = true;
            }

            if (deltaWidth != 0 )
            {
                this.resizeRight(deltaWidth / this.options.cellWidth);
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
            days = this.fitLeftToBoundary(days);

            this.setStart(this.start().add('days',days));
            this.getRow().needToUpdate = true;

            if (this.start() >= this.end()) {
                this.setEnd(this.end().add('days',days));
            }
        },
        resizeRight: function(days) {
            days = this.fitRightToBoundary(days);

            this.setEnd(this.end().add('days',days));
            this.getRow().needToUpdate = true;

            if (this.end() <= this.start()) {
                this.setStart(this.start().add('days',days));
            }
        },

        fitRightToBoundary: function(days) {
            modifiedDate = this.end().add('days', days);
            
            var extraDays = modifiedDate.diff(this.boundary.getLeft().clone().add('days', 1), 'days');
            if (extraDays < 0) {
                days = days - extraDays;
            }

            extraDays = modifiedDate.diff(this.boundary.getRight(), 'days');
            if (extraDays > 0) {
                days = days - extraDays;
            }

            return days;
        },
        fitLeftToBoundary: function(days) {
            modifiedDate = this.start().add('days', days);
            
            var extraDays = modifiedDate.diff(this.boundary.getLeft(), 'days');
            if (extraDays < 0) {
                days = days - extraDays;
            }

            extraDays = modifiedDate.diff(this.boundary.getRight().clone().add('days', -1), 'days');
            if (extraDays > 0) {
                days = days - extraDays;
            }

            return days;
        },
        
        select: function() {
            var workbenchModel = this.getRow().getAgregator().getWorkbench();
            workbenchModel.selectedBlocks.addBlock(this);
            this.selectView();
        },
        unselect: function() {
            var workbenchModel = this.getRow().getAgregator().getWorkbench();
            workbenchModel.selectedBlocks.removeBlock(this);
            this.unselectView();
        },
        selectView: function() {
            this.selected = true;
            this.notifyObservers();
        },
        unselectView: function() {
            this.selected = false;
            this.notifyObservers();
        },
        
        isDisabled: function() {
            if (this.options.disabledPast && this.options.currentDate) {
                if (this.end() <= this.options.currentDate) {
                    return true;
                }
            }
            return false;
        },
        isStarted: function() {
            if (this.options.disabledPast && this.options.currentDate) {
                if (this.start() <= this.options.currentDate 
                    && this.end() >= this.options.currentDate) {
                    return true;
                }
            }
            return false;
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
            var blockChanged = false;

            var startDiff = agregatorBlock.start() - this.start();
            if (startDiff > 0) {
                this.setStart(this.start().add("milliseconds", startDiff));
                this.setEnd(this.end().add("milliseconds", startDiff));

                startDiff = 0;
                blockChanged = true;
                this.getRow().needToUpdate = true;
            }

            var endDiff = agregatorBlock.end() - this.end();
            if (endDiff < 0) {
                this.setEnd(this.end().add("milliseconds", endDiff));
                this.setStart(this.start().add("milliseconds", Math.max(endDiff, startDiff)));
                
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

                if (!blockInRow || !this.start().isSame(blockInRow.start()) || !this.end().isSame(blockInRow.end()) ) {
                    return false;
                }
            }

            return true;
        },
        select: function() {
            AbstractBlockModel.prototype.select.apply(this, arguments);
    
            var blockIterator = new ArrayIterator(this.getAgregatedBlocks());
            while(blockIterator.hasNext()) {
                var block = blockIterator.next();
                block.select();
            }
        },
        unselect: function() {
            AbstractBlockModel.prototype.unselect.apply(this, arguments);
    
            var blockIterator = new ArrayIterator(this.getAgregatedBlocks());
            while(blockIterator.hasNext()) {
                var block = blockIterator.next();
                block.unselect();
            }
        },
        getAgregatedBlocks: function() {
            if (this.blockData.agregatedBlocks) {
                return this.blockData.agregatedBlocks;
            } else {
                return [];
            }
        },

        update: function(start, end, format) {
            this.setStart(start, format);
            this.setEnd(end, format);

            var blockIterator = new ArrayIterator(this.getAgregatedBlocks());
            while(blockIterator.hasNext()) {
                var block = blockIterator.next();
                block.update(start, end, format);
            }
        },
    });

    /**
     * BlockMenuModel class
     */
    function BlockMenuModel(options) {
        this.options = options;
        this.commandList = [];

        this.addDefaultComands();
    }
    $.extend(BlockMenuModel.prototype, {
        addDefaultComands: function() {
            this.addCommand(new CommandModel(this.options.i18n.selectBlock, function(blockModel) {
                blockModel.select();
            }));

            this.addCommand(new CommandModel(this.options.i18n.deleteBlock, function(blockModel) {
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
    function WorkbenchMenuModel(options) {
        this.options = options;
        this.commandList = [];

        this.addDefaultComands();
    }
    $.extend(WorkbenchMenuModel.prototype, {
        addDefaultComands: function() {
            this.addCommand(new CommandModel(this.options.i18n.newBlock, function(data) {
                var element = $(data.event.currentTarget)
                var position = element.data("position");

                var startDate = data.workbenchModel.grid.getDateByPos(data.event.pageX);

                var newBlockData = {
                    "start" : startDate,
                    "end" : startDate.clone().add('days',1)
                };

                data.workbenchModel.addBlock(position, newBlockData);
            }));
            this.addCommand(new CommandModel(this.options.i18n.pasteBlock, function(data) {
                var element = $(data.event.currentTarget)
                var position = element.data("position");

                var startDate = data.workbenchModel.grid.getDateByPos(data.event.pageX);
            
                data.workbenchModel.pasteCopiedBlocks(position, startDate)
            }));
            this.addCommand(new CommandModel(this.options.i18n.selectRow, function(data) {
                var element = $(data.event.currentTarget)
                var position = element.data("position");

                data.workbenchModel.selectRow(position);
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
        removeBlock: function(block) {
            if (this.isSelected(block)) {
                this.selectedBlocks.splice($.inArray(block, this.selectedBlocks), 1);
            }
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
                    selectedBlock.unselectView();
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
                if (date < this.grid[i].date) {
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
        this.left = moment();
        this.right = moment();
        this.minDays = 0;
        this.numberOfDays = 0;

        this.setMinDays(minDays);
        this.setLeft(left);
        this.setRight(right);
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

            this.checkMinRight();
            this.calculateNumberOfDays();
        },
        getRight: function() {
            return this.right;
        },

        setMinDays: function(minDays) {
            this.minDays = minDays;

            this.checkMinRight();
            this.calculateNumberOfDays();
        },

        checkMinRight: function() {
            var minRight = this.getLeft().clone().add('days',this.minDays);
            if (minRight > this.right) {
                this.right = minRight;
            }
        },

        calculateNumberOfDays: function() {
            this.numberOfDays = DateUtils.daysBetween(this.left, this.right);
        },

        getNumberOfDays: function() {
            return this.numberOfDays;
        },
    });

    function I18n(lang) {
        this.lang = lang;
        this.initializeEnglish();
        
        if (lang == "fr") {
            this.initializeFrench();
        } else if (lang == "ru") {
            this.initializeRus()
        }
    }
    $.extend(I18n.prototype, {
        initializeEnglish: function() {
            this.zoomIn      = "Zoom In";
            this.zoomOut     = "Zoom Out";
            this.deleteSelectedBlocks = "Delete Selected Blocks";
            this.copySelectedBlocks = "Copy Selected Blocks";

            this.newBlock    = "New Block";
            this.pasteBlock  = "Paste Block";
            
            this.selectBlock = "Select";
            this.deleteBlock = "Delete";
            this.editBlock   = "Edit";
            
            this.startBlock  = "Start";
            this.endBlock    = "End";
            
            this.selectRow   = "Select Row";

            this.month       = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            this.dateFormat  = "DD/MM/YYYY HH:mm";

            this.status      = "Status";
            this.planned     = "Planned";
            this.started     = "Started";
            this.finished    = "Finished";
        },
        initializeFrench: function() {
            this.zoomIn      = "Zoom +";
            this.zoomOut     = "Zoom -";
            this.deleteSelectedBlocks = "Supprimer Fenêtres Sélectionnées";
            this.copySelectedBlocks = "Copier Fenêtres Sélectionnées";
            
            this.newBlock    = "Nouvelle Fenêtre";
            this.pasteBlock  = "Coller Fenêtre";
            
            this.selectBlock = "Sélectionner";
            this.deleteBlock = "Supprimer";
            this.editBlock   = "Modifier";
            
            this.startBlock  = "Début";
            this.endBlock    = "Fin";
            
            this.selectRow   = "Sélectionner Ligne";

            this.month       = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Déc"];
            this.dateFormat  = "DD/MM/YYYY HH:mm";

            this.status      = "Statut";
            this.planned     = "Planifié";
            this.started     = "Actif";
            this.finished    = "Terminé";
        },
        initializeRus: function() {
            this.zoomIn      = "Увеличить";
            this.zoomOut     = "Уменьшить";
            this.deleteSelectedBlocks = "Удалить выделенные блоки";
            this.copySelectedBlocks = "Копировать выделенные блоки";
            
            this.newBlock    = "Новый блок";
            this.pasteBlock  = "Вставить блок";
            
            this.selectBlock = "Выделить";
            this.deleteBlock = "Удалить";
            this.editBlock   = "Редактировать";
            
            this.startBlock  = "Начало";
            this.endBlock    = "Конец";

            this.selectRow   = "Выделить Строку";

            this.month       = ["Янв", "Февр", "Март", "Апр", "Май", "Июнь", "Июль", "Авг", "Сент", "Окт", "Нояб", "Дек"];
            this.dateFormat  = "DD/MM/YYYY HH:mm";

            this.status      = "Статус";
            this.planned     = "Запланированный";
            this.started     = "Активный";
            this.finished    = "Законченный";
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
        daysBetween: function (start, end, roundUp) {
            if (!start || !end) { return 0; }
            start = moment(start); end = moment(end);
            
            if (roundUp) {
                return Math.ceil(end.diff(start, 'days', true));
            } else  {
                return end.diff(start, 'days');
            }
        },
        convertToDate: function(date, format) {
            if (typeof date == "string") {
                date = moment(date, format);
            }
            return date.clone();
        }
    };

})(jQuery);
