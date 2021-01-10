
const mongoose = require('mongoose');
const redis = require('redis');
const Blog = mongoose.model('Blog');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);

const util = require('util');
client.hget = util.promisify(client.hget);

const originalExec = mongoose.Query.prototype.exec; // the original exec() function

/**
 * when it is called, meaning that the cache mode is needed
 * @param {Object} options 
 */
mongoose.Query.prototype.cache = function(options = {}) {
    this._cache = true; 
    this.hashKey = JSON.stringify(options.key || '');

    return this;
}

/**
 * The exec function will always run every time a query is run, 
 * this means that every time the Mongoose function is called, it will call the exec function.
 */
mongoose.Query.prototype.exec = async function () {    

    if (!this._cache) // do not need to select from cache
    {
        const result = await originalExec.apply(this, arguments);
        return result;
    }

    // make a memory copy to prevent changing the query
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }));

    // Is there any redis data in redis related to this query
    const cacheValue = await client.hget(this.hashKey, key);
    
    if (cacheValue) // If yes, then respond to the request right away and return, no need to pull from the database.
    {
        const doc = JSON.parse(cacheValue);
        return Array.isArray(doc) // 
            ? doc.map(d => new this.model(d)) // an array of records returned
            : new this.model(doc); // a single returned
    } 

    // calling the originalExec function to perform original operations. 
    const result = await originalExec.apply(this, arguments);

    const ONE_MINUTE_IN_SECONDS = 60; 
    client.hset(this.hashKey, key, JSON.stringify(result), 'EX', ONE_MINUTE_IN_SECONDS);  // expires in 1 minute
    return result;
}

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
}
