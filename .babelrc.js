module.exports = function (api) {
    api.cache(false);
    return {
        presets: [
            '@babel/typescript',
            '@babel/preset-env',
            '@babel/react'
        ],
        plugins: [
            '@babel/plugin-transform-modules-commonjs',
            '@babel/plugin-syntax-dynamic-import',
            '@babel/plugin-transform-typeof-symbol',
            '@babel/plugin-transform-arrow-functions',
            '@babel/plugin-transform-proto-to-assign',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-proposal-nullish-coalescing-operator',
            '@babel/plugin-proposal-optional-chaining',
            ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }]
        ]
    };
};