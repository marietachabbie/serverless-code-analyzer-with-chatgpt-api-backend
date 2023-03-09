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
