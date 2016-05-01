var gulp = require('gulp');
var polybuild = require('polybuild');

gulp.task('build', function() {
  return gulp.src('popup/popup.html')
  .pipe(polybuild())
  .pipe(gulp.dest('popup/'));
})