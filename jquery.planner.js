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
        var left = new Date();
        var right = left.clone().addDays(minDays);
        if (options.boundary && options.boudary.left) {
            left = DateUtils.convertToDate(options.boundary.left, this.options.dateFormat);
        }
        if (options.boundary && options.boudary.right) {
            right = DateUtils.convertToDate(options.boundary.right, this.options.dateFormat);
        }
        options.boundary = new Boundary(left, right, minDays);

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
            this.options.boundary.setMinDays(Math.floor(this.options.rowWidth()/this.options.cellWidth));

            this.slideView.render();

            this.widget._trigger("onclickonzoomout", event, {test: 1});
        },

        onClickOnZoomIn: function() {
            this.options.cellWidth++;
            this.options.boundary.setMinDays(Math.floor(this.options.rowWidth()/this.options.cellWidth));

            this.slideView.render();
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

        setBoundaries: function(boundary) {
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
            this.getJquery().append(zoomIn);
            this.getJquery().append(zoomOut);
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
        },

        render: function() {
            this.removeContent();

            var hzHeader = new HzHeaderView(this.options, this.model);
            var workbenchView = new WorkbenchView(this.options, this.model, hzHeader);

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

            this.contentArray.push(hzHeader);
            this.contentArray.push(workbenchView);

            this.appendJquery(hzHeader);
            this.ganttViewBody.append(workbenchView.getJquery());
            this.ganttViewBody.append(this.unavailableDiv);
            this.getJquery().append(this.ganttViewBody);
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
        this.resizedWidth = 0;
        this.resizedLeft = 0;

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
            var resizedBlock = ui.helper;
            resizedBlock.css("position", "relative"); // revert default position

            /* TODO: fix duplication */
            var blockView = this.getBlockView(resizedBlock.data("position"));
            blockView.blockController.select();

            var blockIterator = this.model.selectedBlocks.getIterator();
            while (blockIterator.hasNext()) {
                var block = blockIterator.next().getJquery();

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

                block.css({
                    position: "absolute",
                    top: block.position().top,
                    left: block.position().left,
                });
            }

            this.resizedWidth = resizedBlock.width() - 2;
            this.resizedLeft = resizedBlock.position().left;
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

            var blockIterator = this.model.selectedBlocks.getIterator();
            while (blockIterator.hasNext()) {
                var block = blockIterator.next().getJquery();

                /** workaround: elimination double width calculation  */
                if (block.data("position") == resizedBlock.data("position")) {
                    continue;
                }
                var newLeft = block.position().left + left;
                var newWidth = block.width() + diff + 2;
                if (newWidth > 0) {
                    block.css({
                        left: newLeft,
                        width: newWidth,
                    });
                }
            }
        },
        onResizeBlockStop: function(e, ui) {
            /* TODO: ?duplication onDragBlockStop */
            var grid = this.hzHeader.getGrid();
            var blockIterator = this.model.selectedBlocks.getIterator();
            while (blockIterator.hasNext()) {
                var block = blockIterator.next().getJquery();
                block.next().remove();
                block.data("interval", this.calculateDates(block, grid));
            }

            this.model.updateWithSelectedBlocks();
        },

        onDragBlockStart: function(e, ui) {
            /* EMPTY */
        },
        onDragBlock: function(e, ui) {
            var draggedBlock = ui.helper;
            var blockLeft = parseInt(draggedBlock.css("left"), 10) || 0;

            if (!this.isBlocksDragged && blockLeft != ui.position.left) {
                this.isBlocksDragged = true;

                /* TODO: fix duplication onResize and onClick */
                var blockView = this.getBlockView(draggedBlock.data("position"));
                blockView.blockController.select();
            }

            if (this.isBlocksDragged) {
                var blockIterator = this.model.selectedBlocks.getIterator();
                while (blockIterator.hasNext()) {
                    var block = blockIterator.next().getJquery();

                    block.css({
                        left: ui.position.left
                    });
                }
            }
        },
        onDragBlockStop: function(e, ui) {
            if (!this.isBlocksDragged) {
                return;
            }
            this.isBlocksDragged = false;

            /* TODO:: add onScrollStop - grid calculation */
            var grid = this.hzHeader.getGrid();
            var blockIterator = this.model.selectedBlocks.getIterator();
            while (blockIterator.hasNext()) {
                var block = blockIterator.next().getJquery();
                block.data("interval", this.calculateDates(block, grid));
            }

            this.model.updateWithSelectedBlocks();
        },

        onClickOnBlock: function(e) {
            e.stopPropagation();
            
            /* TODO: fix duplicetion */
            var blockView = this.getBlockView($(e.currentTarget).data("position"));
            blockView.blockController.select();
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
                "end" : startDate
            };

            this.model.addBlock(position, newBlockData);
        },

        getBlockView: function(position) {
            var agregatorView = this.contentArray[position.agregator];
            var rowView = undefined;

            /* TODO:: ?search by Model Order and move agregatedRowView in content array? */
            if (position.row == -1) {
                rowView = agregatorView.agregatedRowView;
            } else {
                rowView = agregatorView.contentArray[position.row];
            }
            var blockView = rowView.contentArray[position.block];
            return blockView;
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

        /* check if block is agregator*/
        if (model.parent.order == -1) {
            this.blockController = new BlockAgregatorController(this, model);
        } else {
            this.blockController = new BlockController(this, model);
        }

        this.startObserveModel();

        this._init();
    }
    BlockView.prototype = Object.create(AbstractView.prototype);

    $.extend(BlockView.prototype, {
        _init: function() {
            this.cellWidth = this.options.cellWidth;

            var cellHeight = this.options.cellHeight;
            var size = DateUtils.daysBetween(this.model.start(), this.model.end()) + 1;
            var offset = DateUtils.daysBetween(this.model.getPreviousBlockEnd(), this.model.start());

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
            if (this.model.color()) {
                block.css("background-color", this.model.color());
            }

            // TODO:: data method
            block.data("position", this.model.getPosition());

            // duration
            var textBlock = $("<div>", { "class": "planner-block-text" }).text(size);
            textBlock.addClass("planner-nonselectable");
            block.append(textBlock);

            this.setJquery(block);
        },
        update:  function() {
            /* TODO: user render to update status */
            this.blockController.select();
        }
    });

    /**
     * BlockController class
     */
    function BlockController(blockView, blockModel) {
        this.blockModel = blockModel;
        this.blockView = blockView;
    }

    $.extend(BlockController.prototype, {
        select: function() {
            /* TODO: add getter to model */
            var workbenchModel = this.blockModel.parent.parent.parent;
            workbenchModel.selectedBlocks.addBlock(this.blockView);
        }
    });

    /**
     * BlockAgregatorController class
     */
    function BlockAgregatorController(blockView, blockModel) {
        this.blockModel = blockModel;
        this.blockView = blockView;
    }

    $.extend(BlockAgregatorController.prototype, {
        select: function() {
            /* TODO: add getter to model */
            var workbenchModel = this.blockModel.parent.parent.parent;
            workbenchModel.selectedBlocks.addBlock(this.blockView);
            
            /* TODO: add getter to model */
            var agregatorModel = this.blockModel.parent.parent;
            var positionIterator = new ArrayIterator(this.blockModel.blockData.agregatedBlocks);

            while(positionIterator.hasNext()) {
                var position = positionIterator.next();
                var rowModel = agregatorModel.getRow(position.row);
                var blockModel = rowModel.getBlock(position.block);

                blockModel.notifyObservers();
            }
        }
    });


    /**
     * WorkbenchModel class
     */
    function WorkbenchModel(options) {
        this.options = options;
        this.data = [];

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

        addBlock: function(position, blockData) {
            var agregator = this.getAgregator(position.agregator);
            /*TODO: optimize if statement */
            if (position.row == -1) {
                var rowIterator = agregator.getIterator();
                while (rowIterator.hasNext()) {
                    var row = rowIterator.next();
                    var blockList = row.getBlockList();

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
        updateWithSelectedBlocks: function() {
            var blockListBuffer = {
                rowList: [],
                addBlockList: function(key, row) {
                    var presenredRow = this.getBlockList(key);
                    if (presenredRow === false) {
                        this.rowList.push({key: key, row: row});
                    } else {
                        presenredRow = row;
                    }
                },
                getBlockList: function(key) {
                    for (var index in this.rowList) {
                        currentKey = this.rowList[index].key;
                        if (key.agregator == currentKey.agregator && key.row == currentKey.row) {
                            return this.rowList[index].row;
                        }
                    }
                    return false;
                },
                getIterator: function() {
                    return new ArrayIterator(this.rowList);
                }
            };

            var selectedBlockIterator = this.selectedBlocks.getIterator();
            while (selectedBlockIterator.hasNext()) {
                selectedBlock = selectedBlockIterator.next().getJquery();

                var position = selectedBlock.data("position");
                var interval = selectedBlock.data("interval");
                var key = {agregator: position.agregator, row: position.row};

                var blockList = blockListBuffer.getBlockList(key);

                if (blockList === false) {
                    var agregator = this.getAgregator(position.agregator);
                    var row = agregator.getRow(position.row);
                    blockList = row.getBlockList();
                }

                var block = blockList[position.block];
                block = $.extend(block, interval);
                blockListBuffer.addBlockList(key, blockList);
            }
            this.selectedBlocks.empty();

            var blockListIterator = blockListBuffer.getIterator();
            while (blockListIterator.hasNext()) {
                blockList = blockListIterator.next();

                var agregator = this.getAgregator(blockList.key.agregator);
                var row = agregator.getRow(blockList.key.row);
                row.setBlockList(blockList.row);
                row.notifyObservers();

                /*TODO:: remove agregator update dupliction */
                agregator.updateAgregatedRow();
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
        getAgregatedRow: function() {
            return this.agregatedRow;
        },
        updateAgregatedRow: function() {
            var blockList = [];
            var rowIterator = this.getIterator();
            while (rowIterator.hasNext()) {
                var rowModel = rowIterator.next();
                var blockIterator = rowModel.getIterator();
                while (blockIterator.hasNext()) {
                    var block = blockIterator.next();
                    blockList.push({start: block.start(), end: block.end(), position: block.getPosition()});
                }
            }

            this.agregatedRow.setBlockList(blockList);
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
            if (this.isAgregatorRow) {
                blockList = this.mergeCrossedBlocks(blockList);
            } else {
                blockList = $.extend(true, [], blockList);
                blockList = this.prepareRowData(blockList);
            }

            this.blockList = [];
            var previousBlockEnd = this.parent.options.boundary.getLeft(); // first day in row
            for (blockNum in blockList) {
                var block = new BlockModel(this, blockNum, blockList[blockNum], previousBlockEnd);
                this.blockList.push(block);
                previousBlockEnd = block.end().clone().addDays(1);
            }
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

        getPosition: function() {
            return {
                row: this.order,
                agregator: this.parent.order
            };
        },

        getIterator: function() {
            return new ArrayIterator(this.blockList);
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
                    this.parent.minDate = rowData[i].start;
                }
                if (!this.parent.maxDate || this.parent.maxDate.compareTo(rowData[i].end) <= 0) {
                    this.parent.maxDate = rowData[i].end;
                }

                correctArr.push(rowData[i]);
            }

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
            /* merge crossed intervals */
            var mergedArr = this.mergeCrossedBlocks(correctArr);
            return mergedArr;
        },
        mergeCrossedBlocks: function(blockList) {
            /* (TODO: function can be optimized) */

            blockList = this.sortBlockList(blockList);

            var currentBlock = blockList[0];

            if (this.isAgregatorRow) {
                currentBlock.agregatedBlocks = [];
                currentBlock.agregatedBlocks.push(currentBlock.position);
            }

            var mergedArr = [];
            for (var i=1; i < blockList.length; i++) {
                var nextBlock = blockList[i];
                var currentStartDate = currentBlock.start;
                var currentEndDate = currentBlock.end;
                var nextStartDate = nextBlock.start;
                var nextEndDate = nextBlock.end;

                if (currentEndDate.compareTo(nextEndDate) >= 0) {
                    if (this.isAgregatorRow) {
                        currentBlock.agregatedBlocks.push(nextBlock.position);
                    }
                    continue;
                }
                if (currentEndDate.clone().addDays(1).compareTo(nextStartDate) >= 0) { // add 1 day to merge neighbors
                    if (this.isAgregatorRow) {
                        currentBlock.agregatedBlocks.push(nextBlock.position);
                    }
                    currentBlock.end = nextBlock.end;
                    continue;
                }
                mergedArr.push(currentBlock);
                currentBlock = nextBlock;

                if (this.isAgregatorRow) {
                    currentBlock.agregatedBlocks = [];
                    currentBlock.agregatedBlocks.push(nextBlock.position);
                }
            }
            mergedArr.push(currentBlock);

            return mergedArr;
        },
        sortBlockList: function(blockList) {
            blockList.sort(function(leftBlock, rightBlock) {
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
            return blockList;
        }
    });

    /**
     * BlockModel class
     */
    function BlockModel(parent, blockNum, blockData, previousBlockEnd) {
        this.parent = parent;
        /* TODO: add getter to model */
        this.options = this.parent.parent.parent.options;
        this.order = blockNum;
        this.blockData = blockData;

        this.observerList = [];
        /* first day in row if not set */
        this.previousBlockEnd = previousBlockEnd || this.parent.parent.options.boundary.getLeft();

        /* HACK: set an agregator color */
        if (this.parent.isAgregatorRow) {
            this.blockData.color = "#CFE3BF";
        }
    }
    $.extend(BlockModel.prototype, {
        start: function() {
            return this.blockData.start;
        },
        end: function() {
            return this.blockData.end;
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
        setBlockData: function(blockData) {
            this.blockData = blockData;
        },
        getPreviousBlockEnd: function() {
            return this.previousBlockEnd;
        },

        getPosition: function() {
            return {
                block: this.order,
                row: this.parent.order,
                agregator: this.parent.parent.order
            };
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

            block.getJquery().addClass("selected");
            this.selectedBlocks.push(block);
        },

        isSelected: function(block) {
            var blockIterator = this.getIterator();
            while (blockIterator.hasNext()) {
                /*TODO: redo verification using model data */
                selectedBlock = blockIterator.next().getJquery();

                if (selectedBlock.data("position") == block.getJquery().data("position")) {
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
                selectedBlock = blockIterator.next().getJquery();
                selectedBlock.removeClass("selected");
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
            this.rigth = right;
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
            return date;
        }
    };

})(jQuery);
