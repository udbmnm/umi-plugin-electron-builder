"use strict";

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

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __generator = void 0 && (void 0).__generator || function (thisArg, body) {
  var _ = {
    label: 0,
    sent: function sent() {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];

        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;

          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;

          case 7:
            op = _.ops.pop();

            _.trys.pop();

            continue;

          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }

            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }

            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }

            if (t && _.label < t[2]) {
              _.label = t[2];

              _.ops.push(op);

              break;
            }

            if (t[2]) _.ops.pop();

            _.trys.pop();

            continue;
        }

        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runBuild = exports.runDev = void 0;

var utils_1 = require("@umijs/utils");

var child_process_1 = require("child_process");

var fse = __importStar(require("fs-extra"));

var path_1 = __importDefault(require("path"));

var vite_1 = require("vite");

var utils_2 = require("../utils");

var vite_2 = require("./vite");

var webpack_1 = require("./webpack");

var TIMEOUT = 500;

var buildMain = function buildMain(api) {
  var buildType = api.config.electronBuilder.buildType;

  if (buildType === 'webpack') {
    return (0, webpack_1.build)((0, webpack_1.getMainWebpackConfig)(api));
  } else {
    return (0, vite_1.build)((0, vite_2.getMainViteConfig)(api));
  }
};

var buildPreload = function buildPreload(api) {
  var _a = api.config.electronBuilder,
      preloadEntry = _a.preloadEntry,
      buildType = _a.buildType;

  if (fse.pathExistsSync((0, utils_2.getPreloadSrc)(api))) {
    var tasks = [];

    if (buildType === 'webpack') {
      for (var inputFileName in preloadEntry) {
        tasks.push((0, webpack_1.build)((0, webpack_1.getPreloadWebpackConfig)(api, inputFileName, preloadEntry[inputFileName])));
      }
    } else {
      for (var inputFileName in preloadEntry) {
        tasks.push((0, vite_1.build)((0, vite_2.getPreloadViteConfig)(api, inputFileName, preloadEntry[inputFileName])));
      }
    }

    return Promise.all(tasks);
  }

  return Promise.resolve();
};

var runDev = function runDev(api) {
  return __awaiter(void 0, void 0, void 0, function () {
    var _a, logProcess, debugPort, parallelBuild, electronPath, spawnProcess, runMain, buildMainDebounced, buildPreloadDebounced, runPreload, watcher;

    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _a = api.config.electronBuilder, logProcess = _a.logProcess, debugPort = _a.debugPort, parallelBuild = _a.parallelBuild;
          electronPath = require(path_1.default.join((0, utils_2.getNodeModulesPath)(), 'electron'));
          spawnProcess = null;
          runMain = (0, utils_2.debounce)(function () {
            if (spawnProcess !== null) {
              spawnProcess.kill('SIGKILL');
              spawnProcess = null;
            }

            spawnProcess = (0, child_process_1.spawn)(String(electronPath), ["--inspect=".concat(debugPort), path_1.default.join((0, utils_2.getDevBuildDir)(api), 'main.js')]);
            spawnProcess.stdout.on('data', function (data) {
              var log = (0, utils_2.filterText)(data.toString());

              if (log) {
                logProcess(log, 'normal');
              }
            });
            spawnProcess.stderr.on('data', function (data) {
              var log = (0, utils_2.filterText)(data.toString());

              if (log) {
                logProcess(log, 'error');
              }
            });
            spawnProcess.on('close', function (code, signal) {
              if (signal != 'SIGKILL') {
                process.exit(-1);
              }
            });
            return spawnProcess;
          }, TIMEOUT);
          buildMainDebounced = (0, utils_2.debounce)(function () {
            return buildMain(api);
          }, TIMEOUT);
          buildPreloadDebounced = (0, utils_2.debounce)(function () {
            return buildPreload(api);
          }, TIMEOUT);
          runPreload = (0, utils_2.debounce)(function () {}, TIMEOUT);
          if (!!parallelBuild) return [3, 2];
          return [4, Promise.all([buildMain(api), buildPreload(api)])];

        case 1:
          _b.sent();

          _b.label = 2;

        case 2:
          watcher = utils_1.chokidar.watch(["".concat((0, utils_2.getMainSrc)(api), "/**"), "".concat((0, utils_2.getPreloadSrc)(api), "/**"), "".concat((0, utils_2.getDevBuildDir)(api), "/**")], {
            ignoreInitial: true
          });
          watcher.on('unlink', function (path) {
            if (spawnProcess !== null && path.includes((0, utils_2.getDevBuildDir)(api))) {
              spawnProcess.kill('SIGINT');
              spawnProcess = null;
            }
          }).on('add', function (path) {
            if (path.includes((0, utils_2.getDevBuildDir)(api))) {
              return runMain();
            }

            if (spawnProcess !== undefined && path.includes('preload.js')) {
              return runPreload();
            }
          }).on('change', function (path) {
            if (path.includes((0, utils_2.getMainSrc)(api))) {
              return buildMainDebounced();
            }

            if (path.includes('main.js')) {
              return runMain();
            }

            if (path.includes((0, utils_2.getPreloadSrc)(api))) {
              return buildPreloadDebounced();
            }

            if (path.includes('preload.js')) {
              return runPreload();
            }
          });
          return [4, runMain()];

        case 3:
          _b.sent();

          return [2];
      }
    });
  });
};

exports.runDev = runDev;

var runBuild = function runBuild(api) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4, buildMain(api)];

        case 1:
          _a.sent();

          return [4, buildPreload(api)];

        case 2:
          _a.sent();

          return [2];
      }
    });
  });
};

exports.runBuild = runBuild;