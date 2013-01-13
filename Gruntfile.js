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
      prebuild: ['<%= pkg.dist %>'],
      postbuild: ['<%= pkg.dist %>/js/app']
    },

    copy: {
      dist:{
        files:{
          '<%= pkg.dist %>/css/'      : '<%= pkg.src %>/css/**',
          '<%= pkg.dist %>/html/'     : '<%= pkg.src %>/html/**',
          '<%= pkg.dist %>/img/'      : '<%= pkg.src %>/img/**',
          '<%= pkg.dist %>/js/'       : '<%= pkg.src %>/js/**',
          '<%= pkg.dist %>/packages/' : '<%= pkg.src %>/packages/**',
          '<%= pkg.dist %>/'          : ['<%= pkg.src %>/*.pfx', '<%= pkg.src %>/*.xml', '<%= pkg.src %>/*.config', '<%= pkg.src %>/*.sln', '<%= pkg.src %>/*.appxmanifest', '<%= pkg.src %>/*.jsproj']
        }
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

    requirejs: {
      compile: {
        options: {
          appDir:'<%= pkg.dist %>',
          baseUrl:'./js',
          dir:'<%= pkg.dist %>',

          optimize:"uglify2",

          optimizeCss:"standard.keepLines",

          removeCombined: true,

          paths: {
            config: "app/config/config",
            underscore: 'libs/lodash.min',
            dataProxy: 'app/proxies/eventbrite'
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

  // Default task.
  grunt.registerTask('default', ['jshint','clean:prebuild', 'copy', 'requirejs', 'clean:postbuild']);
};
