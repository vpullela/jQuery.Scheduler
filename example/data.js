var schedulerData = [
    {
        metadata: { 
            id : 1,
            name: "Feature 1 Feature Feature Feature Feature",
            boundary: {left: "2012-06-12", right :"2016-06-25" },
            link: "#"
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [{ start: "2013-06-03", end: "2013-06-05" }, { start: "2013-06-08", end: "2013-06-10" }, { start: "2013-06-09", end: "2013-06-12" }]
            },
            {
                metadata: { name: "Sub 2" },
                data: [ { start: "2013-06-07", end: "2013-06-09" }, { start: "2013-06-15", end: "2013-06-16" }]
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
                data: [{ start: "2013-06-03", end: "2013-06-05" }, { start: "2013-06-08", end: "2013-06-10" }]
            }
        ]
    }, 
    {
        metadata: {
            id : 3,
            name: "Feature 3", boundary: {right :"2013-06-24" }
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [ { start: "2013-06-07", end: "2013-06-09" }]
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
                data: [ { start: "2013-06-07", end: "2013-06-09" }]
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
                data: [ { start: "2013-06-07", end: "2013-06-09" }]
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
                data: [ { start: "2013-06-07", end: "2013-06-09" }]
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
                data: [ { start: "2013-06-07", end: "2013-06-09", color: "#f0f0f0" }]
            }            
        ]
    }, 
    {
        metadata: {
            name: "Feature 8"
        },
        data: [
            {
                metadata: { name: "Sub 1" },
                data: [ { start: "2013-06-07", end: "2013-06-09", color: "#f0f0f0" }]
            }            
        ]
    }
];

var updateData = [
    {
        metafilter: {id : 1},
        data: [{ start: "2013-06-13", end: "2013-06-17" }, { start: "2013-06-18", end: "2013-06-20" }]
    }, 
];
var testData = false;
