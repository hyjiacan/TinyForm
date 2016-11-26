module.exports = function(grunt) {
    var headerinfo = '/**' +
        '\n * <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %>' +
        '\n * @作者: <%= pkg.author.name %>' +
        '\n * @源码: <%= pkg.repository.url %>' +
        '\n * @示例: <%= pkg.example %>' +
        '\n * @许可协议: this lib under <%= pkg.license %> license' +
        '\n * @依赖: jQuery <%= pkg.dependencies.jQuery %>' +
        '\n * @浏览器支持: 不支持IE8及更低版本' +
        '\n * @QQ群: 187786345 (Javascript爱好者)' +
        '\n */\n';
        
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['src/*.js'],
            options: {
                globals: {
                    jQuery: true,
                    console: true,
                    window: true
                }
            }
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
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
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

};