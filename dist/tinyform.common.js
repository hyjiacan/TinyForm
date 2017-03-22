/**
 * TinyForm 0.7.4 common 2017-03-22
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
(function ($, win) {
    /**
     * 我要使用严格模式
     */
    'use strict';

    /**
     * 附加到元素上的表单实例的id属性
     */
    var INSTANCE_ATTR = 'data-tinyform';

    /**
     * 插件添加方法时，方法已经存在的提示，这个提示会在控制台输出
     */
    var METHOD_EXISTS = '插件添加方法失败: 此方法已经存在';

    /**
     * 插件的扩展方法集合
     */
    var extfn = {
        /**
         * 扩展的初始化方法数组，每个插件的初始化方法都会注册到这个数组中
         */
        setup: [],
        /**
         * 扩展的刷新方法数组，每个插件的刷新方法都会注册到这个数组中
         */
        refresh: []
    };

    /**
     * 存放所有表单的实例的集合
     */
    var instanceSet = {};

    /**
     * 表单实例的控件集合
     */
    var fieldSet = {};

    /**
     * 生成一个新的表单实例id
     * 结构为： tiny+ 时间戳 + 随机数
     */
    function idGenerator() {
        // 时间戳是时间的数字形式
        // 随机数是将生成的float转成字符串，再去掉前面的字符“0”和"."，使用剩下的字符串
        return 'tiny' + (new Date().getTime()) + Math.random().toString().substring(2);
    }

    /**
     * 表单构造函数
     * @param {String|Object} selector 表单选择器
     * @param {Object} option 参数，可选
     * @returns {Object} 表单实例
     */
    function TinyForm(selector, option) {
        // 只将第一个元素实例化成TinyForm
        var $me = $(selector).first();
        // 假设这个元素已经实例化，先取一下id试试
        var id = $me.attr(INSTANCE_ATTR);
        // 如果取到就表示真的已经实例化了，取不到表示还没有实例化
        // 要注意：取到后还有个条件，那就是在实例对象集合  instanceSet 中存在这个id的实例
        // 以防止有小人故意在标签上加个假冒的属性
        if (!id || !instanceSet.hasOwnProperty(id)) {
            // 搞一个新的id
            id = idGenerator();
            // 把这个新id弄到标签的属性上面
            $me.attr(INSTANCE_ATTR, id);
            // 创建实例 TinyForm 的实例
            instanceSet[id] = new TinyForm.prototype.setup($me, option, id);
        }

        // 返回表单实例
        return instanceSet[id];
    }

    /**
     * 表单实例
     */
    TinyForm.prototype = {
        /**
         * 构造
         */
        constructor: TinyForm,
        /**
         * 初始化表单实例
         * @param {Object} formContainer 表单容器的JQ对象
         * @param {Object} option 参数，可选
         * @param {String} id TinyForm实例id
         * @returns {Object}  表单实例
         */
        setup: function (formContainer, option, id) {
            // 保存实例对象到变量里面
            var me = this;
            // 设置实例的id
            me.id = id;

            // 合并选项参数
            me.option = $.extend(true, {}, TinyForm.defaults, option);
            // 表单的DOM上下文
            me.context = formContainer;

            // 获取所有控件
            getAllFields(me);

            // 调用插件的初始化方法  这个调用要放到最后，
            // 确保所有需要的资源都就位
            $.each(extfn.setup, function () {
                // 调用插件的初始化，并且设置插件的初始化方法的上下文this
                this.call(me);
            });

            // 返回实例对象
            return me;
        },
        /**
         * 根据name属性获取控件 返回数组，因为可能存在同name情况
         * @param {String} fieldName 要获取的控件的name值，如果不指定这个属性，那么返回所有控件
         * @returns {Array}  范围内所有name为指定值的控件数组或获取到的所有域对象
         */
        getField: function (fieldName) {
            // 获取到所有控件，然后创建一个副本，以避免控件集合被修改
            var all = $.extend(true, {}, fieldSet[this.id]);

            // 不传参数表示获取所有的控件
            if (arguments.length === 0) {
                // 返回所的控件集合的副本
                return all;
            }

            // 如果传的参数不是字符串，那就是不合法的
            if (typeof fieldName !== 'string') {
                // 参数错误，此时返回空
                return;
            }
            // 尝试获取控件对象（这里得到的是jQuery对象）
            var field = all[fieldName];
            // 判断是否存在这个名字的控件
            if (!all.hasOwnProperty(fieldName) || field.length === 0) {
                // 如不存在，返回空
                return;
            }

            // 返回控件的jQuery对象
            return field;
        },

        /**
         * 重新获取表单的控件，此操作将更新缓存
         * @returns {Object} 表单实例
         */
        refresh: function () {
            // 因为要在下面的回调里面使用表单实例，所以弄个变量把实例保存一下
            var me = this;

            // 在这个核心组件中，刷新仅仅是重新获取所有控件
            getAllFields(me);

            // 调用插件的刷新方法
            $.each(extfn.refresh, function () {
                // 并且设置插件的refresh方法的上下文this
                this.call(me);
            });

            // 刷新后，返回表单实例
            return me;
        }
    };

    /**
     * 给TinyForm添加一个静态的函数 extend，用于插件扩展
     */
    Object.defineProperty(TinyForm, 'extend', {
        // 一旦定义了就不准改了
        configurable: false,
        /**
         * extend 配置为函数，通过 TinyForm.extend 调用
         * @param {Object} extension 扩展，这是一个对象，如：
         * TinyForm.extend({
         *     xxxx: function(){
         *     
         *     }
         * });
         * 这样就给TinyForm的实例添加了一个方法  xxxx，
         * 然后就可以通过  form.xxxx() 来调用
         */
        value: function (extension) {
            // 搞一个参数的副本，以防止改变原有的对象，
            // 或者是原有的对象改变后影响已经绑定的功能
            var temp = $.extend(true, {}, extension);
            // 判断插件是否有初始化方法
            if (temp.hasOwnProperty('setup')) {
                // 有初始化方法，将其添加到扩展方法数组中
                extfn.setup.push(temp.setup);
                // 删掉插件参数上面的setup方法，以阻止其污染核心组件的setup
                delete temp.setup;
            }
            if (temp.hasOwnProperty('refresh')) {
                // 有刷新方法，将其添加到扩展方法数组中
                extfn.refresh.push(temp.refresh);
                // 删掉插件参数上面的refresh方法，以阻止其污染核心组件的refresh
                delete temp.refresh;
            }

            // 添加插件方法到实例上
            $.each(temp, function (name, fn) {
                // 检查方法是否存在
                if (this.hasOwnProperty(name)) {
                    // 方法存在，插件不能添加这个方法
                    console.error(METHOD_EXISTS);
                    // 既然不能添加，那就直接返回吧
                    return;
                }

                // 添加扩展方法到原型对象上头
                TinyForm.prototype[name] = fn;
            });
        }
    });

    // 提供默认的配置修改入口
    // 扩展通过  TinyForm.defaults.xxx 来设置默认参数
    TinyForm.defaults = {
        /**
         * 控件选择器，选择带有name属性的input select和textarea，排除input按钮
         */
        selector: 'input[name]:not(:button,:submit,:reset,[data-ignore]), select[name]:not([data-ignore]), textarea[name]:not([data-ignore])',
        // 在表单内查找控件时，要忽略的控件或控件集合
        // 值可以为false、字符串或数组：
        // boolean: 仅设置false有效，表示没有需要忽略的
        // array: 要忽略的控件的name组成的数组
        // 要注意的是：这里的优先级应该比标签上设置的优先级更低
        // 也就是说，即使这里设置的是false，只在要标签上有属性 data-ignore
        ignore: false
    };

    // 搞懂，因为真正创建实例是通过 setup ，所以需要把 TinyForm 的原型交给 setup，以通过 setup 来产生一个 TinyForm 的实例
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
        var fields = fieldSet[fm.id] = {};

        // 取出在实例化时传入的需要ignore的参数，然后始终搞成数组
        // 后面会用这个数组去判断某个控件是否需要加载
        var ignoreFields = $.makeArray(fm.option.ignore);

        // 根据配置的选择器来查找控件
        fm.context.find(fm.option.selector).each(function () {
            // 尝试取出name属性，顺便trim一下，要是有人喜欢搞怪，给弄点空白呢
            var name = $.trim($(this).attr('name'));

            // 如果name为空，则跳过
            if (name === '') {
                // 没有name属性，那就对不起了
                return;
            }

            // 如果这个name是被ignore的，就跳过这个
            if (ignoreFields.indexOf(name) !== -1) {
                return;
            }

            // 控件缓存集合中还不存在这个name的控件
            // 不存在，可能是还没有这个name的属性或者长度为0，感觉这个判断有点冗余，先不管了
            if (typeof fields[name] === 'undefined' || fields[name].length === 0) {
                // 结果中还不存在name，搞个数组出来
                // 这里搞数组，就是为了将相同name的控件集中起来
                fields[name] = $(this);
                // 可以取下一个控件了
                return;
            }

            // 存在name，如果是radio的话就追加到jQuery数组后头
            if ($(this).is(':radio')) {
                // 将DOM控件对象（非jQuery对象）添加到jQuery数组后头
                // 这里可以肯定只有一个控件，所以直接使用  this
                fields[name].push(this);
                // 添加进去后，就可以取下一个控件了
                return;
            }

            //如果不是radio，那整相同的name就有毛病
            console.error('控件的name属性"' + name + '"出现多次，这不对吧');
        });
    }
})(jQuery, window);/**
 * TinyForm 数据读写组件，负责从表单控件读取值以及向其写入值
 */
