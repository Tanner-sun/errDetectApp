/**
 * Created by zhangfeng on 2016/5/18.
 */
'use strict';
var hbs=require('hbs');
var log4js = require('log4js');
var logger = log4js.getLogger("helper");
var xss = require('xss');
var commonUtil = require('./commonUtil');

exports.helper = function () {
    var blocks = {};
    hbs.registerHelper('extend', function(name, context) {
        var block = blocks[name];
        if (!block) {
            block = blocks[name] = [];
        }
        block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
    });

    hbs.registerHelper('block', function(name) {
        var val = (blocks[name] || []).join('\n');

        // clear the block
        blocks[name] = [];
        return val;
    });

    /**
     * 复杂表达式
     * 注意：表达式str中的变量名前必须加上this.
     */
    hbs.registerHelper('ex', function(str) {
        if(!str){
            logger.error('Handlerbars Helper "ex" 必须跟一个不为空的字符串！');
            return;
        }
        var result = "";
        try{
            (function(){result = eval(str)}).call(this);
            if (result) {
                return result;
            }
        }catch(e){
            logger.error('Handlerbars Helper "ex" 包含了错误的表达式: ' + str + ' （提示：表达式内部的变量必须加上this.）');
        }
    });
    
    /**
     * 复杂表达式的判断
     * {{#lvIf "..."}}
     *      <span>条件成立</span>
     * {{else}}
     *      <span>条件不成立</span>
     * {{/lvIf}}
     * 注意：表达式str中的变量名前必须加上this.
     * */
    hbs.registerHelper('lvIf', function(str,options) {
        if(!str){
            logger.error('Handlerbars Helper "lvIf" 必须跟一个不为空的字符串！');
            return options.inverse(this);
        }
        var result = "";
        try{
            (function(){result = eval(str)}).call(this);
            if (result) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        }catch(e){
            logger.error('Handlerbars Helper "lvIf" 包含了错误的表达式: ' + str + ' （提示：表达式内部的变量必须加上this.）');
            return options.inverse(this);
        }
    });

    hbs.registerHelper('compare',function(left,operator,right,options){
        if(arguments.length<3){
            throw  new Error("Handlerbars Helper 'compare' needs 2 parameters");
        }
        var operators = {
            '==':     function(l, r) {return l == r; },
            '===':    function(l, r) {return l === r; },
            '!=':     function(l, r) {return l != r; },
            '!==':    function(l, r) {return l !== r; },
            '<':      function(l, r) {return l < r; },
            '>':      function(l, r) {return l > r; },
            '<=':     function(l, r) {return l <= r; },
            '>=':     function(l, r) {return l >= r; },
            'typeof': function(l, r) {return typeof l == r; }
        };
        if (!operators[operator]) {
            throw new Error('Handlerbars Helper "compare" doesn\'t know the operator ' + operator);
        }
        var result = operators[operator](left, right);

        if (result) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    hbs.registerHelper('slice', function(str,start,end) {
        if(str){
            return str.slice(start,end);
        }
    });

    hbs.registerHelper('toFixed', function(str,num) {
        if(!isNaN(str)){
            return str.toFixed(num);
        }
    });

    hbs.registerHelper("addOne",function(index){
        //返回+1之后的结果
        return index + 1;
    });
    /*
     type与尺寸对应关系如下:
     1：1200_480；
     2：720_540；
     3：480_320；
     4：360_270；
     5：300_200；
     6：200_150；
     7：200_80；
     8：180_120；
     9：121_91；
     10：定宽 1280；
     11：定宽 960；
     12：定宽 720；
     13：定宽 480；
     注意：只有url含有下列特征的地址才能转换相对应的尺寸，否则返回原始url
     uploads/pc/place2
     uploads/places
     uploads/comment
     uploads/php/origin
     uploads/pc/place_vst/hotels
     */
    hbs.registerHelper("picFilter",function(picUrl,type){
        var sizeReg=/_(1200_480|720_540|480_320|360_270|300_200|200_150|200_80|180_120|121_91|1280_|960_|720_|480_)\./;
        var picReg=/\.(png|jpg|bmp|gif|jpeg)$/i;
        var map=["1200_480","720_540","480_320","360_270","300_200","200_150","200_80","180_120","121_91","1280_","960_","720_","480_"];
        if(!/uploads/.test(picUrl)){
            return picUrl;
        }else if(sizeReg.test(picUrl)){
            return picUrl.replace(sizeReg,"_"+map[type-1]+".");
        }else{
            var tempArray=picUrl.split(picReg);
            return tempArray[0]+"_"+map[type-1]+"."+tempArray[1];
        }
    });

    hbs.registerHelper("distanceFilter", function(input) {
        if (input != undefined) {
            var DIST = Math.round(input / 100) / 10;
            return DIST;
        }
        return  input;
    })

    /**
     * @description 搜索结果页 poi类型转换
     * @params VIEWSPOT 景点 SCENIC_ENTERTAINMENT 娱乐点 RESTAURANT 餐厅 SHOP 购物点 HOTEL 酒店
     * @author Kevin
     */
    hbs.registerHelper('destTypeFilter',  function (input) {

        if (input != ""||input != undefined) {
            switch (input){
                case "VIEWSPOT" : input="景点";
                    break;
                case "SCENIC_ENTERTAINMENT" :input="娱乐";
                    break;
                case "RESTAURANT" :input="餐厅";
                    break;
                case "SHOP" :input="购物";
                    break;
                case "HOTEL" :input="酒店";
                    break;
            }
        }
        return  input;
    });

    hbs.registerHelper('objToString',function(obj){

        if (obj){
            return JSON.stringify(obj)
        }
    })

    /**
     * 当给的第一个值为空时，返回第二个值
     * 示例：{{coalesce commentNum 0}}
     */
    hbs.registerHelper('coalesce', function(a, b) {
        return a || b;
    });

    hbs.registerHelper('hotDestLinkFilter',  function (destObj) {//目的地项目，目的地聚合页，热门去处产品链接
        var hotDestTy = destObj.destType.toUpperCase();
        var linkUrl = "";
        if (hotDestTy == 'VIEWSPOT' || hotDestTy == 'SCENIC_ENTERTAINMENT' || hotDestTy == 'RESTAURANT' || hotDestTy == 'HOTEL' || hotDestTy == 'SHOP') {
            linkUrl = "//m.lvmama.com/lvyou/poi/sight-" + destObj.destId + ".html";
        } else {
            linkUrl = "//m.lvmama.com/dest/" + destObj.pinyin + destObj.destId;
        }
        return linkUrl;
    });

	hbs.registerHelper('tourLinkFilter',  function (routeObj,fromDestId) {//目的地项目，目的地聚合页，自由行（景加酒、机加酒）产品的链接
        var routeType = routeObj.routeDataFrom;
        var productId = routeObj.productId;
        var linkUrl = "";
        if (routeType == "TUANGOU" || routeType == "SECKILL") {
            linkUrl = "//m.lvmama.com/tuan/seckill/product-" + productId;
        } else if (routeObj.productDestId != "" && routeObj.productDestId != "0") {
            linkUrl = "//m.lvmama.com/product/" + productId + "/f" +  fromDestId;
        }else {
            linkUrl = "//m.lvmama.com/product/" + productId;
        }
        return linkUrl;
    });

	hbs.registerHelper('starCount', function (avgScore) {
        if(!avgScore){
            return '';
        }
        var one = parseInt(avgScore.toString().substring(0, 1)),
            two = parseInt(avgScore.toString().substring(2, 3));
        if (!two) {
            two = 0;
        }
        if (two <= 3 && two > 0) {
            two = 0;
        } else if (two >= 3 && two <= 8) {
            two = 0.5;
        } else if (two >= 8) {
            two = 1;
        }
        var sum = one + two;
        var className = '';
        if (sum.toString().length <= 1) {
            className = "x" + sum;
        } else {
            sum = sum.toString().split(".");
            className = "x" + sum[0] + sum[1];
        }
        return className;
    });

    /**
     *  日期转换
     *  "2016-09-30"-> '09/30'
     * 示例：{{dateTos str}
     */
    hbs.registerHelper('dateTos',function(str){
        var date = str.split("-")[1] + "/" + str.split("-")[2];
        return date;
    });

    hbs.registerHelper ('startCount',function(count) {
        var c = Math.floor(Number(count) * 100) / 100 + "";
        var h = 0;
        if (Number(c.split(".")[1]) < 30) {
            h = 0;
        }
        if (Number(c.split(".")[1]) >= 30 && Number(c.split(".")[1]) < 80) {
            h = 0.30;
        }
        if (Number(c.split(".")[1]) >= 80) {
            h = 0.60;
        }
        var con = ((Number(c.split(".")[0])) * 60) / 100 + h;
        var avgScore = "background: url(//m.lvmama.com/webapp/product/static/release/img/star.png) 0 -" + (0.09 + con) + "rem no-repeat; background-size: 100%;";
        return avgScore;
    });

    /**
     * 字符串转义特殊字符
     * @param str 待转义的字符串
     * @param replaceToBr 是否要替换\r\n为<br>，默认false
     * @returns {*}
     */
    hbs.registerHelper('escapeData',function(str, replaceToBr){
        if (commonUtil.getPathValue(replaceToBr, 'name') === 'escapeData'){
            replaceToBr = false;
        }
        var result = commonUtil.escapeData(str, replaceToBr);
        return commonUtil.xss(result);
    });

    /**
     * 过滤字符串中的不安全字符，防止XSS攻击
     * 使用场景：视图模板中通过3个花括号进行数据的展示，如：{{{content}}}，但content内容可能包含攻击脚本，需写成：{{{xss content}}}
     */
    hbs.registerHelper('xss', function(str){
        return commonUtil.xss(str);
    });

    /**
     * 转义一个字符串
     */
    hbs.registerHelper('escape', function(str){
        return escape(str);
    });
};