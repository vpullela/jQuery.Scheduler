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
        options.dateFormat    = options.dateFormat                     || "yyyy-MM-dd";
        options.expandBodrer  = options.expandBorder  && true;         // false

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
        this.options = this.model.parent.options;

        this._init();
    }
    VtHeaderAgregatorView.prototype = Object.create(AbstractView.prototype);
    $.extend(VtHeaderAgregatorView.prototype, {
        _init: function() {
            var agregatorDiv = $("<div>", {
                "class": "planner-vtheader-agregator"
            });
            agregatorDiv.data("position", {agregator: this.model.order});

            this.setJquery(agregatorDiv);
            this.startObserveModel();

            this.render();
        },

        render: function() {
            this.removeContent();

            this.getJquery().css("height", this.options.cellHeight * this.model.getNumberOfRows() + "px");

            var agregatorNameDiv = $("<div>", {
                "class": "planner-vtheader-agregator-name planner-nonselectable"
            });
            agregatorNameDiv.append(this.model.getName());
            this.getJquery().append(agregatorNameDiv);

            var rowIterator = this.model.getIterator();

            if (this.model.expanded) {
                /* TODO:: (duplicaion) make agregatorRow iterable */
                var rowDiv = $("<div>", {
                    "class": "planner-vtheader-agregate-row planner-nonselectable",
                    "css" : {
                        "height" : this.options.cellHeight + "px"
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
            }
        },
        removeContent: function() {
            this.getJquery().empty();
        },
        update: function() {
            this.render();
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
            this.getJquery().append(zoomIn);
            this.getJquery().append(zoomOut);
            this.getJquery().append(deleteSelected);
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
            /* TODO: move GRID to a separete class to avoid hzHeader passing everywere s*/
            this.hzHeader = new HzHeaderView(this.options, this.model);
            var workbenchView = new WorkbenchView(this.options, this.model, this.hzHeader);

            var numberOfDays = this.options.boundary.getNumberOfDays();
            var numberOfDaysAdj = this.options.boundary.getNumberOfDays(true);
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;
            var numberOfRows = this.model.getNumberOfRows();

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

            this.contentArray.push(workbenchView);

            this.appendJquery(this.hzHeader);
            this.ganttViewBody.append(workbenchView.getJquery());
            this.ganttViewBody.append(this.unavailableDiv);
            this.getJquery().append(this.ganttViewBody);
        },
        scrollToDate: function(date) {
            // 500 - scroll speed
            this.getJquery().animate({scrollLeft: this.hzHeader.getGrid().getPosByDate(date)}, 500);
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
            if (this.hzHeader) {
                this.hzHeader.removeContent();
                this.hzHeader.destroyJquery();
            }
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

                var date = grid[grid.length-1].date.clone();
                for(var i=0; i < grid.length; i++) {
                    if (grid[i].offset + shift > posX) {
                        date = grid[i].date.clone();
                        break;
                    }
                }
                return date.clone();
            },
            grid.getPosByDate = function (date) {
                for(var i=0; i < grid.length; i++) {
                    if (date.compareTo(grid[i].date) < 0) {
                        return grid[i].offset - grid.cellWidth;
                    }
                }
                return grid[grid.length-1].offset;
            }

            return grid;
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
            day.append(this.date.getDate());

            this.setJquery(day);
        },

        isWeekend: function () {
            return this.date.getDay() % 6 == 0;
        }
    });

    /**
     * WorkbenchView class
     */
    function WorkbenchView(options, model, hzHeader) {
        this.options = options;
        this.model = model;
        this.hzHeader = hzHeader;

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
                "class": "planner-blocks",
                "css": {
                    "border" : 0,
                    "width" : (numberOfDays+1) * cellWidth + "px",
                    "background-size" : cellWidth + "px " +  (cellHeight)  + "px",
                    "background-position" : cellWidth + "px " +  (cellHeight + 1) + "px" }
                });

            this.setJquery(blocksDiv);

            this.render();
            this.setEvents();
        },

        render: function() {
            this.removeContent();

            this.blockMenuView = new BlockMenuView(this.options, this.model.blockMenuModel);
            this.appendJquery(this.blockMenuView);

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
            this.getJquery().delegate("div.planner-block",
                "mouseover",
                $.proxy(this.onMouseover, this));

            this.getJquery().delegate("div.planner-block",
                "click",
                $.proxy(this.onClickOnBlock, this));

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
            blockModel.select();
        },
        onResizeBlock: function(e, ui) {
            /* TODO: duplication onDragBlock */
            var resizedBlockModel = this.model.getBlockByPosition(ui.helper.data("position"));
            var blockIterator = this.model.selectedBlocks.getIterator();
            while (blockIterator.hasNext()) {
                var blockModel = blockIterator.next();
                blockModel.resize(ui.helper.position().left, ui.helper.width());
                
                if (blockModel != resizedBlockModel) {
                    blockModel.notifyObservers();
                }
            }
        },
        onResizeBlockStop: function(e, ui) {
            this.model.updateSelectedBlocks();
        },

        onDragBlockStart: function(e, ui) {
        },
        onDragBlock: function(e, ui) {
            // select block on horisontal drag 
            if (!this.isBlocksDragged && ui.helper.position().left != ui.position.left) {
                this.isBlocksDragged = true;
                var draggedBlockModel = this.model.getBlockByPosition(ui.helper.data("position"));
                draggedBlockModel.select();
            }
            
            /* TODO: duplication onResizeBlock */
            var resizedBlockModel = this.model.getBlockByPosition(ui.helper.data("position"));
            var blockIterator = this.model.selectedBlocks.getIterator();
            while (blockIterator.hasNext()) {
                var blockModel = blockIterator.next();
                blockModel.resize(ui.helper.position().left, ui.helper.width());
                if (blockModel != resizedBlockModel) {
                    blockModel.notifyObservers();
                }
            }
        },
        onDragBlockStop: function(e, ui) {
            if (!this.isBlocksDragged) {
                return;
            }
            this.isBlocksDragged = false;

            this.model.updateSelectedBlocks();
        },

        onClickOnBlock: function(e) {
            e.stopPropagation();
            var blockModel = this.model.getBlockByPosition($(e.currentTarget).data("position"));
            if (e.ctrlKey == true) {
                blockModel.select();
                return;
            }

            this.blockMenuView.showAt(blockModel, e.pageX - this.getJquery().offset().left - 3, e.pageY - this.getJquery().offset().top - 3);
        },
        onClickOnContainer: function(e) {
            if (!this.model.selectedBlocks.isEmpty()) {
                this.model.selectedBlocks.empty();
                return;
            }

            var element = $(e.currentTarget)
            var grid = this.hzHeader.getGrid();
            var startDate = grid.getDateByPos(e.pageX);
            var position = element.data("position");

            var newBlockData = {
                "start" : startDate,
                "end" : startDate.clone()
            };

            this.model.addBlock(position, newBlockData);
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
            var numberOfDays = this.options.boundary.getNumberOfDays();
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;

            var blocksDiv = $("<div>", {
                "class": "planner-agregator",
                "css": {
                    "border" : 0,
                    "width" : (numberOfDays+1) * cellWidth + "px",
                    "background-size" : cellWidth + "px " +  (cellHeight)  + "px",
                    "background-position" : cellWidth + "px " +  (cellHeight + 1) + "px" }
                });

            this.setJquery(blocksDiv);
            this.startObserveModel();

            this.render();
        },
        render: function() {
            this.removeContent();

            this.agregatedRowView = new RowView(this.options, this.model.getAgregatedRow());
            this.appendJquery(this.agregatedRowView);

            var rowIterator = this.model.getIterator();
            while (rowIterator.hasNext()) {
                var rowModel = rowIterator.next();
                var rowView = new RowView(this.options, rowModel);

                this.appendJquery(rowView);
                this.contentArray.push(rowView);
            }
        },
        removeContent: function() {
            /* TODO: WORKAROUND bug with selected while toggeling */
            this.model.parent.selectedBlocks.empty();

            /* TODO:: removeContent refactoring */
            $(this.contentArray).each(function() {
                this.removeContent();
                this.destroyJquery();
                this.stopObserveModel();
            });

            if (this.agregatedRowView) {
                this.agregatedRowView.removeContent();
                this.agregatedRowView.destroyJquery();
                this.agregatedRowView.stopObserveModel();
            }

            this.contentArray = [];
        },
        update: function() {
            this.render();
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
                    "width": (this.numberOfDays+1) * cellWidth + "px"
                }
            });
            // TODO:: data method
            row.data("position", this.model.getPosition());

            this.setJquery(row);
            this.startObserveModel();

            this.render();

            if (!this.model.parent.expanded && this.model.order != -1) {
                this.hide();
            }
        },
        hide: function() {
            this.getJquery().css({
                "visibility": "hidden",
                "height" : 0,
                "padding" : 0,
            });
        },
        show: function() {
            this.getJquery().css({
                "visibility": "",
                "height": this.options.cellHeight + "px",
                "padding" : "",
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
            this.block = $("<div>", {
                "class": "planner-block"
            });

            this.setJquery(this.block);
            
            // duration
            this.textBlock = $("<div>", { "class": "planner-block-text" });
            this.textBlock.addClass("planner-nonselectable");
            this.getJquery().append(this.textBlock);
            
            this.render();
        },
        render: function() {
            var cellWidth = this.options.cellWidth;
            var cellHeight = this.options.cellHeight;
            var size = DateUtils.daysBetween(this.model.start(), this.model.end()) + 1;
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
            if (this.model.parent.order == -1 && !this.model.isAgregationSolid()) {
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
            /* TODO: user render to update status */
            //this.blockController.select();
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
        this.selectedBlocks = new SelectedBlocks();
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
                var blockList = row.getBlockList();

                blockList.push(blockData);
                row.setBlockList(blockList);
                row.notifyObservers();
            }

            agregator.updateAgregatedRow();
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
        update: function() {
            var agregatorIterator = this.getIterator();
            while (agregatorIterator.hasNext()) {
                var agregator = agregatorIterator.next();
                agregator.update();
            }
        },

        getNumberOfRows: function() {
            return this.data.length;
        },

        getIterator: function() {
            return new ArrayIterator(this.data);
        }
    });

    /**
     * AgregatorModel class
     */
    function AgregatorModel(parent, order, metadata, data) {
        this.parent = parent;
        this.options = this.parent.options;
        this.order = order;
        
        this.rowList = [];
        this.agregatedRow = new RowModel(this, -1, {}, []);

        this.minDate = undefined;
        this.maxDate = undefined;

        this.metadata = metadata
        this.setData(data);

        this.observerList = [];
        /* TODO: move to configuration part */
        this.expanded = false;
    }
    $.extend(AgregatorModel.prototype, {
        getWorkbench: function() {
            return this.parent;
        },
        getAgregatedRow: function() {
            return this.agregatedRow;
        },
        updateAgregatedRow: function() {
            this.agregatedRow.agregateBlocks();
            this.agregatedRow.notifyObservers();
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
            this.updateAgregatedRow();
        },
        getData: function() {
            return this.rowList;
        },
        getRow: function(order) {
            if (order == -1) {
                return this.agregatedRow;
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
            if (this.expanded) {
                return this.rowList.length + 1;
            }
            return 1;
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
                this.updateAgregatedRow();
            }
        },

        /* TODO: move to abstract model (create AbstractModel)*/
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
            observerIterator = new ArrayIterator(this.observerList);
            while (observerIterator.hasNext()) {
                var observer = observerIterator.next();
                observer.update();
            }
        },

        // TODO:: move to RowModel class
        getIterator: function() {
            return new ArrayIterator(this.rowList);
        }
    });

    /**
     *  RowModel class
     */
    function RowModel(parent, rowNum, metadata, blockList) {
        this.parent = parent;
        this.order = rowNum;

        this.needToUpdate = false;

        this.options = this.parent.parent.options;

        this.metadata = metadata;
        this.blockList = [];

        this.observerList = [];
        this.setBlockList(blockList);

        /*TODO: create subclass AgregatedRowModel */
        this.isAgregatorRow = (this.order == -1);
    }
    $.extend(RowModel.prototype, {
        setBlockList: function(blockList) {
            blockList = $.extend(true, [], blockList);
            blockList = this.prepareRowData(blockList);

            this.blockList = [];

            for (blockNum in blockList) {
                var block = new BlockModel(this, blockNum, blockList[blockNum]);
                this.blockList.push(block);
            }
            
            this.mergeBlocks();
        },
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
                agregator: this.parent.order
            };
        },

        update: function() {
            this.setBlockList(this.getBlockList());
            this.notifyObservers();
            this.needToUpdate = false;
        },
        
        getAgregator: function() {
            return this.parent;
        },
        
        getIterator: function() {
            return new ArrayIterator(this.blockList);
        },

        /* TODO: move to abstract model (create AbstractModel)*/
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
            observerIterator = new ArrayIterator(this.observerList);
            while (observerIterator.hasNext()) {
                var observer = observerIterator.next();
                observer.update();
            }
        },

        // help function
        prepareRowData: function(rowData) {
            var correctArr = [];
            /* TODO: ? move to a separete function */
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
                if (!this.options.expandBorder) {

                    if (rowData[i].start.compareTo(this.options.boundary.getLeft()) < 0
                        && rowData[i].end.compareTo(this.options.boundary.getLeft()) < 0) {
                        continue;
                    }
                    if (rowData[i].start.compareTo(this.options.boundary.getRight()) > 0
                        && rowData[i].end.compareTo(this.options.boundary.getRight()) > 0) {
                        continue;
                    }
                    if (rowData[i].start.compareTo(this.options.boundary.getLeft()) < 0) {
                        rowData[i].start = this.options.boundary.getLeft();
                    }
                    if (rowData[i].end.compareTo(this.options.boundary.getRight()) > 0) {
                        rowData[i].end = this.options.boundary.getRight();
                    }
                }

                /* calculate max/min dates  */
                if (!this.parent.minDate || this.parent.minDate.compareTo(rowData[i].start) >= 0) {
                    this.parent.minDate = rowData[i].start.clone();
                }
                if (!this.parent.maxDate || this.parent.maxDate.compareTo(rowData[i].end) <= 0) {
                    this.parent.maxDate = rowData[i].end.clone();
                }

                correctArr.push(rowData[i]);
            }
            /* TODO: ? remove verification ?*/
            if (correctArr.length < 1) {
                return correctArr;
            }

            /* change bundaries */
            if (this.options.expandBorder) {
                if (this.parent.minDate.compareTo(this.options.boundary.getLeft()) < 0) {
                    this.options.boundary.setLeft(this.parent.minDate);
                }
                if (this.parent.maxDate.compareTo(this.options.boundary.getRight()) > 0) {
                    this.options.boundary.setRight(this.parent.maxDate);
                }
            }
            return correctArr;
            
            /* merge crossed intervals */
            var mergedArr = this.mergeCrossedBlocks(correctArr);
            return mergedArr;
        },
        mergeBlocks: function() {
            this.blockList = this.sortBlockList(this.blockList);
            
            var block = false;
            var nextBlock = false;

            var blockIterator = this.getIterator();
            while (blockIterator.hasNext()) {
                if (!block) {
                    block = blockIterator.next();
                }

                if (blockIterator.hasNext()) {
                    nextBlock = blockIterator.next();
                } else {
                    break;
                }
                
                if (block.end().compareTo(nextBlock.end()) >= 0) {
                    nextBlock.remove();
                }
                else if (block.end().clone().addDays(1).compareTo(nextBlock.start()) >= 0) {
                    block.setEnd(nextBlock.end());
                    nextBlock.remove();
                }
                else {
                    block = nextBlock;
                } 
            } 
        },
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
            var block = false;
            var agregatorBlock = false;
            var order = 0;

            var blockIterator = new ArrayIterator(newBlockList);
            /* TODO: merge block duplication */ 
            while (blockIterator.hasNext()) {
                block = blockIterator.next();
                if (agregatorBlock && agregatorBlock.end().compareTo(block.end()) >= 0) {
                    agregatorBlock.blockData.agregatedBlocks.push(block);
                }
                else if (agregatorBlock && agregatorBlock.end().clone().addDays(1).compareTo(block.start()) >= 0) {
                    /* TODO: add 2 setter to update all the agregated blocks and just for agregator */
                    agregatorBlock.blockData.end = block.end().clone();
                    agregatorBlock.blockData.agregatedBlocks.push(block);
                }
                else {
                    var blockData = $.extend(true, {}, block.getBlockData());
                    blockData.start = blockData.start.clone();
                    blockData.end = blockData.end.clone(); 
                    
                    agregatorBlock = new BlockModel(this, order, blockData);
                    order++;
                    agregatorBlock.blockData.agregatedBlocks = [];
                    agregatorBlock.blockData.agregatedBlocks.push(block);
                    block.agregatorBlock = agregatorBlock;
                    
                    this.blockList.push(agregatorBlock);
                }
            }
        },
        sortBlockList: function(blockList) {
            blockList.sort(function(leftBlock, rightBlock) {
                return leftBlock.start().compareTo(rightBlock.start());
            });
            return blockList;
        }
    });

    /**
     * BlockModel class
     */
    function BlockModel(parent, blockNum, blockData) {
        this.parent = parent;
        /* TODO: add getter to model */
        this.options = this.parent.parent.parent.options;
        this.order = blockNum;
        this.blockData = blockData;

        this.blockData.start = DateUtils.convertToDate(this.blockData.start, this.options.dateFormat);
        this.blockData.end = DateUtils.convertToDate(this.blockData.end, this.options.dateFormat);

        /* calculate max/min dates  */
        if (!this.parent.minDate || this.parent.minDate.compareTo(this.start()) >= 0) {
            this.parent.minDate = this.start().clone();
        }
        if (!this.parent.maxDate || this.parent.maxDate.compareTo(this.end()) <= 0) {
            this.parent.maxDate = this.end().clone();
        }

        this.selected = false;
        
        this.left = 0;
        this.width = 0;

        this.observerList = [];
        
        this.agregatorBlock = false;

        /* HACK: set an agregator color */
        if (this.parent.isAgregatorRow) {
            this.blockData.color = "#CFE3BF";
        }
    }
    $.extend(BlockModel.prototype, {
        start: function() {
            return this.blockData.start;
        },
        setStart: function(date, format) {
            /*TODO: 
             * duplication isAgregatorSolid, setEnd
             * agregatorBlock functionality need to create a class
             */
            if (this.parent.order == -1) {
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
            this.parent.needToUpdate = true;
        },
        end: function() {
            return this.blockData.end;
        },
        setEnd: function(date, format) {
            /*TODO: 
             * duplication isAgregatorSolid, setStart
             * agregatorBlock functionality need to create a class
             */
            if (this.parent.order == -1) {
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
            this.parent.needToUpdate = true;
        },
        color: function() {
            return this.blockData.color;
        },

        /* TODO: ? think about adding the AgregatorBlockModel class ? */
        getAgregatedBlocks: function() {
            if (this.blockData.agregatedBlocks) {
                return this.blockData.agregatedBlocks;
            } else {
                return false;
            }
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
        getAgregatorBlock: function() {
            return this.agregatorBlock;
        },
        getRow: function() {
            return this.parent;
        },
        getPosition: function() {
            return {
                block: this.order,
                row: this.parent.order,
                agregator: this.parent.parent.order
            };
        },

        resize: function(left, width) {
            var deltaWidth = this.width ? width - this.width : this.width;
            var deltaLeft = left - this.left;

            this.width = width;
            this.left = left;

            if (deltaWidth == 0 && deltaLeft != 0)
            {
                this.drag(deltaLeft / this.options.cellWidth);
            }
            else if (deltaWidth != 0 && deltaLeft == 0 )
            {
                this.resizeRight(deltaWidth / this.options.cellWidth);
            }
            else if (deltaWidth != 0 && deltaLeft != 0)
            {
                this.resizeLeft((-1) * deltaWidth / this.options.cellWidth)
            }
        },
        stopResize: function() {
            this.resizedWidth = 0;
            this.resizedLeft = 0;
        },

        resizeLeft: function(days) {
            if (this.start().clone().addDays(days).compareTo(this.options.boundary.left) < 0) {
                this.blockData.start = this.options.boundary.left.clone();
                this.parent.needToUpdate = true;
                return;
            }
            
            if (this.start().clone().addDays(days).compareTo(this.end()) > 0) {

                // merge to agregator block borders
                /* TODO: 
                 * duplication
                 * getAgregatorBlock can be optimized
                 * optimize comparation
                 */
                var agregatorBlock = this.getAgregatorBlock();
                if (agregatorBlock) {
                    /* TODO: optimize comparation */
                    if (this.end().clone().addDays(days).compareTo(agregatorBlock.end()) <= 0) {
                        this.end().addDays(days);
                    } else {
                        this.blockData.end = agregatorBlock.end().clone();
                    }
                    
                    if (this.start().clone().addDays(days).compareTo(this.end()) > 0) {
                        this.blockData.start = this.end().clone();
                        this.parent.needToUpdate = true;
                        return;
                    }
                } else {
                    return;
                }
            }

            this.start().addDays(days);
            this.parent.needToUpdate = true;
        },
        resizeRight: function(days) {
            if (this.end().clone().addDays(days).compareTo(this.options.boundary.right) > 0) {
                this.blockData.end = this.options.boundary.right.clone();
                this.parent.needToUpdate = true;
                return;
            }
            
            if (this.end().clone().addDays(days).compareTo(this.start()) < 0) {

                // merge to agregator block borders
                /* TODO: 
                 * duplication
                 * getAgregatorBlock can be optimized
                 * optimize comparation
                 */
                var agregatorBlock = this.getAgregatorBlock();
                if (agregatorBlock) {
                    if (this.start().clone().addDays(days).compareTo(agregatorBlock.start()) >= 0) {
                        this.start().addDays(days);
                    } else {
                        this.blockData.start = agregatorBlock.start().clone();
                    }
                    
                    if (this.end().clone().addDays(days).compareTo(this.start()) < 0) {
                        this.blockData.end = this.start().clone();
                        this.parent.needToUpdate = true;
                        return;
                    }
                } else {
                    return;
                }
            }
            
            this.end().addDays(days);
            this.parent.needToUpdate = true;
        },
        drag: function(days) {
            /* TODO: optimize date comparation */
            if (this.start().clone().addDays(days).compareTo(this.options.boundary.left) < 0) {
                this.blockData.start = this.options.boundary.left.clone();
                this.parent.needToUpdate = true;
                return;
            }
            if (this.end().clone().addDays(days).compareTo(this.options.boundary.right) > 0) {
                this.blockData.end = this.options.boundary.right.clone();
                this.parent.needToUpdate = true;
                return;
            }

            this.start().addDays(days);
            this.end().addDays(days);
            this.parent.needToUpdate = true;
        },
        select: function() {
            /* TODO: add getter to model */
            var workbenchModel = this.parent.parent.parent;
            workbenchModel.selectedBlocks.addBlock(this);
            this.selected = true;
            this.notifyObservers();

            if (this.parent.isAgregatorRow) {
                /* TODO: add getter to model ? move to model part ? */
                var agregatorModel = this.parent.parent;

                var blockIterator = new ArrayIterator(this.blockData.agregatedBlocks);
                while(blockIterator.hasNext()) {
                    var block = blockIterator.next();

                    workbenchModel.selectedBlocks.addBlock(block);
                    block.selected = true;
                    block.notifyObservers();
                }
            }
        },
        unselect: function() {
            this.selected = false;
            this.notifyObservers();
        }, 
        remove: function() {
            /* TODO: ? move the metod to RowModel ?*/ 
            this.parent.blockList.splice($.inArray(this, this.parent.blockList), 1);
            this.parent.needToUpdate = true;
        },

        /* TODO: ?new class ? AgregatedBlock method */
        isAgregationSolid: function() {
            var agregatedBlocks = this.getAgregatedBlocks();

            if (!agregatedBlocks) {
                return false;
            }

            for (rowNum = 0; rowNum < this.parent.parent.rowList.length; rowNum++) {
                var positionIterator = new ArrayIterator(agregatedBlocks);
                var positionInRow = false;
                while (positionIterator.hasNext()) {
                    var position = positionIterator.next();

                    if (position.row == rowNum) {
                        positionInRow = position;
                    }
                }

                if (!positionInRow) {
                    return false;
                }

                var agregator = this.parent.parent;
                var row = agregator.getRow(rowNum);
                var block = row.getBlock(positionInRow.block);

                if ( !this.start().equals(block.start()) || !this.end().equals(block.end()) ) {
                    return false;
                }
            }

            return true;
        },
        /* TODO: move to abstract model (create AbstractModel)*/
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
            observerIterator = new ArrayIterator(this.observerList);
            while (observerIterator.hasNext()) {
                var observer = observerIterator.next();
                observer.update();
            }
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
                var workbenchModel = blockModel.parent.parent.parent;
                workbenchModel.deleteSelectedBlocks();
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
        execute: function(blockModel) {
            this.callback(blockModel);
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
    }
    $.extend(SelectedBlocks.prototype, {
        addBlock: function(block) {
            if (this.isSelected(block)) {
                return;
            }

            this.selectedBlocks.push(block);
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
            if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
            var count = 0, date = start.clone();
            while (date.compareTo(end) == -1) { count = count + 1; date.addDays(1); }
            return count;
        },
        convertToDate: function(date, format) {
            if (typeof date == "string") {
                date = Date.parseExact(date, format);
            }
            return date.clone();
        }
    };

})(jQuery);
