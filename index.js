'user strict';

var through = require('through2');
var fs = require('fs');

var styleProps = 'backgroundImage backgroundColor borderWidth borderColor borderStyle borderRadius boxShadow opacity rotate width height fontStyle fontWeight textDecoration fontFamily fontSize color textAlign lineHeight verticalAlign textShadow left right top bottom zIndex marginLeft marginTop'.split(' ');
var animProps = 'animationName animationDuration animationDelay animationIterationCount'.split(' ');

function compile(file, encoding, callback) {
    var source = new Buffer(file.contents, 'utf8').toString();
    var data = JSON.parse(source);

    archiveProps('app', data);
    for(var i = 0; i < data.pages.length; i++) {
        var page = data.pages[i];
        archiveProps('page', page);
        for(var j = 0; j < page.elements.length; j++) {
            var ele = page.elements[j];
            archiveProps('element', ele);
        }
    }


    file.contents = new Buffer(JSON.stringify(data));
    callback(null, file);
}

function archiveProps(type, obj) {
    switch(type) {
        case 'app':
            obj.tongji = {};
            obj.carousel = {};
            break;
        case 'page':
        case 'element':
            obj.styles = {};
            obj.animationStyle = {};
            break;
    }

    for(var prop in obj) {
        if(obj.hasOwnProperty(prop)) {
            archiveSingleProp(type, obj, prop);
        }
    }
}

function archiveSingleProp(type, obj, prop) {

    /********** 删除下划线开头的prop ***********/
    if(prop[0] == '_') {
        delete obj[prop];
    }

    /********** app ***********/
    if(type == 'app') {
        /********** statistic ***********/
        if(prop == 'tongji_id') {
            obj.tongji['id'] = obj['tongji_id'];
            delete obj['tongji_id'];
        }
        else if(prop == 'tongji_type') {
            obj.tongji['type'] = obj['tongji_type'];
            delete obj['tongji_type'];
        }
        /********** weixin ***********/
        else if(prop == 'weixin' && obj.weixin) {
            obj.weixin.imgUrl = obj.weixin.icon;
            obj.weixin.appId = obj.appId;
            delete obj.weixin.icon;
        }
        /********** carousel ***********/
        else if(prop == 'loop') {
            obj.carousel[prop] = obj[prop];
            delete obj[prop];
        }
    }

    /********** element ***********/
    if(type == 'element') {
        if(prop == 'type') {
            obj[prop] = 'plugin-' + obj[prop];
        }
        else if(prop == 'formid') {
            obj['submitBtn'] = obj[prop];
            delete obj[prop];
        }
        else if(prop == 'video_src') {
            obj['videoSrc'] = obj[prop];
            delete obj[prop];
        }
        else if(prop == 'btnfun') {
            switch (obj[prop]) {
                case 'share':
                    obj['wxShare'] = true;
                    break;
                case 'go':
                    obj['paging'] = obj['btnfunContent'];
                    break;
                case 'link':
                    obj['href'] = obj['btnfunContent'];
                    break;
            }
            delete obj['btnfun'];
            delete obj['btnfunContent'];
        }
    }

    /********** styles ***********/
    if(styleProps.indexOf(prop) >= 0) {

        // backgroundImage需要
        if(prop == 'backgroundImage' && obj[prop] && obj[prop] != 'none') {
            obj[prop] = 'url(' + obj[prop] + ')';
        }

        obj.styles[prop] = obj[prop];
        delete obj[prop];
    }
    else if(animProps.indexOf(prop) >= 0) {
        obj.animationStyle[prop] = obj[prop];
        delete obj[prop];
    }
}


module.exports = function(opt) {
    return through.obj(compile)
};
