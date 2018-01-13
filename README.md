# 简介

**TinyForm**是一个基于 *jQuery* 的WEB表单处理工具(**仅操作表单，不是~~创建表单~~**)。
使用这个工具，不会改变原有的DOM结构和样式，也不会新增或移除元素。
他根据传入的*选择器*或*DOM/jQuery*对象，创建表单实例，然后在这个范围内搜索带有*name*属性的表单字段。
>默认的选择器是*input[name]:not(:button,:submit,:reset), select[name], textarea[name]*，配置参数这`TinyForm.defaults.selector`，也就是说，也可以通过实例化表单的参数*selector*来自定义。

<del>IE8及更低版本IE浏览器</del>

## 目录结构

**dist** 生成目录

- tinyform.core[.min].js 基本的表单字段获取和数据读写功能、表单的重置、异步提交
- tinyform.common[.min].js 含基本的表单字段获取、数据读写、表单的重置、异步提交和数据验证功能
- tinyform.all[.min].js 包含所有功能

**src** 源码目录

- tinyform.core.js 包含表单实例化，字段获取和刷新缓存以及扩展接口
- tinyform.data.js 包含数据的读写、重置和异步提交
- tinyform.validate.js 验证字段的输入
- tinyform.storage.js 操作数据存储

## 下载

> 请使用 **右键->另存为** 下载文件

