/**
 * TinyForm 0.4.2 2016-11-30
 * @作者: hyjiacan
 * @源码: https://git.oschina.net/hyjiacan/TinyForm.git
 * @示例: http://hyjiacan.oschina.io/tinyform
 * @许可协议: MIT
 * @依赖: jQuery 1.8.0及更高版本
 * @浏览器支持: 不支持IE7及更低版本
 * @QQ群: 187786345 (Javascript爱好者)
 */
/**
 * TinyForm 核心组件，提供form实例化以及表单控件获取功能
 */
(function($, win) {
    'use strict';
    /**
     * 控件选择器，选择带有name属性的input select和textarea，排除input按钮
     */
    var CONTROL_SELECTOR = 'input[name]:not([type=button][type=submit][type=reset]), select[name], textarea[name]';

    /**
     * 扩展的初始化方法数组，每个插件的初始化方法都会注册到这个数组中
     */
    var extsetupfn = [];
    /**
     * 扩展的刷新方法数组，每个插件的刷新方法都会注册到这个数组中
     */
    var extrefreshfn = [];
    /**
     * 存放所有表单的实例
     */
    var tinyformInstance = {};

    /**
     * 表单构造函数
     * @param {String|Object} selector 表单选择器
     * @param {Object} option 参数，可选
     * @returns {Object} 表单实例
     */
    function TinyForm(selector, option) {
        var $me = $(selector).first();
        var id = $me.attr('data-tiny-id');
        if(!id || !tinyformInstance.hasOwnProperty(id)) {
            id = 'tiny' + Math.random().toString().substring(2);
            $me.attr('data-tiny-id', id);
            tinyformInstance[id] = new TinyForm.prototype.setup($me, option);
            tinyformInstance[id].id = id;
        }
        return tinyformInstance[id];
    }

    /**
     * 表单实例
     */
    TinyForm.prototype = {
        constructor: TinyForm,
        /**
         * 初始化表单实例
         * @param {Object} formContainer 表单容器的JQ对象
         * @param {Object} option 参数，可选
         * @returns {Object}  表单实例
         */
        setup: function(formContainer, option) {
            var me = this;
            me.option = $.extend(true, {
                // 失去焦点时自动验证
                autoValidate: false,
                // 是否在第一个验证失败时停止验证
                stopOnFail: true,
                // 表单控件的选择器
                fieldSelector: CONTROL_SELECTOR
            }, option);
            // 表单的DOM上下文
            me.context = formContainer;

            // 缓存对象
            me._cache = {
                fields: {}
            };

            $.each(extsetupfn, function() {
                this.call(me);
            });

            this.refresh();

            return me;
        },
        /**
         * 根据name属性获取控件 返回数组，因为可能存在同name情况
         * @param {String} fieldName 要获取的控件的name值，如果不指定这个属性，那么返回所有控件
         * @returns {Array}  范围内所有name为指定值的控件数组或获取到的所有域对象
         */
        getField: function(fieldName) {
            var all = $.extend(true, {}, this._cache.fields);

            if(arguments.length === 0) {
                return all;
            }
            if(typeof fieldName !== 'string') {
                return;
            }
            var field = all[fieldName];
            if(!all.hasOwnProperty(fieldName) || field.length === 0) {
                return [];
            }
            return field;
        },

        /**
         * 重新获取表单的控件，此操作将更新缓存
         * @returns {Object} 表单实例
         */
        refresh: function() {
            var me = this;
            getAllFields(me);

            $.each(extrefreshfn, function() {
                this.call(me);
            });
            return me;
        }
    };

    Object.defineProperty(TinyForm, 'extend', {
        configurable: false,
        value: function(extension) {
            var temp = $.extend(true, {}, extension);
            if(temp.hasOwnProperty('setup')) {
                extsetupfn.push(temp.setup);
                delete temp.setup;
            }
            if(temp.hasOwnProperty('refresh')) {
                extrefreshfn.push(temp.refresh);
                delete temp.refresh;
            }
            $.extend(true, TinyForm.prototype, temp);
        }
    });

    TinyForm.prototype.setup.prototype = TinyForm.prototype;

    /**
     * 搞一个全局的 TinyForm
     */
    win.TinyForm = TinyForm;

    /**
     * 获取所有的控件
     * @param {Object} fm 表单实例
     */
    function getAllFields(fm) {
        // 清空原有的数据
        fm._cache.fields = {};

        fm.context.find(fm.option.fieldSelector).each(function() {
            var name = $.trim($(this).attr('name'));
            // 如果name为空，则跳过
            if(name === '') {
                return;
            }

            if(typeof fm._cache.fields[name] === 'undefined') {
                // 结果中还不存在name，搞个数组出来
                // 这里搞数组，就是为了将相同name的控件集中起来
                fm._cache.fields[name] = [];
            }

            if(fm._cache.fields[name].length === 0) {
                fm._cache.fields[name].push($(this));
                return;
            }

            // 存在name，追加到数组后头
            if($(this).is('[type=radio]')) {
                fm._cache.fields[name].push($(this));
                return;
            }

            //如果不是radio，那整相同的name就有毛病
            console.error('控件的name属性"' + name + '"出现多次，这不对吧');
        });
    }
})(jQuery, window);/**
 * TinyForm 数据读写组件，负责从表单控件读取值以及向其写入值
 */
