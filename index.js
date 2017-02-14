var path = require('path');
var mime = require('mime');
var lwip = require('lwip');

function PwaManifestWebpackPlugin(options) {
  this.options = Object.assign({
    filename: 'manifest.json',
    orientation: 'portrait',
    display: 'standalone',
    icons: [],
  }, options || {});

  const defaultIconSizes = [36, 48, 72, 96, 144, 192];
  if (typeof this.options.icon === 'string') {
    this.options.icon = {
      src: this.options.icon,
      sizes: defaultIconSizes
    };
  }
}

PwaManifestWebpackPlugin.prototype.apply = function(compiler) {
  var self = this;
  compiler.plugin('emit', function(compilation, callback) {
    if (self.options.icon) {
      self.genIcons(compiler, compilation, function() {
        self.createManifest(compilation);
        callback();
      });
    } else {
        self.createManifest(compilation);
        callback();
    }
  });
}

PwaManifestWebpackPlugin.prototype.createManifest= function(compilation) {
  var filename = this.options.filename;
  var contents = Object.assign({}, this.options);
  delete contents.filename;
  delete contents.icon;

  compilation.assets[filename] = {
    source: function() {
      return JSON.stringify(contents, null, 2);
    },
    size: function() {
      return JSON.stringify(contents).length;
    }
  }
}

PwaManifestWebpackPlugin.prototype.genIcons = function(compiler, compilation, callback) {
  var self = this;
  var sizes = this.options.icon.sizes;
  var src = this.options.icon.src;
  var outputPath = compiler.options.output.path;

  // liwp library only single process, so one by one recursive processing
  function resize(image, sizes) {
    var type = mime.lookup(src);
    var ext = mime.extension(type);
    var size = sizes.pop();
    var filename = 'icon_' + size + 'x' + size + '.' + ext;
    self.options.icons.push({
      src: filename,
      sizes: size + 'x' + size,
      type: type,
    });

    image.resize(size, size, function(err, image) {
      image.toBuffer(ext, function(err, buffer) {
        compilation.assets[filename] = {
          source: function() {
            return buffer;
          },
          size: function() {
            return buffer.length;
          }
        }
        if (sizes.length) {
          resize(image, sizes);
        } else {
          callback();
        }
      });
    });
  }

  if (src && Array.isArray(sizes)) {
    lwip.open(src, function(err, image) {
      resize(image, sizes);
    });
  } else {
    callback();
  }
}

module.exports = PwaManifestWebpackPlugin;
