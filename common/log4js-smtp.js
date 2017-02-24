"use strict";

var layouts = require("../node_modules/log4js/lib/layouts");
var mailer = require("nodemailer");
var os = require('os');

var logEventBuffer = [];
var subjectLayout;
var layout;

var unsentCount = 0;
var shutdownTimeout;

var sendInterval;
var sendTimer;

var config;

//HTML邮件内容的样式
var css = '<style>.log div{} .log ul{padding: 0;} .log li{list-style: none;} .log .time{color: #fd443a;} .log .category{color: lightseagreen;} .log .data{color: #333;}</style>';

function sendBuffer() {
    if (logEventBuffer.length > 0) {

        var transportOpts = getTransportOptions(config);
        var transport = mailer.createTransport(transportOpts);
        var firstEvent = logEventBuffer[0];
        var count = 0;
        var body_txt = ''; //纯文本内容
        var body_html = ''; //HTML格式内容
        var log_html = '';
        var log_txt = '';
        var buffer;
        while (logEventBuffer.length > 0) {
            buffer = logEventBuffer.shift();

            //过滤404
            if(buffer.data && buffer.data.length > 0){
                if(typeof(buffer.data[0]) === 'string' && buffer.data[0].indexOf('页面未找到') > 0){
                    continue;
                }
            }
            //过滤接口报错
            if(buffer.categoryName === 'httpUtil'){
                continue;
            }

            count++;

            //HTML内容处理
            log_html = layout(buffer, config.timezoneOffset);
            // 将stack的换行符由\n改为<br>
            log_html = log_html.replace(/\n/g, '<br>&nbsp;&nbsp;&nbsp;&nbsp;');
            body_html += log_html;

            //纯文本内容处理
            log_txt = layouts.basicLayout(buffer, config.timezoneOffset) + '\n';
            body_txt += log_txt;
        }

        //如果没有待发数据，则退出
        if(count === 0){
            return;
        }

        body_html += '</ul></div>';
        body_html = css + "<div class='log'><h3>错误日志（共" + count + "条）：</h3><ul>" + body_html;
        var now = new Date();
        var msg = {
            to: config.recipients,
            subject: 'node错误日志' + now.getFullYear() + (now.getMonth() + 1) + now.getDate(),
            headers: {"Hostname": os.hostname()}
        };

        if (true === config.attachment.enable) {
            msg[config.html ? "html" : "text"] = body_html;
            msg.attachments = [
                {
                    filename: config.attachment.filename,
                    contentType: 'text/x-log',
                    content: body_txt //附件内容使用纯文本
                }
            ];
        } else {
            msg[config.html ? "html" : "text"] = body_html;
        }

        if (config.sender) {
            msg.from = config.sender;
        }
        transport.sendMail(msg, function (error) {
            if (error) {
                console.error("log4js.smtpAppender - Error happened", error);
            }
            transport.close();
            unsentCount -= count;
        });
    }
}

function getTransportOptions() {
    var transportOpts = null;
    if (config.SMTP) {
        transportOpts = config.SMTP;
    } else if (config.transport) {
        var plugin = config.transport.plugin || 'smtp';
        var transportModule = 'nodemailer-' + plugin + '-transport';
        var transporter = require(transportModule);
        transportOpts = transporter(config.transport.options);
    }

    return transportOpts;
}

function scheduleSend() {
    if (!sendTimer) {
        sendTimer = setTimeout(function () {
            sendTimer = null;
            sendBuffer();
        }, sendInterval);
    }
}

function smtpAppender(_config, _layout) {
    config = _config;

    if (!config.attachment) {
        config.attachment = {};
    }

    config.attachment.enable = !!config.attachment.enable;
    config.attachment.message = config.attachment.message || "See logs as attachment";

    var now = new Date();
    config.attachment.filename = config.attachment.filename || ('node错误日志' + now.getFullYear() + (now.getMonth() + 1) + now.getDate());
    layout = _layout || layouts.basicLayout;
    subjectLayout = layouts.messagePassThroughLayout;
    sendInterval = config.sendInterval * 1000 || 0;

    shutdownTimeout = ('shutdownTimeout' in config ? config.shutdownTimeout : 5) * 1000;

    return function (loggingEvent) {
        //仅线上环境1台服务器发送日志邮件
        if(os.hostname() === 'server4-211'){
        // if (true) {
            unsentCount++;
            logEventBuffer.push(loggingEvent);
            if (sendInterval > 0) {
                scheduleSend();
            } else {
                sendBuffer();
            }
        }
    };
}

function configure(_config) {
    config = _config;
    if (_config.layout) {
        layout = layouts.layout(_config.layout.type, _config.layout);
    }
    return smtpAppender(_config, layout);
}

function shutdown(cb) {
    if (shutdownTimeout > 0) {
        setTimeout(function () {
            if (sendTimer)
                clearTimeout(sendTimer);
            sendBuffer();
        }, shutdownTimeout);
    }
    (function checkDone() {
        if (unsentCount > 0) {
            setTimeout(checkDone, 100);
        } else {
            cb();
        }
    })();
}

exports.name = "log4js-smtp";
exports.appender = smtpAppender;
exports.configure = configure;
exports.shutdown = shutdown;