(function($, TinyForm) {
    /**
     * 我要使用严格模式
     */
    'use strict';

    /**
     * 存放表单初始数据的集合
     */
    var originalData = {};

    // 默认配置
    // 因为 data 是核心组件，所以配置项就不单独放到一个对象中
    $.extend(true, TinyForm.defaults, {
        // 自定义 checkbox 选中(第0个元素)和未选中(第1个元素)状态的值，默认为 [true, false]
        checkbox: [true, false],
        // 调用ajax前的数据处理
        beforeSubmit: false
    });

    /**
     * 这个是数据读写（获取和设置）的组件
     */
    TinyForm.extend({
        /**
         * 初始化
         */
        setup: function() {
            // 保存初始数据，用于重置
            originalData[this.id] = this.getData();
        },
        /**
         * 获取所有控件的值，返回对象
         * @param {String} fieldName 控件的name名称，如果指定了此参数，则只获取name=此值的控件的值
         * @returns {Object} 控件的name和值对象
         */
        getData: function(fieldName) {
            // 没有参数，要获取所有控件的数据
            if (arguments.length === 0) {
                // 返回所有控件的数据
                return getAllData(this);
            }
            // 参数需要控件的name字符串，类型不对
            if (typeof fieldName !== 'string') {
                // 返回空
                return;
            }

            // 返回指定控件的值
            return getFieldData(this, fieldName);
        },

        /**
         * 设置控件的值
         * @param {String|Object} data 要设置的值
         * @param {String} fieldName 控件的name名称，如果指定了此参数，则只设置name=此值的控件的值
         * @returns {Object}  表单实例
         */
        setData: function(data, fieldName) {
            // 后头要在回调函数里面用这个实例对象，所以先弄个变量存起来
            var me = this;

            // 这个函数需要至少一个参数，你一个都不传，这是想造反么？
            if (arguments.length === 0) {
                // 这属性开发错误，我要在控制台给你报个错
                console.error('setData 需要至少1个参数');
                // 还是返回个实例给你
                return me;
            }

            // 如果传的参数>=2个，就是要设置指定name的控件的值，后面多余的参数直接忽略
            if (arguments.length >= 2) {
                //  第二个参数还是要个字符串，格式不对没法玩
                if (typeof fieldName !== 'string') {
                    // 返回给你个实例对象
                    return me;
                }

                // 设置指定name控件的值
                setFieldData(me, data, me.getField(fieldName));
                // 始终返回实例对象
                return me;
            }

            // 未指定name参数，设置表单所有项
            $.each(me.getField(), function(name, field) {
                // 从传入数据对象里面取出这个name的值
                var val = data[name];
                // 如果数据对象里面没有指定这个name，或值为null
                if (typeof val === 'undefined' || val === null) {
                    // 那就把值设置成空字符串
                    val = '';
                }

                // 设置控件的值
                setFieldData(me, val, field);
            });

            // 继续返回实例对象
            return me;
        },
        /**
         * 使用jQuery提交表单（默认异步: async=true）
         * @param {Object} option Ajax参数项
         * @returns {Object}  表单实例
         */
        submit: function(option) {
            // 到处都要写this，加个变量保存起来，在压缩的时候说不定能小好几十个字节
            var me = this;

            // 合并提交数据的参数，这些参数都是给ajax用的
            option = $.extend({
                // 提交的url，默认读取dom元素的action属性
                url: me.context.attr('action'),
                // 提交的类型（post/get），默认读取dom元素的method属性
                type: me.context.attr('method') || 'post',
                // 默认异步提交
                async: true,
                // 数据则使用表单的所有数据
                data: me.getData(),
                // 默认不使用数据缓存
                cache: false
            }, option);

            // option 构建完了，这里看看有没有设置提交前的回调函数
            if ($.isFunction(me.option.beforeSubmit)) {
                // 设置了提交前的回调函数，就调用一下
                // 回调函数的上下文this是表单实例对象，有个参数option，可以直接进行改动
                if (me.option.beforeSubmit.call(me, option) === false) {
                    return;
                }
            }

            // 发送ajax请求
            return $.ajax(option);
        },

        /**
         * 重置表单所有项
         * @returns {Object} 表单实例
         */
        reset: function() {
            // 看一下表单dom元素对象上有没有一个叫做reset的方法
            // 如果有，那就说明这个表单的DOM元素是form标签
            // 这时就有浏览器内置的reset能用
            if ($.isFunction(this.context.get(0).reset)) {
                // 调用浏览器内置的表单reset方法
                this.context.get(0).reset();
            } else {
                // 不是form标签，只能自己去设置初始值了(初始化是在表单实例化的时候获取到，保存起来的)
                this.setData(originalData[this.id]);
            }

            // 返回实例对象
            return this;
        }
    });

    /**
     * 设置某个控件的值
     * @param {Object} fm 表单实例
     * @param {String|Object} data 要设置的值
     * @param {Array} field 控件对象数组
     */
    function setFieldData(fm, data, field) {
        // 如果控件不存在（长度为0），那么啥都不做
        if (!field || field.length === 0) {
            // 返回吧
            return;
        }

        // 控件是radio，那么可能有多个
        if (field.is(':radio')) {
            // 所有radio先置为未选中的状态，这样来避免设置了不存在的值时，还有radio是选中的状态
            field.prop('checked', false)
                // 找出value与数据相等的控件设置选中
                .filter('[value=' + data + ']:first').prop('checked', true);
            // 可以返回了
            return;
        }

        // 如果是checkbox，那么直接控件选中
        if (field.is(':checkbox')) {
            // 强制数据转换成字符串来比较，以控制控件的选中状态
            field.prop('checked', data.toString() === fm.option.checkbox[0].toString());
            // 可以返回了
            return;
        }

        // 其它类型的input和非input控件，直接设置值
        field.val(data);

        // 如果是select控件，那就触发一下change事件
        if (field.is('select')) {
            field.change();
        }
    }

    /**
     * 获取表单的所有数据
     * @param {Object} fm
     */
    function getAllData(fm) {
        // 创建一个对象来存放数据
        var data = {};
        // 遍历控件取值
        $.each(fm.getField(), function(name) {
            // 获取某个name的控件的值(在radio时可能是多个)
            data[name] = getFieldData(fm, name);
        });
        // 返回所有数据
        return data;
    }

    /**
     * 设置某个控件的值
     * @param {Object} fm 表单实例
     * @param {String} fieldName 控件的name名称
     * @return {Any} 控件的值
     */
    function getFieldData(fm, fieldName) {
        // 根据控件的name找到控件
        var field = fm.getField(fieldName);

        // 如果控件是input标签的元素，使用独特的取值技巧
        if (field.is('input')) {
            // 返回获取到的值
            return getInputValue(fm, field);
        }

        // 其它的控件直接取值并返回
        return field.val();
    }

    /**
     * 获取input控件的值
     * @param {Object} fm 表单实例
     * @param {Array} field 控件数组
     * @return {Any} 控件的值
     */
    function getInputValue(fm, field) {
        // 声明一个存放控件值的变量，默认值为空字符串
        var value = '';
        // 取radio的值
        if (field.is(':radio')) {
            // 取选中的radio的值就行了
            return field.filter(':checked').val();
        }

        // checkbox 的值返回是根据 option.checkbox定义，默认返回 true和false
        if (field.is(':checkbox')) {
            return field.is(':checked') ? fm.option.checkbox[0] : fm.option.checkbox[1];
        }

        // 其它的直接返回值
        return field.val();
    }
})(jQuery, TinyForm);/**
 * TinyForm 数据校验组件
 */
