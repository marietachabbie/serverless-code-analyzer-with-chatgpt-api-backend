module.exports.greet = async (event) => {
    return {
        statusCode: 200,
        body: `Hello, beautiful ${JSON.parse(event.body).name}!`,
    };
};
