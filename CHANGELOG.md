# CHANGE LOG

## 0.7.8

### 修复

### 新增

- `asDefault`与`getChanges` 方法，用于支持获取表单内被修改过的字段
- 通过选项`exclude`或标签属性`data-exclude`排除一定范围内的字段
- 表单中文件字段异步一起上传的支持(使用formdata实现)

### 移除

### 优化

- 设置值时，支持给`setData`的第二个参数传入`boolean`值，当传入`true`时
会跳过**data**中没有的字段（这些字段保留原值）
- 在多选`select`时，若没有选择项，返回值为空数组， 不再是之前的`null`
- 在表单字段为空时，统一返回空字符串，不再返回 `undefined`