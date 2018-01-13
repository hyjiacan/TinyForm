# FAQ

## 选项`ignore`与`exclude`有什么不同？
    
他们的控制粒度不同。

- `ingore`控制的是字段，即只能写在字段上，
其值可以是一个(字段串)或多个（字符串数组）字段的名称，
配置了`ignore`或含有属性`data-ignore`的字段不会被`TinyForm`处理。    
- `exclude`控制的是范围，即不能写在字段上，
其值可以是表单范围内的选择器、DOM或jQuery对象，
配置了`exclude`或含有属性`data-exclude`范围内的字段不会被`TinyForm`处理。

