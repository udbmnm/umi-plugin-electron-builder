"use strict";

var __assign = void 0 && (void 0).__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];

      for (var p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
    }

    return t;
  };

  return __assign.apply(this, arguments);
};

var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);

  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function get() {
        return m[k];
      }
    };
  }

  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

var __setModuleDefault = void 0 && (void 0).__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});

var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) {
    if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  }

  __setModuleDefault(result, mod);

  return result;
};

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var utils_1 = require("@umijs/utils");

var chalk_1 = __importDefault(require("chalk"));

var fse = __importStar(require("fs-extra"));

var path = __importStar(require("path"));

var yargs_1 = __importDefault(require("yargs"));

var compile_1 = require("./compile");

var external_packages_config_1 = __importDefault(require("./external-packages.config"));

var setup_1 = __importDefault(require("./setup"));

var utils_2 = require("./utils");

var defaultConfig = {
  buildType: 'vite',
  parallelBuild: false,
  mainSrc: 'src/main',
  preloadSrc: 'src/preload',
  builderOptions: {},
  externals: [],
  outputDir: 'dist_electron',
  routerMode: 'hash',
  rendererTarget: 'web',
  debugPort: 5858,
  preloadEntry: {
    'index.ts': 'preload.js'
  },
  viteConfig: function viteConfig() {},
  mainWebpackChain: function mainWebpackChain() {},
  logProcess: function logProcess(log, type) {
    if (type === 'normal') {
      (0, utils_2.logProcess)('Main', log, chalk_1.default.blue);
    } else if (type === 'error') {
      (0, utils_2.logProcess)('Main', log, chalk_1.default.red);
    }
  }
};

function default_1(api) {
  var _a;

  (0, setup_1.default)(api);
  api.describe({
    key: 'electronBuilder',
    config: {
      default: defaultConfig,
      schema: function schema(joi) {
        return joi.object({
          buildType: joi.string(),
          parallelBuild: joi.boolean(),
          mainSrc: joi.string(),
          preloadSrc: joi.string(),
          outputDir: joi.string(),
          externals: joi.array(),
          builderOptions: joi.object(),
          routerMode: joi.string(),
          rendererTarget: joi.string(),
          debugPort: joi.number(),
          preloadEntry: joi.object(),
          viteConfig: joi.func(),
          mainWebpackChain: joi.func(),
          logProcess: joi.func()
        });
      }
    }
  });
  api.registerCommand({
    name: 'electron',
    fn: function fn(_a) {
      var args = _a.args;
      var arg = args._[0];

      if (arg === 'init') {
        copyMainProcess();
      }
    }
  });
  var isElectron = ((_a = api.args) === null || _a === void 0 ? void 0 : _a._[0]) === 'electron';

  if (!isElectron) {
    return;
  }

  api.modifyConfig(function (oldConfig) {
    var config = utils_1.lodash.merge({
      electronBuilder: defaultConfig
    }, oldConfig);
    var _a = config.electronBuilder,
        outputDir = _a.outputDir,
        externals = _a.externals,
        routerMode = _a.routerMode;
    config.outputPath = process.env.APP_ROOT ? path.join('../..', outputDir, 'bundled') : path.join(outputDir, 'bundled');
    config.alias = config.alias || {};
    config.alias['@/common'] = path.join(process.cwd(), 'src/common');
    config.history = config.history || {
      type: routerMode
    };
    config.history.type = routerMode;
    var configExternals = {
      electron: "require('electron')"
    };

    if (externals.length > 0) {
      for (var _i = 0, externals_1 = externals; _i < externals_1.length; _i++) {
        var moduleName = externals_1[_i];
        configExternals[moduleName] = "require('".concat(moduleName, "')");
      }
    }

    config.externals = __assign(__assign({}, configExternals), config.externals);
    return config;
  });
  api.chainWebpack(function (config) {
    var rendererTarget = api.config.electronBuilder.rendererTarget;
    config.target(rendererTarget);

    if (process.env.PROGRESS !== 'none') {}

    return config;
  });
  api.onStart(function () {
    var parallelBuild = api.config.electronBuilder.parallelBuild;

    if (parallelBuild) {
      (0, compile_1.runBuild)(api).catch(function (error) {
        console.error(error);
      });
    }
  });
  api.onDevCompileDone(function (_a) {
    var isFirstCompile = _a.isFirstCompile;

    if (isFirstCompile) {
      (0, compile_1.runDev)(api).catch(function (error) {
        console.error(error);
      });
    }
  });
  api.onBuildComplete(function (_a) {
    var err = _a.err;
    var parallelBuild = api.config.electronBuilder.parallelBuild;

    if (err == null) {
      if (parallelBuild) {
        buildDist();
      } else {
        (0, compile_1.runBuild)(api).then(buildDist).catch(function (error) {
          console.error(error);
        });
      }
    }
  });

  function buildDist() {
    var _a = api.config.electronBuilder,
        builderOptions = _a.builderOptions,
        externals = _a.externals;
    var absOutputDir = (0, utils_2.getAbsOutputDir)(api);
    var buildPkg = (0, utils_2.getRootPkg)();
    buildPkg.main = 'main.js';
    delete buildPkg.scripts;
    delete buildPkg.devDependencies;
    Object.keys(buildPkg.dependencies).forEach(function (dependency) {
      if (!externals.includes(dependency) || !external_packages_config_1.default.includes(dependency)) {
        delete buildPkg.dependencies[dependency];
      }
    });
    externals.forEach(function (external) {
      var _a;

      if (!buildPkg.dependencies[external]) {
        buildPkg.dependencies[external] = (_a = require(path.join(process.cwd(), 'node_modules', external, 'package.json'))) === null || _a === void 0 ? void 0 : _a.version;
      }
    });
    fse.ensureDirSync("".concat(absOutputDir, "/bundled/node_modules"));
    fse.writeFileSync("".concat(absOutputDir, "/bundled/package.json"), JSON.stringify(buildPkg, null, 2));
    var defaultBuildConfig = {
      directories: {
        output: absOutputDir,
        app: "".concat(absOutputDir, "/bundled")
      },
      files: ['**'],
      extends: null
    };
    api.logger.info('build electron');

    var configureBuildCommand = require('electron-builder/out/builder').configureBuildCommand;

    var builderArgs = yargs_1.default.command(['build', '*'], 'Build', configureBuildCommand).parse(process.argv);

    require('electron-builder').build(utils_1.lodash.merge(__assign({
      config: utils_1.lodash.merge(defaultBuildConfig, builderOptions)
    }, builderArgs))).then(function () {
      api.logger.info('build electron success');
      process.exit();
    });
  }

  function copyMainProcess() {
    var mainSrc = (0, utils_2.getMainSrc)(api);

    if (!fse.pathExistsSync(mainSrc)) {
      fse.copySync(path.join(__dirname, '..', 'template', 'main'), mainSrc, {
        overwrite: true
      });
    }

    var preloadSrc = (0, utils_2.getPreloadSrc)(api);

    if (!fse.pathExistsSync(preloadSrc)) {
      fse.copySync(path.join(__dirname, '..', 'template', 'preload'), preloadSrc, {
        overwrite: true
      });
    }
  }
}

exports.default = default_1;