(function($, TF) {
    'use strict';
    TF.extend({
        setup: function() {
            // 保存初始数据，用于重置
            this._oriData = this.getData();
        },
        /**
         * 获取所有控件的值，返回对象
         * @param {String} fieldName 控件的name名称，如果指定了此参数，则只获取name=此值的控件的值
         * @returns {Object} 控件的name和值对象
         */
        getData: function(fieldName) {
            var me = this;

            if(arguments.length === 0) {
                return getAllData(me);
            }
            if(typeof fieldName !== 'string') {
                return;
            }
            return getFieldData(me, fieldName);
        },

        /**
         * 设置控件的值
         * @param {String|Object} data 要设置的值
         * @param {String} fieldName 控件的name名称，如果指定了此参数，则只设置name=此值的控件的值
         * @returns {Object}  表单实例
         */
        setData: function(data, fieldName) {
            var me = this;
            if(arguments.length === 0) {
                console.error('setData 需要至少1个参数');
                return me;
            }

            if(arguments.length >= 2) {
                if(typeof fieldName !== 'string') {
                    return me;
                }

                setFieldData(me, data, fieldName);
                return me;
            }

            // 未指定参数，设置表单所有项
            $.each(me.getField(), function(name, field) {
                var val = data[name];
                if(typeof val === 'undefined' || val === null) {
                    val = '';
                }

                setFieldData(me, val, field);
            });
            return me;
        },
        /**
         * 使用jQuery异步提交表单
         * @param {Object} option Ajax参数项
         * @returns {Object}  表单实例
         */
        submit: function(option) {
            var me = this;
            option = $.extend({
                url: me.context.attr('action'),
                type: me.context.attr('method') || 'post',
                async: true,
                data: {},
                success: false,
                error: false,
                cache: false
            }, option);

            option.data = $.extend({}, option.data, me.getData());
            if($.isFunction(me.option.beforeSubmit)) {
                me.option.beforeSubmit.call(me, option);
            }
            $.ajax(option);

            return me;
        },

        /**
         * 重置表单所有项
         * @returns {Object} 表单实例 
         */
        reset: function() {
            if($.isFunction(this.context.get(0).reset)) {
                this.context.get(0).reset();
            } else {
                this.setData(this._oriData);
            }
            return this;
        }
    });

    /**
     * 设置某个控件的值
     * @param {Object} fm 表单实例
     * @param {String|Object} data 要设置的值
     * @param {String|Array} field 控件的name名称或对象数组
     */
    function setFieldData(fm, data, field) {
        if(!$.isArray(field)) {
            field = fm.getField(field);
            if(!$.isArray(field) || field.length === 0) {
                return;
            }
        }

        $.each(field, function(index, item) {
            item = $(item);
            if(!item.is('input')) {
                item.val(data);
                return;
            }

            if(item.is('[type=radio]')) {
                item.prop('checked', (item.val() || '').toString() === data.toString());
            } else if(item.is('[type=checkbox]')) {
                item.prop('checked', data);
            } else {
                item.val(data);
            }
        });
    }

    /**
     * 获取表单的所有数据
     * @param {Object} fm
     */
    function getAllData(fm) {
        var data = {};
        $.each(fm.getField(), function(name, field) {
            data[name] = getFieldData(fm, name);
        });
        return data;
    }

    /**
     * 设置某个控件的值
     * @param {Object} fm 表单实例
     * @param {String} fieldName 控件的name名称
     * @return {String} 控件的值
     */
    function getFieldData(fm, fieldName) {

        var field = fm.getField(fieldName);

        if(field[0].is('input')) {
            return getInputValue(field);
        }

        if(field[0].is('select[multiple]')) {
            return field[0].val() || [];
        }

        return field[0].val();
    }

    /**
     * 获取input控件的值
     * @param {Array} field 控件数组
     * @return {Any} 控件的值
     */
    function getInputValue(field) {
        var value = '';
        var item = field[0];
        if(item.is('[type=radio]')) {
            for(var i = 0; i < field.length; i++) {
                item = field[i];
                if(item.is(':checked')) {
                    value = item.val();
                    break;
                }
            }
            return value;
        }

        if(item.is('[type=checkbox]')) {
            return item.is(':checked');
        }

        return item.val();
    }
})(jQuery, TinyForm);/**
 * TinyForm 数据存储组件，用于将表单数据持久化到浏览器存储中
 */
