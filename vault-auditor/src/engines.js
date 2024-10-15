const _ = require('lodash');
const utils = require('./utils');

const secretEnginesWithRoles = ['aws', 'azure', 'consul', 'database', 'kubernetes', 'pki', 'ssh'];
const secretEnginesWithRole = ['nomad', 'terraform', 'transform'];

async function scanEngines(namespaceInventory, clientConfig) {
    const namespacePath = utils.setNamespacePath(namespaceInventory.name);
    const path = `${namespacePath}sys/mounts`;

    console.log(`Starting secret engines scan for namespace: ${namespaceInventory.name}`);

    try {
        // Fetch the list of secret engines
        const listResp = await clientConfig.read(path);
        const secretEnginesData = listResp.data || {};

        // Process each secret engine
        await Promise.all(Object.keys(secretEnginesData).map(async (enginePath) => {
            const engineData = secretEnginesData[enginePath];
            await processEngine(namespaceInventory, clientConfig, enginePath, engineData, namespacePath);
        }));

        console.log(`Finished secret engines scan for namespace: ${namespaceInventory.name}`);

    } catch (err) {
        utils.appendError(`Error listing secret engines at path ${path}: ${err.message}`, namespaceInventory.errors);
    }
}

async function processEngine(namespaceInventory, clientConfig, enginePath, engineData, namespacePath) {
    const engine = {
        path: enginePath,
        type: engineData.type || '',
        version: engineData?.options?.version || '',
        roles: [],
        secrets: [],
        itemCount: 0
    };

    console.log(`Processing secret engine: ${enginePath} of type: ${engine.type}`);

    const engineBasePath = `${namespacePath}${enginePath}`;

    // If the engine has roles (like AWS, Azure, etc.), fetch and process roles
    if (secretEnginesWithRoles.includes(engine.type)) {
        await listAndProcessRoles(clientConfig, engineBasePath, engine, 'role');
    }
    if (secretEnginesWithRole.includes(engine.type)) {
        await listAndProcessRoles(clientConfig, engineBasePath, engine, 'roles');
    }

    // If the engine is of type 'kv', walk through the secrets metadata
    if (engine.type === 'kv') {
        const kvPath = engine.version === '2' ? `${engineBasePath}metadata` : engineBasePath;
        await walkKvPath(kvPath, clientConfig, engine, namespaceInventory);
    }

    engine.itemCount = engine.secrets.length;

    // Append the engine to the namespace inventory
    namespaceInventory.secretsEngines = namespaceInventory.secretsEngines || [];
    namespaceInventory.secretsEngines.push(engine);

    console.log(`Processed secret engine: ${enginePath} with ${engine.roles.length} roles and ${engine.secrets.length} secrets`);
}

async function listAndProcessRoles(clientConfig, basePath, engine, roleType) {
    const rolePath = `${basePath}${roleType}`;
    try {
        const listResp = await clientConfig.list(rolePath);
        const keys = listResp.data.keys || [];

        // Append roles to the engine object
        engine.roles = _.concat(engine.roles, keys.map(role => role.toString()));

        console.log(`Found ${keys.length} roles at path: ${rolePath}`);

    } catch (err) {
        console.log(`Error listing roles at path: ${rolePath}: ${err.message}`);
    }
}

async function walkKvPath(basePath, clientConfig, engine, namespaceInventory) {
    try {
        const listResp = await clientConfig.list(basePath);
        const keys = listResp.data.keys || [];

        for (const kvPath of keys) {
            if (kvPath.endsWith('/')) {
                // Recurse into subdirectories
                await walkKvPath(`${basePath}/${kvPath}`, clientConfig, engine, namespaceInventory);
            } else {
                // Fetch the metadata of the secret
                await processSecretMetadata(`${basePath}/${kvPath}`, clientConfig, engine);
            }
        }

    } catch (err) {
        utils.appendError(`Error walking KV path ${basePath}: ${err.message}`, namespaceInventory.errors);
    }
}

async function processSecretMetadata(path, clientConfig, engine) {
    try {
        const metadataResp = await clientConfig.read(path);
        const secretMetadata = metadataResp.data || {};

        const secret = {
            path: path.replace('/metadata', ''),
            currentVersion: secretMetadata.current_version || 'unknown',
            creationTime: secretMetadata.created_time || '',
            updatedTime: secretMetadata.updated_time || '',
            policies: []  // Policies can be added later if needed
        };

        // Append secret to the engine object
        engine.secrets = engine.secrets || [];
        engine.secrets.push(secret);

        console.log(`Processed secret at path: ${secret.path}`);

    } catch (err) {
        console.log(`Error processing secret metadata at path: ${path}: ${err.message}`);
    }
}

module.exports = {
    scanEngines,
};
