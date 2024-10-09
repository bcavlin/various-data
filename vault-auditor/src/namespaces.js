const utils = require('./utils');

async function getNamespaces(clientConfig) {
    let namespaceList = ['root']; // Always include "root" namespace

    try {
        const response = await clientConfig.list('sys/namespaces');
        const keys = response.data.keys || [];

        namespaceList = namespaceList.concat(
            keys.map((namespace) => namespace.replace(/\/$/, '')) // Trim trailing slashes
        );
    } catch (err) {
        throw new Error(`Error listing namespaces: ${err.message}`);
    }

    return namespaceList;
}

module.exports = {
  getNamespaces,
};