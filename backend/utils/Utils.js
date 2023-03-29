const configLoader = require('node-yaml-config');
const fs = require('fs');
const AWS = require('aws-sdk');

/**
 *
 * @param {string} env
 * @returns
 */
module.exports.setupEnvironment = (env) => {
    const content = configLoader.load('./env.yml', env);
    for (let key in content) {
        process.env[key] = content[key];
    }
};

/**
 *
 * @param {object} event
 * @param {string} param
 * @returns {Array<object>}
 */
module.exports.parseHttpEvent = (event, param) => {
    const httpData = event.requestContext.http;
    if (!event.body) {
        return [ null, httpData ];
    }

    const body = param ? JSON.parse(event.body)[param] : JSON.parse(event.body);
    return [ body, httpData ];
};

/**
 *
 * @param {object} event
 * @param {string} param
 * @returns {object | any}
 */
module.exports.parseLambdaEvent = (event, param) => {
    try {
        let result = event;
        /* If the event was passed from local executor */
        if (event.Records?.[0].Sns.Message) {
            /* If lambda was triggered by SNS */
            const message = JSON.parse(event.Records[0].Sns.Message);
            result = param ? message[param] : message;
        } else if (event.body) {
            /* If lambda was triggered by http */
            result = param ? JSON.parse(event.body)[param] : JSON.parse(event.body);
        }

        return result;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

/**
 *
 * @param {number} code
 * @param {object} message
 * @returns {{statusCode: number, body: string}}
 */
module.exports.httpResponse = (code, message) => {
    return {
        statusCode: code,
        body: JSON.stringify(message),
    };
};

/**
 *
 * @param {string} snsName
 * @param {object} message
 * @returns
 */
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
