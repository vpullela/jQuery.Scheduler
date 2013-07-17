var url = "pages/page2/index.html";

casper.test.begin("DOM structure", function(test) {
    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());

        test.assertSelectorExists(workbenchRowSelector, "existed: workbench row");
        test.assertSelectorExists(workbenchMenuSelector, "existed: workbench menu");
        test.assertSelectorExists(blockMenuSelector, "existed: block menu");
        test.assertSelectorExists(workbenchRullerSelector, "existed: workbench ruller");
        test.assertSelectorExists(blockSelector, "existed: block");
    }).run(function() {
        test.done();
    });
});

casper.test.begin("Mouse Move Block to right +5 days", function(test) {

    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());

        var workbenchRowBounds = casper.getElementBounds(workbenchRowSelector);
        var position = {
            agregator: 0,
            row: -1,
            block: 0
        };
        var blockAgregatorData = casper.getBlockData(position);

        var blockStart = moment(blockAgregatorData.start);
        var blockEnd = moment(blockAgregatorData.end)

        var resizeDaysNumber = 5;
        blockStart.add("days", resizeDaysNumber);
        blockEnd.add("days", resizeDaysNumber);
        var offset = casper.getOffsetByDate(blockEnd.format(dateFormat));

        test.comment("-- trying to move with casperjs mouseevents");
        casper.mouseEvent("mouseover", blockSelector);
        casper.mouseEvent("mousedown", blockSelector);
        casper.mouse.move(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );
        casper.mouse.up(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );
        casper.mouse.click(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );
        var blockInfo = this.getElementAttribute(blockSelector, "title");
        var blockInfoBase = "Start:\t" + blockStart.add("days", 1).format(dateFormat) + "\nEnd:\t" + blockEnd.add("days", 1).format(dateFormat);
        test.assert(blockInfo === blockInfoBase, "correct: block info during mouse moving");
    }).run(function() {
        test.done();
    });
});

casper.test.begin("Mouse Move Block to right -5 days", function(test) {

    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());

        var workbenchRowBounds = casper.getElementBounds(workbenchRowSelector);
        var position = {
            agregator: 0,
            row: -1,
            block: 0
        };
        var blockAgregatorData = casper.getBlockData(position);

        var blockStart = moment(blockAgregatorData.start);
        var blockEnd = moment(blockAgregatorData.end)

        var resizeDaysNumber = -5;
        blockStart.add("days", resizeDaysNumber);
        blockEnd.add("days", resizeDaysNumber);
        var offset = casper.getOffsetByDate(blockEnd.format(dateFormat));

        test.comment("-- trying to move with casperjs mouseevents");
        casper.mouseEvent("mouseover", blockSelector);
        casper.mouseEvent("mousedown", blockSelector);
        casper.mouse.move(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );
        casper.mouse.up(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );
        casper.mouse.click(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );
        var blockInfo = this.getElementAttribute(blockSelector, "title");
        var blockInfoBase = "Start:\t" + blockStart.add("days", 1).format(dateFormat) + "\nEnd:\t" + blockEnd.add("days", 1).format(dateFormat);
        test.assert(blockInfo === blockInfoBase, "correct: block info during mouse moving");
    }).run(function() {
        test.done();
    });
});


casper.test.begin("Mouse Move Block into past", function(test) {

    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());

        var workbenchRowBounds = casper.getElementBounds(workbenchRowSelector);
        var position = {
            agregator: 0,
            row: -1,
            block: 0
        };
        var blockAgregatorData = casper.getBlockData(position);

        var blockStart = moment(blockAgregatorData.start);
        var blockEnd = moment(blockAgregatorData.end)

        var currentDate = casper.getCurrentDate();
        utils.dump(currentDate);


        var resizeDaysNumber = -5;
        blockStart.add("days", resizeDaysNumber);
        blockEnd.add("days", resizeDaysNumber);
        var offset = casper.getOffsetByDate(blockEnd.format(dateFormat));

        test.comment("-- trying to move with casperjs mouseevents");
        casper.mouseEvent("mouseover", blockSelector);
        casper.mouseEvent("mousedown", blockSelector);
        casper.mouse.move(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );
        casper.mouse.up(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );
        casper.mouse.click(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );
        var blockInfo = this.getElementAttribute(blockSelector, "title");
        var blockInfoBase = "Start:\t" + blockStart.add("days", 1).format(dateFormat) + "\nEnd:\t" + blockEnd.add("days", 1).format(dateFormat);
        test.assert(blockInfo === blockInfoBase, "correct: block info during mouse moving");
    }).run(function() {
        test.done();
    });
});