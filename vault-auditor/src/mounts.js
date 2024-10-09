const utils = require('./utils');

async function getMounts(clientConfig, namespace) {
    const namespacePath = utils.setNamespacePath(namespace);
    const namespaceInventory = {
        name: namespace,
        authMounts: [],
        secretsEngines: [],
        errors: [],
    };

    try {
        const authMountsResponse = await clientConfig.read(`${namespacePath}sys/auth`);
        for (const path in authMountsResponse.data) {
            const authMount = {
                path: path,
                type: authMountsResponse.data[path].type,
                roles: [],
                users: [],
                groups: [],
                certs: [],
            };
            namespaceInventory.authMounts.push(authMount);
        }
    } catch (err) {
        utils.appendError(`Error listing auth mounts for namespace ${namespace}: ${err.message}`, namespaceInventory.errors);
    }

    try {
        const secretsEnginesResponse = await clientConfig.read(`${namespacePath}sys/mounts`);
        for (const path in secretsEnginesResponse.data) {
            const secretsEngine = {
                path: path,
                type: secretsEnginesResponse.data[path].type,
                version: secretsEnginesResponse.data[path]?.options?.version || '',
                secrets: [],
                itemCount: 0,
            };
            namespaceInventory.secretsEngines.push(secretsEngine);
        }
    } catch (err) {
        utils.appendError(`Error listing secrets engines for namespace ${namespace}: ${err.message}`, namespaceInventory.errors);
    }

    return namespaceInventory;
}

module.exports = {
    getMounts,
};
