const utils = require('./utils');

async function scanEntities(namespaceInventory, clientConfig) {
    const namespacePath = utils.setNamespacePath(namespaceInventory.name);
    const path = `${namespacePath}identity/entity/id`;

    try {
        const data = await clientConfig.list(path);
        const keys = data.keys || [];
        
        await Promise.all(keys.map(async (id) => {
            try {
                const entityData = await clientConfig.read(`${path}/${id}`);
                const entity = {
                    id: id,
                    name: entityData.data.name || '',
                    policies: entityData.data.policies ? entityData.data.policies.map(policy => policy.toString()) : [],
                    aliases: entityData.data.aliases ? processAliases(entityData.data.aliases) : [],
                };
                namespaceInventory.entities.push(entity);
            } catch (err) {
                utils.appendError(`Error fetching entity ${id}: ${err.message}`, namespaceInventory.errors);
            }
        }));
    } catch (err) {
        utils.appendError(`Error listing entities at path ${path}: ${err.message}`, namespaceInventory.errors);
    }
}

function processAliases(aliasesData) {
    return aliasesData.map(alias => {
        return {
            id: alias.id || '',
            name: alias.name || '',
            mountPath: alias.mount_path || '',
            mountType: alias.mount_type || '',
        };
    });
}

module.exports = {
    scanEntities,
};
