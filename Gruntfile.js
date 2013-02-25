/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },

    clean: {
      prebuild: ['<%= pkg.dest %>'],
      postbuild: ['<%= pkg.dest %>/js/app']
    },

    copy: {
      main:{
        files:[{
            expand: true,
            cwd: '<%= pkg.src %>',
            src: ['css/**', 'img/**', 'js/**', 'packages/**', '*.pfx', '*.html', '*.xml', '*.config', '*.sln', '*.appxmanifest', '*.jsproj'], 
            dest: '<%= pkg.dest %>'
        }]
      }
    },
    
    concat: {
      dist: {
        src: ['<banner:meta.banner>', '<file_strip_banner:lib/<%= pkg.name %>.js>'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },

    jshint: {
      uses_defaults: ['<%= pkg.src %>/js/app/**/*.js', '<%= pkg.src %>/js/*.js'],
        
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true,
        laxbreak: true,

        globals:{
          MK: true,
          require: true,
          define: true,
          WinJS: true,
          Windows: true,
          Application: true
        }
      }
    },

    less: {
      production: {
        options: {
          paths: ["<%= pkg.dest %>/css"],
          yuicompress: true
        },
        files: {
          "<%= pkg.dest %>/css/index.css": "<%= pkg.dest %>/css/index.less"
        }
      }
    },

    requirejs: {
      compile: {
        options: {
          appDir:'<%= pkg.dest %>',
          baseUrl:'./js',
          dir:'<%= pkg.dest %>',

          optimize:"uglify2",

          optimizeCss:"standard.keepLines",

          removeCombined: true,

          inlineText: true,

          paths: {
            config: "app/config/config",
            underscore: "libs/lodash.min",
            dataProxy: "app/proxies/eventbrite",
            rText: "libs/requirejs/plugins/text",
            ri18n: "libs/requirejs/plugins/i18n",
            moment: "libs/moment"
          },

          modules:[{
            name:"libs/requirejs/require"
          }, {
            name:"app"
          }],

          preserveLicenseComments: false,

          uglify2: {
            conditionals: true,
            no_mangle: true,
            evaluate: true,
            booleans: true,
            loops: true,
            unused: true,
            if_return: true
          },

          keepBuildDir: true
        }
      }
    },

    uglify: {}
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-less');

  // Default task.
  grunt.registerTask('default', ['jshint','clean:prebuild', 'copy', 'requirejs', 'less:production', 'clean:postbuild']);
};
