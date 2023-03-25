const configLoader = require('node-yaml-config');
const fs = require('fs');
const AWS = require('aws-sdk');

module.exports.setupEnvironment = (env) => {
    const content = configLoader.load('./env.yml', env);
    for (let key in content) {
        process.env[key] = content[key];
    }
};

module.exports.lambdaFunctionExecutor = async (lambda, event) => {
    const start = Date.now();
    const instance = new lambda();
    await instance.execute(event);
    console.log(`${lambda.name} execution done. It took ${Date.now() - start} miliseconds`);
};

module.exports.parseHttpEvent = (event, param) => {
    const httpData = event.requestContext.http;
    if (!event.body) {
        return [ null, httpData ];
    }

    const body = param ? JSON.parse(event.body)[param] : JSON.parse(event.body);
    return [ body, httpData ];
};

module.exports.parseLambdaEvent = (event, param) => {
    try {
        let result = event;
        if (event.Records?.[0].Sns.Message) {
            const message = JSON.parse(event.Records[0].Sns.Message);
            result = param ? message[param] : message;
        } else if (event.body) {
            result = param ? JSON.parse(event.body)[param] : JSON.parse(event.body);
        }

        return result;
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
