const utils = require('./utils');

// Define the auth methods with their respective types
const authMethodsWithRole = ['approle', 'azure', 'jwt', 'kubernetes', 'oidc', 'oci', 'saml'];
const authMethodsWithRoles = ['aws', 'gcp', 'token', 'cf', 'alicloud'];
const authMethodsWithCerts = ['cert'];

async function scanAuths(namespaceInventory, clientConfig) {
    const namespacePath = utils.setNamespacePath(namespaceInventory.name);
    const authMounts = namespaceInventory.authMounts || [];

    await Promise.all(authMounts.map(async (authMount) => {
        const pathBase = `${namespacePath}auth/${authMount.path}`;
        let localErrors = [];

        // Helper function to append auth data (roles/certs) with structure {name, policies: []}
        const appendAuthRole = async (key, item) => {
            try {
                const roleData = await clientConfig.read(`${pathBase}${key}/${item}`);
                const policies = roleData.data.token_policies || roleData.data.allowed_policies || [];
                authMount.authRoles = authMount.authRoles || [];
                authMount.authRoles.push({
                    name: item,
                    policies: policies.map(policy => policy.toString())
                });
            } catch (err) {
                localErrors.push(`Error reading role data at path ${pathBase}${key}/${item}: ${err.message}`);
            }
        };

        // Function to process different auth paths
        const listAndProcess = async (key, dataType) => {
            try {
                const listResp = await clientConfig.list(`${pathBase}${key}`);
                const keys = listResp.data.keys || [];
                for (const item of keys) {
                    await appendAuthRole(key, item); // Appending roles with {name, policies: []} structure
                }
            } catch (err) {
                localErrors.push(`Error listing path ${pathBase}${key}: ${err.message}`);
            }
        };

        try {
            // Check if the auth method is of type "role", "roles", or "certs"
            if (authMethodsWithRole.includes(authMount.type)) {
                await listAndProcess('/role', 'roles');
            }
            if (authMethodsWithRoles.includes(authMount.type)) {
                await listAndProcess('/roles', 'roles');
            }
            if (authMethodsWithCerts.includes(authMount.type)) {
                await listAndProcess('/certs', 'certs');
            }
        } catch (err) {
            localErrors.push(`Error processing auth mount ${authMount.path}: ${err.message}`);
        }

        // Store any errors encountered
        if (localErrors.length > 0) {
            utils.appendError(localErrors.join('; '), namespaceInventory.errors);
        }
    }));
}

module.exports = {
    scanAuths,
};
