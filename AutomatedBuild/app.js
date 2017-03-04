// Initialize clients
var AWS = require('aws-sdk');
var codebuild = new AWS.CodeBuild({
    apiVersion: '2016-10-06',
    region: process.env.REGION,
    maxRetries: process.env.MAX_RETRIES
});

var codePipeline = new AWS.CodePipeline({
    apiVersion: "2015-07-09",
    region: process.env.REGION,
    maxRetries: process.env.MAX_RETRIES
});

console.log('Loading');

exports.handler = function (event, context) {

    if (event != null) {
        console.log('event = ' + JSON.stringify(event));
    }
    else {
        console.log('No event object');

    }
    var jobId = event["CodePipeline.job"].id;

    var params = {
        projectName: process.env.TARGET_BUILD
    };

    codebuild.startBuild(params, function (err, data) {
        if (err) {
            console.log("Failed to kick build");
            console.log(JSON.stringify(err));
            putJobFailureResult(jobId, function (err) {
                context.fail(err, null);
            });

        } else {
            console.log("Successfully build kick");
            putJobSuccessResult(jobId, function (data) {
                context.done(null, data);
            });
        }
    });


};


function putJobSuccessResult(jobId, callback) {
    var params = {
        jobId: jobId
    };
    codePipeline.putJobSuccessResult(params, function (err, data) {
        if (err) {
            console.log("PutJobSuccessResult was failed, but its original task was succeeded. So we regard it as SUCCESS");
            console.log(JSON.stringify(err));
            callback(data);
        } else {
            console.log("PutJobSuccessResult was succeeded");
            callback(data);
        }
    });
};

function putJobFailureResult(jobId, error, callback) {
    var params = {
        jobId: jobId,
        failureDetails: {
            message: JSON.stringify(error),
            externalExecutionId: context.invokeid
        }
    };

    codePipeline.putJobFailureResult(params, function (err, data) {
        if (err) {
            console.log("PutJobFailureResult was failed.");
            console.log(JSON.stringify(err));
            callback(err);
        } else {
            console.log("PutJobFailureResult was succeeded.");
            callback(data);
        }
    });
};