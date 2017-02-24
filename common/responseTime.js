/**
 * Created by SunZhenghua on 2017/1/12.
 */

'use strict';
var onHeaders = require('on-headers');
var log4js = require('log4js');
var logger = log4js.getLogger("responseTime");

/**
 * 记录每次请求耗时，并在响应头中添加X-Response-Time字段
 * @returns {Function}
 */
module.exports = function (){
    return function(req, res, next){
        var start = new Date;
        onHeaders(res, function () {
            var duration = new Date - start;
            logger.info('URL: ' + req.originalUrl + ' 请求耗时: ' + duration + 'ms');
            res.setHeader('X-Response-Time', duration + 'ms');
        });
        next();
    };
};