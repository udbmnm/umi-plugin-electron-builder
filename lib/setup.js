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

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var fse = __importStar(require("fs-extra"));

var path_1 = __importDefault(require("path"));

var utils_1 = require("./utils");

exports.default = function (api) {
  (0, utils_1.setNpmClient)(api.userConfig.npmClient);
  var nodeModulesPath = (0, utils_1.getNodeModulesPath)();
  var rootPkg = (0, utils_1.getRootPkg)();
  var requiredDependencies = ['electron', 'electron-builder'];
  var installDependencies = [];

  for (var _i = 0, requiredDependencies_1 = requiredDependencies; _i < requiredDependencies_1.length; _i++) {
    var dep = requiredDependencies_1[_i];

    if (rootPkg.devDependencies[dep] == null) {
      installDependencies.push(dep);
    }
  }

  if (installDependencies.length > 0) {
    (0, utils_1.installRely)(installDependencies.join(' '));
  }

  rootPkg = (0, utils_1.getRootPkg)();
  var electronPackageJson = fse.readJSONSync(path_1.default.join(nodeModulesPath, 'electron', 'package.json'));

  if (electronPackageJson.dependencies['@types/node'] !== rootPkg.devDependencies['@types/node']) {
    var electronTypesNodeVersion = electronPackageJson.dependencies['@types/node'];
    (0, utils_1.installRely)("@types/node@".concat(electronTypesNodeVersion));
  }

  rootPkg = (0, utils_1.getRootPkg)();
  var isUpdateRootPkg = false;

  if (rootPkg.name == null) {
    rootPkg.name = 'electron_builder_app';
    isUpdateRootPkg = true;
  }

  if (rootPkg.version == null) {
    rootPkg.version = '0.0.1';
    isUpdateRootPkg = true;
  }

  if (rootPkg.scripts['rebuild-deps'] == null) {
    rootPkg.scripts['rebuild-deps'] = 'electron-builder install-app-deps';
    isUpdateRootPkg = true;
  }

  if (rootPkg.scripts['electron:init'] == null) {
    rootPkg.scripts['electron:init'] = 'umi electron init';
    isUpdateRootPkg = true;
  }

  if (rootPkg.scripts['electron:dev'] == null) {
    rootPkg.scripts['electron:dev'] = 'umi dev electron';
    isUpdateRootPkg = true;
  }

  if (rootPkg.scripts['electron:build:win'] == null) {
    rootPkg.scripts['electron:build:win'] = 'umi build electron --win';
    isUpdateRootPkg = true;
  }

  if (rootPkg.scripts['electron:build:mac'] == null) {
    rootPkg.scripts['electron:build:mac'] = 'umi build electron --mac';
    isUpdateRootPkg = true;
  }

  if (rootPkg.scripts['electron:build:linux'] == null) {
    rootPkg.scripts['electron:build:linux'] = 'umi build electron --linux';
    isUpdateRootPkg = true;
  }

  if (isUpdateRootPkg) {
    api.logger.info('update package.json');
    fse.writeFileSync(path_1.default.join(process.cwd(), 'package.json'), JSON.stringify(rootPkg, null, 2));
  }
};