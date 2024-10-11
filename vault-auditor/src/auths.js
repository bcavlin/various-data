const utils = require('./utils');

// Define the auth methods with their respective types
const authMethodsWithRole = ['approle', 'azure', 'jwt', 'kubernetes', 'oidc', 'oci', 'saml'];
const authMethodsWithRoles = ['aws', 'gcp', 'token', 'cf', 'alicloud'];
const authMethodsWithCerts = ['cert'];

async function scanAuths(namespaceInventory, clientConfig) {
    const namespacePath = utils.setNamespacePath(namespaceInventory.name);
    const authMounts = namespaceInventory.authMounts || [];

    console.log(`Starting auth methods scan for namespace: ${namespaceInventory.name}`);

    await Promise.all(authMounts.map(async (authMount) => {
        const pathBase = `${namespacePath}auth/${authMount.path}`;
        let localErrors = [];

        console.log(`Processing auth mount: ${authMount.path} of type: ${authMount.type}`);

        // Helper function to append auth data (roles/certs) with structure {name, policies: []}
        const appendAuthData = async (key, item, dataType) => {
            try {
                // Read role data for token_policies and allowed_policies
                const roleData = await clientConfig.read(`${pathBase}${key}/${item}`);
                const tokenPolicies = roleData.data.token_policies || [];
                const allowedPolicies = roleData.data.allowed_policies || [];

                // Combine both token_policies and allowed_policies into a single policies array
                const policies = [...new Set([...tokenPolicies, ...allowedPolicies])].map(policy => policy.toString());

                if (dataType === 'roles') {
                    authMount.Roles = authMount.Roles || [];
                    authMount.Roles.push({
                        name: item,
                        policies
                    });
                } else if (dataType === 'certs') {
                    authMount.Certs = authMount.Certs || [];
                    authMount.Certs.push({
                        name: item,
                        policies
                    });
                }

                console.log(`Processed ${dataType.slice(0, -1)}: ${item} with policies: [${policies.join(', ')}]`);

            } catch (err) {
                localErrors.push(`Error reading ${dataType.slice(0, -1)} data at path ${pathBase}${key}/${item}: ${err.message}`);
            }
        };

        // Function to process different auth paths
        const listAndProcess = async (key, dataType) => {
            try {
                const listResp = await clientConfig.list(`${pathBase}${key}`);
                const keys = listResp.data.keys || [];
                console.log(`Found ${keys.length} items at path ${pathBase}${key}`);
                for (const item of keys) {
                    await appendAuthData(key, item, dataType); // Append roles or certs based on dataType
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

        console.log(`Completed processing for auth mount: ${authMount.path}`);
    }));

    console.log(`Finished auth methods scan for namespace: ${namespaceInventory.name}`);
}

module.exports = {
    scanAuths,
};
