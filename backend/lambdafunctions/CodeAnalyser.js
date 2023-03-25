const { Configuration, OpenAIApi } = require('openai');
const geoip = require('geoip-lite');

const Utils = require('../utils/Utils');
const CONSTANTS = require('../utils/Constants');
const DataCollector = require('./DataCollector');

class CodeAnalyser {
    async execute(event) {
        const [ body, httpData ] = Utils.parseHttpEvent(event);
        if (!body.code) {
            return;
        }

        const task = httpData.path.slice(1);
        const question = this.generateQuestion(body.code, task);
        const response = await this.requestDataFromChatgptAPI(question);

        this.processedResult = {}; this.orderedArray = [];
        if (task === CONSTANTS.ANALYSE){
            this.generateCodeAnalysisData(response);
        } else {
            this.generateCodeOptimisationData(response);
        }
        const dataForDb = this.generateCompleteDataForDb(httpData, body.userToken, task);
        if (process.env.local_execution) {
            return await Utils.lambdaFunctionExecutor(DataCollector, dataForDb);
        }
        await Utils.snsPublish(process.env.DATA_COLLECTOR_SNS, dataForDb);
    }

    generateQuestion(code, task) {
        let question = 'Tell me ';
        switch (task) {
            case CONSTANTS.OPTIMISE:
                question += 'language of this code and optimise it';
                break;
            case CONSTANTS.COMMENT:
                question += 'language of this code and add comments to it';
                break;
            case CONSTANTS.ANALYSE:
            default:
                question += `${CONSTANTS.TOPICS.length} things about this code: ${CONSTANTS.TOPICS.join(',')}`;
        }
        return question + '\n' + code;
    }

    generateCodeOptimisationData (message) {
        const splitted = message.split('\n');
        this.orderedArray[CONSTANTS.LANGUAGE_INDEX] = splitted.shift();
        this.assignLanguage();
        this.processedResult.result = splitted.join('\n');
    }

    generateCodeAnalysisData (message) {
        const splitted = message.split('\n');
        for (const line of splitted) {
            if (parseInt(line[0])) {
                this.orderedArray[line[0]] = line.slice(line.indexOf(': ') + 2);
            }
        }

        this.assignAnalyse();
        this.assignLanguage();
        this.assignPackages();
        this.assignStylisticPractises();
        this.assignComplexity(CONSTANTS.TIME);
        this.assignComplexity(CONSTANTS.SPACE);
    }

    generateCompleteDataForDb(http, token, task) {
        return {
            codeData: {
                user_token: token,
                data: this.processedResult,
            },
            requestData: {
                user_token: token,
                language: this.processedResult.language,
                request: task,
                country_code: geoip.lookup(http.sourceIp).country,
                user_agent: http.userAgent,
            },
        };
    }

    assignAnalyse () {
        this.processedResult[CONSTANTS.ANALYSE] = this.orderedArray[`${CONSTANTS.ANALYSE_INDEX}`];
    }

    assignStylisticPractises () {
        this.processedResult[`${CONSTANTS.STYLES}`] =
            this.orderedArray[`${CONSTANTS.STYLES_INDEX}`];
    }

    assignPackages () {
        this.processedResult[`${CONSTANTS.PACKAGES}_${CONSTANTS.DETAILS}`] =
            this.orderedArray[`${CONSTANTS.PACKAGES_INDEX}`];

        this.processedResult.packages = [];
        const punctuationRegex = /[!"$%&'()*,:;<=>?@[\]^`{|}~]/g;
        const splitted = this.processedResult[`${CONSTANTS.PACKAGES}_${CONSTANTS.DETAILS}`].split('.')[0].split(' ');
        splitted.forEach((word, idx) => {
            if (((word.startsWith('"') || word.startsWith("'") || word.startsWith('`')) &&
                (word.endsWith('"') || word.endsWith("'") || word.endsWith('`')) ||
                word.endsWith(',') ||
                splitted[idx - 1] === 'and')) {
                this.processedResult.packages.push(word.replace(punctuationRegex, ''));
            }
        });
    }

    assignLanguage () {
        this.processedResult[`${CONSTANTS.LANGUAGE}_${CONSTANTS.DETAILS}`] =
            this.orderedArray[CONSTANTS.LANGUAGE_INDEX];

        const punctuationRegex = /[!"$%&'()*,-./:;<=>?@[\]^_`{|}~]$/g;
        const splitted = this.processedResult[`${CONSTANTS.LANGUAGE}_${CONSTANTS.DETAILS}`].split(' ');

        splitted.forEach((word, idx) => {
            if (idx !== 0 && /^[A-Z]/.test(word)) {
                this.processedResult[CONSTANTS.LANGUAGE] = word.replace(punctuationRegex, '');
            }
        });
    }

    assignComplexity(option) {
        const complexity = `${option}_${CONSTANTS.COMPLEXITY}`;
        this.processedResult[`${complexity}_${CONSTANTS.DETAILS}`] =
            this.orderedArray[CONSTANTS[`${complexity}_${CONSTANTS.INDEX}`.toUpperCase()]];

        const complexityPunctuationRegex = /[!"#$%&'*,.:;<=>?@[\]_`{|}~]$/g;
        const complexityRegex = /^O\(.*\)$/i;
        let isConstant = false;

        const splitted = this.processedResult[`${complexity}_${CONSTANTS.DETAILS}`].split(' ');
        splitted.forEach(word => {
            if (complexityRegex.test(word.replace(complexityPunctuationRegex, ''))) {
                this.processedResult[`${complexity}`] = word.replace(complexityPunctuationRegex, '');
            } else if (word === 'constant') {
                isConstant = true;
            }
        });

        if (!this.processedResult[`${complexity}`] && isConstant) {
            this.processedResult[`${complexity}`] = 'O(1)';
        }
    }

    async requestDataFromChatgptAPI (content) {
        const role = process.env.OPENAI_USER;
        const configuration = new Configuration({
            organization: process.env.OPENAI_ORGANIZATION_ID,
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const response = await openai.createChatCompletion({
            model: process.env.OPENAI_MODEL,
            messages: [{ role, content }],
        }).catch(err => {
            console.error(err);
        });

        return response.data?.choices?.[0].message?.content;
    }
}

module.exports = CodeAnalyser;
