(function($, TF) {
    'use strict';
    TF.extend({
        setup: function() {
            // 保存初始数据，用于重置
            this._oriData = this.getData();
        },
        /**
         * 获取所有控件的值，返回对象
         * @param {String} fieldName 控件的name名称，如果指定了此参数，则只获取name=此值的控件的值
         * @returns {Object} 控件的name和值对象
         */
        getData: function(fieldName) {
            var me = this;

			if(arguments.length === 0) {
				return getAllData(me);
			}
			if(typeof fieldName !== 'string') {
				return;
			}
			return getFieldData(me, fieldName);
		},

		/**
		 * 设置控件的值
		 * @param {String|Object} data 要设置的值
		 * @param {String} fieldName 控件的name名称，如果指定了此参数，则只设置name=此值的控件的值
		 * @returns {Object}  表单实例
		 */
		setData: function(data, fieldName) {
			var me = this;
			if(arguments.length === 0) {
				console.error('setData 需要至少1个参数');
				return me;
			}

			if(arguments.length >= 2) {
				if(typeof fieldName !== 'string') {
					return me;
				}

				setFieldData(me, data, fieldName);
				return me;
			}

			// 未指定参数，设置表单所有项
			$.each(me.getField(), function(name, field) {
				var val = data[name];
				if(typeof val === 'undefined' || val === null) {
					val = '';
				}

				setFieldData(me, val, field);
			});
			return me;
		},
		/**
		 * 使用jQuery异步提交表单
		 * @param {Object} option Ajax参数项
		 * @returns {Object}  表单实例
		 */
		submit: function(option) {
			var me = this;
			option = $.extend({
				url: me.context.attr('action'),
				type: me.context.attr('method') || 'post',
				async: true,
				data: {},
				success: false,
				error: false,
				cache: false
			}, option);

			option.data = $.extend({}, option.data, me.getData());
			if($.isFunction(me.option.beforeSubmit)) {
				me.option.beforeSubmit.call(me, option);
			}
			$.ajax(option);

			return me;
		},

		/**
		 * 重置表单所有项
		 * @returns {Object} 表单实例 
		 */
		reset: function() {
			if($.isFunction(this.context.get(0).reset)) {
				this.context.get(0).reset();
			} else {
				this.setData(this._oriData);
			}
			return this;
		}
	});

	/**
	 * 设置某个控件的值
	 * @param {Object} fm 表单实例
	 * @param {String|Object} data 要设置的值
	 * @param {String|Array} field 控件的name名称或对象数组
	 */
	function setFieldData(fm, data, field) {
		if(!$.isArray(field)) {
			field = fm.getField(field);
			if(!$.isArray(field) || field.length === 0) {
				return;
			}
		}

		$.each(field, function(index, item) {
			item = $(item);
			if(!item.is('input')) {
				item.val(data);
				return;
			}

			if(item.is('[type=radio]')) {
				item.prop('checked', (item.val() || '').toString() === data.toString());
			} else if(item.is('[type=checkbox]')) {
				item.prop('checked', data);
			} else {
				item.val(data);
			}
		});
	}

	/**
	 * 获取表单的所有数据
	 * @param {Object} fm
	 */
	function getAllData(fm) {
		var data = {};
		$.each(fm.getField(), function(name, field) {
			data[name] = getFieldData(fm, name);
		});
		return data;
	}

	/**
	 * 设置某个控件的值
	 * @param {Object} fm 表单实例
	 * @param {String} fieldName 控件的name名称
	 * @return {String} 控件的值
	 */
	function getFieldData(fm, fieldName) {
		
		var field = fm.getField(fieldName);

		if(field[0].is('input')) {
			return getInputValue(field);
		}

		if(field[0].is('select[multiple]')) {
			return field[0].val() || [];
		}

		return field[0].val();
	}

	/**
	 * 获取input控件的值
	 * @param {Array} field 控件数组
	 * @return {Any} 控件的值
	 */
	function getInputValue(field) {
		var value = '';
		var item = field[0];
		if(item.is('[type=radio]')) {
			for(var i = 0; i < field.length; i++) {
				item = field[i];
				if(item.is(':checked')) {
					value = item.val();
					break;
				}
			}
			return value;
		}

		if(item.is('[type=checkbox]')) {
			return item.is(':checked');
		}

		return item.val();
	}
})(jQuery, TinyForm);