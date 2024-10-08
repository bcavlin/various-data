const ClientConfig = require('./src/clientConfig');
const { scanAuths, scanEntities } = require('./src/auths');
const { scanPolicies } = require('./src/policies');
const { scanEngines } = require('./src/engines');
const { toCSV, toJSON, toSQL } = require('./src/output');

(async () => {
    const clientConfig = new ClientConfig('http://localhost:8200', 'your-vault-token', false, 10, 100, true, '');
    const vaultInventory = { namespaces: [], errors: [] };

    // Scan namespaces, policies, entities, and engines
    await scanAuths(vaultInventory, clientConfig);
    await scanEntities(vaultInventory, clientConfig);
    await scanPolicies(vaultInventory, clientConfig);
    await scanEngines(vaultInventory, clientConfig);

    // Output results
    toJSON(vaultInventory, true); // Or toCSV(vaultInventory), or toSQL(vaultInventory, 'postgres://user:pass@localhost:5432/dbname');
})();