如果只需要表单字段的获取以及表单数据的读写和异步提交，用这个就够了
[tinyform.core.js](http://git.oschina.net/hyjiacan/TinyForm/raw/master/dist/tinyform.core.js)(开发版)
[tinyform.core.min.js](http://git.oschina.net/hyjiacan/TinyForm/raw/master/dist/tinyform.core.min.js)(生产版)

如果还想要用到数据的验证，那就用这个
[tinyform.common.js](http://git.oschina.net/hyjiacan/TinyForm/raw/master/dist/tinyform.common.js)(开发版)
[tinyform.common.min.js](http://git.oschina.net/hyjiacan/TinyForm/raw/master/dist/tinyform.core.common.js)(生产版)

如果还想用到表单数据的本地存储，那就只能选这个了
[tinyform.all.js](http://git.oschina.net/hyjiacan/TinyForm/raw/master/dist/tinyform.all.js)(开发版)
[tinyform.all.min.js](http://git.oschina.net/hyjiacan/TinyForm/raw/master/dist/tinyform.all.min.js)(生产版)

## 源码

git
```shell
$ git clone https://git.oschina.net/hyjiacan/TinyForm.git
```

npm
```shell
$ npm install tinyform
```

Bower

```shell
$ bower install tinyform
```

## 用法

**html**

```html
<div id="f1" action="#">
    <div>
        <label for="">用户名</label>
        <input type="text" name="username" data-rule="required number" data-msg="有本事你写下你的名字" placeholder="不能为空,只能数字" />
    </div>
    <div>
        <label for="">性别</label>
        <input type="radio" data-rule="required" name="gender" value="0" data-rule="required" data-msg="咋，你是人妖？" />男的
        <input type="radio" data-rule="required" name="gender" value="1" />女的
    </div>
    <div>
        <label for="">做啥的</label>
        <select name="job" id="">
            <option value="freedom">自由职业</option>
            <option value="it">IT玩家</option>
            <option value="code">码农</option>
            <option value="programmer">程序猿</option>
        </select>
    </div>
    <div>
        <label for="">电话号码</label>
        <input type="text" name="phone" value="" data-rule="number" placeholder="只能是数字" />
    </div>
    <div>
        <label for="">英文名字</label>
        <input type="text" name="name-en" value="" data-rule="alpha lower" placeholder="只能是字母，还只能是小写的" />
    </div>
    <div>
        <label for="">邮箱</label>
        <input type="text" name="email" value="" data-rule="email" placeholder="只能输入邮箱" />
    </div>
    <div>
        <label for="">邮编</label>
        <input type="text" name="postcode" value="" data-rule="regex:^[0-9]{6}$" data-msg="请输入正确的6位数字" placeholder="只能输入6位数字" />
    </div>
    <div>
        <label for="">网址</label>
        <input type="text" name="website" value="" data-rule="site" placeholder="只能输入网址" />
    </div>
    <div>
        <label for="">签名</label>
        <input type="text" name="signature" value="" data-rule="length: 12" placeholder="至少要12个字符" />
    </div>
    <div>
        <label for="">备注</label>
        <textarea name="remark" rows="5" cols="40" data-rule="length: 20, 32" placeholder="字符数量需要在20-32之间"></textarea>
    </div>
    <div>
        <label for="">标签忽略的字段</label>
        <input type="text" name="ignore-field-1" data-ignore />
    </div>
    <div>
        <label for="">配置忽略的字段</label>
        <input type="text" name="ignore-field-2" />
    </div>
</div>
```

**js**

```javascript
var form = TinyForm('#f1', {
    // 自定义 checkbox 选中(第0个元素)和未选中(第1个元素)状态的值，默认为 ['on', 'off']
    checkbox: [1, 0],
    // 在表单内查找字段时，要忽略的字段或字段集合
    // 值可以为false、字符串或数组：
    // boolean: 仅设置false有效，表示没有需要忽略的
    // array: 要忽略的字段的name组成的数组
    // 要注意的是：这里的优先级比标签上设置的优先级更低
    // 也就是说，即使这里设置的是false，只在要标签上有属性 data-ignore
    ignore: 'ignore-field-2',
    validate: {
        // 是否在输入字段失去焦点时自动验证，默认为false
        auto: true,
        // 是否在第一次验证失败时停止验证，默认为true
        stop: false,
        // 每个字段验证后的回调函数
        callback: function(e) {
            //正在验证的字段的jQuery对象
            console.log('字段:' + e.field.attr('name'));
            //此字段的值
            console.log('值:' + e.value);
            //表单验证是否通过
            console.log('结果:' + e.pass);
            // 验证的提示消息，无论验证是否通过都有
            console.log('消息:' + e.msg);
            // 可以通过 return来改变验证的结果，若不想改变原验证结果，可以不返回任何值
        },
        // 这个表单实例附加的验证规则
        rules: {
            // 小写规则
            lower: {
                rule: /^[a-z]+$/,
                msg: '请输入小写字母'
            },
            // 大写规则
            upper: {
                // @param value 字段的值
                // @param name 字段的name属性
                rule: function(value, name){
                    if(value===''){
                        // 输入为空  返回true表示验证通过
                        return true;
                    }

                    if(/^[A-Z]+$/.test(value)){
                        // 是大写的，返回true表示验证通过
                        return true;
                    }
                    // 验证失败，返回提示消息
                    return '请输入大写字母';
                    // 或者，此时使用data-msg或下面的msg属性
                    // return false;
                },
                msg: '只接收大写字母输入'
            }
            // 当然，还可以加上更多
        }
    },
    storage: {
        // 存储的唯一名称，如果不指定，会自动计算一个唯一名称
        name: 'xxx',
        // 数据存储的容器，根据应用场景可以设置为 localStorage或sessionStorage
        container: localStorage,
        // 是否在实例化的时候加载存储的数据，默认为false
        load: false,
        // // 自动保存表单数据到存储的间隔(毫秒)，不设置或设置0表示不自动保存
        time: 0,
        // 自动保存数据后的回调函数
        // this 是表单实例
        onstore: function(data) {
            console.log('表单数据已经自动保存');
        }
    },
    // 调用ajax前的数据处理
    beforeSubmit: function(ajaxOption) {
        var data = ajaxOption.data || {};
        data.addition = 'xxxxxxxxxxxxxx-fuck';
        if(data.gender) {
            if(data.gender == '0') {
                data.gender = '男的';
            } else {
                data.gender = '女的';
            }
        }
    }
});
```

自定义`rule`为函数的写法，参见 [issue#4](http://git.oschina.net/hyjiacan/TinyForm/issues/4)

### 想看更多示例 ？ 那就点 **[这里](http://hyjiacan.oschina.io/tinyform/)** 吧

## 选项

选项`option`是在创建表单实例的时候仇主入的一个参数对象：

```javascript
var form = TinyForm('formselector', option);
```

下面是选项的概述：

**selector** String

> 自定义的表单字段选择器，用于选择表单字段。注：一定要包含*[name]*，否则会导致表单功能的异常

**checkbox** Array

> 自定义**checkbox**的选中与未选中状态的值，默认为 `['on', 'off']`，
> 这个选项在调用`getData`和`setData`时都会生效，
> 要注意的是，这里的类型只支持基础值类型： Number, String, Boolean
> 在设置数据时，会将设置的数据转换成字符串(调用 `toString`，这个选项的值也会转换)再比较，
> 为`on`则选中，否则不选中

**validate** Object

> 验证相关的参数对象，详细参数详见上方示例

**storage** Object

> 存储相关的参数对象，详细参数详见上方示例

**beforeSubmit** Function(ajaxOption: Object)

> 异步提交表单前的回调函数，上下文`this`指向 表单实例对象。可以通过此函数改变提交的数据
> **ajaxOption** 异步请求的数据对象，参数与jQuery的ajax参数一致。修改这个对象会直接影响ajax请求的参数。
> **return** 此函数返回 false 会阻止表单的提交(仅阻止通过`form.submit()`发起的提交)。

  **exclude** boolean
  
> 要被排除的范围，在这个范围内的字段不会被加载

这些选项的默认值可以通过：

```javascript
// 设置所有的表单失去焦点时自动验证
TinyForm.defaults.validate.auto = true;

// 添加一个名为 xxx 的验证规则，在标签上可以通过  data-rule="xxx" 来使用
TinyForm.defaults.validate.rules.xxx = {
    rule: /xxx/,
    msg: '需要xxx'
};
```

这样的方式来修改，在执行这句后的所有`TinyForm`都会自动在失去焦点后验证

## 标签属性

### **data-rule**

此输入字段的验证规则，支持以下值(**这些写法均要区分大小写**)：

- **required** 必填
- **number** 数字
- **alpha** 字母
- **email** 电子邮箱
- **site** 网址
- 留空 不验证
- **regex:**打头 自定义的正则表达式，如：`regex: [0-7]`
- **length:**打头 验证输入长度，若只有一个值则表示最短长度;两个值表示长度范围 `length: 6, 16`

指定多个验证规则时，使用 `|` 符号分隔：

```html
<input type="text" name="username" data-rule="required|number" data-msg="有本事你写下你的名字|只能是数字" placeholder="不能为空" />
```

需要注意的是，使用 `|` 符号分隔的规则仅在指定规则名称时有效，即不能将规则名称与正则混用，如：

```html
<input type="text" name="username" data-rule="regex: ^xxx$|number" data-msg="有本事你写下你的名字|只能是数字" placeholder="不能为空" />
```
是错误的写法。

另外，如果想验证输入与其它某个字段的值相同(比如常见的密码确认功能)，可以这样写规则：

```html
<input type="password" name="pswd" rule="required|password" />
<input type="password" name="pswdconfirm" rule="required|&pswd" />
```

，看到了吧，这里写成引用的方式来告诉程序，希望字段`pswdconfirm`的值与`pswd`的值相同，这样，字段`pswdconfirm`验证时，就会自动判断了。

### **data-msg**

> 此字段验证失败时的提示消息，若不指定则使用默认消息，
> data-msg消息的优先级最高，也就是说:
> 如果配置了`data-msg`，那么验证失败始终提示此消息
> 如果没有配置 `data-msg` ，那么就使用 `rule.msg` 作为提示消息
> 如果想要尝试定制提示消息，那层就将`rule.rule`配置为函数，返回值将作为提示消息
> 如果要针对每一个规则设置不同的消息，可以将多个消息使用 `|` 符号分隔，如果消息中包含`|`符号，那么就写成`||`

当有相同*name*的字段时，只读取第一个字段的*data-rule*和*data-msg*

可使用如下方法更改提示消息：

```javascript
var form = $('#form', {
    validate:{
        required: {
            msg: '请填写必填字段'
        }
    }
})
```

另外，`data-msg`属性新增了引用功能，可以通过 `&l`, `&p`, `&v`分别引用对应`label`标签和`placeholder`属性的值，如：

```html
<label for="username">用户名</label>
<input name="username" data-rule="required|format" data-msg="&p|输入的&l格式不正确" placeholder="请输入用户名" />
```

这样，当未填写时，就会提示消息*请输入用户名*，而当输入的格式不正确时(`format`规则)，就会提示*输入的用户名格式不正确*。

`&l`和`&p`可以多次出现，如果要在消息中显示 `&l`和`&p`，则写作`&&l`和`&&p`。

### **data-ignore**

被忽略的字段，有这个属性的字段不会被处理，如：

```html
<input type="text" name="ignore-field" data-ignore />
```

### **data-exclude**

被排除的范围，有这个属性范围内的字段不会被处理，如：

```html
<div data-exclude>
    <input type="text" name="ignore-field" />
</div>
```

> 这些忽略和排除的属性，可以用于在某个表单中创建子表单。

## 实例属性

**context**

> 表单的DOM上下文，这是一个指向实例化表单的DOM的jQuery对象，可以通过这个对象去操作表单表的DOM。

```javascript
// 查找表单内的按钮
form.context.find('input[type=button]');
```

**option**

> 表单的选项，部分参数可以在运行时变更

```javascript
// 将存储切换为sessionStorage
form.option.storage.container = window.sessionStorage;
```

可以在运行时变更的选项：

- data
    - selector 可以动态地设置字段选择器，重设后需要调用*refresh*方法刷新缓存
- storage
    - container 切换存储容器
    - time  设置为*0*可以停止自动存储数据，停止后不能再次启用自动存储(实例生命周期内)
    - onstore 改变自动存储的回调函数
    - name 改变存储项的名称，，不推荐修改这项，因为运行时修改可能导致已经存储的数据无法读取
- validate
    - stop 可以改变：是否在第一次验证失败后停止验证
    - callback 改变字段验证的回调函数

## 实例方法

> 说明：除了获取数据类(包括验证)的函数，其它都会返回表单的实例对象。

### tinyform.core

**getField(fieldName: String): Object**

> 根据*name*属性获取字段 返回jQuery对象
> **fieldName** 要获取的字段的*name*值，如果不指定这个属性，那么返回所有字段
> **return** 范围内所有*name*为指定值的字段的jQuery对象或获取到的所有字段jQuery对象

**refresh(): Instance**

> 重新获取所有字段和验证规则，适用于表单有动态改动时
> **return** 表单实例

**getData(fieldName: String): Object**

> 获取输入字段的值。
> **fieldName** 要获取值的字段。字段的*name*名称，如果指定了此参数，则只获取*name=此值*的字段的值
> **return** 表单数据，结构如下：

```javascript
{
    username: 'hyjiacan',
    gender: '0'
}
```

> 注意：没有值时返回空字符串，
> 带有*multiple*属性的*select*，获取到的值为数组，没有选择项时返回空数组。

**setData(data: Any|Object, fieldName: String|boolean): Instance**

> 设置字段的值
> **data** 表单数据，*field*不指定时结构与`getData`返回结构一致，缺少的项使用空值；指定时可以设置任何合适的类型
> **fieldName** 字段的name名称或是否跳转data中没有的字段，
        如果未指定此参数，则**data**应该是一个对象，此时设置表单所有字段的值
        如果指定了此参数，
        当是字符串时，则只设置name=此值的字段的值
        当是布尔值时，也会设置所有字段的值，但是会否跳过data中没有的字段(不设置值)
> **return** 表单实例

**asDefault(data: object): Instance**

> 将当前表单内的数据作为默认数据，默认数据将作为 getChanges 的基础
> **data** 要作为默认值的数据，如果不传，则使用当前表单内的数据
> **return** 表单实例

**getChanges(returnField: boolean): object**

> 获取值的改变的字段
> **returnField** 是否返回字段，默认为 false
        传入true的时候，返回的是改变的字段集合
        传入false的时候，返回的是改变的值集合

**reset(): Instance**

> 重置表单的值（清空所有数据）
> **return** 表单实例

**submit(option: Object): Instance|Promise**

> 异步提交表单
> **option** ajax选项，参数与jQuery的*ajax*选项相同，默认参数如下：

```javascript
{
    url: 'String', // 使用表单的action属性
    type: 'String', // 使用表单的method属性，如果没有则使用"post"
    data: 'Object', // 使用"getData()"取到的表单数据，在此指定时，参数会附加到参数里面
}
```

> 注意：从版本 `0.7` 开始，这个函数的返回值发生了变化：
> 如果`beforeSubmit`返回`false`，那么此函数不会提交表单，此时此函数会返回`undefined`，
> 而如果提交了表单，那么此函数会返回`ajax`的`Promise`对象，以方便通过`form.submit().then(function(){})`的方式使用返回数据

### tinyform.common

**getRule(fieldName: String): Object**

> 获取表单指定字段的验证规则或所有规则
> **fieldName** 件的*name*名称，不指定此值时获取所有规则
> **return** 获取单个字段规则时，返回结构如下：

```javascript
{
    rule:  /^.+$/, // 这里可能是正则或函数
    msg: '不能为空' // 提示消息，通过标签的 *data-msg* 属性设置
}
```

> 获取多个字段规则时，结构如下：

```javascript
{
    username:{
        rule:  /^.+$/, // 必填
        msg: '不能为空' // 提示消息，通过标签的 *data-msg* 属性设置
    }
    gender: {
        rule:  false, // 没有验证规则
        msg: ''
    }
}
```

**validate(field: String|Array): Boolean|Object**

> 通过标签属性*data-rule*指定的规则验证表单
> **fieldName** 指定要验证字段的*name*名称，不指定时验证所有字段
> **return** 验证通过时，返回`true`，未通过时返回失败详细信息，结构如下：

```javascript
{
    username: false,
    gender: true
}
```

### tinyform.all

**store(fn: Function)**: Object

> 存储表单数据
> **fn** 存储前的数据处理函数，用于在存储前处理数据，这个函数有一个参数*data*，是表单的数据，修改后的数据通过`return`返回
> **return** 表单实例

**load(fill: Boolean, fn: Function)**: Object

> 读取存储的表单数据，读取后会自动加载到表单
> **fill**是否在读取数据后自动将数据填充到表单中。注意：如果填充，动作发生在回调后
> **fn** 读取后的回调函数，用于在读取后处理数据，这个函数有一个参数*data*，是表单的数据，修改后的数据通过`return`返回
> **return** 从存储读取的数据(没有被回调处理过)

**abandon()**: Object

> 读取存储的表单数据，然后清除存储的数据
> **return** 从存储读取的数据

## 静态函数

TinyForm 也提供了一些的功能函数。

### 获取实例

在任意位置获取表单实例的接口。即可以不记住表单实例，只需要通过表单的id就可以获取到指定的表单。

`TinyForm.get(id)` 
参数`id`是表单的实例id，这个id可以在实例对象的id属性上找到，也可以在创建表单标签的data-tinyform属性上找到。
当指定`id`的实例不存在时，返回 `undefined`，当不传参数`id`时，返回页面上的所有实例

### 实例功能扩展

TinyForm 支持通过调用函数`TinyForm.extend`添加自定义实例功能扩展。

一般的扩展用法如下：

```javascript
(function($, TinyForm){
    TinyForm.extend({
        setup: function(){
            // 这里写初始化的代码
        },
        refresh:function(){
            // 这里写刷新表单时的代码，对需要缓存的数据进行刷新操作
        },
        method2:function(){
            // 扩展方法 method2
        },
        methodn:function(){
            // 扩展方法 methodn
        }
    });
})(jQuery, TinyForm);
```

这时候，就可以直接调用

```javascript
form.method2();
form.methodn();
```
