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

// Helper function to process in batches
async function processInBatches(items, batchSize, processItemFn) {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.all(batch.map(processItemFn)); // Process all items in the current batch concurrently
    }
}

module.exports = {
    setNamespacePath,
    stringInArray,
    appendError,
    getStringFromMap,
    processInBatches
};