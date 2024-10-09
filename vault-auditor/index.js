const ClientConfig = require('./src/clientConfig');
const { scanAuths, scanEntities } = require('./src/auths');
const { scanPolicies } = require('./src/policies');
const { scanEngines } = require('./src/engines');
const { toCSV, toJSON, toSQL } = require('./src/output');
const { getNamespaces, getMounts } = require('./mounts');

(async () => {
    const clientConfig = new ClientConfig('http://localhost:8200', 'your-vault-token', false, 10, 100, true, '');
    const vaultInventory = { namespaces: [], errors: [] };

    // Step 1: Get namespaces
    const namespaces = await getNamespaces(clientConfig);
    
    // Step 2: Get mounts for each namespace
    for (const namespace of namespaces) {
        const namespaceInventory = await getMounts(clientConfig, namespace);
        vaultInventory.namespaces.push(namespaceInventory);
    }

    // Step 3: Scan policies, entities, auths, and engines for each namespace
    for (const namespaceInventory of vaultInventory.namespaces) {
        await scanPolicies(namespaceInventory, clientConfig);
        await scanAuths(namespaceInventory, clientConfig);
        await scanEntities(namespaceInventory, clientConfig);
        await scanEngines(namespaceInventory, clientConfig);
    }

    // Output results
    toJSON(vaultInventory, true); // Or toCSV(vaultInventory), or toSQL(vaultInventory, 'postgres://user:pass@localhost:5432/dbname');
})();