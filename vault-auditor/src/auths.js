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

        // Helper function to append auth data (roles/certs)
        const appendAuthData = (dataType, item) => {
            switch (dataType) {
                case 'roles':
                    authMount.roles = authMount.roles || [];
                    authMount.roles.push(item);
                    break;
                case 'certs':
                    authMount.certs = authMount.certs || [];
                    authMount.certs.push(item);
                    break;
            }
        };

        // Function to process different auth paths
        const listAndProcess = async (key, dataType) => {
            try {
                const listResp = await clientConfig.list(`${pathBase}${key}`);
                const keys = listResp.data.keys || [];
                keys.forEach((item) => appendAuthData(dataType, item));
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
    scanAuths
};
