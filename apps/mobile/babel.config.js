// babel.config.js
//
// babel-preset-expo handles the react-native-worklets (Reanimated 4) plugin
// automatically on SDK 56; we only add the NativeWind transform here.
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  }
}
