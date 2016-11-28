# TinyForm
TinyForm 是一个基于jQuery的WEB表单处理工具。他根据传入的*选择器*或*DOM/jQuery*对象，创建表单实例，然后在这个范围内搜索带有*name*属性的表单控件。
>默认的选择器是**input[name]:not([type=button][type=submit][type=reset]), select[name], textarea[name]**，这项是写在文件*src/tinyform.core.js*里面的全局变量*CONTROL_SELECTOR*中。

## 用法/Usage
**html**
```
<div id="f1" action="#">
	<div>
		<label for="">用户名</label>
		<input type="text" name="username" data-rule="required" data-msg="有本事你写下你的名字" placeholder="不能为空" />
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
		<input type="text" name="name-en" value="" data-rule="alpha" placeholder="只能是字母" />
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
</div>
```

**js**
```
var form = $('#f1').mf({
	autoValidate: true, // 是否在输入控件失去焦点时自动验证
	stopOnFail: false, // 是否在第一次验证失败时停止验证
	afterValidate: function(e) {
		console.log('字段:' + e.field[0].attr('name'));
		console.log('值:' + e.value);
		console.log('结果:' + e.pass);
		console.log('消息:' + e.msg);
	},
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

### 想看更多示例 ？ 那就点 **[这里](http://hyjiacan.oschina.io/tinyform/)** 吧

## 选项/option
**fieldSelector** String
> 自定义的表单控件选择器，用于选择表单控件。注：一定要包含*[name]*，否则会导致表单功能的异常

**autoValidate** Boolean
> 是否在输入控件失去焦点时自动验证输入，默认为*false*

**afterValidate** Function( e: Object): Boolean
> 验证后的回调函数，上下文this指向 *minifom* 对象。此回调在验证每个输入控件时都会调用
> **e** 回调事件参数，结构如下：
	```
	{
		result: Boolean, //表单验证是否通过
		field: Array, //正在验证的控件的对象数组
		value: String, //此控件的值
		message: String // 验证未通过时的消息
	}
	```
> **return** 验证是否通过，可以通过修改这个返回值来改变验证结果。如果没有返回或返回*undefined*，那么保留原验证结果

**beforeSubmit** Function(ajaxOption: Object)
> 异步提交表单前的回调函数，上下文this指向 *minifom* 对象。可以通过此函数改变提交的数据
> **ajaxOption** 异步请求的数据对象

**stopOnFail** Boolean
> 是否在第一个验证失败的时停止验证，默认为 *true*

## 标签属性/Tag Attribute
**data-rule**
> 此输入控件的验证规则，支持以下值：
	- required 必填
	- number 数字
	- alpha 字母
	- email 电子邮箱
	- site 网址
	- 留空 不验证
	- 以*regex:*打头 自定义的正则表达式，如：regex: [0-7]
	- 以*length:*打头 验证输入长度，若只有一个值则表示最短长度;两个值表示长度范围 length: 6, 16; 两个值相等表示指定长度

**data-msg**
> 此控件验证失败时的提示消息，若不指定则使用默认消息

当有相同*name*的控件时，只读取第一个控件的*data-rule*和data-msg*

## 方法/Method
> 说明：除了获取数据类(包括验证)的函数，其它都会返回*miniform*的实例对象。

**getField(fieldName: String): Array**
> 根据name属性获取控件 返回数组，因为可能存在同name情况
> **fieldName** 要获取的控件的name值，如果不指定这个属性，那么返回所有控件
> **return** 范围内所有name为指定值的控件数组或获取到的所有域对象，结构如下：
	```
	{
		username: [Object], // 用户名
		gender: [Object, Object] // 男 女
	}
	```
	或
	```
	[Object], // 用户名
	[Object, Object] // 男 女
	```

**getData(fieldName: String): Object**
> 获取输入控件的值。
> **fieldName** 要获取值的控件。控件的name名称，如果指定了此参数，则只获取name=此值的控件的值
> **return** 表单数据，结构如下：
	```
	{
		username: 'hyjiacan',
		gender: '0'
	}
	```
> 注意：带有*multiple="multiple"属性的*select*，获取到的值为数组。

**setData(data: Any|Object, fieldName: String): Instance**
> 设置控件的值
> **data** 表单数据，*field*不指定时结构与*getData*返回结构一致，缺少的项使用空值；指定时可以设置任何合适的类型
> **fieldName** 控件的name名称，如果指定了此参数，则只设置name=此值的控件的值
> **return** miniform实例

**reset(): Instance**
> 重置表单的值（清空所有数据）
> **return** miniform实例

**refresh(): Instance**
> 重新获取所有控件和验证规则，适用于表单有动态改动时
> **return** miniform实例

**getRule(fieldName: String): Object**
> 获取表单指定控件的验证规则或所有规则
> **fieldName** 件的name名称，不指定此值时获取所有规则
> **return** 获取单个控件规则时，返回结构如下：
	```
	{
	    rule:  /^.+$/, // 必填
	    msg: '不能为空' // 提示消息，通过标签的 *data-msg* 属性设置
	}
	```
	> 获取多个控件规则时，结构如下：	

	```
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
> **fieldName** 指定要验证控件的name名称，不指定时验证所有控件
> **return** 验证通过时，返回*true*，未通过时返回失败详细信息，结构如下：
	```
	{
	    username: false,
	    gender: true
	}
	```

**submit(option: Object)**
> 异步提交表单
> **option** ajax选项，参数与*jQuery*的ajax选项相同，默认参数如下：
	```
	{
	    url: 使用表单的action属性，
	    type: 使用表单的method属性，如果没有则使用*post*,
	    data: 使用*getData()*取到的表单数据，在此指定时，参数会附加到参数里面
	}
	```

## 扩展/Extend
> TinyForm支持添加自定义功能扩展。

```
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
```
form.method2();
form.methodn();
```