const { ESBuildMinifyPlugin } = require('esbuild-loader');

function addEsbuildMinify(config, options) {
	const terserIndex = config.optimization.minimizer.findIndex(minimizer => (minimizer.constructor.name === 'TerserPlugin'));
	if (terserIndex > -1) {
		config.optimization.minimizer.splice(
			terserIndex,
			1,
			new ESBuildMinifyPlugin(options),
		);
	}
}

function addEsbuildLoader(config, options) {
	const jsRule = config.module.rules.find(rule => rule.test && rule.test.test('.tsx'));
	if (!jsRule) throw new Error('No js Loader found!');

	if (config.name === 'client') {
		if (
			jsRule.use.length !== 2 ||
			!jsRule.use[0].includes('@next/react-refresh-utils/loader.js') ||
			!jsRule.use[1].loader?.includes('next/dist/build/babel/loader/index.js')
		)
			throw new Error('webpack\'s "config.module.rules.use" structure changed. Please adopt');

		const use = jsRule.use[1]
		use.loader = 'esbuild-loader';
		use.options = options;
		return;
	}
	if (config.name === 'server') {
		jsRule.use.loader = 'esbuild-loader';
		jsRule.use.options = options;
		return;
	}
	throw new Error('Unknown build name');
}

module.exports = {
	webpack: (config, { webpack }) => {
		config.plugins.push(
			new webpack.ProvidePlugin({
				React: 'react',
			}),
		);

		addEsbuildMinify(config);

		addEsbuildLoader(config, {
			// Specify `jsx` if you're not using Typescript
			loader: 'tsx',
			target: 'es2017',
		});

		return config;
	},
};
