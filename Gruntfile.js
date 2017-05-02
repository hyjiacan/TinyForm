module.exports = function (grunt) {

    var header = '/**' +
        '\n * TinyForm-{edition}@<%= pkg.version %>  <%= grunt.template.today("yyyy-mm-dd") %>' +
        '\n * @作者: hyjiacan' +
        '\n * @源码: <%= pkg.repository.url %>' +
        '\n * @示例: <%= pkg.example %>' +
        '\n * @许可协议: <%= pkg.license %>' +
        '\n * @依赖: jQuery 1.8.0及更高版本' +
        '\n * @浏览器支持: 不支持IE7及更低版本' +
        '\n * @QQ群: 187786345 (Javascript爱好者)' +
        '\n */';

    var wapper = '\n\n(function(win, $){\n"use strict";\n';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['src/tinyform.core.js', 'src/tinyform.data.js', 'src/tinyform.validate.js', 'src/tinyform.storage.js'],
            options: {
                globals: {
                    $: true,
                    console: true,
                    win: true,
                    TinyForm: true
                },
                // 写完一行必须加个分号
                asi: false,
                // 不要在条件语句中赋值
                boss: false,
                // 语句块请使用{}包围
                curly: true,
                // 始终使用 === 和 !== 作比较
                eqeqeq: true,
                // 不想在程序中用 eval这种危险的东西
                evil: false,
                // 变量都应该先声明后使用
                undef: true,
                // 我想在代码里面使用严格模式
                // strict: true,
                // 变量声明了就要用，不然声明来做啥
                unused: true
            }
        },
        watch: {
            scripts: {
                files: ['<%= jshint.files %>'],
                tasks: ['jshint']
            },
            css: {
                files: ['example-resource/example.less', 'test/style/*.less'],
                tasks: ['less']
            }
        },
        concat: {
            options: {
                // 定义一个用于插入合并输出文件之间的字符
                separator: '\n',
                footer: '})(window, jQuery);'
            },
            core: {
                options: {
                    banner: header.replace('{edition}', 'core') + wapper
                },
                // 将要被合并的文件
                src: ['src/tinyform.core.js', 'src/tinyform.data.js'],
                // 合并后的JS文件的存放位置
                dest: 'dist/<%= pkg.name %>.core.js'
            },
            common: {
                options: {
                    banner: header.replace('{edition}', 'common') + wapper
                },
                // 将要被合并的文件
                src: ['src/tinyform.core.js', 'src/tinyform.data.js', 'src/tinyform.validate.js'],
                // 合并后的JS文件的存放位置
                dest: 'dist/<%= pkg.name %>.common.js'
            },
            all: {
                options: {
                    banner: header.replace('{edition}', 'all') + wapper
                },
                // 将要被合并的文件
                src: ['src/*.js'],
                // 合并后的JS文件的存放位置
                dest: 'dist/<%= pkg.name %>.all.js'
            }
        },
        less: {
            compile: {
                files: [{
                    expand: true,
                    cwd: 'example-resource/',
                    src: '*.less',
                    dest: 'example-resource/',
                    ext: '.css'
                }]
            }
        },
        uglify: {
            core: {
                options: {
                    banner: header.replace('{edition}', 'core')
                },
                files: {
                    'dist/<%= pkg.name %>.core.min.js': ['<%= concat.core.dest %>']
                }
            },
            common: {
                options: {
                    banner: header.replace('{edition}', 'common')
                },
                files: {
                    'dist/<%= pkg.name %>.common.min.js': ['<%= concat.common.dest %>']
                }
            },
            all: {
                options: {
                    banner: header.replace('{edition}', 'all')
                },
                files: {
                    'dist/<%= pkg.name %>.all.min.js': ['<%= concat.all.dest %>']
                }
            }
        },
        qunit: {
            core: 'test/core.html',
            data: 'test/data.html',
            validate: 'test/validate.html',
            storage: 'test/storage.html'
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('default', ['jshint', 'concat', 'less', 'uglify']);

};