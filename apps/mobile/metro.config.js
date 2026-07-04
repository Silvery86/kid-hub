// metro.config.js
//
// Monorepo-aware Metro config wrapped with NativeWind.
// - watchFolders: workspace root so edits in packages/shared are hot-reloaded.
// - nodeModulesPaths: resolve from the app first, then the hoisted root store.
// - withNativeWind: compiles ./src/global.css (Tailwind) into RN styles.
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = withNativeWind(config, { input: './src/global.css' })
