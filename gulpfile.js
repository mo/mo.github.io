var gulp        = require('gulp');
var browserSync = require('browser-sync');
var cp          = require('child_process');

gulp.task('jekyll-build', function (done) {
    browserSync.notify("Running jekyll build");
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
        .on('close', done);
});

gulp.task('jekyll-build-reload', ['jekyll-build'], function () {
    browserSync.reload();
});

gulp.task('browser-sync', ['jekyll-build-reload'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

gulp.task('watch', function () {
    gulp.watch(['**/*', '!_site/**/*'], ['jekyll-build-reload']);
});

gulp.task('default', ['browser-sync', 'watch']);
