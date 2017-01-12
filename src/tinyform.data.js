/**
 * TinyForm 数据读写组件，负责从表单控件读取值以及向其写入值
 */
(function($, TF) {
    /**
     * 我要使用严格模式
     */
    'use strict';

    /**
     * 存放表单初始数据的集合
     */
    var originalData = {};

    /**
     * 这个是数据读写（获取和设置）的组件
     */
    TF.extend({
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
            if(arguments.length === 0) {
                // 返回所有控件的数据
                return getAllData(this);
            }
            // 参数需要控件的name字符串，类型不对
            if(typeof fieldName !== 'string') {
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
            if(arguments.length === 0) {
                // 这属性开发错误，我要在控制台给你报个错
                console.error('setData 需要至少1个参数');
                // 还是返回个实例给你
                return me;
            }

            // 如果传的参数>=2个，就是要设置指定name的控件的值，后面多余的参数直接忽略
            if(arguments.length >= 2) {
                //  第二个参数还是要个字符串，格式不对没法玩
                if(typeof fieldName !== 'string') {
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
                if(typeof val === 'undefined' || val === null) {
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
            if($.isFunction(me.option.beforeSubmit)) {
                // 设置了提交前的回调函数，就调用一下
                // 回调函数的上下文this是表单实例对象，有个参数option，可以直接进行改动
                me.option.beforeSubmit.call(me, option);
            }

            // 发送ajax请求
            $.ajax(option);

            // 返回表单实例对象
            return me;
        },

        /**
         * 重置表单所有项
         * @returns {Object} 表单实例 
         */
        reset: function() {
            // 看一下表单dom元素对象上有没有一个叫做reset的方法
            // 如果有，那就说明这个表单的DOM元素是form标签
            // 这时就有浏览器内置的reset能用
            if($.isFunction(this.context.get(0).reset)) {
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
        if(field.length === 0) {
            // 返回吧
            return;
        }

        // 控件是radio，那么可能有多个
        if(field.is(':radio')) {
            // 所有radio先置为未选中的状态，这样来避免设置了不存在的值时，还有radio是选中的状态
            field.prop('checked', false)
                // 找出value与数据相等的控件设置选中
                .filter('[value=' + data + ']:first').prop('checked', true);
            // 可以返回了
            return;
        }

        // 如果是checkbox，那么直接控件选中
        if(field.is(':checkbox')) {
            // 强制数据转换成bool类型来控制控件的选中状态
            field.prop('checked', !!data);
            // 可以返回了
            return;
        }

        // 其它类型的input和非input控件，直接设置值
        field.val(data);
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
        if(field.is('input')) {
            // 返回获取到的值
            return getInputValue(field);
        }

        // 其它的控件直接取值并返回
        return field.val();
    }

    /**
     * 获取input控件的值
     * @param {Array} field 控件数组
     * @return {Any} 控件的值
     */
    function getInputValue(field) {
        // 声明一个存放控件值的变量，默认值为空字符串
        var value = '';
        // 取radio的值
        if(field.is(':radio')) {
            // 取选中的radio的值就行了
            return field.filter(':checked').val();
        }

        // checkbox 的值返回true和false
        if(field.is(':checkbox')) {
            return field.is(':checked');
        }

        // 其它的直接返回值
        return field.val();
    }
})(jQuery, TinyForm);