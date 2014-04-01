'use strict';

module.exports = function (grunt) {
  // Show elapsed time at the end
  require('time-grunt')(grunt);
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    nodeunit: {
      files: ['test/**/*_test.js']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: [ 'nodeunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: [ 'nodeunit']
      }
    },

    ts: {
      // use to override the default options, See: http://gruntjs.com/configuring-tasks#options
      // these are the default options to the typescript compiler for grunt-ts:
      // see `tsc --help` for a list of supported options.
      options: {
        compile: true,                 // perform compilation. [true (default) | false]
        comments: false,               // same as !removeComments. [true | false (default)]
        target: 'es5',                 // target javascript language. [es3 (default) | es5]
        module: 'commonjs',                 // target javascript module style. [amd (default) | commonjs]
        sourceMap: true,               // generate a source map for every output js file. [true (default) | false]
        sourceRoot: '',                // where to locate TypeScript files. [(default) '' == source ts location]
        mapRoot: '',                   // where to locate .map.js files. [(default) '' == generated js location.]
        declaration: false             // generate a declaration .d.ts file for every output js file. [true | false (default)]
      },
      // a particular target
      dev: {
        src: ["app/**/*.ts"],          // The source typescript files, http://gruntjs.com/configuring-tasks#files
//        html: ['app/**/**.tpl.html'],  // The source html files, https://github.com/basarat/grunt-ts#html-2-typescript-support
        watch: 'app',                  // If specified, watches this directory for changes, and re-runs the current target
        // use to override the grunt-ts project options above for this target
        options: {
        }
      },
      build: {
        src: ["app/**/*.ts"]          // The source typescript files, http://gruntjs.com/configuring-tasks#files
      }
    }

  });

  // Default task.
  grunt.registerTask('default', ['nodeunit']);

  grunt.registerTask('watch', [
    'ts:dev'
  ]);

  grunt.registerTask('build', [
    'ts:build'
  ]);
};
