const path = require('path')

class JSEntryWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      filename: 'index.js',
      template: 'auto',
      publicPath: options.publicPath === undefined ? 'auto' : options.publicPath,
      ...options,
    }
  }

  apply(compiler) {
    compiler.hooks.emit.tap('InjectCssEntry', async compilation => {
      // console.log(Object.keys(compilation.assets))

      /** output filenames for the given entry names */
      const entryNames = Object.keys(compiler.options.entry)
      const outputFileNames = new Set(
        (entryNames.length ? entryNames : ['main']).map(entryName =>
          // Replace '[name]' with entry name
          this.options.filename.replace(/\[name\]/g, entryName),
        ),
      )

      /** Option for every entry point */
      const entryOption = Array.from(outputFileNames).map(filename => ({
        ...this.options,
        filename,
      }))[0]

      /** The public path used inside the html file */
      const publicPath = this.getPublicPath(
        compilation,
        entryOption.filename,
        entryOption.publicPath,
      )

      /** build output path */
      const templatePath = this.getTemplatePath(entryOption.template, compilation.options)

      /** Generated file paths from the entry point names */
      const assets = this.htmlWebpackPluginAssets(
        compilation,
        // 只处理一个
        Array.from(compilation.entrypoints.keys()).slice(0, 1),
        publicPath,
        templatePath,
      )

      // js entry
      if (!compilation.assets[assets.entry]) return
      // const { libsImportCode } = await import("../src/dev-utils/external.js");
      // const libs = libsImportCode(["lowcoder-sdk"]);
      // ${libsImportCode(["lowcoder-sdk"])}
      let content = `(function() {

        // adding entry points to single bundle.js file
        let scripts = ${JSON.stringify(assets.js)};
        for (let i = 0; i < scripts.length; i++) {
          const scriptEle = document.createElement('script');
          scriptEle.src = scripts[i];
          document.body.appendChild(scriptEle);
        }
      })()`;

      compilation.assets[entryOption.filename] = {
        source() {
          return content
        },
        size() {
          return content.length
        },
      }
    })
  }

  htmlWebpackPluginAssets(compilation, entryNames, publicPath, templatePath) {
    // https://github.com/jantimon/html-webpack-plugin/blob/main/index.js#L640
    const assets = {
      publicPath,
      templatePath,
      entry: '',
      js: [],
      css: [],
    }

    // Extract paths to .js, .mjs and .css files from the current compilation
    const entryPointPublicPathMap = {}
    const extensionRegexp = /\.(css|js)(\?|$)/
    for (let i = 0; i < entryNames.length; i++) {
      const entryName = entryNames[i]
      /** entryPointUnfilteredFiles - also includes hot module update files */
      const entryPointUnfilteredFiles = compilation.entrypoints.get(entryName).getFiles()

      const entryPointFiles = entryPointUnfilteredFiles.filter(chunkFile => {
        // compilation.getAsset was introduced in webpack 4.4.0
        // once the support pre webpack 4.4.0 is dropped please
        // remove the following guard:
        const asset = compilation.getAsset && compilation.getAsset(chunkFile)
        if (!asset) {
          return true
        }
        // Prevent hot-module files from being included:
        const assetMetaInformation = asset.info || {}
        return !(assetMetaInformation.hotModuleReplacement || assetMetaInformation.development)
      })

      // Prepend the publicPath and append the hash depending on the
      // webpack.output.publicPath and hashOptions
      // E.g. bundle.js -> /bundle.js?hash
      const entryPointPublicPaths = entryPointFiles.map(chunkFile => {
        const urlPath = this.urlencodePath(chunkFile)
        const entryPointPublicPath = publicPath + urlPath

        if (chunkFile.endsWith('.js')) {
          assets.entry = urlPath
        }
        return entryPointPublicPath
      })

      entryPointPublicPaths.forEach(entryPointPublicPath => {
        const extMatch = extensionRegexp.exec(entryPointPublicPath)
        // Skip if the public path is not a .css, .mjs or .js file
        if (!extMatch) {
          return
        }
        // Skip if this file is already known
        // (e.g. because of common chunk optimizations)
        if (entryPointPublicPathMap[entryPointPublicPath]) {
          return
        }
        entryPointPublicPathMap[entryPointPublicPath] = true
        const ext = extMatch[1]
        assets[ext].push(entryPointPublicPath)
      })
    }
    return assets
  }

  getPublicPath(compilation, outputName, customPublicPath) {
    const compilationHash = compilation.hash

    /**
     * @type {string} the configured public path to the asset root
     * if a path publicPath is set in the current webpack config use it otherwise
     * fallback to a relative path
     */
    const webpackPublicPath = compilation.getAssetPath(compilation.outputOptions.publicPath, {
      hash: compilationHash,
    })

    // Webpack 5 introduced "auto" as default value
    const isPublicPathDefined = webpackPublicPath !== 'auto'

    let publicPath =
      // If the html-webpack-plugin options contain a custom public path uset it
      customPublicPath !== 'auto'
        ? customPublicPath
        : isPublicPathDefined
        ? // If a hard coded public path exists use it
          webpackPublicPath
        : // If no public path was set get a relative url path
          path
            .relative(
              path.resolve(compilation.options.output.path, path.dirname(outputName)),
              compilation.options.output.path,
            )
            .split(path.sep)
            .join('/')

    if (publicPath.length && publicPath.substr(-1, 1) !== '/') {
      publicPath += '/'
    }

    return publicPath
  }

  getTemplatePath(template, options) {
    const { context, output } = options

    return template === 'auto'
      ? path.join(output.path, path.sep)
      : path.join(context || '', template)
  }

  urlencodePath(filePath) {
    // some+path/demo.html?value=abc?def
    const queryStringStart = filePath.indexOf('?')
    const urlPath = queryStringStart === -1 ? filePath : filePath.substr(0, queryStringStart)
    const queryString = filePath.substr(urlPath.length)
    // Encode all parts except '/' which are not part of the querystring:
    const encodedUrlPath = urlPath.split('/').map(encodeURIComponent).join('/')
    return encodedUrlPath + queryString
  }
}

JSEntryWebpackPlugin.version = 1

module.exports = JSEntryWebpackPlugin
