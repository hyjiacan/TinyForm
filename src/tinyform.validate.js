(function($, TF) {
	'use strict';
	/**
	 * 验证规则定义，
	 * 如果需要更多的规则，请直接添加到这里
	 */
	var RULES = {
		required: { // 必填
			rule: /^.+$/,
			msg: '不能为空'
		},
		number: { // 数字
			rule: /^[0-9]+$/,
			msg: '请输入数字'
		},
		alpha: { // 字母
			rule: /^[a-zA-Z]+$/,
			msg: '请输入字母'
		},
		email: { // 邮箱
			rule: /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/,
			msg: '请输入有效的邮箱'
		},
		url: { // 网址
			rule: /^[0-9a-z]+(\.[0-9a-z\-_])*\.[\w]+$/i,
			msg: '请输入有效的网址'
		}
	};

	/**
	 * 验证相关的属性
	 */
	var ATTRS = {
		rule: 'data-rule',
		msg: 'data-msg'
	};

	TF.extend({
		setup: function() {
			var me = this;
			me._cache.rules = {};

			// 绑定事件 失去焦点时调用验证函数
			if(me.option.autoValidate) {
				$.each(this.getField(), function(name) {
					bindValidateEvent(me, name);
				});
			}
		},
		refresh: function() {
			getAllRules(this);
		},
		/**
		 * 获取表单指定控件的验证规则或所有规则
		 * @param {String} fieldName 控件的name名称，不指定此值时获取所有规则
		 * @returns {Object|Boolean}  此控件未定义规则时，返回false；否则返回规则对象 {rule: /正则表达式/, msg: '消息'}
		 */
		getRule: function(fieldName) {
			var all = $.extend(true, {}, this._cache.rules);

			if(arguments.length === 0) {
				return all;
			}

			if(this.getField(fieldName).length === 0) {
				return {};
			}

			return all[fieldName];
		},
		/**
		 * 验证表单
		 * @param {String} fieldName 指定要验证控件的name名称，不指定时验证所有控件
		 * @returns {Object|Boolean} 验证通过时返回true，失败时返回失败的详细信息对象{pass: Boolean, value: String, field: Array, msg: String}
		 */
		validate: function(fieldName) {
			var me = this;

			if(arguments.length > 0) {
				if(typeof fieldName !== 'string') {
					return false;
				}
				return validateField(me, fieldName);
			}

			var data = {
				pass: true,
				detail: {}
			};

			var fields = me.getField();
			for(var name in fields) {
				if(!fields.hasOwnProperty(name)) {
					continue;
				}

				var r = validateField(me, name);
				// 在第一次验证失败后停止验证
				if(!r && me.option.stopOnFail) {
					return false;
				}
				data.detail[name] = r;
				if(!r && data.pass) {
					// 验证不通过  整体结果为不通过
					data.pass = false;
				}
			}

			return data.pass || data.detail;
		}
	});

	/**
	 * 绑定验证事件
	 * @param {Object} fm 表单实例
	 * @param {String} fieldName 要绑定验证事件的控件名称
	 * @returns {} 没有返回值
	 */
	function bindValidateEvent(fm, fieldName) {
		$.each(fm.getField(fieldName), function(index, item) {
			item.blur(function() {
				fm.validate(fieldName);
			});
		});
	}

	/**
	 * 获取表单所有控件的验证规则
	 * @param {Object} fm 表单实例
	 * @returns {Object} 验证规则对象
	 */
	function getAllRules(fm) {
		// 清空原有的数据
		fm._cache.rules = {};

		$.each(fm.getField(), function(name, field) {
			var rule = $.trim(field[0].attr(ATTRS.rule));
			var msg = field[0].attr(ATTRS.msg);

			if(rule === '') {
				fm._cache.rules[name] = false;
				return;
			}

			if(RULES.hasOwnProperty(rule)) {
				fm._cache.rules[name] = $.extend(true, {}, RULES[rule]);
				if(typeof msg !== 'undefined') {
					fm._cache.rules[name].msg = msg;
				}
				return;
			}

			fm._cache.rules[name] = resolveValidateRule(rule, msg);
		});
	}

	/**
	 * 解析控件的规则验证
	 * @param {Object} rule data-rule的值
	 * @param {Object} msg 消息
	 * @return {Object|Boolean} 需要验证时返回对象，否则返回false
	 */
	function resolveValidateRule(rule, msg) {
		var validation = {};
		if(!rule) {
			return false;
		}
		// 如果验证以regex:开头，表示需要使用正则验证
		if(rule.indexOf('regex:') === 0) {
			try {
				validation.rule = new RegExp(rule.replace('regex:', ''));
				validation.msg = msg || '格式不正确';
				return validation;
			} catch(e) {
				return false;
			}
		}

		// 如果验证以 length: 开头，表示要控制输入长度
		if(rule.indexOf('length:') === 0) {
			return resolveLengthRule(rule, msg);
		}

		return false;
	}

	/**
	 * 解析验证规则为长度的表达式
	 * @param {String} rule 规则表达式
	 * @param {String} msg 验证失败时的自定义消息
	 * @returns {Object|Boolean} 需要验证时返回对象，否则返回false
	 */
	function resolveLengthRule(rule, msg) {
		var validation = {};

		var lendef = rule.replace('length:', '').split(',');
		// 如果只提供了一个值，表示长度不能小于设定值
		if(lendef.length === 1) {
			lendef[0] = parseInt(lendef[0]);
			if(isNaN(lendef[0]) || lendef[0] < 0) {
				console.error('验证规则无效: 长度需要正整数 "' + rule + '"');
				return false;
			}

			validation.rule = new RegExp('^.{' + lendef[0] + '}.*$', 'g');
			validation.msg = msg || '长度不能少于' + lendef[0] + '个字';

			return validation;
		}

		if(lendef.length === 2) {
			// 如果提供了两个值，那么就是长度范围
			lendef[0] = parseInt(lendef[0]);
			lendef[1] = parseInt(lendef[1]);
			if(isNaN(lendef[0]) || lendef[0] < 0 || isNaN(lendef[1]) || lendef[1] < 0) {
				console.error('验证规则无效: 长度需要正整数 "' + rule + '"');

				return false;
			}

			if(lendef[0] === lendef[1]) {
				validation.rule = new RegExp('^.{' + lendef[0] + '}$', 'g');
				validation.msg = msg || '长度需要' + lendef[0] + '个字';

				return validation;
			}

			validation.rule = new RegExp('^.{' + lendef[0] + ',' + lendef[1] + '}$', 'g');
			validation.msg = msg || '长度应该在' + lendef[0] + '到' + lendef[1] + '个字之间';

			return validation;
		}

		return false;
	}

	/**
	 * 验证某个控件
	 * @param {Object} fm 表单实例
	 * @param {String} fieldName 控件的name名称
	 * @return {Object|Boolean}验证成功时返回true, 否则返回失败的详细信息
	 */
	function validateField(fm, fieldName) {
		var field = fm.getField(fieldName);
		if(field.length === 0) {
			return false;
		}

		var rule = fm.getRule(fieldName);
		if(typeof rule === 'undefined' || rule === false) {
			return true;
		}

		var value = fm.getData(fieldName);

		// 此处为了方便处理textarea中的换行，特意将获取到的值中的换行符 \r\n 替换成了 空格
		var pass = !rule.rule || rule.rule.test((value || '').toString().replace(/[\r\n]/g, ' '));

		if(!$.isFunction(fm.option.afterValidate)) {
			return pass;
		}
		var custompass = fm.option.afterValidate.call(fm, {
			pass: pass,
			field: field,
			value: value,
			msg: pass ? '' : rule.msg
		});
		if(typeof custompass !== 'undefined') {
			pass = !!custompass;
		}
		return pass;
	}
})(jQuery, TinyForm);