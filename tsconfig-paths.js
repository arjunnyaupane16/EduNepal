const { resolve } = require('path');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  paths: {
    'expo-module-scripts/*': [resolve(__dirname, 'node_modules/expo-module-scripts/*')],
    ...compilerOptions.paths
  }
};
