
casper.test.begin("DOM structure", function(test) {
    casper.start(url).then(function() {
        test.assertSelectorExists(workbenchRowSelector, "existed: workbench row");
        test.assertSelectorExists(workbenchMenuSelector, "existed: workbench menu");
        test.assertSelectorExists(blockMenuSelector, "existed: block menu");
        test.assertSelectorExists(workbenchRullerSelector, "existed: workbench ruller");
    }).run(function() {
        test.done();
    });
});

casper.test.begin("Create Block On Click In Future", 8, function(test) { 
    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());

        var workbenchRowBounds = casper.getElementBounds(workbenchRowSelector);
        var blockStartDate = new Date(casper.getCurrentDate()).addDays(1);
        var offset = casper.getOffsetByDate(blockStartDate.toString(dateFormat));

        test.assertDoesntExist(blockSelector, "not existed: block");
        test.assertNotVisible(workbenchMenuSelector, "not visible: workbench menu");
        test.assertNotVisible(blockMenuSelector, "not visible: block menu");

        test.comment("-- click on workbench");
        casper.mouse.click(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );

        test.assertVisible(workbenchMenuSelector, "visible: workbench menu");
        test.assertNotVisible(blockMenuSelector, "not visible: block menu");

        test.comment('-- click on workbench menu -> add block');
        casper.click(workbenchMenuSelector + " > " + contextMenuItemSelector);

        test.assertNotVisible(workbenchMenuSelector, "not visible: workbench menu");
        test.assertExists(blockSelector, "existed: block");

        var blockInfo = casper.getElementAttribute(blockSelector, "title");
        var blockInfoBase = "Start:\t" + blockStartDate.toString(dateFormat) + "\nEnd:\t" + blockStartDate.clone().addDays(1).toString(dateFormat);

        test.assert(blockInfo === blockInfoBase, "correct: block info");
    }).run(function() {
        test.done();
    });
});

casper.test.begin("Create Block On Click In The Past", 6, function(test) { 
    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());

        var workbenchRowBounds = casper.getElementBounds(workbenchRowSelector);
        var blockStartDate = new Date(casper.getCurrentDate()).addDays(-1);
        var offset = casper.getOffsetByDate(blockStartDate.toString(dateFormat));

        test.assertDoesntExist(blockSelector, "not existed: block");
        test.assertNotVisible(workbenchMenuSelector, "not visible: workbench menu");
        test.assertNotVisible(blockMenuSelector, "not visible: block menu");

        test.comment("-- click on workbench");
        casper.mouse.click(
            offset,
            workbenchRowBounds.top + workbenchRowBounds.height/2
        );

        test.assertDoesntExist(blockSelector, "not existed: block");
        test.assertNotVisible(workbenchMenuSelector, "not visible: workbench menu");
        test.assertNotVisible(blockMenuSelector, "not visible: block menu");
    }).run(function() {
        test.done();
    });
});
