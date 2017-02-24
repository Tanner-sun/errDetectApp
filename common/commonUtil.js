/**
 * Created by Sunzhenghua on 2016/6/17.
 */
'use strict';
var crypto = require('crypto');
var log4js = require('log4js');
var logger = log4js.getLogger("commonUtil");
var hbs = require('hbs');
var url = require('url');
var util = require('util');
var xss_module = require('xss');
var compiledFuncCache = {}; //视图编译结果缓存

module.exports = {
    /**
     * 判断对象中是否存在指定属性（或属性路径）
     * 示例：判断{a:{b:{c:[{d:123}]}}}是否存在a.b.c[0].d => hasPath(obj, 'a.b.c[0].d')
     * @param object 对象
     * @param path 属性值，可以是路径，如：'a.b.c[0].d'
     * @returns {boolean} 判断结果
     */
    hasPath: function(object, path) {
        if (typeof object !== 'object' || typeof path !== 'string') {
            return false;
        }
        path = path.split(/[\.\[\]]/).filter(function(n) {
            return n != ''
        });
        var index = -1,
            len = path.length,
            key,
            result = true;
        while (++index < len) {
            key = path[index];
            if (!Object.prototype.hasOwnProperty.call(object, key)) {
                result = false;
                break;
            }
            object = object[key];
        }
        return result;
    },

    /**
     * 获取对象的指定属性（或属性路径）
     * 示例：获取对象{a:{b:{c:[{d:123}]}}}的属性a.b.c[0].d => getPathValue(obj, 'a.b.c[0].d')
     * @param object 对象
     * @param path 属性值，可以是路径，如：'a.b.c[0].d'
     * @param defaultVal [optional] 默认值，可不传
     * @returns 返回结果
     */
    getPathValue: function(object, path, defaultVal) {
        var ret = defaultVal !== undefined ? defaultVal : '';
        if (object === null || typeof object !== 'object' || typeof path !== 'string') {
            return ret;
        }
        path = path.split(/[\.\[\]]/).filter(function(n) {
            return n != ''
        });
        var index = -1,
            len = path.length,
            key,
            result = true;
        while (++index < len) {
            key = path[index];
            if (!Object.prototype.hasOwnProperty.call(object, key)) {
                result = false;
                break;
            }
            object = object[key];
        }
        if (result) {
            ret = object;
        }
        return ret;
    },

    /**
     * 判断设备平台
     * */
    isDevice: function(req) {
        var ua = req.headers['user-agent'] || '';
        if (ua.indexOf('LVMM') > -1) {
            if (ua.indexOf('iPhone') > -1) {
                return 'ip';
            } else if (ua.indexOf('iPad') > -1) {
                return 'pad';
            } else if (ua.indexOf('Android') > -1) {
                return 'ad';
            } else if (agent.indexOf("Windows") > 0 && agent.indexOf("Phone") > 0) {
                return 'wp';
            }
        } else {
            return 'wap';
        }
    },

    /**
     * 判断是否为客户端,并返回客户端版本状态
     * @param req request对象
     * @returns {*}
     */
    isClient: function(req) {
        /*
         * 新的客户端判断逻辑
         * 0 非客户端
         * 01 最新版本客户端
         * 1 ios&android客户端
         * 02 ipad最新客户端
         * 3 weixin客户端
         * 2 ipad客户端
         * 4 wp客户端
         * */
        var that = this;
        var agent = req.headers['user-agent'] || '';
        var wp_version = req.query.wpversion;
        var wp_agent = req.query.wpagent;
        if (agent.indexOf("MicroMessenger") != -1) {
            return "3";
        } else if (agent.indexOf("LVMM") > 0) {
            return "1";
        } else if (agent.indexOf("Windows") > 0 && agent.indexOf("Phone") > 0 && wp_agent == "LVMM") {
            //判别来自wp系列
            if (wp_version == that.nearestVerWP) {
                return "04";
            } else {
                return "4";
            }
        } else {
            return "0"; //非客户端
        }
    },
    /*对象是否为空*/
    isNotEmpty: function(Arr) {
        if (!Arr || Arr == '' || Arr == null || Arr == 'undefined' || Arr == undefined || Arr.length == 0) {
            return false;
        }
        return true;
    },
    //判断对象是否为空
    isNotEmptyObject: function(obj) {
        if (!obj) {
            return false;
        }
        for (var key in obj) {
            return true;
        }
        return false;
    },
    destOrPOI: function(typeStr) {
        /*CONTINENT      大洲
         * SPAN_COUNTRY   跨国家地区
         * COUNTRY        国家
         * SPAN_PROVINCE  跨州省地区
         * PROVINCE       州省
         * SPAN_CITY      跨城市地区
         * CITY           城市
         * SPAN_COUNTY    跨区县地区
         * COUNTY         区/县
         * SPAN_TOWN      跨乡镇地区
         * TOWN           乡镇/街道
         * SCENIC         景区
         * VIEWSPOT       景点
         * SCENIC_ENTERTAINMENT 娱乐点
         * RESTAURANT     餐厅
         * HOTEL          酒店
         * SHOP           购物点
         * VIEWSPOT,SCENIC_ENTERTAINMENT,RESTAURANT,HOTEL,SHOP 属于POI，其他属于目的地
         * */
        var poiTypes = ['VIEWSPOT', 'SCENIC_ENTERTAINMENT', 'RESTAURANT', 'HOTEL', 'SHOP'];
        var type = "dest";
        poiTypes.forEach(function(ele) {
            if (typeStr == ele)
                type = "poi";
        });
        return type;
    },
    /**
     * 获取客户端ip地址
     * @param req
     * @returns {*}
     */
    getClientIp: function(req) {
        var xForwordedFor = req.headers['x-forwarded-for'];
        var xRealIp = req.headers['x-real-ip'];
        var ipAddress = null;
        // 如果通过多级反向代理，X-Forwarded-For的值不止一个，而是一串用逗号分隔的IP值，此时取X-Forwarded-For中第一个非unknown的有效IP字符串
        var proxyArray;
        if (xForwordedFor) {
            proxyArray = xForwordedFor.split(',').filter(function (item) {
                return item && item !== 'unknown'
            });
            if (proxyArray && proxyArray[0]) {
                ipAddress = proxyArray[0];
            }
        }
        // 否则取x-real-ip的值
        else if (xRealIp) {
            ipAddress = xRealIp;
        }
        // 否则取req.connection.remoteAddress
        else if (req.connection && req.connection.remoteAddress) {
            ipAddress = req.connection.remoteAddress;
        }
        // 否则取req.socket.remoteAddress
        else if (req.socket && req.socket.remoteAddress) {
            ipAddress = req.socket.remoteAddress;
        }
        // 否则取req.connection.socket.remoteAddress
        else if (req.connection && req.connection.socket && req.connection.socket.remoteAddress) {
            ipAddress = req.connection.socket.remoteAddress;
        }

        // 如果包含了IPv6，则过滤一下
        if (ipAddress) {
            if (ipAddress.indexOf(':') > -1) {
                ipAddress = ipAddress.replace(/^.*:/, '');
            }
        }

        return ipAddress;
    },

    /**
     * 将utf8字符串编码为base64字符串
     * @param str
     * @returns {String}
     */
    encodeBase64: function(str) {
        return new Buffer(str, 'utf8').toString('base64');
    },

    /**
     * 将base64字符串解码为utf8字符串
     * @param str
     * @returns {String}
     */
    decodeBase64: function(str) {
        return new Buffer(str, 'base64').toString('utf8');
    },

    /**
     * md5加密方法
     * @param str
     * @returns {*}
     */
    md5: function(str) {
        return crypto.createHash('md5').update(str, 'utf8').digest('hex');
    },

    /**
     * 将查询对象转为查询字符串并md5加密
     * @param obj
     * @returns {*}
     */
    addSaltNumber: function(obj) {
        var spacialVal = "Vkd0U1UxSkdWbFZYYldoYVZtMDRlRmt5TVhOTmF6VllVbXhTYVdGc1dtRldhazVPVFZkSmVsSnVUazlXYlhoM1ZUTndWazFYU2xWWmVrWlBWMFZhUjFSclVsTlNSazQyVm14d2JGWnRZM2hXUldoSFpXczFWVlp1YUZOV1JscG9Wa1JLTTAxV2JGZGFSV3hQWWtkNFNWVXdWVFZOVmxZMlZtNWFWVTFyV2tOYVJrNHdWa1UxV1ZGcVJtaFhSbG8yVmtSR2EyRXlSWGRQVmxKUFVqSjNlRlpZY0dGaU1sSllVbXR3YUUxc1duTlhWbVJ2VlVkR1ZXSklaR3RXVkd4RFdWWk9NR0ZHVFhwUmJYaHBWbFZ3ZVZONlJrNU5SMUpaVm01Q1dHSlVSWGhXYWtKTFlqQnplVkpzYUdwTlJHd3dWakJvVjA1V1NraGpSelZVWVRKb01GbHJhRXRTVjBwSVkwWndUMDFxVlhsV01uUnZUVzFTY21OSVdrNVNSbG96V2xaV2MxUnNXa2hqU0ZKcFVrWndXbGt3YUVOa01rcDBUVlJHVkdWVWJIcFpNRll3WWxkS1NHRkhhR3hpVkVaM1dURmFiMk15UmxaaVNHeHBZbFJHY0ZwSE1ERmtSMGw0Vlc1R1lVMUhlRFZaYTJSM1V6RndkR1JFUm1wWFNFSXhXV3hqTlZaWFNraGpla3BZVWpOb00xWXhaR0ZrTVc5NFlrY3hhMkpzY0V4Wk1qRXdUVlpzVmxWdVVtRk5TR2Q1V1ZST1YyRkdiSFJQV0d4cVlURktlbGx0ZUhkU1YwVjZWbXR3YW1KWVVYaFpha3BMWkVkR1ZtTkZiR2xpVkVZeVZtdGpOVTFzYkZoVGJrWmhUVWQzZVZsVVRsZFRiRXBJVFZoT2FVMXNiM2xhUjNSelRtMUtkVlpVUWsxTmFrWXlWa1ZrZDJNeVRuVlJWRTVyWW14d1MxcFhNSGhsVm14WFZXNVNhRmRGV2xwWk1HUnJXVlpXU0dSRVJsVlRSWEF5V1d4YWQyVlhTa2hhUm5CaFlsUkdlbGt5ZEZOa01rcEZXa1JLYUdKWFVrdFZNVkYzVUZFOVBRPT0=";
        var indexOfKey = 0;
        var bodyCluster = "";
        var bodyParasArray = [];
        //对象转数组
        delete obj.lvtukey;

        for (var key in obj) {
            bodyParasArray[indexOfKey] = key;
            indexOfKey++;
        }
        //数组排序  + "=" + obj[key]
        bodyParasArray.sort();
        //拼接字符串
        bodyParasArray.map(function(item, i) {
            if (i != 0) {
                bodyCluster = bodyCluster + "&" + item + "=" + obj[item];
            } else {
                bodyCluster = bodyCluster + item + "=" + obj[item];
            }
        });

        var lvkey = this.md5(bodyCluster + spacialVal);
        return lvkey;
    },

    //进行经纬度转换为距离的计算
    rad: function(d) {
        return d * Math.PI / 180.0; //经纬度转换成三角函数中度分表形式。
    },

    //计算距离，参数分别为第一点的纬度，经度；第二点的纬度，经度
    getDistance: function(lat1, lng1, lat2, lng2) {
        var radLat1 = this.rad(lat1);
        var radLat2 = this.rad(lat2);
        var a = radLat1 - radLat2;
        var b = this.rad(lng1) - this.rad(lng2);
        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
            Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * 6378.137; // EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000; //输出为公里
        s = s.toFixed(); //四舍五入取整
        return s;
    },
    /**
    /**
     * 深拷贝任意类型对象
     * 参考修改自http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript/25921504
     * 支持：值类型、普通对象、数组、日期、正则表达式、DOM
     * @param src 要拷贝的对象
     * @param _visited 内部使用，不用传参！
     * @returns {*} 传入的对象的副本
     */
    deepCopy: function(src, /* INTERNAL */ _visited) {
        if (src == null || typeof(src) !== 'object') {
            return src;
        }

        // Initialize the visited objects array if needed
        // This is used to detect cyclic references
        if (_visited == undefined) {
            _visited = [];
        }
        // Otherwise, ensure src has not already been visited
        else {
            var i, len = _visited.length;
            for (i = 0; i < len; i++) {
                // If src was already visited, don't try to copy it, just return the reference
                if (src === _visited[i]) {
                    return src;
                }
            }
        }

        // Add this object to the visited array
        _visited.push(src);

        //Honor native/custom clone methods
        if (typeof src.clone == 'function') {
            return src.clone(true);
        }

        //Special cases:
        //Array
        if (Object.prototype.toString.call(src) == '[object Array]') {
            //[].slice(0) would soft clone
            ret = src.slice();
            var j = ret.length;
            while (j--) {
                ret[j] = this.deepCopy(ret[j], _visited);
            }
            return ret;
        }
        //Date
        if (src instanceof Date) {
            return new Date(src.getTime());
        }
        //RegExp
        if (src instanceof RegExp) {
            return new RegExp(src);
        }
        //DOM Elements
        if (src.nodeType && typeof src.cloneNode == 'function') {
            return src.cloneNode(true);
        }

        //If we've reached here, we have a regular object, array, or function

        //make sure the returned object has the same prototype as the original
        var proto = (Object.getPrototypeOf ? Object.getPrototypeOf(src) : src.__proto__);
        if (!proto) {
            proto = src.constructor.prototype; //this line would probably only be reached by very old browsers
        }
        var ret = Object.create(proto);

        for (var key in src) {
            if (Object.prototype.hasOwnProperty.call(src, key)) {
                ret[key] = this.deepCopy(src[key], _visited);
            }
        }
        return ret;
    },

    /**
     * 字符串转义特殊字符
     * @param str 待转义的字符串
     * @param replaceToBr 是否要替换\r\n为<br>，默认false
     * @returns {*}
     */
    escapeData: function (str, replaceToBr) {
        if (str === undefined) {
            return '';
        }
        if(typeof str !== 'string'){
            logger.error('escapeData方法的入参必须是字符串类型！');
            return "";
        }
        if (replaceToBr === undefined){
            replaceToBr = false;
        }
        var result = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n');
        if (replaceToBr){
            result = result.replace(/(\\r)?\\n/g, '<br>');
        }
        return result;
    },

    /**
     * 根据Handlebars视图文件生成编译后的函数
     * @param filePath 视图文件路径
     * @param cache 是否走缓存
     * @returns {*}
     */
    getCompiledFunc: function (filePath, cache) {
        var template,
            func;
        if(cache === undefined){
            cache = true;
        }
        if(cache && compiledFuncCache[filePath]){
            return compiledFuncCache[filePath];
        }else{
            try{
                template = require('fs').readFileSync(filePath).toString('utf8');
            }catch(err){
                logger.error(err);
                template = '';
            }
            func = hbs.handlebars.compile(template);
            if(cache){
                compiledFuncCache[filePath] = func;
            }
            return func;
        }
    },

    /**
     * 过滤不安全的字符
     * @param html
     * @returns {string}
     */
    xss: function (html) {
        if (typeof html !== 'string') {
            return '';
    }
        var options = {
            onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
                if (name.substr(0, 5) === 'data-' || name.substr(0, 3) === 'lv-' || name === 'style') {
                    return name + '="' + xss_module.escapeAttrValue(value) + '"';
                }
            }
        };
        var myxss = new xss_module.FilterXSS(options);
        return myxss.process(html);
    },

    /**
     * 给Url添加查询参数
     * 示例：addUrlParams('http://baidu.com/index.html?a=1&b=2', {b:1, c:3}) => http://baidu.com/index.html?a=1&b=1&c=3
     * @param originalUrl
     * @param paramObj
     * @returns {*}
     */
    addUrlParams: function (originalUrl, paramObj) {
        var urlObj = url.parse(originalUrl, true);
        var newQuery = util._extend(urlObj.query, paramObj);
        urlObj.search = null;
        urlObj.query = newQuery;
        return url.format(urlObj);
    }
};