(function(win, $, TinyForm) {
    'use strict';

    TinyForm.extend({
        setup: function() {
            var me = this;

            me.option = $.extend(true, {
                // 数据存储的位置
                storage: win.localStorage,
                // 初始化时自动加载存储数据
                autoload: false,
                // 自动保存存储数据周期（毫秒），为0时不自动保存
                interval: 0,
                // 保存数据后的回调函数
                onstore: false,
            }, me.option);

            Object.defineProperty(this.option, 'uniquepath', {
                configurable: false,
                writable: false,
                value: getUniquePath(me.context)
            });

            if(me.option.autoload) {
                me.load();
            }

            if(!me.option.interval) {
                return;
            }

            win.setInterval(function() {
                me.store();
                if($.isFunction(me.option.onstore)) {
                    me.option.onstore.call(me);
                }
            }, parseInt(me.option.interval));
        },
        /**
         * 保存数据到缓存中
         * @param {Function} fn 保存数据前的回调函数，可以通过回调函数更改数据更改后的数据通过return返回
         * @return {Object} 表单实例
         */
        store: function(fn) {
            var data = this.getData();
            if(arguments.length) {
                data = fn.call(this, data);
            }
            this.option.storage.setItem(this.option.uniquepath, JSON.stringify(data));
            return this;
        },
        /**
         * 从缓存读取数据并加载到表单控件，没有数据时不会更新表单控件数据
         * @param {Boolean} fill 是否在读取数据后自动将数据填充到表单中。注意：如果填充，动作发生在回调后
         * @param {Function} fn 读取出数据后的回调函数，可以通过回调函数更改数据更改后的数据通过return返回
         * @return {Object} 存储的原始数据
         */
        load: function(fill, fn) {
            var data = this.option.storage.getItem(this.option.uniquepath);
            if(data) {
                try {
                    data = JSON.parse(data);
                } catch(e) {
                    console.error('存储不是有效的JSON数据');
                }
            }

            if(fill) {
                var temp;
                if($.isFunction(fn)) {
                    temp = fn.call(this, data);
                }
                this.setData(data);
            }

            return data;
        },
        /**
         * 丢弃数据存储
         * @return {Object} 存储的数据
         */
        abandon: function() {
            var data = this.option.storage.getItem(this.option.uniquepath);
            this.option.storage.removeItem(this.option.uniquepath);
            if(data) {
                try {
                    data = JSON.parse(data);
                } catch(e) {}
            }

            return data;
        }
    });

    /**
     * 获取某个DOM元素在DOM中的路径
     * @param {Object} element DOM元素对象
     * @return {String} 路径
     */
    function getUniquePath(element) {
        var path = [window.location.origin, window.location.pathname];

        $(element).parentsUntil(win.document.body).each(function() {
            path.push(this.tagName);
        });

        path.push($(element).siblings().andSelf().index(element));

        if($(element).is('[id]')) {
            path.push($(element).attr('id'));
        }

        return path.join('_').replace(/[^0-9a-z_]/ig, '_').toUpperCase();
    }
})(window, jQuery, TinyForm);/**
 * TinyForm 数据校验组件
 */
