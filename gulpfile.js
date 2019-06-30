"use strict";

// Load plugins
const autoprefixer = require("gulp-autoprefixer");
const browsersync = require("browser-sync").create();
const cleanCSS = require("gulp-clean-css");
const del = require("del");
const gulp = require("gulp");
const header = require("gulp-header");
const merge = require("merge-stream");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify");
const responsive = require('gulp-responsive');

// Load package.json for banner
const pkg = require('./package.json');

// Set the banner content
const banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  '\n'
].join('');

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

// BrowserSync reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean vendor
function clean() {
  return del(["./vendor/"]);
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap
  var bootstrap = gulp.src('./node_modules/bootstrap/dist/**/*')
    .pipe(gulp.dest('./vendor/bootstrap'));
  // Font Awesome CSS
  var fontAwesomeCSS = gulp.src('./node_modules/@fortawesome/fontawesome-free/css/**/*')
    .pipe(gulp.dest('./vendor/fontawesome-free/css'));
  // Font Awesome Webfonts
  var fontAwesomeWebfonts = gulp.src('./node_modules/@fortawesome/fontawesome-free/webfonts/**/*')
    .pipe(gulp.dest('./vendor/fontawesome-free/webfonts'));
  // jQuery Easing
  var jqueryEasing = gulp.src('./node_modules/jquery.easing/*.js')
    .pipe(gulp.dest('./vendor/jquery-easing'));
  // jQuery
  var jquery = gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest('./vendor/jquery'));
  return merge(bootstrap, fontAwesomeCSS, fontAwesomeWebfonts, jquery, jqueryEasing);
}

// CSS task
function css() {
  return gulp
    .src("./scss/**/*.scss")
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded",
      includePaths: "./node_modules",
    }))
    .on("error", sass.logError)
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest("./css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./css"))
    .pipe(browsersync.stream());
}

// JS task
function js() {
  return gulp
    .src([
      './js/*.js',
      '!./js/*.min.js',
      '!./js/contact_me.js',
      '!./js/jqBootstrapValidation.js'
    ])
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./js'))
    .pipe(browsersync.stream());
}

// Optimize images task
function image() {
    const config = {
        'portfolio/*.jpg': [
            {   // jpg
                width: 700,
                rename: { suffix: '-large', extname: '.jpg' }
            }, {
                width: 700 * 2,
                rename: { suffix: '-large@2x', extname: '.jpg' }
            }, {
                width: 400,
                rename: { suffix: '-small', extname: '.jpg' }
            }, {
                width: 400 * 2,
                rename: { suffix: '-small@2x', extname: '.jpg' }
            }, {   // webp
                width: 700,
                rename: { suffix: '-large', extname: '.webp' }
            }, {
                width: 700 * 2,
                rename: { suffix: '-large@2x', extname: '.webp' }
            }, {
                width: 400,
                rename: { suffix: '-small', extname: '.webp' }
            }, {
                width: 400 * 2,
                rename: { suffix: '-small@2x', extname: '.webp' }
            } ],
        'team/*.jpg': [
            {   // jpg
                width: 250,
                rename: { suffix: '-small', extname: '.jpg' }
            }, {
                width: 250 * 2,
                rename: { suffix: '-small@2x', extname: '.jpg' }
            }, {    // webp
                width: 250,
                rename: { suffix: '-small', extname: '.webp' }
            }, {
                width: 250 * 2,
                rename: { suffix: '-small@2x', extname: '.webp' }
            } ],
        'header-bg.jpg': [
            {
                width: 1440,
                rename: { suffix: '-large', extname: '.jpg' }
            },  // We do not generate @2x images for background
            {
                width: 500,
                rename: { suffix: '-small', extname: '.jpg' }
            } ],
        'map-image.png': [
            {
                width: 1440,
                rename: { suffix: '-large', extname: '.png' }
            }, {    // We do not generate @2x images for background
                width: 500,
                rename: { suffix: '-small', extname: '.png' }
            } ],
        'team/michel.jpg': [    // Favicon
            {
                width: 16,
                rename: 'favicon-16.png'
            }, {
                width: 32,
                rename: 'favicon-32.png'
            }, {
                width: 180,
                rename: 'apple-touch-icon.png'
            }, {
                width: 192,
                rename: 'favicon-192.png'
            }, {    // Open Graph
                width: 1200,
                rename: 'michel-thumbnail.jpg'
            } ]
    };

    return gulp
        .src([
            './images/**/*.{jpg,png}'
        ])
        .pipe(responsive(config, {
            quality: 85,
            progressive: true,
            compressionLevel: 9
        }))
        .pipe(gulp.dest('./img'))
}

// Watch files
function watchFiles() {
  gulp.watch("./scss/**/*", css);
  gulp.watch(["./js/**/*", "!./js/**/*.min.js"], js);
  gulp.watch("./images/**/*", image);
  gulp.watch("./**/*.html", browserSyncReload);
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, gulp.parallel(css, js, image));
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
exports.css = css;
exports.js = js;
exports.image = image;
exports.clean = clean;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.default = build;
