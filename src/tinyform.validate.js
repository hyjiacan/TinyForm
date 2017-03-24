/**
 * TinyForm 数据校验组件
 */
(function($, TinyForm) {
	/**
	 * 我要使用严格模式
	 */
	'use strict';
	/**
	 * 验证规则定义，这些规则可以直接应用到表单字段的属性上面
	 * 如果需要更多的规则，请直接添加到这里
	 * @example
	 * <input type="text" data-rule="email" data-msg="请输入电子邮箱地址" />
	 */
	var RULES = {
		// 必填
		required: {
			rule: /^.+$/,
			msg: '不能为空'
		},
		// 数字
		number: {
			rule: /^[0-9]+$/,
			msg: '请输入数字'
		},
		// 字母
		alpha: {
			rule: /^[a-zA-Z]+$/,
			msg: '请输入字母'
		},
		// 电子邮箱
		email: {
			rule: /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/,
			msg: '请输入有效的邮箱'
		},
		// 网址
		url: {
			rule: /^[0-9a-z]+(\.[0-9a-z\-_])*\.[\w]+$/i,
			msg: '请输入有效的网址'
		}
	};

	/**
	 * 长度验证规则
	 */
	var RULE_LEN = {
		/**
		 * 限定长度不能少于多少个字符
		 */
		least: {
			rule: '^.{{0}}.*$',
			msg: '长度不能少于{0}个字'
		},
		/**
		 * 限定长度只能为多少个字符
		 */
		equals: {
			rule: '^.{{0}}$',
			msg: '长度需要{0}个字'
		},
		between: {
			rule: '^.{{0},{1}}$',
			msg: '长度应该在{0}到{1}个字之间'
		}
	};

	/**
	 * 当验证规则不被支持的提示信息，这个消息会在控制台输出
	 */
	var UNSUPPORTED_RULE = '不支持的验证规则';

	/**
	 * 自定义长度参数格式不是整数的提示消息
	 */
	var INT_REQUIRED = '验证规则无效: 长度需要正整数';

	/**
	 * 验证相关的属性
	 */
	var ATTRS = {
		// 标签的验证规则属性名称
		rule: 'data-rule',
		// 标签的规则验证失败时的提示消息属性名称
		msg: 'data-msg'
	};

	/**
	 * 表单字段的验证规则集合
	 */
	var ruleSet = {};

	/**
	 * 默认配置
	 */
	TinyForm.defaults.validate = {
		// 是否在输入字段失去焦点时自动验证，默认为false
		auto: false,
		// 是否在第一次验证失败时停止验证，默认为true
		stop: false,
		// 每个字段验证后的回调函数
		callback: function() {},
		// 提供规则可编辑的接口
		rules: RULES
	};

	/**
	 * 验证组件
	 */
	TinyForm.extend({
		/**
		 * 初始化
		 */
		setup: function() {
			refresh(this);
		},
		/**
		 * 刷新接口
		 */
		refresh: function() {
			refresh(this);
		},
		/**
		 * 获取表单指定字段的验证规则或所有规则
		 * @param {String} fieldName 字段的name名称，不指定此值时获取所有规则
		 * @returns {Object|Boolean}  此字段未定义规则时，返回false；否则返回规则对象 {rule: /正则表达式/, msg: '消息'}
		 */
		getRule: function(fieldName) {
			// 搞一个验证规则的副本，以防止意外改变验证规则
			var all = $.extend(true, {}, ruleSet[this.id]);

			// 没有参数
			if(arguments.length === 0) {
				// 返回所有的规则对象
				return all;
			}

			// 字段不存在
			if(this.getField(fieldName).length === 0) {
				// 返回空对象
				return {};
			}

			// 返回指定字段的验证规则
			return all[fieldName];
		},
		/**
		 * 验证表单
		 * @param {String} fieldName 指定要验证字段的name名称，不指定时验证所有字段
		 * @returns {Object|Boolean} 验证通过时返回true，失败时返回失败的详细信息对象{pass: Boolean, value: String, field: Array, msg: String}
		 */
		validate: function(fieldName) {
			// 后头到处要用，搞个变量保存起来，能减小压缩后的体积
			var me = this;

			// 指定了参数，说明只验证指定name的字段，这里只取第一个参数
			if(arguments.length > 0) {
				// 参数需要字符串，类型不对
				if(typeof fieldName !== 'string') {
					// 因为这种情况应该是开发的错误，所以返回验证失败
					return false;
				}

				// 返回验证结果
				return validateField(me, fieldName);
			}

			// 验证结果数据
			var data = {
				// 所有的验证是否通过
				pass: true,
				// 验证结果详细信息
				detail: {}
			};

			// 取到所有的字段准备验证
			var fields = me.getField();
			// 开始遍历字段验证
			for(var name in fields) {
				// 这个name无效
				if(!fields.hasOwnProperty(name)) {
					// 进行下一次
					continue;
				}

				// 字段的验证结果
				// 结果长这样：
				//{
				//  pass: Boolean,
				//  field: Object,
				//  value: Any,
				//  msg: String
				//}
				var r = validateField(me, name);
				// 在第一次验证失败后停止验证
				if(!r && me.option.validate.stop) {
					// 验证失败了，返回false
					return false;
				}

				// 将返回的验证详细信息保存起来，
				// 这个函数完了后，如果验证失败就将所有验证结果返回
				data.detail[name] = r;
				if(!r && data.pass) {
					// 验证不通过  整体结果为不通过
					data.pass = false;
				}
			}

			// 如果有验证失败，则返回验证失败的详细信息，如果验证通过，则返回true
			return data.pass || data.detail;
		}
	});

	/**
	 * 加载验证规则并根据配置绑定自动验证事件
	 * 
	 * @param {Object} fm 表单实例
	 */
	function refresh(fm) {
		// 重新获取标签的验证规则
		getAllRules(fm);

		// 绑定事件 失去焦点时调用验证函数
		if(!fm.option.validate.auto) {
			// 不自动验证 就直接返回好了
			return;
		}
		// 遍历字段，绑定失去焦点时验证的事件
		$.each(fm.getField(), function(name) {
			// 绑定失去焦点事件
			this.blur(function() {
				// 失去焦点时触发验证规则
				fm.validate(name);
			});
		});
	}

	/**
	 * 获取表单所有字段的验证规则
	 * @param {Object} fm 表单实例
	 * @returns {Object} 验证规则对象
	 */
	function getAllRules(fm) {
		// 清空原有的数据
		var rules = ruleSet[fm.id] = {};
		// 所有可用的规则
		var validRules = fm.option.validate.rules;

		// 遍历字段，获取验证规则
		$.each(fm.getField(), function(fieldName, field) {
			// 从标签属性上获取规则描述  当然  还是要trim一下的
			var rule = $.trim(field.attr(ATTRS.rule));

			// 规则为空，返回一个false
			if(rule === '') {
				// 设置 false ，表示没有验证规则
				rules[fieldName] = false;
				// 没有规则就不用再去取提示消息了，直接返回去取下一个字段
				return;
			}

			var msg = replaceRegMsg(fm, field, fieldName, field.attr(ATTRS.msg));

			// 从标签属性上获取提示消息
			var msgs = msg ? handlePlaceholder(msg, '|') : false;

			// 不包含 : 冒号，表示是普通规则
			// 如果自定义规则 validRules 中存在这个名称的规则，那么直接取出正则
			rules[fieldName] = rule.indexOf(':') === -1 ?
				resolvePreDefinedRule(validRules, rule, msgs) :
				// 规则是特殊语法
				[resolveValidateRule(rule, msgs[0])];

			// 如果所有验证规则都不存在，那么就认为不需要验证
			if(!rules[fieldName].length) {
				rules[fieldName] = false;
			}
		});
	}

	/**
	 * 将字符串str通过 seek 分隔成数组，然后将两个连续的seek替换成 place
	 * 
	 * @param {String} str 原始串
	 * @param {String} seek 用来分隔多项的串
	 * @param {String} place 用来替换两个连续的seek的串，当不指定时，表示与 seek 相同
	 * @returns 分割后的数组
	 */
	function handlePlaceholder(str, seek, place) {
		if(!str) {
			return [];
		}
		seek = seek.toString();

		if(str.indexOf(seek) === -1) {
			return [str];
		}

		// 搞个新的占位串，这个占位串用来替代两个 placeholder 连续存在的位置
		var token;
		do {
			// 因为要构建正则，所以这里干掉.符号
			token = '#' + Math.random().toString().replace('.', '') + '#';
		} while (str.indexOf(token) !== -1);

		var tokenReg = new RegExp(token, 'g');
		place = typeof place === 'undefined' ? seek : place;

		// 把 | 符号转义，正则里面才能使用
		seek = seek.replace(/\|/g, '\\|');

		// 例： str = 'xxx||aaa'
		// 会得到 xxx#1232121#aaa
		return str.replace(new RegExp(seek + seek, 'g'), token)
			// 将多个内容分开
			.split(new RegExp(seek, 'g')).map(function(item) {
				return item.replace(tokenReg, place);
			});
	}

	/**
	 * 替换消息中的引用消息
	 * @param {Object} fm 表单实例
	 * @param {Object} field 字段对象
	 * @param {string} fieldName 字段名称
	 * @param {String} msg 原始消息串
	 * @returns 替换后的提示消息
	 */
	function replaceRegMsg(fm, field, fieldName, msg) {
		if(!msg) {
			return '';
		}
		var refmsg;
		if(msg.indexOf('&l') !== -1) {
			refmsg = $('label[for=' + fieldName + ']:first', fm.context)
				.text().replace(/\|/g, '||'); // 防止要引用消息中含有|符号

			// 填充引用消息 &l => label
			msg = handlePlaceholder(msg, '&l')
				.join(refmsg);
		}

		if(msg.indexOf('&p') !== -1) {
			refmsg = field.attr('placeholder') || ''
				.replace(/\|/g, '||'); // 防止要引用消息中含有|符号

			// 填充引用消息 &p => placeholder
			msg = handlePlaceholder(msg, '&p')
				.join(refmsg);
		}

		return msg;
	}

	/**
	 * 解析字段的预定义规则验证
	 * @param {Object} 所有可用的验证规则
	 * @param {Object} rule data-rule的值
	 * @param {Array} msgs 消息数组
	 * @return {Array} 这个字段需要验证的规则数组，如果没有就返回空数组
	 */
	function resolvePreDefinedRule(validRules, rule, msgs) {
		// 规则名称
		// 字段的所有验证规则
		// 通过 | 符号分隔
		return rule.split('|').filter(function(ruleName) {
			return validRules.hasOwnProperty(ruleName) || ruleName[0] === '&';
		}).map(function(ruleName) {
			var thisRule = $.extend(true, {
				name: ruleName
			}, validRules[ruleName]);

			// 如果验证规则是以 & 符号开头，那就表示这个字段要与其它某个字段的值相同
			// 其它某个字段： & 符号后的字符串即为其名称
			if(ruleName[0] === '&') {
				thisRule.rule = ruleName;
			}

			if(msgs && msgs.length) {
				// 如果有配置data-msg，就使用data-msg作为默认的消息
				if(typeof msgs === 'string') {
					// 使用标签上配置的的提示消息(也就是在data-msg上配置的消息)
					thisRule.msg = msgs;
				} else {
					// 取第一个消息
					thisRule.msg = msgs.shift();
				}
			}
			// 添加规则
			return thisRule;
		});
	}

	/**
	 * 解析字段的特殊规则验证
	 * @param {Object} rule data-rule的值
	 * @param {String} msg 消息
	 * @return {Object|Boolean} 需要验证时返回对象，否则返回false
	 */
	function resolveValidateRule(rule, msg) {
		// 创建一个存放验证规则和提示消息的对象
		var validation = {
			name: rule
		};
		// 参数传入的rule为空
		if(!rule) {
			// 不需要验证，返回一个false
			return false;
		}
		// 如果验证以regex:开头，表示需要使用正则验证
		if(rule.indexOf('regex:') === 0) {
			// 本来这里有 try catch 的，但是考虑到，
			// 要是有异常，这就是开发的问题了，这种错误还是保留比较好
			// 替换掉原串的 regox: 字符，后面的就应该是验证用的正则
			validation.rule = new RegExp(rule.replace('regex:', ''));
			// 设置默认的提示消息
			validation.msg = msg || '格式不正确';
			// 返回验证规则对象
			return validation;
		}

		// 如果验证以 length: 开头，表示要控制输入长度
		if(rule.indexOf('length:') === 0) {
			return resolveLengthRule(rule, msg);
		}

		// 不支持的格式，则不去验证，
		console.error(UNSUPPORTED_RULE + ':' + rule);
		//返回false，就不需要验证了
		return false;
	}

	/**
	 * 解析验证规则为长度的表达式
	 * @param {String} rule 规则表达式
	 * @returns {Object|Boolean} 需要验证时返回对象，否则返回false
	 */
	function resolveLengthRule(rule, msg) {
		// 创建一个存放验证规则和提示消息的对象
		var validation = {
			name: rule
		};

		// 长度定义格式: length: start [, end]
		// 所以通过分隔逗号(,)来搞成数组
		var lendef = rule.replace('length:', '').split(',');
		// 如果只提供了一个值，表示长度不能小于设定值
		if(lendef.length === 1) {
			// 搞成int类型 如果搞不成，那数据格式就不对了
			var len = parseInt(lendef[0]);
			// 不能搞成数字 或者是负数
			if(isNaN(len) || len < 0) {
				// 给开发输出提示消息
				console.error(INT_REQUIRED + ' "' + rule + '"');
				// 错了就不验证了
				return false;
			}

			// 根据配置创建正则对象
			validation.rule = new RegExp(RULE_LEN.least.rule.replace('{0}', len), 'g');
			// 根据配置创建提示消息
			validation.msg = msg || RULE_LEN.least.msg.replace('{0}', len);

			// 返回规则验证对象
			return validation;
		}

		//提供了两个值，表示要限制长度起始范围
		if(lendef.length === 2) {
			// 把第一个值弄成int
			var len1 = parseInt(lendef[0]);
			// 把第二个值弄成int
			var len2 = parseInt(lendef[1]);
			// 不能搞成数字 或者是负数
			if(isNaN(len1) || len1 < 0 || isNaN(len2) || len2 < 0) {
				// 给开发输出提示消息
				console.error(INT_REQUIRED + ' "' + rule + '"');
				// 错了就不验证了
			}

			//根据配置创建正则对象
			validation.rule = new RegExp(RULE_LEN.between.rule.replace('{0}', len1).replace('{1}', len2), 'g');
			// 根据配置创建提示消息
			validation.msg = msg || RULE_LEN.between.msg.replace('{0}', len1).replace('{1}', len2);

			// 返回规则验证对象
			return validation;
		}

		// 其它情况视为不支持
		console.error(UNSUPPORTED_RULE + ':' + rule);

		// 不验证
		return false;
	}

	/**
	 * 验证某个字段
	 * @param {Object} fm 表单实例
	 * @param {String} fieldName 字段的name名称
	 * @return {Object|Boolean}验证成功时返回true, 否则返回失败的详细信息
	 */
	function validateField(fm, fieldName) {
		//根据name取到字段
		var field = fm.getField(fieldName);
		// 字段不存在
		if(!field || field.length === 0) {
			// 返回false表示验证失败
			// 为啥呢？
			// 开发专门来验证，却出现了字段不存在的情况，
			// 这是来玩的么？
			return false;
		}

		var pass = true;
		// 获取字段的验证规则
		var rules = fm.getRule(fieldName);

		// 没有验证规则时，直接返回  true
		if(rules === false) {
			return pass;
		}

		// 获取字段的值
		var value = fm.getData(fieldName) || '';

		// 如果值为空并且没有配置 required 规则，那么调用回调或者返回 true ，
		// 此时不需要验证，所以就不调用回调函数了
		if(rules === false || (value === '' && rules.every(function(rule) {
				return rule.name !== 'required';
			}))) {
			return pass;
		}

		// 这里用for 而不是each，是为了方便在适当的时候 return ，以结束函数
		for(var i = 0; i < rules.length; i++) {
			var rule = rules[i];
			// 没有规则或为false就不需要验证
			if(typeof rule === 'undefined' || rule === false) {
				// 返回一个true，表示验证通过
				return true;
			}

			if($.isFunction(rule.rule)) {
				// 验证规则是函数，调用它
				var ret = rule.rule.call(field, value, fieldName);
				// 验证通过时返回true
				// 验证不通过时返回false
				// 不通过时，使用默认的消息：data-msg 或者 rule.msg
				// 返回字符串（或其它类型）的时候则认为验证不通过，同时这个字符串作为验证失败的提示消息
				if(typeof ret === 'string') {
					pass = false;
					// 返回值作为提示消息
					rule.msg = ret;
				} else if(ret === false) {
					// 返回值作为验证结果
					pass = !!ret;
				}
			} else if(rule.rule[0] === '&') {
				// 验证与其它某个字段的值相等
				pass = fm.getData(rule.rule.substring(1)) === value;
			} else {
				// 不是函数，那就认为是下则表达式了
				// 因为只支持这三种写法

				// 同一个正则多次验证，每次验证都需要将 lastIndex 设置为0，否则多次验证会失败
				rule.rule.lastIndex = 0;
				pass = rule.rule.test(value);
			}

			//验证的回调函数，这个太长了，弄个短名字好写些
			var cb = fm.option.validate.callback;

			// 回调不是函数，直接返回验证的结果
			if(!$.isFunction(cb)) {
				// 配置了stop参数么在第一次验证失败后就停止验证
				if(fm.option.validate.stop && !pass) {
					return false;
				}
				continue;
			}

			// 因为回调可以通过return来改变验证结果，所以这里要取得回调的返回值
			var custompass = cb.call(fm, {
				// 验证是否通过
				pass: pass,
				// 验证的字段对象
				field: field,
				// 验证规则的名称
				rule: rule.name,
				// 字段的name名称
				name: fieldName,
				// 字段的值
				value: value,
				// 提示消息
				msg: rule.msg
			});

			// 判断回调的返回值是不是 undefined，如果是那么就是用户并没有返回值
			if(typeof custompass !== 'undefined') {
				// 用户返回了值，强制搞成boolean然后作为这个字段的验证结果
				pass = !!custompass;
			}

			// 配置了stop参数么在第一次验证失败后就停止验证
			if(fm.option.validate.stop && !pass) {
				return false;
			}
		}
		//返回验证结果   true 或者 false
		return pass;
	}
})(jQuery, TinyForm);