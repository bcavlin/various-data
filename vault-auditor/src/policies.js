const utils = require('./utils');

async function scanPolicies(namespaceInventory, clientConfig) {
    const namespacePath = utils.setNamespacePath(namespaceInventory.name);
    const path = `${namespacePath}sys/policy`;

    try {
        const data = await clientConfig.list(path);
        const policies = data.policies || [];

        await Promise.all(policies.map(async (policyName) => {
            try {
                const policy = await clientConfig.read(`${path}/${policyName}`);
                namespaceInventory.policies.push({
                    name: policyName,
                    paths: extractPathsFromRules(policy.data.rules || '')
                });
            } catch (err) {
                utils.appendError(`Error fetching policy ${policyName}: ${err.message}`, namespaceInventory.errors);
            }
        }));
    } catch (err) {
        utils.appendError(`Error listing policies at path ${path}: ${err.message}`, namespaceInventory.errors);
    }
}

function extractPathsFromRules(rules) {
    return rules.split('\n')
        .filter(line => line.startsWith('path'))
        .map(line => line.split('"')[1]);
}

module.exports = {
    scanPolicies
};
