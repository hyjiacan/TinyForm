/**
 * TinyForm 文件上传支持组件
 * @depend tinyform.data.js
 *
 * 目前支持以下方式上传：
 * - FormData ，可以在 http://caniuse.com/#search=formdata 查询兼容性
 */
(function (win, $) {

    /**
     * 上传组件的默认参数
     */
    TinyForm.defaults.upload = {
        /**
         * 使用的上传引擎
         * @type String
         */
        engine: 'native',
        /**
         * 接收上传文件的url
         * @type String
         */
        urL: false,
        /**
         * 支持上传的文件类型，默认为空，表示不限制
         * @type String
         */
        type: null,
        /**
         * 支持选择的文件大小，默认的单位为M，也可以指定单位，默认为0，表示不限制
         * @type Number|String [0]
         * @example 1024 == 1024M == 1G
         */
        size: 0,
        /**
         * 上传前执行的函数，可以通过 return false 阻止上传
         * @type Function
         * @param {Object} param 请求的参数，可以在函数中修改此参数
         * @return {Boolean|void} 返回 false 以阻止上传
         */
        before: null,
        /**
         * 上传后执行的函数
         * @type Function
         */
        after: false,
        /**
         * 上传文件的进度的田回调函数，当进行发生变化时会调用
         * @type Function
         * @param {Number} progress 上传的进度
         */
        progress: false
    };

    TinyForm.extend({
        /**
         *
         */
        init: function () {
            var me = this;
            var option = me.option.upload;
            // 检查是否支持指定的上传引擎
            if (upload.engine === 'native') {
                if (!win.FormData) {
                    console.error('浏览器不支持 FormData，无法上传文件，请前往 http://caniuse.com/#search=formdata 查看浏览器兼容性');
                    return;
                }
            }
        },
        upload: function () {

        }
    });

})(window, jQuery);