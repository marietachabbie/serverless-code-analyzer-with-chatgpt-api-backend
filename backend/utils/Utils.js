const configLoader = require('node-yaml-config');
const fs = require('fs');

module.exports.setupEnvironment = (env) => {
    const content = configLoader.load('./backend/env.yml', env);
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
