import { chokidar } from '@umijs/utils';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as fse from 'fs-extra';
import path from 'path';
import { IApi } from 'umi';
import { build as viteBuild } from 'vite';
import { ElectronBuilder } from '../types';
import {
  debounce,
  filterText,
  getDevBuildDir,
  getMainSrc,
  getNodeModulesPath,
  getPreloadSrc,
} from '../utils';
import { getMainViteConfig, getPreloadViteConfig } from './vite';
import {
  build as webpackBuild,
  getMainWebpackConfig,
  getPreloadWebpackConfig,
} from './webpack';

const TIMEOUT = 500;

const buildMain = (api: IApi) => {
  const { buildType } = api.config.electronBuilder as ElectronBuilder;

  if (buildType === 'webpack') {
    return webpackBuild(getMainWebpackConfig(api));
  } else {
    return viteBuild(getMainViteConfig(api));
  }
};

const buildPreload = (api: IApi): Promise<any> => {
  const { preloadEntry, buildType } = api.config
    .electronBuilder as ElectronBuilder;

  //preload目录存在才编译
  if (fse.pathExistsSync(getPreloadSrc(api))) {
    const tasks: Promise<any>[] = [];
    if (buildType === 'webpack') {
      for (let inputFileName in preloadEntry) {
        tasks.push(
          webpackBuild(
            getPreloadWebpackConfig(
              api,
              inputFileName,
              preloadEntry[inputFileName],
            ),
          ),
        );
      }
    } else {
      for (let inputFileName in preloadEntry) {
        tasks.push(
          viteBuild(
            getPreloadViteConfig(
              api,
              inputFileName,
              preloadEntry[inputFileName],
            ),
          ),
        );
      }
    }
    return Promise.all(tasks);
  }
  return Promise.resolve();
};

/**
 * 以开发模式运行
 * @param api
 */
export const runDev = async (api: IApi) => {
  const { logProcess, debugPort, parallelBuild } = api.config
    .electronBuilder as ElectronBuilder;
  const electronPath = require(path.join(getNodeModulesPath(), 'electron'));
  let spawnProcess: ChildProcessWithoutNullStreams | null = null;

  const runMain = debounce(() => {
    if (spawnProcess !== null) {
      spawnProcess.kill('SIGKILL');
      spawnProcess = null;
    }

    spawnProcess = spawn(String(electronPath), [
      `--inspect=${debugPort}`,
      path.join(getDevBuildDir(api), 'main.js'),
    ]);
    spawnProcess.stdout.on('data', (data) => {
      const log = filterText(data.toString());
      if (log) {
        logProcess(log, 'normal');
      }
    });
    spawnProcess.stderr.on('data', (data) => {
      const log = filterText(data.toString());
      if (log) {
        logProcess(log, 'error');
      }
    });
    spawnProcess.on('close', (code, signal) => {
      if (signal != 'SIGKILL') {
        process.exit(-1);
      }
    });

    return spawnProcess;
  }, TIMEOUT);

  const buildMainDebounced = debounce(() => buildMain(api), TIMEOUT);

  const buildPreloadDebounced = debounce(() => buildPreload(api), TIMEOUT);

  const runPreload = debounce(() => {
    // api.getServer().sockets.forEach((socket) => {
    //   socket.write(
    //     JSON.stringify({
    //       type: 'ok',
    //       data: {
    //         reload: true,
    //       },
    //     }),
    //   );
    // });
  }, TIMEOUT);

  // 启动electron前编译主进程
  if (!parallelBuild) {
    await Promise.all([buildMain(api), buildPreload(api)]);
  }

  const watcher = chokidar.watch(
    [
      `${getMainSrc(api)}/**`,
      `${getPreloadSrc(api)}/**`,
      `${getDevBuildDir(api)}/**`,
    ],
    { ignoreInitial: true },
  );

  watcher
    .on('unlink', (path) => {
      if (spawnProcess !== null && path.includes(getDevBuildDir(api))) {
        spawnProcess.kill('SIGINT');
        spawnProcess = null;
      }
    })
    .on('add', (path) => {
      if (path.includes(getDevBuildDir(api))) {
        return runMain();
      }

      if (spawnProcess !== undefined && path.includes('preload.js')) {
        return runPreload();
      }
    })
    .on('change', (path) => {
      if (path.includes(getMainSrc(api))) {
        return buildMainDebounced();
      }

      if (path.includes('main.js')) {
        return runMain();
      }

      if (path.includes(getPreloadSrc(api))) {
        return buildPreloadDebounced();
      }

      if (path.includes('preload.js')) {
        return runPreload();
      }
    });

  await runMain();
};

/**
 * 打包
 * @param api
 */
export const runBuild = async (api: IApi) => {
  await buildMain(api);
  await buildPreload(api);
};
