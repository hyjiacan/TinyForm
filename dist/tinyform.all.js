/**
 * TinyForm-all@0.7.11  2020-03-02
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
            instanceSet[id] = new TinyForm.prototype.tinyform($me, option, id);
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
        tinyform: function (formContainer, option, id) {
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
            var checkboxValue = readCheckboxValueOnTag(me, field);
            // 检查值是否合法
            data = data.toLowerCase();
            if (checkboxValue.indexOf(data) === -1) {
                console.warn('字段' + field.attr('name') + '的值' + data + '无效，需要[' + checkboxValue.join() + ']');
            }
            field.prop('checked', data === checkboxValue[0]);
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
     * @return {String|Boolean|Number|File} 字段的值
     */
    function getInputValue(me, field) {
        // 取radio的值
        if (field.is(':radio')) {
            // 取选中的radio的值就行了
            return ifUndefOrNull(field.filter(':checked').val());
        }

        // checkbox 的值返回是根据 option.checkbox定义，默认返回 true和false
        if (field.is(':checkbox')) {
            return readCheckboxValueOnTag(me, field)[field.is(':checked') ? 0 : 1];
        }

        // 取文件描述
        if (field.is(':file')) {
            return field.get(0).files[0];
        }

        // 其它的直接返回值
        return ifUndefOrNull(field.val());
    }

    /**
     * 若果值是 undefined，返回一个默认值
     * @param {string} [val] 用于判断的值
     * @param {string} [dft=''] 默认值
     * @return {string}
     */
    function ifUndefOrNull(val, dft) {
        return typeof  val === 'undefined' || val === null ?
            arguments.length > 1 ? dft : ''
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

    /**
     * 读取标签上定义的 data-checkbox 的值，如果读取不到，就使用表单上定义的值
     * @param {TinyForm} me 实例
     * @param {jQuery} field 字段的jQuery对象
     * @return {Array} 定义的checkbox值数组，第一项是选中的值，第二项是未选中的值
     */
    function readCheckboxValueOnTag(me, field) {
        var tagValue = (field.attr('data-checkbox') || '').toLowerCase();
        if (tagValue) {
            return tagValue.split('|');
        }
        var formValue = (me.context.attr('data-checkbox') || '').toLowerCase();
        if (formValue) {
            return formValue.split('|');
        }
        return me.option.checkbox.map(function (item) {
            return item.toString().toLowerCase();
        });
    }
})(window, jQuery);
/**
 * TinyForm 数据存储组件，用于将表单数据持久化到浏览器存储中
 */
