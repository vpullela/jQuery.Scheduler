var schedulerData = [
    {
        metadata: { 
            id : 1,
            name: "Feature 1 Feature Feature Feature Feature",
            boundary: {left: "2012-06-12 00:00", right :"2016-06-25 00:00" },
            link: "#"
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [{ start: "2013-06-03 12:00", end: "2013-06-05 11:00" }, { start: "2013-06-08 00:00", end: "2013-06-10 00:00" }, { start: "2013-06-09 00:00", end: "2013-06-12 00:00" }]
            },
            {
                metadata: { name: "Sub 2" },
                data: [ { start: "2013-06-07 00:00", end: "2013-06-09 00:00" }, { start: "2013-06-15 03:00", end: "2013-06-16 01:00" }, {start: "2013-06-17 10:00", end: "2013-06-18 18:00"}]
            }            
        ]
    }, 
    {
        metadata: {
            id : 2,
            name: "Feature 2"
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [{ start: "2013-06-03 00:00", end: "2013-06-05 00:00" }, { start: "2013-06-08 00:00", end: "2013-06-10 00:00" }]
            }
        ]
    }, 
    {
        metadata: {
            id : 3,
            name: "Feature 3", boundary: {right :"2013-06-24 00:00" }
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [ { start: "2013-06-07 00:00", end: "2013-06-09 00:00" }]
            }            
        ]
    }, 
    {
        metadata: {
            name: "Feature 4"
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [ { start: "2013-06-07 00:00", end: "2013-06-09 00:00" }]
            }            
        ]
    },
    {
        metadata: {
            name: "Feature 5"
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [ { start: "2013-06-07 00:00", end: "2013-06-09 00:00" }]
            }            
        ]
    }, 
    {
        metadata: {
            name: "Feature 6"
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [ { start: "2013-06-07 00:00", end: "2013-06-09 00:00" }]
            }            
        ]
    }, 
    {
        metadata: {
            name: "Feature 7"
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [ { start: "2013-06-07 00:00", end: "2013-06-09 00:00", color: "#f0f0f0" }]
            }            
        ]
    }, 
    {
        metadata: {
            name: "Feature 8", boundary: {left :"2013-06-24 00:00" }
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [ { start: "2013-06-07 00:00", end: "2013-06-09 00:00" } ]
            }
        ]
    }
];

var updateData = [
    {
        metafilter: {id : 1},
        data: [{ start: "2013-06-13 00:00", end: "2013-06-17 00:00" }, { start: "2013-06-18 00:00", end: "2013-06-20 00:00" }]
    }, 
];
var testData = false;
