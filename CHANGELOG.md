# CHANGE LOG

## 0.7.12

### 优化

- 调用 `getData` 时，`type=file` 的字段返回文件描述对象 `File` ，不再返回选择文件的虚拟路径

## 0.7.10

### 新增
 
- 支持对同一表单内不同的`checkbox`设置不同的值

## 0.7.9

### 新增

- 设置`refresh`选项以在调用方法时先自动调用`refresh()`方法，这在表单动态变化时很有用
- 可以自定义html标签上写验证规则与提示消息的属性

### 优化

- 在调用`setData`时，若传入的data为空(`null`或`undefined`)，啥也不做

### 修复

- `getChanges` 判断不正确的问题

## 0.7.8

### 新增

- `asDefault`与`getChanges` 方法，用于支持获取表单内被修改过的字段
- 通过选项`exclude`或标签属性`data-exclude`排除一定范围内的字段
- 表单中文件字段异步一起上传的支持(使用formdata实现)

### 优化

- 设置值时，支持给`setData`的第二个参数传入`boolean`值，当传入`true`时
会跳过**data**中没有的字段（这些字段保留原值）
- 在多选`select`时，若没有选择项，返回值为空数组， 不再是之前的`null`
- 在表单字段为空时，统一返回空字符串，不再返回 `undefined`