const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
    ...defaultConfig,
    entry: {
        'index': './src/index.jsx',
        'public-form': './src/public-form.jsx'
    },
    output: {
        ...defaultConfig.output,
        filename: '[name].js', 
    },
    resolve: {
        ...defaultConfig.resolve,
        alias: {
            ...defaultConfig.resolve.alias,
            '@': path.resolve(__dirname, 'src'),
        },
    },
};