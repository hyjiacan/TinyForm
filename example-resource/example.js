$(function() {
    var scripts = $('script[data-target]');

    function formatIndent(html) {
        var lines = html.split('\n');
        var data = [];
        var offset = -1;
        $.each(lines, function(index, line) {
            if('' == $.trim(line)) {
                return;
            }
            if(offset == -1) {
                offset = line.length - line.replace(/^\s*/, '').length;
            }

            if(line.length > offset) {
                line = line.substring(offset);
            }

            data.push(line);
        });

        return data.join('\n');
    }

    function getScript(item) {
        var html = scripts.filter('[data-target=' + item + ']').html();
        if(!html) {
            return;
        }
        return formatIndent(html);
    }

    $('#f1>div').each(function() {
        var code = $('<textarea class="code">');
        code.val(formatIndent($(this).html()));
        $(this).append(code);
    });

    $('textarea.code').each(function() {
        var me = $(this);
        me.attr('readonly', 'readonly');
        var target = me.attr('data-target');
        if(target) {
            me.val(getScript(target));
        }
        me.height(me.get(0).scrollHeight);
    });

    var fields = form.getField();
    for(var name in fields) {
        var option = $('<option>');
        option.val(name);
        option.text($.trim(fields[name][0].prev().text()));
        $('#fields').append(option);
    }

    $('#b1').click(function() {
        var selected = $('#fields>option:selected');
        console.log(selected.text() + ':' + form.getData(selected.val()));
    });

    $('#b2').click(function() {
        console.log(form.getData());
    });

    $('#b3').click(function() {
        console.log(form.getField('username'));
    });

    $('#b4').click(function() {
        console.log(form.getField('gender'));
    });

    $('#b5').click(function() {
        console.log(form.getField());
    });

    $('#b6').click(function() {
        console.log(form.setData('hyjiacan', 'username'));
    });

    $('#b7').click(function() {
        console.log(form.setData(0, 'gender'));
    });

    $('#b8').click(function() {
        console.log(form.setData({
            username: 'hyjiacan-data',
            email: 'me@hyjiacan.com'
        }));
    });

    $('#b9').click(function() {
        console.log(form.reset());
    });

    $('#b10').click(function() {
        console.log(form.validate('username'));
    });

    $('#b11').click(function() {
        console.log(form.validate());
    });

    $('#b12').click(function() {
        console.log(form.submit());
    });

    $('#b13').click(function() {
        console.log(form.validate('remark'));
    });

    $('#b14').click(function() {
        console.log(form.setData(['girl', 'coding'], 'hobby'));
    });
});