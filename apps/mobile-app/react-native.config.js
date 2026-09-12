module.exports = {
  dependencies: {
    // Mappls' native Gradle plugin hard-fails the build if its license
    // files (<appId>.a.olf / .a.conf) aren't present — see
    // android/app/README-MAPPLS.md. Keep native autolinking off until
    // those files exist locally, then delete this override.
    'mappls-map-react-native': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
