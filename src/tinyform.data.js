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
         * @return {{}}
         */
        getChanges: function (returnFields) {
            var me = this;
            // 默认值
            var defaultValue = defaultData[me.id] || {};
            // 改变的集合
            // 放的可能是字段或者值
            var changes = {};
            // 所有字段的集合
            var fields = me.getField();
            // 遍历当前数据
            // 将找出有改变的字段来
            $.each(me.getData(), function (field, value) {
                // 默认值中包含这个字段
                // 并且默认值与当前值一致
                // 则认为此字段没有改变
                if (defaultValue.hasOwnProperty(field) && defaultValue[field] === value) {
                    return;
                }
                changes[field] = returnFields ? fields[field] : value;
            });

            return changes;
        },
        /**
         * 使用jQuery提交表单（默认异步: async=true）
         * @param {Object} option Ajax参数项
         * @returns {Object|void}  实例
         */
        submit: function (option) {
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
})(window, jQuery);