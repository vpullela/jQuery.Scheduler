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

        var blockStart = new Date(blockAgregatorData.start);
        var blockEnd = new Date(blockAgregatorData.end)

        var resizeDaysNumber = 5;
        blockStart.addDays(resizeDaysNumber);
        blockEnd.addDays(resizeDaysNumber);
        var offset = casper.getOffsetByDate(blockEnd.toString(dateFormat));

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
        var blockInfoBase = "Start:\t" + blockStart.addDays(1).toString(dateFormat) + "\nEnd:\t" + blockEnd.addDays(1).toString(dateFormat);
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

        var blockStart = new Date(blockAgregatorData.start);
        var blockEnd = new Date(blockAgregatorData.end)

        var resizeDaysNumber = -5;
        blockStart.addDays(resizeDaysNumber);
        blockEnd.addDays(resizeDaysNumber);
        var offset = casper.getOffsetByDate(blockEnd.toString(dateFormat));

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
        var blockInfoBase = "Start:\t" + blockStart.addDays(1).toString(dateFormat) + "\nEnd:\t" + blockEnd.addDays(1).toString(dateFormat);
        test.assert(blockInfo === blockInfoBase, "correct: block info during mouse moving");
    }).run(function() {
        test.done();
    });
});


casper.test.begin("Mouse Move Block to into past", function(test) {

    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());

        var workbenchRowBounds = casper.getElementBounds(workbenchRowSelector);
        var position = {
            agregator: 0,
            row: -1,
            block: 0
        };
        var blockAgregatorData = casper.getBlockData(position);

        var blockStart = new Date(blockAgregatorData.start);
        var blockEnd = new Date(blockAgregatorData.end)

        var currentDate = casper.getCurrentDate();
        utils.dump(currentDate);


        var resizeDaysNumber = -5;
        blockStart.addDays(resizeDaysNumber);
        blockEnd.addDays(resizeDaysNumber);
        var offset = casper.getOffsetByDate(blockEnd.toString(dateFormat));

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
        var blockInfoBase = "Start:\t" + blockStart.addDays(1).toString(dateFormat) + "\nEnd:\t" + blockEnd.addDays(1).toString(dateFormat);
        test.assert(blockInfo === blockInfoBase, "correct: block info during mouse moving");
    }).run(function() {
        test.done();
    });
});