(function (win, $) {
    /**
     * 从存储中读取出的数据无法转换成JSON对象时的提示消息，这个消息会在控制台输出
     */
    var INVALID_STORAGE_DATA = '无效的数据存储';

    /**
     * 定时存储数据的周期，单位为毫秒
     */
    var interval;

// 默认配置
    TinyForm.defaults.storage = {
        // 存储的唯一名称，如果不指定，会使用表单的name值或id值，否则自动计算一个唯一名称
        name: null,
        // 数据存储的容器，根据应用场景可以设置为 localStorage或sessionStorage
        container: win.localStorage,
        // 是否在实例化的时候加载存储的数据，默认为false
        load: false,
        // 自动保存表单数据到存储的间隔(毫秒)，不设置或设置0表示不自动保存
        time: 0,
        // 自动保存数据后的回调函数
        onstore: false
    };

    /**
     * TinyForm 本地存储组件
     * 提供将表单数据存放到localStorage或sessionStorage的功能
     */
    TinyForm.extend({
        setup: function () {
            // 照惯例保存一个表单实例对象到变量
            var me = this;

            var storage = me.option.storage;

            // 这个表单数据存储的唯一名称
            // 类型: 字符串，如果不指定这个参数，那么会使用url+DOM构建一个唯一名称
            if (!storage.name) {
                storage.name = getUniquePath(me.context);
            }
            // 如果需要初始化时从存储加载数据，那么就调用加载函数
            // 如果存储中没有数据会清空现有的数据
            if (storage.load) {
                // 加载数据
                me.load();
            }

            // 调用定时存储函数
            storeDataInterval(me, storage);
        },
        /**
         * 保存数据到缓存中，新保存的数据会覆盖上次保存的数据
         * @param {Function} fn 保存数据前的处理函数，返回值是新的数据
         * @return {TinyForm} 实例
         */
        store: function (fn) {
            // 存储数据前肯定要先获取数据
            var data = this.getData();

            // 如果参数大于0，那么就是传入了存储数据前的处理函数
            if (arguments.length > 0) {
                // 调用回调函数
                data = fn.call(this, data);
            }

            // 将数据使用JSON搞成字符串，然后存储
            this.option.storage.container.setItem(this.option.storage.name, JSON.stringify(data));

            // 返回表单实例
            return this;
        },
        /**
         * 从缓存读取数据并加载到表单字段，没有数据时不会更新表单字段数据
         * @param {Boolean} fill 是否在读取数据后自动将数据填充到表单中。注意：如果填充，动作发生在回调后
         * @param {Function} fn 读取出数据后的回调函数，可以通过回调函数更改数据更改后的数据通过return返回
         * @return {Object} 存储的原始数据
         */
        load: function (fill, fn) {
            // 从存储中读取出来数据
            var data = this.option.storage.container.getItem(this.option.storage.name);
            // 如果有数据，就通过JSON搞成对象
            if (data) {
                // 这里弄个try catch，是考虑到存储被篡改的情况
                try {
                    // 解析字符串为对象
                    data = JSON.parse(data);
                } catch (e) {
                    // 解析失败，在控制台输出信息
                    console.error(INVALID_STORAGE_DATA);
                }
            }

            // 如果指定了填充参数
            if (fill) {
                // 如果指定了填充表单数据前的处理函数
                if ($.isFunction(fn)) {
                    // 那么就调用这个处理函数，并将其返回值作为要填充的数据填入
                    this.setData(fn.call(this, data));
                } else {
                    // 直接填充数据
                    this.setData(data);
                }
            }
            // 返回存储的数据对象（未经过处理函数处理)
            return data;
        },
        /**
         * 丢弃数据存储
         * @return {Object} 存储的数据
         */
        abandon: function () {
            var storage = this.option.storage;
            var data = storage.container.getItem(storage.name);
            storage.container.removeItem(storage.name);
            if (data) {
                // 这里弄个try catch，是考虑到存储被篡改的情况
                try {
                    // 解析字符串为对象
                    data = JSON.parse(data);
                } catch (e) {
                    // 解析失败，在控制台输出信息
                    console.error(INVALID_STORAGE_DATA);
                }
            }
            // 返回存储的数据对象
            return data;
        }
    });

    /**
     * 获取某个DOM元素在DOM中的路径
     * @param {Object} element DOM元素对象
     * @return {String} 路径
     */
    function getUniquePath(element) {
        // 把所有需要的数据都搞到一个数组里面，然后再join就能生成一个字符串
        // 取了这些数据：
        // 1 url（含页面路径）
        // 2 表单元素在DOM中的路径
        // 3 表单元素在同级元素同的位置
        // 4 如果表单元素指定了ID，则将这个ID也加上

        // 获取url路径（不带search参数）  并存到数组
        var path = [win.location.origin, win.location.pathname];

        // 查找表单元素的所有父级元素(不包含body元素)，并且将其标签名称添加到数组中
        $(element).parentsUntil(win.document.body).each(function () {
            path.push(this.tagName);
        });

        // 如果表单有同级元素，则找到表单在同级DOM中的index
        path.push($(element).siblings().andSelf().index(element));

        // 判断表单元素是否指定了ID
        if ($(element).is('[id]')) {
            // 指定了ID就把ID添加到数组中
            path.push($(element).attr('id'));
        }

        // 使用下划线(_)连接数组的每一项，然后将所有的非数字、字母和下划线都替换成下划线，然后再弄成大写的形式
        return path.join('_').replace(/[^0-9a-z_]/ig, '_').toUpperCase();
    }

    /**
     * 定时存储表单数据
     * @param {TinyForm} me 实例
     * @param {Object} storage 配置参数的storage对象
     */
    function storeDataInterval(me, storage) {
        interval = parseInt(storage.time);

        // 是否配置了定时存储数据
        if (isNaN(interval) || interval <= 0) {
            // 如果没有定义或格式不正确或是负数就直接返回
            return;
        }

        // 定义了定时存储，搞个定时器来做这个事
        win.setTimeout(function () {
            // 存储数据
            me.store();
            // 如果指定了存储数据的事件处理函数
            if ($.isFunction(storage.onstore)) {
                // 调用存储数据的处理函数
                storage.onstore.call(me);
            }

            // 然后再次调用存储函数，准备下个周期的存储
            storeDataInterval(me, storage);
        }, parseInt(interval));
    }
})(window, jQuery);
/**
 * TinyForm 数据校验组件
 */
