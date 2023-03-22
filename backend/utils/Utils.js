const configLoader = require('node-yaml-config');
const fs = require('fs');
const AWS = require('aws-sdk');

module.exports.setupEnvironment = (env) => {
    const content = configLoader.load('./env.yml', env);
    for (let key in content) {
        process.env[key] = content[key];
    }
};

module.exports.parseHttpEvent = (event) => {
    const httpData = event.requestContext.http;
    if (!event.body) {
        return [ null, httpData ];
    }

    return [ JSON.parse(event.body), httpData ];

};

module.exports.parseSnsEvent = (event, param) => {
    try {
        const message = JSON.parse(event.Records[0].Sns.Message);
        return param ? message[param] : message;
    } catch (err) {
        console.error(err);
    }
};

module.exports.httpResponse = (code, message) => {
    return {
        statusCode: code,
        body: JSON.stringify(message),
    };
};

module.exports.readFromFile = async (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) { reject(err); }
            resolve(JSON.parse(data));
        });
    });
};

module.exports.snsPublish = async (snsName, message) => {
    let sns = new AWS.SNS({
        region: process.env.REGION,
        accessKeyId: process.env.AWS_ACCESSKEYID,
        secretAccessKey: process.env.AWS_SECRETACCESSKEY,
    });

    return sns.publish({
        Message: JSON.stringify(message),
        TopicArn: `arn:aws:sns:${process.env.REGION}:${process.env.AWS_ACCOUNT_ID}:${snsName}`,
    }).promise();
};