(function($, TF) {
    'use strict';
    /**
     * 验证规则定义，这些规则可以直接应用到表单控件的属性上面
     * 如果需要更多的规则，请直接添加到这里
     * @example
     * <input type="text" data-rule="email" data-msg="请输入电子邮箱地址" />
     */
    var RULES = {
        required: { // 必填
            rule: /^.+$/,
            msg: '不能为空'
        },
        number: { // 数字
            rule: /^[0-9]+$/,
            msg: '请输入数字'
        },
        alpha: { // 字母
            rule: /^[a-zA-Z]+$/,
            msg: '请输入字母'
        },
        email: { // 邮箱
            rule: /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/,
            msg: '请输入有效的邮箱'
        },
        url: { // 网址
            rule: /^[0-9a-z]+(\.[0-9a-z\-_])*\.[\w]+$/i,
            msg: '请输入有效的网址'
        }
    };

    /**
     * 验证相关的属性
     */
    var ATTRS = {
        rule: 'data-rule',
        msg: 'data-msg'
    };

    TF.extend({
        setup: function() {
            var me = this;
            me._cache.rules = {};

            // 绑定事件 失去焦点时调用验证函数
            if(me.option.autoValidate) {
                $.each(this.getField(), function(name) {
                    bindValidateEvent(me, name);
                });
            }
        },
        refresh: function() {
            getAllRules(this);
        },
        /**
         * 获取表单指定控件的验证规则或所有规则
         * @param {String} fieldName 控件的name名称，不指定此值时获取所有规则
         * @returns {Object|Boolean}  此控件未定义规则时，返回false；否则返回规则对象 {rule: /正则表达式/, msg: '消息'}
         */
        getRule: function(fieldName) {
            var all = $.extend(true, {}, this._cache.rules);

            if(arguments.length === 0) {
                return all;
            }

            if(this.getField(fieldName).length === 0) {
                return {};
            }

            return all[fieldName];
        },
        /**
         * 验证表单
         * @param {String} fieldName 指定要验证控件的name名称，不指定时验证所有控件
         * @returns {Object|Boolean} 验证通过时返回true，失败时返回失败的详细信息对象{pass: Boolean, value: String, field: Array, msg: String}
         */
        validate: function(fieldName) {
            var me = this;

            if(arguments.length > 0) {
                if(typeof fieldName !== 'string') {
                    return false;
                }
                return validateField(me, fieldName);
            }

            var data = {
                pass: true,
                detail: {}
            };

            var fields = me.getField();
            for(var name in fields) {
                if(!fields.hasOwnProperty(name)) {
                    continue;
                }

                var r = validateField(me, name);
                // 在第一次验证失败后停止验证
                if(!r && me.option.stopOnFail) {
                    return false;
                }
                data.detail[name] = r;
                if(!r && data.pass) {
                    // 验证不通过  整体结果为不通过
                    data.pass = false;
                }
            }

            return data.pass || data.detail;
        }
    });

    /**
     * 绑定验证事件
     * @param {Object} fm 表单实例
     * @param {String} fieldName 要绑定验证事件的控件名称
     * @returns {} 没有返回值
     */
    function bindValidateEvent(fm, fieldName) {
        $.each(fm.getField(fieldName), function(index, item) {
            item.blur(function() {
                fm.validate(fieldName);
            });
        });
    }

    /**
     * 获取表单所有控件的验证规则
     * @param {Object} fm 表单实例
     * @returns {Object} 验证规则对象
     */
    function getAllRules(fm) {
        // 清空原有的数据
        fm._cache.rules = {};

        $.each(fm.getField(), function(name, field) {
            var rule = $.trim(field[0].attr(ATTRS.rule));
            var msg = field[0].attr(ATTRS.msg);

            if(rule === '') {
                fm._cache.rules[name] = false;
                return;
            }

            if(RULES.hasOwnProperty(rule)) {
                fm._cache.rules[name] = $.extend(true, {}, RULES[rule]);
                if(typeof msg !== 'undefined') {
                    fm._cache.rules[name].msg = msg;
                }
                return;
            }

            fm._cache.rules[name] = resolveValidateRule(rule, msg);
        });
    }

    /**
     * 解析控件的规则验证
     * @param {Object} rule data-rule的值
     * @param {Object} msg 消息
     * @return {Object|Boolean} 需要验证时返回对象，否则返回false
     */
    function resolveValidateRule(rule, msg) {
        var validation = {};
        if(!rule) {
            return false;
        }
        // 如果验证以regex:开头，表示需要使用正则验证
        if(rule.indexOf('regex:') === 0) {
            try {
                validation.rule = new RegExp(rule.replace('regex:', ''));
                validation.msg = msg || '格式不正确';
                return validation;
            } catch(e) {
                return false;
            }
        }

        // 如果验证以 length: 开头，表示要控制输入长度
        if(rule.indexOf('length:') === 0) {
            return resolveLengthRule(rule, msg);
        }

        return false;
    }

    /**
     * 解析验证规则为长度的表达式
     * @param {String} rule 规则表达式
     * @param {String} msg 验证失败时的自定义消息
     * @returns {Object|Boolean} 需要验证时返回对象，否则返回false
     */
    function resolveLengthRule(rule, msg) {
        var validation = {};

        var lendef = rule.replace('length:', '').split(',');
        // 如果只提供了一个值，表示长度不能小于设定值
        if(lendef.length === 1) {
            lendef[0] = parseInt(lendef[0]);
            if(isNaN(lendef[0]) || lendef[0] < 0) {
                console.error('验证规则无效: 长度需要正整数 "' + rule + '"');
                return false;
            }

            validation.rule = new RegExp('^.{' + lendef[0] + '}.*$', 'g');
            validation.msg = msg || '长度不能少于' + lendef[0] + '个字';

            return validation;
        }

        if(lendef.length === 2) {
            // 如果提供了两个值，那么就是长度范围
            lendef[0] = parseInt(lendef[0]);
            lendef[1] = parseInt(lendef[1]);
            if(isNaN(lendef[0]) || lendef[0] < 0 || isNaN(lendef[1]) || lendef[1] < 0) {
                console.error('验证规则无效: 长度需要正整数 "' + rule + '"');

                return false;
            }

            if(lendef[0] === lendef[1]) {
                validation.rule = new RegExp('^.{' + lendef[0] + '}$', 'g');
                validation.msg = msg || '长度需要' + lendef[0] + '个字';

                return validation;
            }

            validation.rule = new RegExp('^.{' + lendef[0] + ',' + lendef[1] + '}$', 'g');
            validation.msg = msg || '长度应该在' + lendef[0] + '到' + lendef[1] + '个字之间';

            return validation;
        }

        return false;
    }

    /**
     * 验证某个控件
     * @param {Object} fm 表单实例
     * @param {String} fieldName 控件的name名称
     * @return {Object|Boolean}验证成功时返回true, 否则返回失败的详细信息
     */
    function validateField(fm, fieldName) {
        var field = fm.getField(fieldName);
        if(field.length === 0) {
            return false;
        }

        var rule = fm.getRule(fieldName);
        if(typeof rule === 'undefined' || rule === false) {
            return true;
        }

        var value = fm.getData(fieldName);

        // 此处为了方便处理textarea中的换行，特意将获取到的值中的换行符 \r\n 替换成了 空格
        var pass = !rule.rule || rule.rule.test((value || '').toString().replace(/[\r\n]/g, ' '));

        if(!$.isFunction(fm.option.afterValidate)) {
            return pass;
        }
        var custompass = fm.option.afterValidate.call(fm, {
            pass: pass,
            field: field,
            value: value,
            msg: pass ? '' : rule.msg
        });
        if(typeof custompass !== 'undefined') {
            pass = !!custompass;
        }
        return pass;
    }
})(jQuery, TinyForm);