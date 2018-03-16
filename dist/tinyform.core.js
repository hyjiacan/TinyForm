/**
 * TinyForm-core@0.7.9  2018-03-16
 * @作者: hyjiacan
 * @源码: https://git.oschina.net/hyjiacan/TinyForm.git
 * @示例: http://hyjiacan.oschina.io/tinyform
 * @许可协议: MIT
 * @依赖: jQuery 1.8.0及更高版本
 * @浏览器支持: 不支持IE8及更低版本
 * @QQ群: 187786345 (Javascript爱好者)
 */
/**
 * TinyForm 核心组件，提供form实例化以及表单字段获取功能
 */
(function (win, $) {
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
     * 表单的id为键，表单实例为值
     */
    var instanceSet = {};

    /**
     * 表单实例的字段集合
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
     * @param {String|jQuery|HTMLElement} selector 表单选择器
     * @param {Object} [option] 参数，可选
     * @returns {TinyForm} 实例
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
     * 实例
     */
    TinyForm.prototype = {
        /**
         * 构造
         */
        constructor: TinyForm,
        /**
         * 初始化表单实例
         * @param {jQuery} formContainer 表单容器的JQ对象
         * @param {Object} option 参数，可选
         * @param {String} id TinyForm实例id
         * @returns {Object}  实例
         */
        setup: function (formContainer, option, id) {
            // 保存实例对象到变量里面
            var me = this;
            // 设置实例的id
            me.id = id;

            // 表单的DOM上下文
            me.context = formContainer;

            // 合并选项参数
            me.option = $.extend(true, {}, TinyForm.defaults, option);

            parseExcludeOption(me);

            // 获取所有字段
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
         * 根据name属性获取字段 返回数组，因为可能存在同name情况
         * @param {String} [fieldName] 要获取的字段的name值，如果不指定这个属性，那么返回所有字段
         * @returns {Array|Object|void}  范围内所有name为指定值的字段数组或获取到的所有域对象
         */
        getField: function (fieldName) {
            var me = this;
            // 是否设置了自动刷新
            if (me.option.refresh) {
                me.refresh();
            }
            // 获取到所有字段，然后创建一个副本，以避免字段集合被修改
            var all = $.extend(true, {}, fieldSet[me.id]);

            // 不传参数表示获取所有的字段
            if (arguments.length === 0) {
                // 返回所的字段集合的副本
                return all;
            }

            // 如果传的参数不是字符串，那就是不合法的
            if (typeof fieldName !== 'string') {
                // 参数错误，此时返回空
                return;
            }
            // 尝试获取字段对象（这里得到的是jQuery对象）
            var field = all[fieldName];
            // 判断是否存在这个名字的字段
            if (!all.hasOwnProperty(fieldName) || field.length === 0) {
                // 如不存在，返回空
                return;
            }

            // 返回字段的jQuery对象
            return field;
        },

        /**
         * 重新获取表单的字段，此操作将更新缓存
         * @returns {TinyForm} 实例
         */
        refresh: function () {
            // 因为要在下面的回调里面使用表单实例，所以弄个变量把实例保存一下
            var me = this;

            // 先更新一下排除范围
            parseExcludeOption(me);

            // 在这个核心组件中，刷新仅仅是重新获取所有字段
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
            var me = this;

            // 添加扩展
            $.each(extension, function (name, fn) {
                // 插件方法
                if (extfn.hasOwnProperty(name)) {
                    extfn[name].push(fn);
                    return;
                }

                // 扩展方法
                // 检查方法是否存在
                if (me.hasOwnProperty(name)) {
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

    /**
     * 对exclude选项进行预处理
     * @param {TinyForm} me 实例
     */
    function parseExcludeOption(me) {
        var option = me.option;
        var exclude = option.exclude;

        // 重置排除范围
        option.exclude = false;

        // 配置中 exclude 如果传的是字符串，表示是选择器
        // 或者是 html 对象
        // 在这里将其搞成jQuery对象
        if (typeof exclude === 'string' ||
            exclude instanceof window.HTMLElement) {
            option.exclude = $(exclude, me.context);
        } else if (!(exclude instanceof $)) {
            // 传入了不是字段串 jQuery 对象的
            option.exclude = false;
        }

        // 如果有标签写了属性 data-exclude 也要被排除掉
        exclude = $(me.context).find('[data-exclude]');
        if (exclude.length) {
            option.exclude = option.exclude ?
                option.exclude.add(exclude) : exclude;
        }
    }

    /**
     * 获取所有的字段
     * @param {TinyForm} me 实例
     */
    function getAllFields(me) {
        // 清空原有的数据
        var fields = fieldSet[me.id] = {};

        // 取出在实例化时传入的需要ignore的参数，然后始终搞成数组
        // 后面会用这个数组去判断某个字段是否需要加载
        var ignoreFields = $.makeArray(me.option.ignore);

        // 根据配置的选择器来查找字段
        me.context.find(TinyForm.defaults.selector).each(function () {
            // 字段对象
            var field = $(this);
            // 不是选择器指定的字段
            if (me.option.selector && !field.is(me.option.selector)) {
                return;
            }
            // 尝试取出name属性，顺便trim一下，要是有人喜欢搞怪，给弄点空白呢
            var name = $.trim(field.attr('name'));

            // 如果name为空，则跳过
            if (name === '') {
                // 没有name属性，那就对不起了
                return;
            }

            // 如果这个name是被ignore的，就跳过这个
            if (ignoreFields.indexOf(name) !== -1) {
                return;
            }

            // 看看这个字段是不是处于被 exclude 的范围内
            if (me.option.exclude && me.option.exclude.find(field).length > 0) {
                return;
            }

            // 字段缓存集合中还不存在这个name的字段
            // 不存在，可能是还没有这个name的属性或者长度为0，感觉这个判断有点冗余，先不管了
            if (typeof fields[name] === 'undefined' || fields[name].length === 0) {
                // 结果中还不存在name，搞个数组出来
                // 这里搞数组，就是为了将相同name的字段集中起来
                fields[name] = field;
                // 可以取下一个字段了
                return;
            }

            // 存在name，如果是radio的话就追加到jQuery数组后头
            if (field.is(':radio')) {
                // 将DOM字段对象（非jQuery对象）添加到jQuery数组后头
                // 这里可以肯定只有一个字段，所以直接使用  this
                fields[name] = fields[name].add(this);
                // 添加进去后，就可以取下一个字段了
                return;
            }

            //如果不是radio，那整相同的name就有毛病
            console.error('字段的name属性"' + name + '"出现多次，这不对吧');
        });
    }

    // 提供默认的配置修改入口
    // 扩展通过  TinyForm.defaults.xxx 来设置默认参数
    TinyForm.defaults = {
        /**
         * 字段选择器，选择带有name属性的input select和textarea，排除input按钮
         */
        selector: 'input[name]:not(:button,:submit,:reset,[data-ignore]' + (!!window.FormData ? '' : ',[type=file]') + '), select[name]:not([data-ignore]), textarea[name]:not([data-ignore])',
        // 在表单内查找字段时，要忽略的字段或字段集合
        // 值可以为false、字符串或数组：
        // boolean: 仅设置false有效，表示没有需要忽略的
        // array: 要忽略的字段的name组成的数组
        // 要注意的是：这里的优先级应该比标签上设置的优先级更低
        // 也就是说，即使这里设置的是false，只在要标签上有属性 data-ignore
        ignore: false,
        /**
         * 要被排除的范围，在这个范围内的字段不会被加载
         * @type {string|HTMLElement|jQuery}
         */
        exclude: false,
        /**
         * 在调用方法时，是否自动执行 refresh() 方法
         * 设置为 false 时，表示不自动刷新，设置为true时，表示自动刷新
         * 注意：设置为true时会有额外的性能开销
         * @type {boolean}
         */
        refresh: false
    };

    // 搞懂，因为真正创建实例是通过 setup ，
    // 所以需要把 TinyForm 的原型交给 setup，
    // 以通过 setup 来产生一个 TinyForm 的实例
    TinyForm.prototype.setup.prototype = TinyForm.prototype;

    /**
     * 搞一个全局的 TinyForm
     */
    win.TinyForm = TinyForm;

    /**
     * 在任意位置获取表单实例的接口
     * 即可以不记住表单实例，只需要通过表单的id就可以获取到指定的表单
     * @param {String} id 表单的id，这个id可以在实例对象的id属性上找到，也可以在创建表单标签的data-tinyform属性上找到
     */
    TinyForm.get = function (id) {
        return !!id ?
            instanceSet[id] :
            // 返回copy，防止实例集合被胡乱搞
            $.extend(true, {}, instanceSet);
    };
})(window, jQuery);
/**
 * TinyForm 数据读写组件，负责从表单字段读取值以及向其写入值
 */(function (win, $) {

    /**
     * 定义一个空的 jQuery.Deferred 对象，
     * 以在 beforeSubmit 返回 false 的时候，
     * 将这个空的 Deferred 返回，这样才能确保
     * form.submit().then() 调用始终有效。
     * 在这里创建一个全局的 Deferred ，
     * 以减少多次调用 $.Deferred() 产生的开销。
     */
    var emptyDeffered = $.Deferred();

    /**
     * 存放表单初始数据的集合
     */
    var originalData = {};

    /**
     * 存放表单默认数据的集合，这里面的数据是 getChanges 的基础
     */
    var defaultData = {};

    // 默认配置
    // 因为 data 是核心组件，所以配置项就不单独放到一个对象中
    $.extend(true, TinyForm.defaults, {
        // 自定义 checkbox 选中(第0个元素)和未选中(第1个元素)状态的值，默认为 ['on', 'off']
        checkbox: ['on', 'off'],
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
        setup: function () {
            // 保存初始数据，用于重置
            originalData[this.id] = this.getData();
            // 保存默认值，用于 getChanges
            defaultData[this.id] = this.getData();
        },
        /**
         * 获取所有字段的值，返回对象
         * @param {String} [fieldName] 字段的name名称，如果指定了此参数，则只获取name=此值的字段的值
         * @returns {*} 字段的name和值对象
         */
        getData: function (fieldName) {
            // 没有参数，要获取所有字段的数据
            if (arguments.length === 0) {
                // 返回所有字段的数据
                return getAllData(this);
            }
            // 参数需要字段的name字符串，类型不对
            if (typeof fieldName !== 'string') {
                // 返回空
                return '';
            }

            // 返回指定字段的值
            return getFieldData(this, fieldName);
        },

        /**
         * 设置字段的值
         * @param {String|Object} data 要设置的值
         * @param {String|boolean} [fieldName] 字段的name名称或是否跳转data中没有的字段，
         *      如果未指定此参数，则**data**应该是一个对象，此时设置表单所有字段的值
         *      如果指定了此参数，
         *      当是字符串时，则只设置name=此值的字段的值
         *      当是布尔值时，也会设置所有字段的值，但是会否跳过data中没有的字段(不设置值)
         * @returns {Object}  实例
         */
        setData: function (data, fieldName) {
            // 后头要在回调函数里面用这个实例对象，所以先弄个变量存起来
            var me = this;

            // 这个函数需要至少一个参数，你一个都不传，这是想造反么？
            if (arguments.length === 0) {
                // 这属于开发错误，我要在控制台给你报个错
                console.error('setData 需要至少1个参数');
                // 还是返回个实例给你
                return me;
            }

            //  传入的data为空时，啥也不做
            if (typeof data === 'undefined' || data === null) {
                return me;
            }

            // 如果传的参数>=2个，就是要设置指定name的字段的值，后面多余的参数直接忽略
            if (arguments.length >= 2) {
                //  第二个参数还是要个字符串，
                if (typeof fieldName === 'string') {
                    // 设置指定name字段的值
                    setFieldData(me, data, me.getField(fieldName));
                    // 返回给你个实例对象
                    return me;
                }
            }

            // 看看第二个是不是布尔类型
            var secondArgIsBoolean = typeof fieldName === 'boolean';

            // 如果第二个参数也不是boolean  就表示跳过
            if (arguments.length >= 2 && !secondArgIsBoolean) {
                // 始终记得返回给你个实例对象
                return me;
            }

            // 未指定name参数，设置表单所有项
            $.each(me.getField(), function (name, field) {
                // 在第二个参数为boolean时
                // 并且数据不包含其值时
                // 不设置（保留原值）
                if (secondArgIsBoolean && !data.hasOwnProperty(name)) {
                    return;
                }
                // 从传入数据对象里面取出这个name的值
                // 如果数据对象里面没有指定这个name，或值为null
                // 那就把值设置成空字符串
                var val = ifUndefOrNull(data[name]);

                // 设置字段的值
                setFieldData(me, val, field);
            });

            // 继续返回实例对象
            return me;
        },
        /**
         * 将当前表单内的数据作为默认数据，默认数据将作为 getChanges 的基础
         * @param {object} [data] 要作为默认值的数据，如果不传，则使用当前表单内的数据
         * @returns {Object|void}  实例
         */
        asDefault: function (data) {
            var me = this;
            defaultData[me.id] = arguments.length ? data : me.getData();
            return me;
        },
        /**
         * 获取值的改变的字段
         * @param {boolean} [returnFields=false] 是否返回字段，默认为 false
         * 传入true的时候，返回的是改变的字段集合
         * 传入false的时候，返回的是改变的值集合
         * @return {object|Boolean} 有改变时，返回改变的数据，否则返回 false
         */
        getChanges: function (returnFields) {
            var me = this;
            // 默认值
            var defaultValue = defaultData[me.id] || {};
            // 改变的集合
            // 放的可能是字段或者值
            var changes = {};
            // 标记是否有改变
            var hasChange = false;
            // 所有字段的集合
            var fields = me.getField();
            // 当前的数据
            var currentData = me.getData();
            // 遍历当前数据
            // 将找出有改变的字段来
            $.each(currentData, function (field, value) {
                // 默认值中包含这个字段（不包含表示有新增字段）
                // 并且默认值与当前值一致
                // 则认为此字段没有改变
                if (!defaultValue.hasOwnProperty(field) || diff(defaultValue[field], value)) {
                    hasChange = true;
                    changes[field] = returnFields ? fields[field] : value;
                }
            });

            // 看看原数据中有的而当前数据没有的字段（缺失字段）
            $.each(defaultValue, function (field) {
                if (!currentData.hasOwnProperty(field)) {
                    hasChange = true;
                    changes[field] = returnFields ? fields[field] : '';
                }
            });

            return hasChange ? changes : false;
        },
        /**
         * 使用jQuery提交表单（默认异步: async=true）
         * @param {Object} option Ajax参数项
         * @returns {Object|void}  实例
         */
        submit: function (option) {
            // 到处都要写this，加个变量保存起来，在压缩的时候说不定能小好几十个字节
            var me = this;

            option = parseOption(me, option);

            // option 构建完了，这里看看有没有设置提交前的回调函数
            if ($.isFunction(me.option.beforeSubmit)) {
                // 设置了提交前的回调函数，就调用一下
                // 回调函数的上下文this是表单实例对象，有个参数option，可以直接进行改动
                if (me.option.beforeSubmit.call(me, option) === false) {
                    return emptyDeffered;
                }
            }

            // 发送ajax请求
            return $.ajax(option);
        },

        /**
         * 重置表单所有项
         * @returns {TinyForm} 实例
         */
        reset: function () {
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
     * 判断两个值是否不一致
     * @param oldValue
     * @param newValue
     * @return {Boolean} 一致时返回false，否则返回true
     */
    function diff(oldValue, newValue) {
        // 这里把 null undefined 以及空数组 等同于 空字符串处理
        if (oldValue === undefined || oldValue === null || ($.isArray(oldValue) && !oldValue.length)) {
            oldValue = '';
        }
        if (newValue === undefined || newValue === null || ($.isArray(newValue) && !newValue.length)) {
            newValue = '';
        }

        // 多选的select得到的是数组
        // 都是数组
        if ($.isArray(oldValue) && $.isArray(newValue)) {
            // 长度不相等
            if (oldValue.length !== newValue.length) {
                return true;
            }
            // 值不相等
            for (var i = 0; i < oldValue.length; i++) {
                if (oldValue[i] !== newValue[i]) {
                    return true;
                }
            }

            return false;
        }
        // 数据类型都不同了 肯定改变了
        if ($.isArray(oldValue) || $.isArray(newValue)) {
            return true;
        }

        // 都不是数组 就按字符串比较
        return oldValue !== newValue;
    }

    /**
     * 设置某个字段的值
     * @param {TinyForm} me 实例
     * @param {String|Number|Boolean|Array} data 要设置的值，可以是任意类型，除了select其它类型都会自动搞成string
     * @param {Array} field 字段对象数组
     */
    function setFieldData(me, data, field) {
        // 如果字段不存在（长度为0），那么啥都不做
        if (!field || field.length === 0) {
            // 返回吧
            return;
        }

        // 如果是 null 或者 undefined ，那么在生成选择器表达式的时候，
        // 就会变成  [value="null"]:first 或者 [value="undefined"]:first
        // 这明显是不对的哇
        // 所以给搞成空字符串，这样就可以得到正确的选择器 [value=""]:first，查找值为空的元素
        data = ifUndefOrNull(data);

        // 把值强制弄成字符串
        data = $.isArray(data) ? $.map(data, function (item) {
            return item.toString();
        }) : data.toString();

        // 字段是radio，那么可能有多个
        if (field.is(':radio')) {
            // 所有radio先置为未选中的状态，这样来避免设置了不存在的值时，还有radio是选中的状态
            field.prop('checked', false).each(function () {
                // 找出value与数据相等的字段设置选中
                // 不区分大小写
                if ($(this).val().toLowerCase() === data.toLowerCase()) {
                    $(this).prop('checked', true);
                    return false;
                }
            });
            // 可以返回了
            return;
        }

        // 如果是checkbox，那么直接字段选中
        if (field.is(':checkbox')) {
            // 比较字符串的值，以控制字段的选中状态 
            // 不区分大小写
            field.prop('checked', data.toLowerCase() === me.option.checkbox[0].toString().toLowerCase());
            // 可以返回了
            return;
        }

        // 如果是select字段，那就触发一下change事件
        if (field.is('select')) {
            field.val(data);
            field.change();
        } else {
            // 其它类型的input和非input字段，直接设置值
            field.val(data);
        }
    }

    /**
     * 获取表单的所有数据
     * @param {TinyForm} me
     */
    function getAllData(me) {
        // 创建一个对象来存放数据
        var data = {};
        // 遍历字段取值
        $.each(me.getField(), function (name) {
            // 获取某个name的字段的值(在radio时可能是多个)
            data[name] = getFieldData(me, name);
        });
        // 返回所有数据
        return data;
    }

    /**
     * 设置某个字段的值
     * @param {TinyForm} me 实例
     * @param {String} fieldName 字段的name名称
     * @return {*} 字段的值
     */
    function getFieldData(me, fieldName) {
        // 根据字段的name找到字段
        var field = me.getField(fieldName);

        // field 不存在，即此时在请求不存在
        if (!field) {
            console.error('cannot found field "' + fieldName + '"');
            return '';
        }

        // 如果字段是input标签的元素，使用独特的取值技巧
        if (field.is('input')) {
            // 返回获取到的值
            return getInputValue(me, field);
        }
        var val = field.val();

        // 如果是select的多选，在 jQuery3版本中，没有选中项时，获取到的是空数组
        // 而在jquery3之前的版本 没有选中时返回的是 null
        // 这里让行为保持一致，若是jquery3之前的版本，则也返回空数组
        if (field.is('select[multiple]')) {
            return val === null ? [] : val;
        }

        // 其它的字段直接取值并返回
        // 如果取到的是 undefined 那么返回空字符串或空数组
        return typeof val === 'undefined' ?
            (field.is('select[multiple]') ? [] : '') : val;
    }

    /**
     * 获取input字段的值
     * @param {TinyForm} me 实例
     * @param {Array} field 字段数组
     * @return {String|Boolean|Number} 字段的值
     */
    function getInputValue(me, field) {
        // 取radio的值
        if (field.is(':radio')) {
            // 取选中的radio的值就行了
            return ifUndefOrNull(field.filter(':checked').val());
        }

        // checkbox 的值返回是根据 option.checkbox定义，默认返回 true和false
        if (field.is(':checkbox')) {
            return field.is(':checked') ? me.option.checkbox[0] : me.option.checkbox[1];
        }

        // 其它的直接返回值
        return ifUndefOrNull(field.val());
    }

    /**
     * 若果值是 undefined，返回一个默认值
     * @param {string} [val] 用于判断的值
     * @param {string} [def=''] 默认值
     * @return {string}
     */
    function ifUndefOrNull(val, def) {
        return typeof  val === 'undefined' || val === null ?
            arguments.length > 1 ? def : ''
            : val;
    }

    /**
     * 处理$.ajax异步上传的选项
     * @param {TinyForm} me 实例
     * @param {object} [option] 调用 submit 方法时传入的参数
     * @return {object} 处理后的选项对象
     */
    function parseOption(me, option) {
        var data = me.getData();

        var defaultOption = {
            // 提交的url，默认读取dom元素的action属性
            url: me.context.attr('action'),
            // 提交的类型（post/get），默认读取dom元素的method属性
            type: me.context.attr('method') || 'post',
            // 默认异步提交
            async: true,
            // 默认不使用数据缓存
            cache: false
        };

        // 看看是否有文件字段
        var hasFileField = false;
        $.each(me.getField(), function (fieldName, field) {
            if (field.is(':file')) {
                // 发现了文件字段
                hasFileField = true;
                return false;
            }
        });

        // 有文件字段  那么发送的数据就不一样了
        if (hasFileField) {
            if (!win.FormData) {
                throw new Error('[TinyForm] 浏览器不支持 FormData，无法上传文件，请前往 http://caniuse.com/#search=formdata 查看浏览器兼容性');
            }
            // 构造 FormData
            var formData = new win.FormData();
            $.each(me.getField(), function (fieldName, field) {
                if (field.is(':file')) {
                    // 发现了文件字段
                    // 将文件对象搞进去
                    formData.append(fieldName, field.get(0).files[0]);
                } else {
                    // 非文件字段
                    formData.append(fieldName, data[fieldName]);
                }
            });
            defaultOption.data = formData;
            // 还要设置一些其它的属性才行
            // https://segmentfault.com/a/1190000007207128
            defaultOption.contentType = false;
            // https://zhidao.baidu.com/question/1926250710050869147.html
            defaultOption.processData = false;

            if (me.option.onprogress) {
                // 添加文件上传进度的支持
                defaultOption.xhr = function () {
                    //获取ajaxSettings中的xhr对象，为它的upload属性绑定progress事件的处理函数
                    var xhr = $.ajaxSettings.xhr();
                    if (xhr.upload) { //检查upload属性是否存在
                        //绑定progress事件的回调函数
                        xhr.upload.addEventListener('progress', me.option.onprogress, false);
                    }
                    return xhr;
                };
            }
        } else {
            // 没有文件字段则使用表单的所有数据
            defaultOption.data = data;
        }

        // 合并提交数据的参数，这些参数都是给ajax用的
        return $.extend(true, defaultOption, option);
    }
})(window, jQuery);
TinyForm.version = "0.7.9"