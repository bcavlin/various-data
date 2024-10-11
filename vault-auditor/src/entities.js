const utils = require('./utils');

async function scanEntities(namespaceInventory, clientConfig) {
    const namespacePath = utils.setNamespacePath(namespaceInventory.name);
    const path = `${namespacePath}identity/entity/id`;

    console.log(`Starting entities scan for namespace: ${namespaceInventory.name}`);

    try {
        // Fetch the list of entity IDs from Vault
        const listResp = await clientConfig.list(path);
        const keys = listResp.data.keys || [];

        console.log(`Found ${keys.length} entities in namespace: ${namespaceInventory.name}`);

        // Process each entity concurrently
        await Promise.all(keys.map(async (entityID) => {
            await processEntity(namespaceInventory, clientConfig, entityID, path);
        }));

        console.log(`Finished entities scan for namespace: ${namespaceInventory.name}`);

    } catch (err) {
        utils.appendError(`Error listing entities at path ${path}: ${err.message}`, namespaceInventory.errors);
    }
}

async function processEntity(namespaceInventory, clientConfig, entityID, basePath) {
    const entityPath = `${basePath}/${entityID}`;

    try {
        // Fetch entity data from Vault
        const entityData = await clientConfig.read(entityPath);

        // Construct the entity object
        const entity = {
            id: entityID,
            name: entityData.data.name || '',
            policies: entityData.data.policies || [],
            aliases: []
        };

        // Process aliases
        if (entityData.data.aliases) {
            entity.aliases = entityData.data.aliases.map(alias => ({
                id: alias.id || '',
                name: alias.name || '',
                mountPath: alias.mount_path || '',
                mountType: alias.mount_type || ''
            }));
        }

        // Append entity to the namespaceInventory
        namespaceInventory.entities = namespaceInventory.entities || [];
        namespaceInventory.entities.push(entity);

        console.log(`Processed entity: ${entityID} with ${entity.policies.length} policies and ${entity.aliases.length} aliases`);

    } catch (err) {
        utils.appendError(`Error processing entity ${entityID} at path ${entityPath}: ${err.message}`, namespaceInventory.errors);
    }
}

module.exports = {
    scanEntities,
};
