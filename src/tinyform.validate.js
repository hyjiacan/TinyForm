/**
 * TinyForm 数据校验组件
 */
(function($, TF) {
    /**
     * 我要使用严格模式
     */
    'use strict';
    /**
     * 验证规则定义，这些规则可以直接应用到表单控件的属性上面
     * 如果需要更多的规则，请直接添加到这里
     * @example
     * <input type="text" data-rule="email" data-msg="请输入电子邮箱地址" />
     */
    var RULES = {
        // 必填
        required: {
            rule: /^.+$/,
            msg: '不能为空'
        },
        // 数字
        number: {
            rule: /^[0-9]+$/,
            msg: '请输入数字'
        },
        // 字母
        alpha: {
            rule: /^[a-zA-Z]+$/,
            msg: '请输入字母'
        },
        // 电子邮箱
        email: {
            rule: /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/,
            msg: '请输入有效的邮箱'
        },
        // 网址
        url: {
            rule: /^[0-9a-z]+(\.[0-9a-z\-_])*\.[\w]+$/i,
            msg: '请输入有效的网址'
        }
    };

    /**
     * 长度验证规则
     */
    var RULE_LEN = {
        /**
         * 限定长度不能少于多少个字符
         */
        least: {
            rule: '^.{{0}}.*$',
            msg: '长度不能少于{0}个字'
        },
        /**
         * 限定长度只能为多少个字符
         */
        equals: {
            rule: '^.{{0}}$',
            msg: '长度需要{0}个字'
        },
        between: {
            rule: '^.{{0},{1}}$',
            msg: '长度应该在{0}到{1}个字之间'
        }
    };

    /**
     * 当验证规则不被支持的提示信息，这个消息会在控制台输出
     */
    var UNSUPPORTED_RULE = '不支持的验证规则';

    /**
     * 自定义长度参数格式不是整数的提示消息
     */
    var INT_REQUIRED = '验证规则无效: 长度需要正整数';

    /**
     * 验证相关的属性
     */
    var ATTRS = {
        // 标签的验证规则属性名称
        rule: 'data-rule',
        // 标签的规则验证失败时的提示消息属性名称
        msg: 'data-msg'
    };

    /**
     * 表单控件的验证规则集合
     */
    var ruleSet = {};

    /**
     * 验证组件
     */
    TF.extend({
        /**
         * 初始化
         */
        setup: function() {
            // 后面有回调要用这个实例对象，所以先存一下
            var me = this;
            // 合并配置项 传参数时要使用  {validate:{}} 这样的形式
            me.option.validate = $.extend(true, {
                // 是否在失去焦点时自动验证
                auto: false,
                // 是否在第一个验证失败时停止验证
                stop: true,
                // 每个控件被验证后触发的回调
                callback: function() {}
            }, me.option.validate);

            // 获取所有在元素标签属性上指定的验证规则和提示消息
            getAllTagRules(this);

            // 绑定事件 失去焦点时调用验证函数
            if(!me.option.validate.auto) {
                // 不自动验证 就直接返回好了
                return;
            }
            // 遍历控件，绑定失去焦点时验证的事件
            $.each(this.getField(), function(name) {
                // 绑定失去焦点事件
                this.blur(function() {
                    // 失去焦点时触发验证规则
                    me.validate(name);
                });
            });
        },
        /**
         * 刷新接口
         */
        refresh: function() {
            // 重新获取标签的验证规则
            getAllTagRules(this);
        },
        /**
         * 获取表单指定控件的验证规则或所有规则
         * @param {String} fieldName 控件的name名称，不指定此值时获取所有规则
         * @returns {Object|Boolean}  此控件未定义规则时，返回false；否则返回规则对象 {rule: /正则表达式/, msg: '消息'}
         */
        getRule: function(fieldName) {
            // 搞一个验证规则的副本，以防止意外改变验证规则
            var all = $.extend(true, {}, ruleSet[this.id]);

            // 没有参数
            if(arguments.length === 0) {
                // 返回所有的规则对象
                return all;
            }

            // 控件不存在
            if(this.getField(fieldName).length === 0) {
                // 返回空对象
                return {};
            }

            // 返回指定控件的验证规则
            return all[fieldName];
        },
        /**
         * 验证表单
         * @param {String} fieldName 指定要验证控件的name名称，不指定时验证所有控件
         * @returns {Object|Boolean} 验证通过时返回true，失败时返回失败的详细信息对象{pass: Boolean, value: String, field: Array, msg: String}
         */
        validate: function(fieldName) {
            // 后头到处要用，搞个变量保存起来，能减小压缩后的体积
            var me = this;

            // 指定了参数，说明只验证指定name的控件，这里只取第一个参数
            if(arguments.length > 0) {
                // 参数需要字符串，类型不对
                if(typeof fieldName !== 'string') {
                    // 因为这种情况应该是开发的错误，所以返回验证失败 
                    return false;
                }

                // 返回验证结果
                return validateField(me, fieldName);
            }

            // 验证结果数据
            var data = {
                // 所有的验证是否通过
                pass: true,
                // 验证结果详细信息
                detail: {}
            };

            // 取到所有的控件准备验证
            var fields = me.getField();
            // 开始遍历控件验证
            for(var name in fields) {
                // 这个name无效
                if(!fields.hasOwnProperty(name)) {
                    // 进行下一次
                    continue;
                }

                // 控件的验证结果
                // 结果长这样：
                //{
                //  pass: Boolean,
                //  field: Object,
                //  value: Any,
                //  msg: String
                //}
                var r = validateField(me, name);
                // 在第一次验证失败后停止验证
                if(!r && me.option.validate.stop) {
                    // 验证失败了，返回false
                    return false;
                }

                // 将返回的验证详细信息保存起来，
                // 这个函数完了后，如果验证失败就将所有验证结果返回
                data.detail[name] = r;
                if(!r && data.pass) {
                    // 验证不通过  整体结果为不通过
                    data.pass = false;
                }
            }

            // 如果有验证失败，则返回验证失败的详细信息，如果验证通过，则返回true
            return data.pass || data.detail;
        }
    });

    /**
     * 获取表单所有控件的验证规则
     * @param {Object} fm 表单实例
     * @returns {Object} 验证规则对象  
     */
    function getAllTagRules(fm) {
        // 清空原有的数据
        var rules = ruleSet[fm.id] = {};

        // 遍历控件，获取验证规则
        $.each(fm.getField(), function(name, field) {
            // 从标签属性上获取规则描述  当然  还是要trim一下的
            var rule = $.trim(field.attr(ATTRS.rule));
            // 从标签属性上获取提示消息
            var msg = field.attr(ATTRS.msg);

            // 规则为空，返回一个false
            if(rule === '') {
                // 设置 false ，表示没有验证规则
                rules[name] = false;
                // 没有规则就不用再去取提示消息了，直接返回去取下一个控件
                return;
            }

            // 如果自定义规则 RULES 中存在这个名称的规则，那么直接取出正则
            if(RULES.hasOwnProperty(rule)) {
                // 取出正则
                rules[name] = $.extend(true, {}, RULES[rule]);
                // 标签上没有设置提示消息
                if(typeof msg !== 'undefined') {
                    // 使用默认的提示消息(也就是在RULES中设置的消息)
                    rules[name].msg = msg;
                }
                // 可以返回了
                return;
            }

            // 解析在RULES中没有定义的规则，然后返回
            rules[name] = resolveValidateRule(rule, msg);
        });
    }

    /**
     * 解析控件的规则验证
     * @param {Object} rule data-rule的值
     * @param {Object} msg 消息
     * @return {Object|Boolean} 需要验证时返回对象，否则返回false
     */
    function resolveValidateRule(rule, msg) {
        // 创建一个存放验证规则和提示消息的对象
        var validation = {};
        // 参数传入的rule为空
        if(!rule) {
            // 不需要验证，返回一个false
            return false;
        }
        // 如果验证以regex:开头，表示需要使用正则验证
        if(rule.indexOf('regex:') === 0) {
            // 本来这里有 try catch 的，但是考虑到，
            // 要是有异常，这就是开发的问题了，这种错误还是保留比较好
            // 替换掉原串的 regox: 字符，后面的就应该是验证用的正则
            validation.rule = new RegExp(rule.replace('regex:', ''));
            // 设置默认的提示消息
            validation.msg = msg || '格式不正确';
            // 返回验证规则对象
            return validation;
        }

        // 如果验证以 length: 开头，表示要控制输入长度
        if(rule.indexOf('length:') === 0) {
            return resolveLengthRule(rule, msg);
        }

        // 不支持的格式，则不去验证，
        console.error(UNSUPPORTED_RULE + ':' + rule);
        //返回false，就不需要验证了
        return false;
    }

    /**
     * 解析验证规则为长度的表达式
     * @param {String} rule 规则表达式
     * @param {String} msg 验证失败时的自定义消息
     * @returns {Object|Boolean} 需要验证时返回对象，否则返回false
     */
    function resolveLengthRule(rule, msg) {
        // 创建一个存放验证规则和提示消息的对象        
        var validation = {};

        // 长度定义格式: length: start [, end]
        // 所以通过分隔逗号(,)来搞成数组
        var lendef = rule.replace('length:', '').split(',');
        // 如果只提供了一个值，表示长度不能小于设定值
        if(lendef.length === 1) {
            // 搞成int类型 如果搞不成，那数据格式就不对了
            var len = parseInt(lendef[0]);
            // 不能搞成数字 或者是负数 
            if(isNaN(len) || len < 0) {
                // 给开发输出提示消息
                console.error(INT_REQUIRED + ' "' + rule + '"');
                // 错了就不验证了
                return false;
            }

            // 根据配置创建正则对象
            validation.rule = new RegExp(RULE_LEN.least.rule.replace('{0}', len), 'g');
            // 根据配置创建提示消息
            validation.msg = msg || RULE_LEN.least.msg.replace('{0}', len);

            // 返回规则验证对象
            return validation;
        }

        //提供了两个值，表示要限制长度起始范围
        if(lendef.length === 2) {
            // 把第一个值弄成int
            var len1 = parseInt(lendef[0]);
            // 把第二个值弄成int
            var len2 = parseInt(lendef[1]);
            // 不能搞成数字 或者是负数 
            if(isNaN(len1) || len1 < 0 || isNaN(len2) || len2 < 0) {
                // 给开发输出提示消息
                console.error(INT_REQUIRED + ' "' + rule + '"');
                // 错了就不验证了
            }

            //根据配置创建正则对象
            validation.rule = new RegExp(RULE_LEN.between.rule.replace('{0}', len1).replace('{1}', len2), 'g');
            // 根据配置创建提示消息
            validation.msg = msg || RULE_LEN.between.msg.replace('{0}', len1).replace('{1}', len2);

            // 返回规则验证对象
            return validation;
        }

        // 其它情况视为不支持
        console.error(UNSUPPORTED_RULE + ':' + rule);

        // 不验证
        return false;
    }

    /**
     * 验证某个控件
     * @param {Object} fm 表单实例
     * @param {String} fieldName 控件的name名称
     * @return {Object|Boolean}验证成功时返回true, 否则返回失败的详细信息
     */
    function validateField(fm, fieldName) {
        //根据name取到控件
        var field = fm.getField(fieldName);
        // 控件不存在
        if(field.length === 0) {
            // 返回false表示验证失败
            // 为啥呢？
            // 开发专门来验证，却出现了控件不存在的情况，
            // 这是来玩的么？
            return false;
        }

        // 获取控件的验证规则
        var rule = fm.getRule(fieldName);

        // 没有规则或为false就不需要验证
        if(typeof rule === 'undefined' || rule === false) {
            // 返回一个true，表示验证通过
            return true;
        }

        // 获取控件的值
        var value = fm.getData(fieldName);

        // 此处为了方便处理textarea中的换行，特意将获取到的值中的换行符 \r\n 替换成了 空格
        var pass = !rule.rule || rule.rule.test((value || '').toString().replace(/[\r\n]/g, ' '));

        //验证的回调函数，这个太长了，弄个短名字要写些
        var cb = fm.option.validate.callback;
        // 回调不是函数，直接返回验证的结果
        if(!$.isFunction(cb)) {
            // 返回验证的结果  true 或者 false
            return pass;
        }

        // 因为回调可以通过return来改变验证结果，所以这里要取得回调的返回值
        var custompass = cb.call(fm, {
            // 验证是否通过
            pass: pass,
            // 验证的控件对象
            field: field,
            // 控件的值
            value: value,
            // 提示消息
            msg: rule.msg
        });

        // 判断回调的返回值是不是 undefined，如果是那么就是用户并没有返回值
        if(typeof custompass !== 'undefined') {
            // 用户返回了值，强制搞成boolean然后作为这个控件的验证结果
            pass = !!custompass;
        }
        //返回验证结果   true 或者 false
        return pass;
    }
})(jQuery, TinyForm);