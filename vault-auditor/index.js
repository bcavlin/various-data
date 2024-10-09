const ClientConfig = require('./src/clientConfig');
const { getMounts } = require('./src/mounts');
const { getNamespaces } = require('./src/namespaces');
const { scanEntities } = require('./src/entities');  // Importing entities module
const { scanAuths } = require('./src/auths');
const { scanPolicies } = require('./src/policies');
const { scanEngines } = require('./src/engines');
const { toCSV, toJSON, toSQL } = require('./src/output');

(async () => {
    const clientConfig = new ClientConfig(process.env.VAULT_ADDR, process.env.VAULT_TOKEN, 
        false, process.env.MAX_CONCURRENCY, process.env.RATE_LIMIT, true, '');
    const vaultInventory = { namespaces: [], errors: [] };

    // Step 1: Get namespaces
    console.log("Getting namespaces");
    const namespaces = await getNamespaces(clientConfig);
    
    // Step 2: Concurrently process all namespaces to get mounts
    console.log("Getting mounts");
    const namespaceInventories = await Promise.all(
        namespaces.map(async (namespace) => await getMounts(clientConfig, namespace))
    );

    // Add the results to the vault inventory
    vaultInventory.namespaces.push(...namespaceInventories);

    // Step 3: Concurrently process each namespace (policies, auths, entities, and engines)
    console.log("Getting rest of the data");
    await Promise.all(
        vaultInventory.namespaces.map(async (namespaceInventory) => {
            await scanPolicies(namespaceInventory, clientConfig);
            await scanAuths(namespaceInventory, clientConfig);
            await scanEntities(namespaceInventory, clientConfig);
            await scanEngines(namespaceInventory, clientConfig);
        })
    );

    // Output results (You can choose either JSON, CSV, or SQL)
    console.log("Generating export");
    toJSON(vaultInventory, true); // Or toCSV(vaultInventory), or toSQL(vaultInventory, 'postgres://user:pass@localhost:5432/dbname');
})();
