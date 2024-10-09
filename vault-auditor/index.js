const ClientConfig = require('./clientConfig');
const { getMounts } = require('./mounts');
const { getNamespaces } = require('./namespaces');
const { scanEntities } = require('./entities');  // Importing entities module
const { scanAuths } = require('./auths');
const { scanPolicies } = require('./policies');
const { scanEngines } = require('./engines');
const { toCSV, toJSON, toSQL } = require('./output');

(async () => {
    const clientConfig = new ClientConfig('http://localhost:8200', 'your-vault-token', false, 10, 100, true, '');
    const vaultInventory = { namespaces: [], errors: [] };

    // Step 1: Get namespaces
    const namespaces = await getNamespaces(clientConfig);
    
    // Step 2: Concurrently process all namespaces to get mounts
    const namespaceInventories = await Promise.all(
        namespaces.map(async (namespace) => await getMounts(clientConfig, namespace))
    );

    // Add the results to the vault inventory
    vaultInventory.namespaces.push(...namespaceInventories);

    // Step 3: Concurrently process each namespace (policies, auths, entities, and engines)
    await Promise.all(
        vaultInventory.namespaces.map(async (namespaceInventory) => {
            await scanPolicies(namespaceInventory, clientConfig);
            await scanAuths(namespaceInventory, clientConfig);
            await scanEntities(namespaceInventory, clientConfig);
            await scanEngines(namespaceInventory, clientConfig);
        })
    );

    // Output results (You can choose either JSON, CSV, or SQL)
    toJSON(vaultInventory, true); // Or toCSV(vaultInventory), or toSQL(vaultInventory, 'postgres://user:pass@localhost:5432/dbname');
})();
