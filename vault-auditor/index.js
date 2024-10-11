const ClientConfig = require('./clientConfig');
const { getNamespaces, getMounts } = require('./mounts');
const { scanPolicies } = require('./policies');
const { scanAuths } = require('./auths');
const { scanEntities } = require('./entities');
const { scanEngines } = require('./engines');
const { toJSON } = require('./output');

(async () => {
    console.log('Starting Vault inventory scan...');

    const clientConfig = new ClientConfig('http://localhost:8200', 'your-vault-token', false, 10, 100, true, '');
    const vaultInventory = { namespaces: [], errors: [] };

    console.log('Fetching namespaces...');
    const namespaces = await getNamespaces(clientConfig);
    console.log(`Found ${namespaces.length} namespaces.`);

    // Concurrently get mounts for each namespace
    const namespaceInventories = await Promise.all(
        namespaces.map(async (namespace) => {
            console.log(`Fetching mounts for namespace: ${namespace}`);
            const namespaceInventory = await getMounts(clientConfig, namespace);
            console.log(`Completed mounts fetch for namespace: ${namespace}`);
            return namespaceInventory;
        })
    );

    vaultInventory.namespaces.push(...namespaceInventories);

    // Process each namespace (policies, auths, entities, and engines)
    await Promise.all(
        vaultInventory.namespaces.map(async (namespaceInventory) => {
            console.log(`Starting processing for namespace: ${namespaceInventory.name}`);
            await scanPolicies(namespaceInventory, clientConfig);
            await scanAuths(namespaceInventory, clientConfig);
            await scanEntities(namespaceInventory, clientConfig);
            await scanEngines(namespaceInventory, clientConfig);
            console.log(`Completed processing for namespace: ${namespaceInventory.name}`);
        })
    );

    console.log('Vault inventory scan completed.');

    // Output the final inventory result
    toJSON(vaultInventory, true); // Or toCSV, toSQL, etc.
})();
