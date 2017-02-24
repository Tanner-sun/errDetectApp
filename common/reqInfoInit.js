/**
 * Created by SunZhenghua on 2016/12/19.
 */

'use strict';
var path = require('path');
var log4js = require('log4js');
var logger = log4js.getLogger("reqInfoInit");

/**
 * 每次接收到请求，在service处理之前先自动初始化reqInfo中的params对象，否则reqInfo会保留上一次请求时的值从而可能导致异常
 * @param reqPath
 * @returns {Function}
 */
var reqInfoCache = {};
module.exports = function (reqPath) {
    return function (req, res, next) {
        try {
            var modulePath = path.join('../', 'busiLogic', reqPath);
            var reqInfo = require(modulePath);
            var obj;
            Object.keys(reqInfo).forEach(function (key) {
                // 通过判断url属性是否存在，来判断是否是一个“标准”的reqInfo对象
                if (Object.prototype.hasOwnProperty.call(reqInfo[key], 'url')) {
                    obj = reqPath + '/' + key;
                    // 如果缓存中没有，则说明是第一次请求，先设置缓存
                    if (reqInfoCache[obj] === undefined) {
                        reqInfoCache[obj] = reqInfo[key].params || {};
                    }
                    // 如果缓存中有则直接从缓存取
                    else {
                        reqInfo[key].params = reqInfoCache[obj];
                    }
                }
            });
        } catch (err) {
            logger.warn(err);
        } finally {
            next();
        }
    }
};