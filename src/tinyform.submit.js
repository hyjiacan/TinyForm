(function($, TF) {

    TF.extend({
        setup: function() {
            // 保存初始数据，用于重置
            this.originData = this.getData();
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
                this.setData(this.originData);
            }
            return this;
        }
    });
})(jQuery, TinyForm);