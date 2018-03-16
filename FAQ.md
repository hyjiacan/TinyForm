# FAQ

## 选项`ignore`与`exclude`有什么不同？
    
他们的控制粒度不同。

- `ingore`控制的是字段，即只能写在字段上，
其值可以是一个(字段串)或多个（字符串数组）字段的名称，
配置了`ignore`或含有属性`data-ignore`的字段不会被`TinyForm`处理。    
- `exclude`控制的是范围，即不能写在字段上，
其值可以是表单范围内的选择器、DOM或jQuery对象，
配置了`exclude`或含有属性`data-exclude`范围内的字段不会被`TinyForm`处理。

## 如果自定义验证规则

自定义验证规则可以有两种：

- 全局规则

```javascript
$.extend(true, TinyForm.defaults.validate.rules, {
   '自定义规则1':{
       rule: '正则或函数',
       msg: '验证失败时的提示消息'
   } ,
   '自定义规则2':{
       rule: '正则或函数',
       msg: '验证失败时的提示消息'
   } 
});
```

- 实例规则

```javascript
var form = TinyForm('#form', {
    validate:{
        rules:{
             '自定义规则1':{
                 rule: '正则或函数',
                 msg: '验证失败时的提示消息'
             } ,
             '自定义规则2':{
                 rule: '正则或函数',
                 msg: '验证失败时的提示消息'
             } 
        }
    }
});
```

实例规则的优先级更高，也就是说，如果实例定义了与全局相同的验证规则，那么只会验证实例上的定义。