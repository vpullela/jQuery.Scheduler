var chartSelector = "#chart";
var workbenchMenuSelector = ".scheduler-context-menu.workbench-menu";
var blockMenuSelector = ".scheduler-context-menu.block-menu";
var contextMenuItemSelector = ".scheduler-context-menu-item";
var workbenchRullerSelector = ".scheduler-ruller";
var workbenchRowSelector = ".scheduler-row";
var blockSelector = ".scheduler-block";
var resizeRightSelector = ".scheduler-block > .ui-resizable-e";

var dateFormat = "DD/MM/YYYY HH:mm";

var utils = require('utils');

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

casper.getBlockData = function(position) {
    return casper.evaluate(function(selector, position) {
        return $(selector).scheduler("getBlockData", position);
    }, chartSelector, position);
};

casper.resizeBlock = function(position, leftDelta, widthDelta) {
    return casper.evaluate(function(selector, position, leftDelta, widthDelta) {
        return $(selector).scheduler("resizeBlockTesting", position, leftDelta, widthDelta);
    }, chartSelector, position, leftDelta, widthDelta);
};