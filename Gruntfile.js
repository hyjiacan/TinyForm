module.exports = function(grunt) {
    var headerinfo = '/**' +
        '\n * TinyForm <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %>' +
        '\n * @作者: hyjiacan' +
        '\n * @源码: <%= pkg.repository.url %>' +
        '\n * @示例: <%= pkg.example %>' +
        '\n * @许可协议: <%= pkg.license %>' +
        '\n * @依赖: jQuery 1.8.0及更高版本' +
        '\n * @浏览器支持: 不支持IE7及更低版本' +
        '\n * @QQ群: 187786345 (Javascript爱好者)' +
        '\n */\n';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['src/tinyform.core.js', 'src/tinyform.data.js', 'src/tinyform.validate.js', 'src/tinyform.storage.js'],
            options: {
                globals: {
                    jQuery: true,
                    console: true,
                    window: true,
                    'TinyForm': true,
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
                strict: true
            }
        },
        watch: {
            scripts: {
                files: ['<%= jshint.files %>'],
                tasks: ['jshint']
            },
            css: {
                files: ['example-resource/example.less'],
                tasks: ['less']
            }
        },
        concat: {
            options: {
                // 定义一个用于插入合并输出文件之间的字符
                separator: '',
                banner: headerinfo
            },
            dist: {
                // 将要被合并的文件
                src: ['src/*.js'],
                // 合并后的JS文件的存放位置
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        less: {
            compile: {
                files: {
                    'example-resource/example.css': 'example-resource/example.less'
                }
            },
            options: {
                banner: '/* <%=pkg.namexxx %> 示例 */'
            }
            //          yuicompress: {
            //              files: {
            //                  'css/test-min.css': 'css/test.css'
            //              },
            //              options: {
            //                  yuicompress: true
            //              }
            //          }
        },
        uglify: {
            options: {
                // 此处定义的banner注释将插入到输出文件的顶部
                banner: headerinfo
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['jshint', 'concat', 'less', 'uglify']);

};