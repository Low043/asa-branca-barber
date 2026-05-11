module.exports = function (options) {
  return {
    ...options,
    externals: [
      ...(Array.isArray(options.externals) ? options.externals : [options.externals]),

      function ({ request }, callback) {
        if (request.startsWith('@generated/')) {
          const mapped = request.replace('@generated/', '../../packages/db/generated/');
          return callback(null, 'commonjs ' + mapped);
        }
        callback();
      },
    ],
  };
};
