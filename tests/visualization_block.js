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

casper.test.begin("Test block days number", function(test) {

    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());

        var blockNumber = 1;
        var blockBounds = this.getElementBounds(blockSelector + ":nth-child("+blockNumber+")");
        var blockInfo = this.getElementAttribute(blockSelector + ":nth-child("+blockNumber+")", "title");
        var daysNumber = this.getHTML(blockSelector + ":nth-child("+blockNumber+") > " + schedulerBlockText);
        test.assertEquals(daysNumber, "1", "equal:\n" + blockInfo +"\nduration = 1 day");
        test.assertEquals(blockBounds.width, 9, "equal:\n" + blockInfo +"\nwidth = 1 day");

        blockNumber = 2
        blockBounds = this.getElementBounds(blockSelector + ":nth-child("+blockNumber+")");
        blockInfo = this.getElementAttribute(blockSelector + ":nth-child("+blockNumber+")", "title");
        daysNumber = this.getHTML(blockSelector + ":nth-child("+blockNumber+") > " + schedulerBlockText);
        test.assertEquals(daysNumber, "1", "equal:\n" + blockInfo +"\nduration = 1 day");
        test.assertEquals(blockBounds.width, 21, "equal:\n" + blockInfo +"\nwidth = 2 days");

        blockNumber = 3
        blockBounds = this.getElementBounds(blockSelector + ":nth-child("+blockNumber+")");
        blockInfo = this.getElementAttribute(blockSelector + ":nth-child("+blockNumber+")", "title");
        daysNumber = this.getHTML(blockSelector + ":nth-child("+blockNumber+") > " + schedulerBlockText);
        test.assertEquals(daysNumber, "1", "equal:\n" + blockInfo +"\nduration = 1 day");
        test.assertEquals(blockBounds.width, 9, "equal:\n" + blockInfo +"\nwidth = 1 days");

        blockNumber = 4
        blockBounds = this.getElementBounds(blockSelector + ":nth-child("+blockNumber+")");
        blockInfo = this.getElementAttribute(blockSelector + ":nth-child("+blockNumber+")", "title");
        daysNumber = this.getHTML(blockSelector + ":nth-child("+blockNumber+") > " + schedulerBlockText);
        test.assertEquals(daysNumber, "1", "equal:\n" + blockInfo +"\nduration = 1 day");
        test.assertEquals(blockBounds.width, 9, "equal:\n" + blockInfo +"\nwidth = 1 days");

    }).run(function() {
        test.done();
    });
});

casper.test.begin("Test block merging", function(test) {

    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());

        var blockNumber = 5
        var blockInfoBase = "Start:\t01/07/2013 01:00\nEnd:\t03/07/2013 01:00";
        var blockBounds = this.getElementBounds(blockSelector + ":nth-child("+blockNumber+")");
        var blockInfo = this.getElementAttribute(blockSelector + ":nth-child("+blockNumber+")", "title");
        var daysNumber = this.getHTML(blockSelector + ":nth-child("+blockNumber+") > " + schedulerBlockText);
        test.assertEquals(daysNumber, "2", "equal:\n" + blockInfo +"\nduration = 2 day");
        test.assertEquals(blockBounds.width, 33, "equal:\n" + blockInfo +"\nwidth = 3 days");
        test.assert(blockInfo === blockInfoBase, "correct: block info during merging");

        blockNumber = 6
        blockInfoBase = "Start:\t05/07/2013 09:00\nEnd:\t07/07/2013 09:00";
        blockBounds = this.getElementBounds(blockSelector + ":nth-child("+blockNumber+")");
        blockInfo = this.getElementAttribute(blockSelector + ":nth-child("+blockNumber+")", "title");
        daysNumber = this.getHTML(blockSelector + ":nth-child("+blockNumber+") > " + schedulerBlockText);
        test.assertEquals(daysNumber, "2", "equal:\n" + blockInfo +"\nduration = 2 day");
        test.assertEquals(blockBounds.width, 33, "equal:\n" + blockInfo +"\nwidth = 3 days");
        test.assert(blockInfo === blockInfoBase, "correct: block info during merging");

        blockNumber = 7
        blockInfoBase = "Start:\t09/07/2013 00:00\nEnd:\t10/07/2013 00:00";
        blockBounds = this.getElementBounds(blockSelector + ":nth-child("+blockNumber+")");
        blockInfo = this.getElementAttribute(blockSelector + ":nth-child("+blockNumber+")", "title");
        daysNumber = this.getHTML(blockSelector + ":nth-child("+blockNumber+") > " + schedulerBlockText);
        test.assertEquals(daysNumber, "1", "equal:\n" + blockInfo +"\nduration = 1 day");
        test.assertEquals(blockBounds.width, 9, "equal:\n" + blockInfo +"\nwidth = 1 days");
        test.assert(blockInfo === blockInfoBase, "correct: block info during merging");

        blockNumber = 8
        blockInfoBase = "Start:\t10/07/2013 09:00\nEnd:\t11/07/2013 09:00";
        blockBounds = this.getElementBounds(blockSelector + ":nth-child("+blockNumber+")");
        blockInfo = this.getElementAttribute(blockSelector + ":nth-child("+blockNumber+")", "title");
        daysNumber = this.getHTML(blockSelector + ":nth-child("+blockNumber+") > " + schedulerBlockText);
        test.assertEquals(daysNumber, "1", "equal:\n" + blockInfo +"\nduration = 1 day");
        test.assertEquals(blockBounds.width, 21, "equal:\n" + blockInfo +"\nwidth = 2 days");
        test.assert(blockInfo === blockInfoBase, "correct: block info during merging");

        blockNumber = 9
        blockInfoBase = "Start:\t13/07/2013 09:00\nEnd:\t14/07/2013 09:00";
        blockBounds = this.getElementBounds(blockSelector + ":nth-child("+blockNumber+")");
        blockInfo = this.getElementAttribute(blockSelector + ":nth-child("+blockNumber+")", "title");
        daysNumber = this.getHTML(blockSelector + ":nth-child("+blockNumber+") > " + schedulerBlockText);
        test.assertEquals(daysNumber, "1", "equal:\n" + blockInfo +"\nduration = 1 day");
        test.assertEquals(blockBounds.width, 21, "equal:\n" + blockInfo +"\nwidth = 2 days");
        test.assert(blockInfo === blockInfoBase, "correct: block info during merging");

        blockNumber = 10
        blockInfoBase = "Start:\t15/07/2013 00:00\nEnd:\t16/07/2013 00:00";
        blockBounds = this.getElementBounds(blockSelector + ":nth-child("+blockNumber+")");
        blockInfo = this.getElementAttribute(blockSelector + ":nth-child("+blockNumber+")", "title");
        daysNumber = this.getHTML(blockSelector + ":nth-child("+blockNumber+") > " + schedulerBlockText);
        test.assertEquals(daysNumber, "1", "equal:\n" + blockInfo +"\nduration = 1 day");
        test.assertEquals(blockBounds.width, 9, "equal:\n" + blockInfo +"\nwidth = 1 days");
        test.assert(blockInfo === blockInfoBase, "correct: block info during merging");

    }).run(function() {
        test.done();
    });
});