(function (win, $) {
    /**
     * 验证规则定义，这些规则可以直接应用到表单字段的属性上面
     * 如果需要更多的规则，请直接添加到这里
     * @example
     * <input type="text" data-rule="email" data-msg="请输入电子邮箱地址" />
     */
    var RULES = {
        // 必填
        required: {
            rule: function (value) {
                value = $.trim(value);
                return !!value && value.length;
            },
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
        /**
         * 限定长度应在某个区间内
         */
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
     * 表单字段的验证规则集合
     */
    var ruleSet = {};

    /**
     * 默认配置
     */
    TinyForm.defaults.validate = {
        //  用于自定义html标签上写验证规则与提示消息的属性
        attr: ATTRS,
        // 是否在输入字段失去焦点时自动验证，默认为false
        auto: false,
        // 是否在第一次验证失败时停止验证，默认为true
        stop: true,
        // 每个字段验证后的回调函数
        callback: function () {
        },
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
        setup: function () {
            refresh(this);
        },
        /**
         * 刷新接口
         */
        refresh: function () {
            refresh(this);
        },
        /**
         * 获取表单指定字段的验证规则或所有规则
         * @param {String} fieldName 字段的name名称，不指定此值时获取所有规则
         * @returns {Object|Boolean}  此字段未定义规则时，返回false；否则返回规则对象 {rule: /正则表达式/, msg: '消息'}
         */
        getRule: function (fieldName) {
            // 搞一个验证规则的副本，以防止意外改变验证规则
            var all = $.extend(true, {}, ruleSet[this.id]);

            // 没有参数
            if (arguments.length === 0) {
                // 返回所有的规则对象
                return all;
            }

            // 字段不存在
            if (this.getField(fieldName).length === 0) {
                // 返回空对象
                return {};
            }

            // 返回指定字段的验证规则
            return all[fieldName];
        },
        /**
         * 验证表单
         * @param {String} fieldName 指定要验证字段的name名称，不指定时验证所有字段
         * @returns {Object|Boolean} 验证通过时返回true，失败时返回失败的详细信息对象{pass: Boolean, value: String, field: Array, msg: String}
         */
        validate: function (fieldName) {
            // 后头到处要用，搞个变量保存起来，能减小压缩后的体积
            var me = this;

            // 指定了参数，说明只验证指定name的字段，这里只取第一个参数
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

            // 取到所有的字段准备验证
            var fields = me.getField();
            // 开始遍历字段验证
            for (var name in fields) {
                // 这个name无效
                if (!fields.hasOwnProperty(name)) {
                    // 进行下一次
                    continue;
                }

                // 字段的验证结果
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
     * @param {TinyForm} me 实例
     */
    function refresh(me) {
        // 重新获取标签的验证规则
        getAllRules(me);

        // 绑定事件 失去焦点时调用验证函数
        if (!me.option.validate.auto) {
            // 不自动验证 就直接返回好了
            return;
        }
        // 遍历字段，绑定失去焦点时验证的事件
        $.each(me.getField(), function (name) {
            // 绑定失去焦点事件
            this.blur(function () {
                // 失去焦点时触发验证规则
                me.validate(name);
            });
        });
    }

    /**
     * 从一个jQuery对象的字段中获取验证的规则
     * @param {TinyForm} me 实例
     * @param {Object} field 字段jQuery对象
     * @returns {Array}
     */
    function getFieldRule(me, field) {
        // 从标签属性上获取规则描述  当然  还是要trim一下的
        var ruleName = $.trim(field.attr(ATTRS.rule));

        // 规则为空，返回一个false
        if (ruleName === '') {
            // 返回[] ，表示没有验证规则
            return [];
        }

        var msg = replaceRegMsg(me.context, field, field.attr('name'), field.attr(ATTRS.msg));

        // 从标签属性上获取提示消息
        var msgs = msg ? handlePlaceholder(msg, '|') : false;

        // 不包含 : 冒号，表示是普通规则
        // 如果自定义规则 validRules 中存在这个名称的规则，那么直接取出正则
        return ruleName.indexOf(':') === -1 ?
            resolvePreDefinedRule(me.option.validate.rules, ruleName, msgs) :
            // 规则是特殊语法
            [resolveValidateRule(ruleName, msgs[0])];
    }

    /**
     * 将字符串str通过 seek 分隔成数组，然后将两个连续的seek替换成 place
     *
     * @param {String} str 原始串
     * @param {String} seek 用来分隔多项的串
     * @param {String} [place] 用来替换两个连续的seek的串，当不指定时，表示与 seek 相同
     * @returns {Array} 分割后的数组
     */

    /**
     * 获取表单所有字段的验证规则
     * @param {TinyForm} me 实例
     * @returns {Object} 验证规则对象
     */
    function getAllRules(me) {
        // 清空原有的数据
        var rules = ruleSet[me.id] = {};

        // 遍历字段，获取验证规则
        $.each(me.getField(), function (fieldName, field) {
            rules[fieldName] = getFieldRule(me, field);

            // 如果所有验证规则都不存在，那么就认为不需要验证
            if (!rules[fieldName].length) {
                rules[fieldName] = false;
            }
        });
    }

    function handlePlaceholder(str, seek, place) {
        if (!str) {
            return [];
        }
        seek = seek.toString();

        if (str.indexOf(seek) === -1) {
            return [str];
        }

        // 搞个新的占位串，这个占位串用来替代两个 placeholder 连续存在的位置
        var token;
        do {
            // 因为要构建正则，所以这里干掉.符号
            token = '#' + Math.random().toString().replace('.', '') + '#';
        } while (str.indexOf(token) !== -1);

        var tokenReg = new RegExp(token, 'g');
        place = typeof place === 'undefined' ? seek : place;

        // 把 | 符号转义，正则里面才能使用
        seek = seek.replace(/\|/g, '\\|');

        // 例： str = 'xxx||aaa'
        // 会得到 xxx#1232121#aaa
        return str.replace(new RegExp(seek + seek, 'g'), token)
        // 将多个内容分开
            .split(new RegExp(seek, 'g')).map(function (item) {
                return item.replace(tokenReg, place);
            });
    }

    /**
     * 替换消息中的引用消息
     * @param {Object} context 元素的上下文环境
     * @param {Object} field 字段对象
     * @param {string} fieldName 字段名称
     * @param {String} msg 原始消息串
     * @returns {String} 替换后的提示消息
     */
    function replaceRegMsg(context, field, fieldName, msg) {
        if (!msg) {
            return '';
        }
        var refmsg;
        // 在具有name属性时，对 label文本 的引用支持
        if (fieldName && msg.indexOf('&l') !== -1) {
            refmsg = $('label[for=' + fieldName + ']:first', context)
                .text().replace(/\|/g, '||'); // 防止要引用消息中含有|符号

            // 填充引用消息 &l => label
            msg = handlePlaceholder(msg, '&l')
                .join(refmsg);
        }
        // 对 placeholder 的引用支持
        if (msg.indexOf('&p') !== -1) {
            refmsg = (field.attr('placeholder') || '').replace(/\|/g, '||'); // 防止要引用消息中含有|符号

            // 填充引用消息 &p => placeholder
            msg = handlePlaceholder(msg, '&p')
                .join(refmsg);
        }
        return msg;
    }

    /**
     * 解析字段的预定义规则验证
     * @param {Object} validRules 所有可用的验证规则
     * @param {Object} rule data-rule的值
     * @param {Array|Boolean} msgs 消息数组
     * @return {Array} 这个字段需要验证的规则数组，如果没有就返回空数组
     */
    function resolvePreDefinedRule(validRules, rule, msgs) {
        // 规则名称
        // 字段的所有验证规则
        // 通过 | 符号分隔
        return rule.split('|').filter(function (ruleName) {
            return validRules.hasOwnProperty(ruleName) || ruleName[0] === '&';
        }).map(function (ruleName) {
            var thisRule = $.extend(true, {
                name: ruleName
            }, validRules[ruleName]);

            // 如果验证规则是以 & 符号开头，那就表示这个字段要与其它某个字段的值相同
            // 其它某个字段： & 符号后的字符串即为其名称
            if (ruleName[0] === '&') {
                thisRule.rule = ruleName;
                thisRule.msg = '两次输入不一致';
            }

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
            return thisRule;
        });
    }

    /**
     * 解析字段的特殊规则验证
     * @param {String} rule data-rule的值
     * @param {String} [msg] 消息
     * @return {Object|Boolean} 需要验证时返回对象，否则返回false
     */
    function resolveValidateRule(rule, msg) {
        // 创建一个存放验证规则和提示消息的对象
        var validation = {
            name: rule
        };
        // 参数传入的rule为空
        if (!rule) {
            // 不需要验证，返回一个false
            return false;
        }
        // 如果验证以regex:开头，表示需要使用正则验证
        if (rule.indexOf('regex:') === 0) {
            // 本来这里有 try catch 的，但是考虑到，
            // 要是有异常，这就是开发的问题了，这种错误还是保留比较好
            // 替换掉原串的 regex: 字符，后面的就应该是验证用的正则
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
     * @param {String} msg 自定义的提示消息
     * @returns {Object|Boolean} 需要验证时返回对象，否则返回false
     */
    function resolveLengthRule(rule, msg) {
        // 创建一个存放验证规则和提示消息的对象
        var validation = {
            name: rule
        };

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
            validation.rule = new RegExp(RULE_LEN.least.rule.replace('{0}', len.toString()), 'g');
            // 根据配置创建提示消息
            validation.msg = msg || RULE_LEN.least.msg.replace('{0}', len.toString());

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
            validation.rule = new RegExp(RULE_LEN.between.rule.replace('{0}', len1.toString()).replace('{1}', len2.toString()), 'g');
            // 根据配置创建提示消息
            validation.msg = msg || RULE_LEN.between.msg.replace('{0}', len1.toString()).replace('{1}', len2.toString());

            // 返回规则验证对象
            return validation;
        }

        // 其它情况视为不支持
        console.error(UNSUPPORTED_RULE + ':' + rule);

        // 不验证
        return false;
    }

    /**
     * 验证某个字段
     * @param {TinyForm} me 实例
     * @param {String} fieldName 字段的name名称
     * @return {Object|Boolean}验证成功时返回true, 否则返回失败的详细信息
     */
    function validateField(me, fieldName) {
        //根据name取到字段
        var field = me.getField(fieldName);
        // 字段不存在
        if (!field || field.length === 0) {
            // 返回false表示验证失败
            // 为啥呢？
            // 开发专门来验证，却出现了字段不存在的情况，
            // 这是来玩的么？
            return false;
        }
        // 获取字段的验证规则
        var rules = me.getRule(fieldName);

        // 没有验证规则时，直接返回  true
        if (rules === false) {
            return true;
        }

        var value = me.getData(fieldName);

        return validateFieldRules(me, field, value, rules);
    }

    /**
     * 执行验证规则的真正逻辑
     * @param {TinyForm} me 实例
     * @param {jQuery} field 字段的jQuery对象
     * @param {string} value 字段的值
     * @param rules
     * @return {boolean}
     */
    function validateFieldRules(me, field, value, rules) {
        var pass = true;
        var fieldName = field.attr('name');

        // 如果值为空并且没有配置 required 规则，那么调用回调或者返回 true ，
        // 此时不需要验证，所以就不调用回调函数了
        if (rules === false || ((value === '' || value.length === 0) && rules.every(function (rule) {
                return rule.name !== 'required';
            }))) {
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
            } else if (rule.rule[0] === '&') {
                // 验证与其它某个字段的值相等
                pass = me.getData(rule.rule.substring(1)) === value;
            } else {
                // 不是函数，那就认为是下则表达式了
                // 因为只支持这三种写法

                // 同一个正则多次验证，每次验证都需要将 lastIndex 设置为0，否则多次验证会失败
                rule.rule.lastIndex = 0;
                pass = rule.rule.test(value);
            }

            //验证的回调函数，这个太长了，弄个短名字好写些
            var cb = me.option.validate.callback;

            // 回调不是函数，直接返回验证的结果
            if (!$.isFunction(cb)) {
                // 配置了stop参数么在第一次验证失败后就停止验证
                if (me.option.validate.stop && !pass) {
                    return false;
                }
                continue;
            }

            // 因为回调可以通过return来改变验证结果，所以这里要取得回调的返回值
            var custompass = cb.call(me, {
                // 验证是否通过
                pass: pass,
                // 验证的字段对象
                field: field,
                // 验证规则的名称
                rule: rule.name,
                // 字段的name名称
                name: fieldName,
                // 字段的值
                value: value,
                // 提示消息
                // 对输入值的引用支持
                // 仅支持 input输入框(即 checkbox和radio无效 )
                msg: rule.msg.indexOf('&v') === -1 || !field.is('input:not(:checkbox,:radio)') ?
                    rule.msg : rule.msg.replace(/&v/g, value || '')
            });

            // 判断回调的返回值是不是 undefined，如果是那么就是用户并没有返回值
            if (typeof custompass !== 'undefined') {
                // 用户返回了值，强制搞成boolean然后作为这个字段的验证结果
                pass = !!custompass;
            }

            // 配置了stop参数么在第一次验证失败后就停止验证
            if (me.option.validate.stop && !pass) {
                return false;
            }
        }
        //返回验证结果   true 或者 false
        return pass;
    }
})(window, jQuery);

TinyForm.version = "0.7.11"