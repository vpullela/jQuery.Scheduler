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

casper.test.begin("Mouse Resize Block to right +5 days", function(test) {

    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());

        test.assertDoesntExist(resizeRightSelector, "not existed: resize right");
        test.comment("-- mouse over block");
        casper.mouseEvent("mouseover", blockSelector);
        test.assertSelectorExists(resizeRightSelector, "existed: resize right");

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
        blockEnd.addDays(resizeDaysNumber);
        var offset = casper.getOffsetByDate(blockEnd.toString(dateFormat));

        test.comment("-- trying to resize with casperjs mouseevents");
        casper.mouseEvent("mouseover", resizeRightSelector);
        casper.mouseEvent("mousedown", resizeRightSelector);
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
        var blockInfoBase = "Start:\t" + blockStart.toString(dateFormat) + "\nEnd:\t" + blockEnd.toString(dateFormat);
        test.assert(blockInfo === blockInfoBase, "correct: block info during mouse resizing");
    }).run(function() {
        test.done();
    });
});

casper.test.begin("API Resize Block to right +5 days", function(test) {

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
        blockEnd.addDays(resizeDaysNumber);
        var offset = casper.getOffsetByDate(blockEnd.toString(dateFormat));

        blockInfo =  casper.getElementInfo(blockSelector);
        test.comment("-- (workaround) resize block using resizeBlockTesting function");
        casper.resizeBlock(position, 0, offset-blockInfo.x-blockInfo.width);

        var blockInfo = this.getElementAttribute(blockSelector, "title");
        var blockInfoBase = "Start:\t" + blockStart.toString(dateFormat) + "\nEnd:\t" + blockEnd.toString(dateFormat);
        test.assert(blockInfo === blockInfoBase, "correct: block info during api resizing");

    }).run(function() {
        test.done();
    });
});