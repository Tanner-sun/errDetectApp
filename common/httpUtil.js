/**
 * Created by liutingting on 2016/4/6.
 */
'use strict';
var Q = require('q');//异步 deffer
var request = require("request");
var url = require('url');
var query = require("querystring");
var log4js = require('log4js');
var logger = log4js.getLogger("httpUtil");
var commonUtil = require('./commonUtil');

module.exports = {
    // 从req中提取完整的URL
    _getFullUrl: function(req) {
        var url = '未获取到url.';
        if(req){
            url = req.protocol + '://' + req.get('Host') + req.url;
        }
        return url;
    },

    // 处理firstChannel和secondChannel
    _handleChannels : function (object, req) {
        var urlObj = url.parse(object.url, true),
            hasFirstCa = false,
            hasSecondCa = false;
        // 判断是否存在firstChannel
        if(commonUtil.getPathValue(urlObj, 'query.firstChannel') || commonUtil.getPathValue(object, 'params.firstChannel')){
            hasFirstCa = true;
        }
        // 判断是否存在secondChannel
        if(commonUtil.getPathValue(urlObj, 'query.secondChannel') || commonUtil.getPathValue(object, 'params.secondChannel')){
            hasSecondCa = true;
        }
        // 任意一个不存在则进行赋值
        if(!hasFirstCa || !hasSecondCa){
            var _ua = commonUtil.getPathValue(req || {}, 'headers.user-agent'),
                firstChannel,
                secondChannel;
            if(_ua.indexOf("LVMM")>-1 && _ua.indexOf("iPhone; CPU")>-1){
                firstChannel = "IPHONE";
                secondChannel = "AppStore";
            }else if(_ua.indexOf("LVMM")>-1 && _ua.indexOf("Android")>-1){
                firstChannel = "ANDROID";
                secondChannel = _ua.substring(_ua.indexOf("ANDROID_")+8, _ua.lastIndexOf("LVMM")-1);
            }else if(_ua.indexOf("LVMM")>-1 && _ua.indexOf("iPad; CPU OS")>-1){
                firstChannel = "IPAD";
                secondChannel = "AppStore";
            }else if(_ua.indexOf("Windows Phone")>-1 && _ua.indexOf("WebView")>-1){
                firstChannel = "WP";
                secondChannel = "WPStore";
            }else{
                firstChannel = "TOUCH";
                secondChannel = "LVMM";
            }
            urlObj.query = urlObj.query || {};
            if(!hasFirstCa){
                // 必须将search设为null，对query的操作才能生效
                urlObj.search = null;
                urlObj.query.firstChannel = firstChannel;
            }
            if(!hasSecondCa){
                urlObj.search = null;
                urlObj.query.secondChannel = secondChannel;
            }
            // 去除空属性
            for (var i in urlObj.query) {
                if (!i) {
                    delete urlObj.query[i];
                }
            }
            object.url = url.format(urlObj);
        }

        // 对末尾URL字符特殊处理
        var isEmptyQuery = Object.keys(urlObj.query || {}).length === 0;
        var lastUrlChar = object.url.substring(object.url.length - 1);
        if(isEmptyQuery && lastUrlChar !== '?'){
            object.url = object.url + '?';
        }
        if(!isEmptyQuery && lastUrlChar !== '&'){
            object.url = object.url + '&';
        }
    },

    /**
     * get请求
     * @param object 请求对象
     * @param [req] req对象（可选）
     * @returns {*|promise}
     */
    get: function (object, req) {
        var that = this,
            deferred = Q.defer();
        that._handleChannels(object, req);
        var option = {
            url: object.url,
            qs: object.params,
            method: "GET",
            timeout: object.timeout || 10000,
            headers: {
                'signal': 'ab4494b2-f532-4f99-b57e-7ca121a137ca',
                'User-Agent': commonUtil.getPathValue(req || {}, 'headers.user-agent', 'Mozilla')
            }
        };
        logger.info("GET " + option.url + query.stringify(option.qs));
        var startTime = Date.now();
        request(option, function (e, res, body) {
            if (e) {
                logger.error('接口请求出错！ URL：' + option.url + query.stringify(option.qs) + ' 所在页面：' + that._getFullUrl(req));
                logger.error(e);
                deferred.resolve({error: e.message});
            } else if (res.statusCode == 200) {
                try {
                    logger.info('请求耗时：' + (Date.now() - startTime) / 1000 + 's. URL:' + option.url + query.stringify(option.qs));
                    deferred.resolve(JSON.parse(body));
                } catch (err) {
                    logger.error("接口返回数据异常：statusCode=" + res.statusCode + "  " + option.url + query.stringify(option.qs) + ' 所在页面：' + that._getFullUrl(req));
                    logger.error(err);
                    deferred.resolve({});
                }
            } else {
                logger.error("接口请求异常：statusCode=" + res.statusCode + "  " + option.url + query.stringify(option.qs)+ ' 所在页面：' + that._getFullUrl(req));
                deferred.resolve({error: "接口请求异常：statusCode=" + res.statusCode + "  " + res.request.href, code: res.statusCode, body: body});
            }
        });
        return deferred.promise;
    },

    /**
     * post请求
     * @param object 请求对象
     * @param [req] req对象（可选）
     * @returns {*|promise}
     */
    post: function (object, req) {
        var that = this,
            deferred = Q.defer();
        that._handleChannels(object, req);
        var option = {
            url: object.url,
            method: "POST",
            form: object.params,
            timeout: object.timeout || 10000,
            headers: {
                'signal': 'ab4494b2-f532-4f99-b57e-7ca121a137ca',
                'User-Agent': commonUtil.getPathValue(req || {}, 'headers.user-agent', 'Mozilla')
            }
        };

        logger.info("POST url:" + option.url);
        logger.info("param:" + JSON.stringify(option.form));
        var startTime = Date.now();
        request(option, function (e, res, body) {
            if (e) {
                logger.error('接口请求出错！ URL：' + option.url + ' FORM：' + JSON.stringify(option.form) + ' 所在页面：' + that._getFullUrl(req));
                logger.error(e);
                deferred.resolve({error: e.message});
            } else if (res.statusCode == 200) {
                try {
                    logger.info('请求耗时：' + (Date.now() - startTime) / 1000 + 's. URL:' + option.url);
                    deferred.resolve(JSON.parse(body));
                } catch (err) {
                    logger.error("接口返回数据异常：statusCode=" + res.statusCode + "  " + option.url + ' FORM：' + JSON.stringify(option.form) + ' 所在页面：' + that._getFullUrl(req));
                    logger.error(err);
                    deferred.resolve({});
                }
            } else {
                logger.error("接口请求异常：statusCode=" + res.statusCode + "  " + res.request.href + ' 所在页面：' + that._getFullUrl(req));
                deferred.resolve({error: "接口请求异常：statusCode=" + res.statusCode + "  " + res.request.href, code: res.statusCode, body: body});
            }
        });
        return deferred.promise;
    },
    /*请求tdk接口，并替换其中动态参数
     * @key  接口参数
     * @obj  指定需要替换的对象，包含替换的标识和被替换的内容
     *       {reg1:content1, reg2:content2...}
     * */
    replaceTDK: function (key, obj, req) {
        var date = new Date();
        obj.year = date.getFullYear() + '年';
        obj.month = date.getMonth() + 1;
        obj.month = obj.month + '月';
        obj.day = date.getDay() + '日';
        var deferred = Q.defer();
        var option = {
            url: "http://m.lvmama.com/api/router/rest.do?method=api.com.tdk.queryTdkRule&version=1.0.0&debug=false&format=json&",
            method: "GET",
            qs: {key: key},
            timeout: 10000,
            headers: {
                'signal': 'ab4494b2-f532-4f99-b57e-7ca121a137ca',
                'User-Agent': commonUtil.getPathValue(req || {}, 'headers.user-agent', 'Mozilla')
            }
        };
        this._handleChannels(option, req);
        logger.info("请求tdk接口 " + option.url + query.stringify(option.qs));
        request(option, function (e, res) {
            if (e) {
                deferred.resolve({t: "", d: "", k: ""});
            } else {
                try {
                    var data = JSON.parse(res.body);
                    var t = data.data.title;
                    var d = data.data.description;
                    var k = data.data.keywords;
                    for (var item in obj) {
                        var reg = new RegExp(eval("/\\{\\$?" + item + "\\}/g"));
                        t = t.replace(reg, obj[item]);
                        d = d.replace(reg, obj[item]);
                        k = k.replace(reg, obj[item]);
                    }

                    deferred.resolve({t: t, d: d, k: k});
                } catch (err) {
                    logger.error(err);
                    deferred.resolve({t: "", d: "", k: ""});
                }
            }
        });
        return deferred.promise;
    },

    /**
     * 同时发送多个请求
     * @param allReq 请求对象数组
     * @param [req] req对象（可选）
     * @returns {*}
     */
    combineReq: function (allReq, req) {
        var arr = [];
        var that = this;
        allReq.forEach(function (item) {
            var deferred = Q.defer();
            //约定：如果item是空对象{}，则会返回null
            if(Object.keys(item).length === 0){
                deferred.resolve(null);
                arr.push(deferred.promise);
            }else{
                if (item.method && item.method.toLowerCase() === "post"){
                    arr.push(that.post(item, req));
                }else{
                    arr.push(that.get(item, req));
                }

            }
        });
        return Q.all(arr).spread(function () {
            return arguments;
        });
    }
};




