/*
var AWS = require('aws-sdk');
var uuid = require('uuid');
var fs = require('fs');

// Enter copied or downloaded access ID and secret key here
const ID = 'AKIAWGNWHD77UXYXWAVU';
const SECRET = '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';

// The name of the bucket that you have created
const BUCKET_NAME = 'owlmedvideos';

const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

const params = {
    Bucket: BUCKET_NAME// File name you want to save as in S3
};

// Call S3 to list the buckets
s3.listObjects(params, function(err, data) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Success", data.Contents);

        for (let video in data.Contents) {
            // console.log(data.Contents[video].Key);
            // let keyValue = "" + data.Contents[video].Key.split(" ").join("+");
            let objectURL = "https://owlmedvideos.s3.amazonaws.com/" + data.Contents[video].Key.split(" ").join("+") //replaces space with +
            objectURL = objectURL.split("'").join("%27"); //replaces ' with url equivalent
            console.log(objectURL);
        }
    }
});


*/

