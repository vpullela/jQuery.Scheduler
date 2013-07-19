var url = "pages/page3/index.html";

casper.test.begin("Create Block Out Of Boundary Are not Presented", function(test) { 
    casper.start(url).then(function() {
        test.comment(casper.getCurrentUrl());
        test.comment("-- load data out of range via API");
        test.assertDoesntExist(blockSelector, "not existed: block");
    }).run(function() {
        test.done();
    });
});