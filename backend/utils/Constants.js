module.exports.LANGUAGE_INDEX = 1;
module.exports.TIME_COMPLEXITY_INDEX = 2;
module.exports.SPACE_COMPLEXITY_INDEX = 3;
module.exports.ANALYSE_INDEX = 4;
module.exports.PACKAGES_INDEX = 5;
module.exports.STYLES_INDEX = 6;

module.exports.LANGUAGE = 'language';
module.exports.PACKAGES = 'packages';
module.exports.STYLES = 'common_stylistic_practises';
module.exports.TIME = 'time';
module.exports.SPACE = 'space';
module.exports.ANALYSE = 'analyse';
module.exports.OPTIMISE = 'optimise';
module.exports.COMMENT = 'comment';
module.exports.DETAILS = 'details';
module.exports.COMPLEXITY = 'complexity';
module.exports.INDEX = 'index';

module.exports.TOPICS = [
    module.exports.LANGUAGE,
    module.exports.TIME + ' ' + module.exports.COMPLEXITY,
    module.exports.SPACE + ' ' + module.exports.COMPLEXITY,
    module.exports.ANALYSE,
    module.exports.PACKAGES,
    module.exports.STYLES,
];

module.exports.CODE_ANALYSES_TABLE = 'code_analyses';
module.exports.REQUEST_STATISTICS_TABLE = 'request_statistics';
