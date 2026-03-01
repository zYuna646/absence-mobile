const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      eas: {
        projectId: "ce6f28a5-b3ab-4ebb-9504-e2d385c2434a",
      },
    },
    plugins: [
      ...(appJson.expo.plugins || []),
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
          },
          ios: {
            useFrameworks: "static",
            useModularHeaders: true,
            buildReactNativeFromSource: true,
          },
        },
      ],
    ],
  },
};
