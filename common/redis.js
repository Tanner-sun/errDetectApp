/**
 * Created by zhangfeng on 2016/8/16.
 */
var redis = require('redis');
var logger = require('log4js').getLogger("page1");
module.exports = function (options,name) {
    var client = redis.createClient(options);
    var f = function (req, res, next) {
        if (client.connected) {
            req[name] = client;
            next();
        }else {
            client.on('ready', function () {
                logger.info('Redis connection ready.');
                req[name] = client;
                next();
            });
        }
    };

    // Expose the client in the return object.
    f.client = client;

    f.connect = function (next) {
        if (client && client.connected) {
            client.once('end', function () {
                client = redis.createClient(options);
                next();
            });
            client.quit();
        }else {
            client = redis.createClient(options);
            next();
        }
    };

    f.disconnect = function (next) {
        if (client) {
            client.once('end', function () {
                client = null;
                next();
            });
            client.quit();
        }else {
            next();
        }
    };

    return f;
};

