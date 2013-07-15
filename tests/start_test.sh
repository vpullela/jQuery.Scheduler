#!/bin/sh

#--xunit=<filename>       export test suite results in a xUnit XML file
#--direct                 output log messages directly to the console
#--log-level=<logLevel>   set the logging level (see the related section)
#--includes=foo.js,bar.js include the foo.js and bar.js files before each test file execution
#--pre=pre-test.js        add the tests contained in pre-test.js before executing the test suite
#--post=post-test.js      add the tests contained in post-test.js after having executed the whole test suite
#--fail-fast              terminate the current test suite as soon as a first failure is encountered. 

casperjs test --includes=\
../lib/jquery-1.5.1.min.js,\
../lib/jquery-ui-1.8.14.custom.min.js,\
../lib/moment.min.js,\
../jquery.scheduler.js,\
init.js add_block.js resize_block.js move_block.js