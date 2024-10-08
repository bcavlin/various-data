const fs = require('fs');
const { parse } = require('json2csv');
const { Client } = require('pg');

async function toCSV(vaultInventory) {
    const fields = ['Namespace', 'Engine Type', 'Engine Version', 'Engine Path', 'Secret Path', 'Current Version', 'Creation Time', 'Updated Time'];
    const data = [];

    vaultInventory.namespaces.forEach((namespace) => {
        namespace.secretsEngines.forEach((engine) => {
            engine.secrets.forEach((secret) => {
                data.push({
                    Namespace: namespace.name,
                    'Engine Type': engine.type,
                    'Engine Version': engine.version,
                    'Engine Path': engine.path,
                    'Secret Path': secret.path,
                    'Current Version': secret.currentVersion,
                    'Creation Time': secret.creationTime,
                    'Updated Time': secret.updatedTime
                });
            });
        });
    });

    const csv = parse(data, { fields });
    fs.writeFileSync('secrets.csv', csv);
}

async function toJSON(vaultInventory, stdout = false) {
    const jsonData = JSON.stringify(vaultInventory, null, 2);
    if (stdout) {
        console.log(jsonData);
    } else {
        fs.writeFileSync('inventory.json', jsonData);
    }
}

async function toSQL(vaultInventory, sqlConnectionString) {
    const client = new Client({ connectionString: sqlConnectionString });
    await client.connect();

    await client.query('DROP TABLE IF EXISTS secrets');
    await client.query(`
        CREATE TABLE secrets (
            secret_path VARCHAR(255) PRIMARY KEY,
            namespace VARCHAR(100),
            engine_type VARCHAR(10),
            engine_version CHAR(1),
            engine_path VARCHAR(255),
            current_version VARCHAR(255),
            creation_time TIMESTAMP,
            updated_time TIMESTAMP
        );
    `);

    for (const namespace of vaultInventory.namespaces) {
        for (const engine of namespace.secretsEngines) {
            for (const secret of engine.secrets) {
                await client.query(`
                    INSERT INTO secrets (secret_path, namespace, engine_type, engine_version, engine_path, current_version, creation_time, updated_time)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [secret.path, namespace.name, engine.type, engine.version, engine.path, secret.currentVersion, secret.creationTime, secret.updatedTime]);
            }
        }
    }

    await client.end();
}

module.exports = {
    toCSV,
    toJSON,
    toSQL
};
