var url = "pages/page4/index.html";

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

casper.test.begin("Test days numner", function(test) {

    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());


        var blockBounds = this.getElementBounds(blockSelector + ":nth-child(1)");
        var blockInfo = this.getElementAttribute(blockSelector + ":nth-child(1)", "title");
        var daysNumber = this.getHTML(blockSelector + ":nth-child(1) > " + schedulerBlockText);
        test.assertEquals(daysNumber, "1", "equal:\n" + blockInfo +"\nduration = 1 day");
        test.assertEquals(blockBounds.width, 9, "equal:\n" + blockInfo +"\nwidth = 1 day");

        blockBounds = this.getElementBounds(blockSelector + ":nth-child(2)");
        blockInfo = this.getElementAttribute(blockSelector + ":nth-child(2)", "title");
        daysNumber = this.getHTML(blockSelector + ":nth-child(2) > " + schedulerBlockText);
        test.assertEquals(daysNumber, "1", "equal:\n" + blockInfo +"\nduration = 1 day");
        test.assertEquals(blockBounds.width, 21, "equal:\n" + blockInfo +"\nwidth = 2 days");

        var blockInfoBase = "Start:\t17/06/2013 01:00\nEnd:\t19/06/2013 01:00";
        blockBounds = this.getElementBounds(blockSelector + ":nth-child(3)");
        blockInfo = this.getElementAttribute(blockSelector + ":nth-child(3)", "title");
        daysNumber = this.getHTML(blockSelector + ":nth-child(3) > " + schedulerBlockText);
        test.assertEquals(daysNumber, "2", "equal:\n" + blockInfo +"\nduration = 2 day");
        test.assertEquals(blockBounds.width, 33, "equal:\n" + blockInfo +"\nwidth = 3 days");
        test.assert(blockInfo === blockInfoBase, "correct: block info during merging");

    }).run(function() {
        test.done();
    });
});