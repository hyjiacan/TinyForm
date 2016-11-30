/**
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
})(window, jQuery, TinyForm);