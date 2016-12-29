var gulp = require('gulp'),
    clean = require('gulp-clean'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    less = require('gulp-less'),
    rename = require('gulp-rename'),
    pump = require('pump'),
    plumber = require('gulp-plumber');

gulp.task('default', function(cb) {
    gulp.start('uglify');
});

gulp.task('clean', function(cb) {
    pump([
        gulp.src('./dist/*.min.js'),
        clean()
    ], cb);
})

gulp.task('jshint', function(cb) {
    pump([
        gulp.src('./src/'),
        jshint()
    ], cb);
});

gulp.task('concat', ['jshint', 'clean'], function(cb) {
    pump([
        gulp.src(['./src/tinyform.core.js', './src/tinyform.data.js']),
        concat('tinyform.core.js'),
        gulp.dest('./dist/'),
        // ]);
        // pump([
        gulp.src(['./src/tinyform.core.js', './src/tinyform.data.js', './src/tinyform.validate.js']),
        concat('tinyform.common.js'),
        gulp.dest('./dist/'),
        // ]);
        //  pump([
        gulp.src(['./src/tinyform.core.js', './src/tinyform.data.js', './src/tinyform.validate.js', './src/tinyform.storage.js']),
        concat('tinyform.all.js'),
        gulp.dest('./dist/')
    ], cb);
});

gulp.task('uglify', ['clean'], function(cb) {
    pump([
        gulp.src('./dist/*.js'),
        uglify(),
        rename({ suffix: '.min' }),
        gulp.dest('./dist/')
    ], cb);
})

gulp.task('less', function(cb) {
    pump([
        gulp.src('./example-resource/example.less'),
        plumber(),
        less(),
        gulp.dest('./example-resource/')
    ], cb);
});

gulp.task('watch', function() {
    gulp.watch('src', ['jshint']);
});