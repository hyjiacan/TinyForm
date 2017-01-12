/**
 * TinyForm 核心组件，提供form实例化以及表单控件获取功能
 */
(function($, win) {
    /**
     * 我要使用严格模式
     */
    'use strict';
    /**
     * 控件选择器，选择带有name属性的input select和textarea，排除input按钮
     */
    var CONTROL_SELECTOR = 'input[name]:not(:button,:submit,:reset), select[name], textarea[name]';
   
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
        if(!id || !instanceSet.hasOwnProperty(id)) {
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
        setup: function(formContainer, option, id) {
            // 保存实例对象到变量里面
            var me = this;
            // 设置实例的id
            me.id = id;

            // 合并选项参数
            me.option = $.extend(true, {
                // 表单控件的选择器
                selector: CONTROL_SELECTOR
            }, option);
            // 表单的DOM上下文
            me.context = formContainer;

            // 获取所有控件
            getAllFields(me);

            // 调用插件的初始化方法  这个调用要放到最后，
            // 确保所有需要的资源都就位
            $.each(extfn.setup, function() {
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
        getField: function(fieldName) {
            // 获取到所有控件，然后创建一个副本，以避免控件集合被修改
            var all = $.extend(true, {}, fieldSet[this.id]);

            // 不传参数表示获取所有的控件
            if(arguments.length === 0) {
                // 返回所的控件集合的副本
                return all;
            }

            // 如果传的参数不是字符串，那就是不合法的
            if(typeof fieldName !== 'string') {
                // 参数错误，此时返回空
                return;
            }
            // 尝试获取控件对象（这里得到的是jQuery对象）
            var field = all[fieldName];
            // 判断是否存在这个名字的控件
            if(!all.hasOwnProperty(fieldName) || field.length === 0) {
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
        refresh: function() {
            // 因为要在下面的回调里面使用表单实例，所以弄个变量把实例保存一下
            var me = this;

            // 在这个核心组件中，刷新仅仅是重新获取所有控件
            getAllFields(me);

            // 调用插件的刷新方法
            $.each(extfn.refresh, function() {
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
        value: function(extension) {
            // 搞一个参数的副本，以防止改变原有的对象，
            // 或者是原有的对象改变后影响已经绑定的功能
            var temp = $.extend(true, {}, extension);
            // 判断插件是否有初始化方法
            if(temp.hasOwnProperty('setup')) {
                // 有初始化方法，将其添加到扩展方法数组中
                extfn.setup.push(temp.setup);
                // 删掉插件参数上面的setup方法，以阻止其污染核心组件的setup
                delete temp.setup;
            }
            if(temp.hasOwnProperty('refresh')) {
                // 有刷新方法，将其添加到扩展方法数组中
                extfn.refresh.push(temp.refresh);
                // 删掉插件参数上面的refresh方法，以阻止其污染核心组件的refresh
                delete temp.refresh;
            }

            // 添加插件方法到实例上
            $.each(temp, function(name, fn) {
                // 检查方法是否存在
                if(this.hasOwnProperty(name)) {
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

        // 根据配置的选择器来查找控件
        fm.context.find(fm.option.selector).each(function() {
            // 尝试取出name属性，顺便trim一下，要是有人喜欢搞怪，给弄点空白呢
            var name = $.trim($(this).attr('name'));
            // 如果name为空，则跳过
            if(name === '') {
                // 没有name属性，那就对不起了
                return;
            }

            // 控件缓存集合中还不存在这个name的控件
            // 不存在，可能是还没有这个name的属性或者长度为0，感觉这个判断有点冗余，先不管了
            if(typeof fields[name] === 'undefined' || fields[name].length === 0) {
                // 结果中还不存在name，搞个数组出来
                // 这里搞数组，就是为了将相同name的控件集中起来
                fields[name] = $(this);
                // 可以取下一个控件了
                return;
            }

            // 存在name，如果是radio的话就追加到jQuery数组后头
            if($(this).is(':radio')) {
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
})(jQuery, window);