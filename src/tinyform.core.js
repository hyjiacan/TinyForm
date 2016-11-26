(function($, win) {
    /**
     * 控件选择器，选择带有name属性的input select和textarea，排除input按钮
     */
    var CONTROL_SELECTOR = 'input[name]:not([type=button][type=submit][type=reset]), select[name], textarea[name]';

    /**
     * 找不到控件时的提示消息
     */
    var CONTROL_NOT_FOUND = '找不到此控件: ';

    /**
     * 在需要字符串参数的地方，没有给字符串参数时输出这个消息
     */
    var STR_REQUIRED = '需要字符串';

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
            this._cache = {
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
                console.error(STR_REQUIRED);
                return;
            }
            var field = all[fieldName];
            if(!all.hasOwnProperty(fieldName) || field.length === 0) {
                console.error(CONTROL_NOT_FOUND + fieldName);
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
     * @param {} option 表单初始化参数，可选
     * @returns {Object} 表单实例对象；当选择器为空时，返回 undefined 
     */
    win.TinyForm = TinyForm;

    /**
     * 获取所有的控件
     * @param {Object} fm 表单实例
     */
    function getAllFields(fm) {
        // 清空原有的数据
        $.each(fm._cache.fields, function(name, field) {
            field.length = 0;
        });

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
})(jQuery, window);