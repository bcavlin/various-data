const utils = require('./utils');

async function scanEngines(namespaceInventory, clientConfig) {
    const namespacePath = utils.setNamespacePath(namespaceInventory.name);

    await Promise.all(namespaceInventory.secretsEngines.map(async (engine) => {
        let path = `${namespacePath}${engine.path}`;
        
        if (clientConfig.listSecrets && engine.type === 'kv') {
            path = engine.version === '2' ? `${path}/metadata` : path;
            try {
                const secrets = await clientConfig.list(path);
                engine.secrets = secrets.keys || [];
            } catch (err) {
                utils.appendError(`Error listing KV secrets for ${engine.path}: ${err.message}`, namespaceInventory.errors);
            }
        }
    }));
}

module.exports = {
    scanEngines
};
