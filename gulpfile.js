var gulp        = require('gulp');
var browserSync = require('browser-sync');
var cp          = require('child_process');

gulp.task('jekyll-build', function (done) {
    browserSync.notify("Running jekyll build");
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
        .on('close', done);
});

gulp.task('jekyll-build-reload', gulp.series('jekyll-build', function (done) {
    browserSync.reload();
    done();
}));

gulp.task('browser-sync', gulp.series('jekyll-build-reload', function(done) {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
    done();
}));

gulp.task('watch', function (done) {
    gulp.watch(['**/*', '!_site/**/*'], gulp.series('jekyll-build-reload'));
    done();
});

gulp.task('default', gulp.series('browser-sync', 'watch'));
