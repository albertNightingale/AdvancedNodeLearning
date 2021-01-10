
const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
    await next(); // await for all the code to be completed before executing this middleware

    clearHash(req.user.id);
};