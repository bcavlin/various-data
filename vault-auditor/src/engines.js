const utils = require('./utils');

// Define the secret engines with their respective types
const secretEnginesWithRole = ['nomad', 'terraform', 'transform'];
const secretEnginesWithRoles = ['aws', 'azure', 'consul', 'database', 'kubernetes', 'pki', 'ssh'];

async function scanEngines(namespaceInventory, clientConfig) {
    const namespacePath = utils.setNamespacePath(namespaceInventory.name);

    await Promise.all(namespaceInventory.secretsEngines.map(async (engine) => {
        let localErrors = [];

        const listAndProcess = async (key, field) => {
            try {
                const listResp = await clientConfig.list(`${namespacePath}${engine.path}${key}`);
                const keys = listResp.data.keys || [];
                engine[field] = keys;
            } catch (err) {
                localErrors.push(`Error listing secrets engine ${key} path: ${err.message}`);
            }
        };

        try {
            // Check if the secret engine has a "roles" or "role" endpoint
            if (secretEnginesWithRole.includes(engine.type)) {
                await listAndProcess('/role', 'roles');
            }
            if (secretEnginesWithRoles.includes(engine.type)) {
                await listAndProcess('/roles', 'roles');
            }

            // Special handling for KV secret engine version 2
            if (engine.type === 'kv' && engine.version === '2') {
                const path = `${namespacePath}${engine.path}metadata`;
                if (clientConfig.listSecrets) {
                    await walkKvPath(engine, path, clientConfig, namespaceInventory);
                }
            }
        } catch (err) {
            localErrors.push(`Error processing engine ${engine.path}: ${err.message}`);
        }

        // Store any errors encountered
        if (localErrors.length > 0) {
            utils.appendError(localErrors.join('; '), namespaceInventory.errors);
        }
    }));
}

async function walkKvPath(engine, basePath, clientConfig, namespaceInventory) {
    // Function to recursively walk through KV paths
    try {
        const listResp = await clientConfig.list(basePath);
        const keys = listResp.data.keys || [];
        for (const key of keys) {
            if (key.endsWith('/')) {
                await walkKvPath(engine, `${basePath}/${key}`, clientConfig, namespaceInventory);
            } else {
                // Process and store secrets for non-directory paths
                engine.secrets.push({ path: key });
            }
        }
    } catch (err) {
        utils.appendError(`Error walking KV path ${basePath}: ${err.message}`, namespaceInventory.errors);
    }
}

module.exports = {
    scanEngines
};
