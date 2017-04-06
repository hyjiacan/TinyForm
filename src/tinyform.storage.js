/**
 * TinyForm 数据存储组件，用于将表单数据持久化到浏览器存储中
 */

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
    // 存储的唯一名称，如果不指定，会自动计算一个唯一名称
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
    setup: function() {
        // 照惯例保存一个表单实例对象到变量
        var me = this;

        var storage = me.option.storage;

        // 这个表单数据存储的唯一名称
        // 类型: 字符串，如果不指定这个参数，那么会使用url+DOM构建一个唯一名称
        if(!storage.name) {
            storage.name = getUniquePath(me.context);
        }
        // 如果需要初始化时从存储加载数据，那么就调用加载函数
        // 如果存储中没有数据会清空现有的数据
        if(storage.load) {
            // 加载数据
            me.load();
        }

        // 调用定时存储函数
        storeDataInterval(me, storage);
    },
    /**
     * 保存数据到缓存中，新保存的数据会覆盖上次保存的数据
     * @param {Function} fn 保存数据前的处理函数，返回值是新的数据
     * @return {Object} 表单实例
     */
    store: function(fn) {
        // 存储数据前肯定要先获取数据
        var data = this.getData();

        // 如果参数大于0，那么就是传入了存储数据前的处理函数
        if(arguments.length > 0) {
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
    load: function(fill, fn) {
        // 从存储中读取出来数据
        var data = this.option.storage.container.getItem(this.option.storage.name);
        // 如果有数据，就通过JSON搞成对象
        if(data) {
            // 这里弄个try catch，是考虑到存储被篡改的情况
            try {
                // 解析字符串为对象
                data = JSON.parse(data);
            } catch(e) {
                // 解析失败，在控制台输出信息
                console.error(INVALID_STORAGE_DATA);
            }
        }

        // 如果指定了填充参数
        if(fill) {
            // 如果指定了填充表单数据前的处理函数
            if($.isFunction(fn)) {
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
    abandon: function() {
        var storage = this.option.storage;
        var data = storage.container.getItem(storage.name);
        storage.container.removeItem(storage.name);
        if(data) {
            // 这里弄个try catch，是考虑到存储被篡改的情况
            try {
                // 解析字符串为对象
                data = JSON.parse(data);
            } catch(e) {
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
    $(element).parentsUntil(win.document.body).each(function() {
        path.push(this.tagName);
    });

    // 如果表单有同级元素，则找到表单在同级DOM中的index
    path.push($(element).siblings().andSelf().index(element));

    // 判断表单元素是否指定了ID
    if($(element).is('[id]')) {
        // 指定了ID就把ID添加到数组中
        path.push($(element).attr('id'));
    }

    // 使用下划线(_)连接数组的每一项，然后将所有的非数字、字母和下划线都替换成下划线，然后再弄成大写的形式
    return path.join('_').replace(/[^0-9a-z_]/ig, '_').toUpperCase();
}

/**
 * 定时存储表单数据
 * @param {Object} fm 表单实例
 * @param {Object} storage 配置参数的storage对象
 */
function storeDataInterval(fm, storage) {
    interval = parseInt(storage.time);

    // 是否配置了定时存储数据
    if(isNaN(interval) || interval <= 0) {
        // 如果没有定义或格式不正确或是负数就直接返回
        return;
    }

    // 定义了定时存储，搞个定时器来做这个事
    win.setTimeout(function() {
        // 存储数据
        fm.store();
        // 如果指定了存储数据的事件处理函数
        if($.isFunction(storage.onstore)) {
            // 调用存储数据的处理函数
            storage.onstore.call(fm);
        }

        // 然后再次调用存储函数，准备下个周期的存储
        storeDataInterval(fm, storage);
    }, parseInt(interval));
}