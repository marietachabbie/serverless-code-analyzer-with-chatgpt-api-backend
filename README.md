# Serverless Code Analyzer with ChatGPT API

Node.js serverless application that consists of several AWS Lambdas that analyse and/or optimise via ChatGPT API a code given by a user. Also stores in DataBase and provides statistics on what it was asked in the past.

Implemented Lambdas:

- NETCodeAnalysis
Configured to be triggered by HTTP request. Preprocesses a given code to ask for analysis and sends request to the ChatGPT API. Validates, processes and passes the received results to the VPCDataCollection lambda via SNS.

- NETCodeOptimisation
Configured to be triggered by HTTP request. Preprocesses a given code to ask for optimisation and sends request to the ChatGPT API. Validates, processes and passes the received results to the VPCDataCollection lambda via SNS.

- NETCodeComment
Configured to be triggered by HTTP request. Preprocesses a given code to ask for a technical documentation/comments on it and sends request to the ChatGPT API. Validates, processes and passes the received results to the VPCDataCollection lambda via SNS.

- VPCDataCollection
Configurde to triggered by SNS. Stores passed information in DataBase (Amazon RDS for PostgreSQL) associating the user with a token from frontend.

- VPCResultsPresentation
Configured to be triggered by HTTP request. Retrieves data from Database and passes to the request sender for a specific user with token.

- VPCStatisticsPresentation
Configured to be triggered by HTTP request. Retrieves data from Database and passes to the request sender for a statistics of requesting countries, feedbacks, programming languages that were analysed in the past, how many of users asked for optimisation, etc.

- VPCUserFeedback
Configured to be triggered by HTTP request to collect and store in Database user's feedback.
# OpenAI API documentation
https://platform.openai.com/docs/api-reference/chat

# Good articles to help implement, configure and deploy an application on AWS with Node.js
https://blog.appsignal.com/2022/03/23/build-serverless-apis-with-nodejs-and-aws-lambda.html

https://blog.logrocket.com/going-serverless-node-js-apps/
