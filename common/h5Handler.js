/**
 * Created by SunZhenghua on 2016/11/17.
 */

var log4js = require('log4js');
var logger = log4js.getLogger('h5Handler');
var request = require('request');

/**
 * /h5/开头的URL，本地开发环境如果没有配nginx应该是访问不了的，因为node项目中没有对应的路由
 * 该中间件会自动抓取/h5/之后部分的URL的页面数据，并保持原始URL不变（即使抓取的页面包含了3xx跳转）
 * @type {module.exports}
 */
exports = module.exports = function (req, res, next) {
    var pattern = /^\/h5(\/.*)/,
        rawUrl = req.url,
        localUrl,
        localFullUrl;
    if(pattern.test(rawUrl) && process.env.NODE_ENV !== 'production'){
        localUrl = rawUrl.match(pattern)[1];
        logger.info('服务器接收到URL为 ' + rawUrl + ' 的访问，已自动抓取 ' + localUrl + ' 的数据');
        localFullUrl = req.protocol + '://' + req.get('Host') + localUrl;
        request({
            url: localFullUrl,
            followRedirect: false //不follow跳转，重新处理3xx请求，以便能够拿到跳转后的URL
        }, function (err) {
            if(err){
                logger.error(err);
                next(err);
            }
        }).pipe(res);
    } else {
        next();
    }
};