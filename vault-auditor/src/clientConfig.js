const axios = require('axios');
const RateLimit = require('axios-rate-limit');
const utils = require('./utils');

// A simple class to simulate the Vault client functionality
class ClientConfig {
    constructor(addr, token, tlsSkipVerify = true, maxConcurrency = 10, rateLimit = 100, listSecrets = false, targetEngine = '') {
        this.addr = addr;
        this.token = token;
        this.tlsSkipVerify = tlsSkipVerify;
        this.maxConcurrency = maxConcurrency;
        this.rateLimit = rateLimit;
        this.listSecrets = listSecrets;
        this.targetEngine = targetEngine;
        this.client = RateLimit(axios.create({
            baseURL: addr,
            headers: { 'X-Vault-Token': token }
        }), { maxRequests: rateLimit, perMilliseconds: 1000 });

        console.log(`Created client with address: ${addr}, maxConcurrency: ${maxConcurrency}, rateLimit: ${rateLimit}, listSecrets: ${listSecrets}`);
    }

    async list(path) {
        try {
            const response = await this.client.get(path + "?list=true");
            return response.data;
        } catch (err) {
            throw new Error(`Error listing path ${path}: ${err}`);
        }
    }

    async read(path) {
        try {
            const response = await this.client.get(path);
            return response.data;
        } catch (err) {
            throw new Error(`Error reading path ${path}: ${err}`);
        }
    }
}

module.exports = ClientConfig;