(function($, TinyForm) {
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
     * 默认配置
     */
    TinyForm.defaults.validate = {
        // 是否在输入控件失去焦点时自动验证，默认为false
        auto: false,
        // 是否在第一次验证失败时停止验证，默认为true
        stop: false,
        // 每个控件验证后的回调函数
        callback: function() {},
        // 提供规则可编辑的接口
        rules: RULES
    };

    /**
     * 验证组件
     */
    TinyForm.extend({
        /**
         * 初始化
         */
        setup: function() {
            refresh(this);
        },
        /**
         * 刷新接口
         */
        refresh: function() {
            refresh(this);
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
            if (arguments.length === 0) {
                // 返回所有的规则对象
                return all;
            }

            // 控件不存在
            if (this.getField(fieldName).length === 0) {
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
            if (arguments.length > 0) {
                // 参数需要字符串，类型不对
                if (typeof fieldName !== 'string') {
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
            for (var name in fields) {
                // 这个name无效
                if (!fields.hasOwnProperty(name)) {
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
                if (!r && me.option.validate.stop) {
                    // 验证失败了，返回false
                    return false;
                }

                // 将返回的验证详细信息保存起来，
                // 这个函数完了后，如果验证失败就将所有验证结果返回
                data.detail[name] = r;
                if (!r && data.pass) {
                    // 验证不通过  整体结果为不通过
                    data.pass = false;
                }
            }

            // 如果有验证失败，则返回验证失败的详细信息，如果验证通过，则返回true
            return data.pass || data.detail;
        }
    });

    /**
     * 加载验证规则并根据配置绑定自动验证事件
     * 
     * @param {Object} fm 表单实例
     */
    function refresh(fm) {
        // 重新获取标签的验证规则
        getAllRules(fm);

        // 绑定事件 失去焦点时调用验证函数
        if (!fm.option.validate.auto) {
            // 不自动验证 就直接返回好了
            return;
        }
        // 遍历控件，绑定失去焦点时验证的事件
        $.each(fm.getField(), function(name) {
            // 绑定失去焦点事件
            this.blur(function() {
                // 失去焦点时触发验证规则
                fm.validate(name);
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
        var rules = ruleSet[fm.id] = {};
        // 所有可用的规则
        var validRules = fm.option.validate.rules;

        // 遍历控件，获取验证规则
        $.each(fm.getField(), function(name, field) {
            // 从标签属性上获取规则描述  当然  还是要trim一下的
            var rule = $.trim(field.attr(ATTRS.rule));
            // 从标签属性上获取提示消息
            var msg = field.attr(ATTRS.msg);

            // 规则为空，返回一个false
            if (rule === '') {
                // 设置 false ，表示没有验证规则
                rules[name] = false;
                // 没有规则就不用再去取提示消息了，直接返回去取下一个控件
                return;
            }

            // 不包含 : 冒号，表示是普通规则
            // 如果自定义规则 validRules 中存在这个名称的规则，那么直接取出正则
            if (rule.indexOf(':') === -1) {
                // 字段的所有验证规则
                var fieldRules = rule.split(' ');
                // 这是|符号的占位符。
                // 占位方法：将 || 替换成这个串，然后再map中替换成 |
                var placeholder = '@tiny_form_msg_splitter@';
                // 多个提示消息的分隔符
                var splitter = '|';
                // 多个消息使用 | 符号分隔，如果要在消息中显示 | 符号，那么就使用 ||
                var msgs = typeof msg === 'undefined' ? false :
                    $.map(msg.replace(/\|\|/g, placeholder).split(splitter), function(msgItem) {
                        return msgItem.replace(new RegExp(placeholder), splitter);
                    });

                if (msgs) {
                    // 让规则和消息长度一致
                    if (msgs.length > fieldRules.length) {
                        msgs.length = fieldRules.length;
                    }

                    // 如果只有一个消息，就搞成字符串
                    if (msgs.length === 1) {
                        msgs = msgs[0];
                    }
                }

                rules[name] = [];

                $.each(fieldRules, function(index, ruleName) {
                    if (!validRules.hasOwnProperty(ruleName)) {
                        return;
                    }
                    var thisRule = $.extend(true, {
                        name: ruleName
                    }, validRules[ruleName]);

                    if (msgs && msgs.length) {
                        // 如果有配置data-msg，就使用data-msg作为默认的消息
                        if (typeof msgs === 'string') {
                            // 使用标签上配置的的提示消息(也就是在data-msg上配置的消息)
                            thisRule.msg = msgs;
                        } else {
                            // 取第一个消息
                            thisRule.msg = msgs.shift();
                        }
                    }
                    // 添加规则
                    rules[name].push(thisRule);
                });

                // 如果所有验证规则都不存在，那么就认为不需要验证
                if (!rules[name].length) {
                    rules[name] = false;
                }
                // 可以返回了
                return;
            }

            // 解析在validRules中没有定义的规则，然后返回
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
        if (!rule) {
            // 不需要验证，返回一个false
            return false;
        }
        // 如果验证以regex:开头，表示需要使用正则验证
        if (rule.indexOf('regex:') === 0) {
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
        if (rule.indexOf('length:') === 0) {
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
        if (lendef.length === 1) {
            // 搞成int类型 如果搞不成，那数据格式就不对了
            var len = parseInt(lendef[0]);
            // 不能搞成数字 或者是负数
            if (isNaN(len) || len < 0) {
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
        if (lendef.length === 2) {
            // 把第一个值弄成int
            var len1 = parseInt(lendef[0]);
            // 把第二个值弄成int
            var len2 = parseInt(lendef[1]);
            // 不能搞成数字 或者是负数
            if (isNaN(len1) || len1 < 0 || isNaN(len2) || len2 < 0) {
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
        if (!field || field.length === 0) {
            // 返回false表示验证失败
            // 为啥呢？
            // 开发专门来验证，却出现了控件不存在的情况，
            // 这是来玩的么？
            return false;
        }

        var pass = true;
        // 获取控件的验证规则
        var rules = fm.getRule(fieldName);

        // 没有验证规则时，直接返回  true
        if (rules === false) {
            return pass;
        }

        // 获取控件的值
        var value = fm.getData(fieldName);

        // 如果值为空并且没有配置 required 规则，那么调用回调或者返回 true ，
        // 此时不需要验证，所以就不调用回调函数了
        if (rules === false || value === '' && rules.every(function(rule) {
                return rule.name !== 'required';
            })) {
            return pass;
        }

        // 这里用for 而不是each，是为了方便在适当的时候 return ，以结束函数
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            // 没有规则或为false就不需要验证
            if (typeof rule === 'undefined' || rule === false) {
                // 返回一个true，表示验证通过
                return true;
            }

            if ($.isFunction(rule.rule)) {
                // 验证规则是函数，调用它
                var ret = rule.rule.call(field, value, fieldName);
                // 验证通过时返回true
                // 验证不通过时返回false
                // 不通过时，使用默认的消息：data-msg 或者 rule.msg
                // 返回字符串（或其它类型）的时候则认为验证不通过，同时这个字符串作为验证失败的提示消息
                if (typeof ret === 'string') {
                    pass = false;
                    // 返回值作为提示消息
                    rule.msg = ret;
                } else if (ret === false) {
                    // 返回值作为验证结果
                    pass = !!ret;
                }
            } else {
                // 不是函数，那就认为是下则表达式了
                // 因为只支持这两种写法
                pass = rule.rule.test(value);
            }

            //验证的回调函数，这个太长了，弄个短名字好写些
            var cb = fm.option.validate.callback;

            // 回调不是函数，直接返回验证的结果
            if (!$.isFunction(cb)) {
                // 配置了stop参数么在第一次验证失败后就停止验证
                if (fm.option.validate.stop && !pass) {
                    return false;
                }
                continue;
            }

            // 因为回调可以通过return来改变验证结果，所以这里要取得回调的返回值
            var custompass = cb.call(fm, {
                // 验证是否通过
                pass: pass,
                // 验证的控件对象
                field: field,
                // 验证规则的名称
                rule: rule.name,
                // 控件的name名称
                name: fieldName,
                // 控件的值
                value: value,
                // 提示消息
                msg: rule.msg
            });

            // 判断回调的返回值是不是 undefined，如果是那么就是用户并没有返回值
            if (typeof custompass !== 'undefined') {
                // 用户返回了值，强制搞成boolean然后作为这个控件的验证结果
                pass = !!custompass;
            }

            // 配置了stop参数么在第一次验证失败后就停止验证
            if (fm.option.validate.stop && !pass) {
                return false;
            }
        }
        //返回验证结果   true 或者 false
        return pass;
    }
})(jQuery, TinyForm);