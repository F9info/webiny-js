const fs = require("fs-extra");

module.exports = (options, context) => {
    const { boolean } = require("boolean");
    const webpack = require("webpack");
    let babelOptions = require("./babelrc");
    const { setupOutput } = require("./utils");
    const output = setupOutput(options.output);

    // Customize babelOptions
    if (typeof options.babel === "function") {
        babelOptions = options.babel(babelOptions);
    }

    // Load base webpack config
    let webpackConfig = require("./webpack.config")({
        entry: options.entry || "./src/index",
        output,
        debug: boolean(options.debug),
        babelOptions,
        define: options.define
    });

    // Customize webpack config
    if (typeof options.webpack === "function") {
        webpackConfig = options.webpack(webpackConfig);
    }

    return new Promise(async (resolve, reject) => {
        context.log(`Start bundling`);

        if (boolean(options.watch)) {
            return webpack(webpackConfig).watch({}, async (err, stats) => {
                if (err) {
                    return reject(err);
                }

                if (stats.hasErrors()) {
                    const info = stats.toJson();

                    if (stats.hasErrors()) {
                        console.error(info.errors);
                    }
                }

                context.log(`Finished bundling! Watching for changes...`);
            });
        }

        return webpack(webpackConfig).run(async (err, stats) => {
            console.log("aaaa", process.cwd() + "/statis.json");
            await fs.writeFile(process.cwd() + "/.statis.json", JSON.stringify(stats.toJson()));

            if (err) {
                return reject(err);
            }

            if (stats.hasErrors()) {
                const info = stats.toJson();

                if (stats.hasErrors()) {
                    console.error(info.errors);
                }

                return reject("Build failed!");
            }

            context.log(`Finished bundling`);
            resolve();
        });
    });
};
