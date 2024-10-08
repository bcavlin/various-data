const utils = require('./utils');

async function scanAuths(namespaceInventory, clientConfig) {
    const namespacePath = utils.setNamespacePath(namespaceInventory.name);
    const authMounts = namespaceInventory.authMounts || [];
    
    await Promise.all(authMounts.map(async (authMount) => {
        const path = `${namespacePath}auth/${authMount.path}`;
        try {
            const data = await clientConfig.list(path);
            authMount.roles = data.keys || [];
        } catch (err) {
            utils.appendError(`Error fetching auth roles for ${authMount.path}: ${err.message}`, namespaceInventory.errors);
        }
    }));
}

async function scanEntities(namespaceInventory, clientConfig) {
    const namespacePath = utils.setNamespacePath(namespaceInventory.name);
    const path = `${namespacePath}identity/entity/id`;

    try {
        const data = await clientConfig.list(path);
        const keys = data.keys || [];
        
        await Promise.all(keys.map(async (id) => {
            try {
                const entity = await clientConfig.read(`${path}/${id}`);
                namespaceInventory.entities.push({
                    id,
                    name: entity.data.name || '',
                    policies: entity.data.policies || []
                });
            } catch (err) {
                utils.appendError(`Error fetching entity ${id}: ${err.message}`, namespaceInventory.errors);
            }
        }));
    } catch (err) {
        utils.appendError(`Error listing entities at path ${path}: ${err.message}`, namespaceInventory.errors);
    }
}

module.exports = {
    scanAuths,
    scanEntities
};
