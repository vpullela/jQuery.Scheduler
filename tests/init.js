var workbenchMenuSelector = ".scheduler-context-menu.workbench-menu";
var blockMenuSelector = ".scheduler-context-menu.block-menu";
var contextMenuItemSelector = ".scheduler-context-menu-item";
var workbenchRuller = ".scheduler-ruller";
var workbenchRowSelector = ".scheduler-row";
var blockSelector = ".scheduler-block";
var chartSelector = "#chart";

var dateFormat = "dd/MM/yyyy HH:mm";

var utils = require('utils');
var url = "./pages/page1/index.html";

casper.options.viewportSize = {width: 1024, height: 768};

casper.getOffsetByDate = function(date) {
    return casper.evaluate(function(selector, date, dateFormat) {
        return $(selector).scheduler("getOffsetByDate", date, dateFormat);
    }, chartSelector, date, dateFormat);
};

casper.getCurrentDate = function() {
    return casper.evaluate(function(selector) {
        return $(selector).scheduler("getCurrentDate");
    }, chartSelector);
};