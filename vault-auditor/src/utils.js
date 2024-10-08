const fs = require('fs');

function setNamespacePath(namespace) {
    return namespace === 'root' ? '' : `${namespace}/`;
}

function stringInArray(str, array) {
    return array.includes(str);
}

function appendError(errMsg, errors) {
    errors.push(errMsg);
}

function getStringFromMap(map, key) {
    return map[key] ? map[key].toString() : '';
}

module.exports = {
    setNamespacePath,
    stringInArray,
    appendError,
    getStringFromMap,
};