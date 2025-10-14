const { getDefaultConfig } = require('expo/metro-config');
const appJson = require('./app.json'); // ambil config dari app.json

module.exports = ({ config }) => {
  return {
    ...config, // merge default dari app.json
    ...getDefaultConfig(__dirname),
    expo: {
      ...appJson.expo, // pakai semua config dari app.json
      extra: {
        ...appJson.expo.extra,
        eas: {
          projectId: "ce6f28a5-b3ab-4ebb-9504-e2d385c2434a", // kalau mau override
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
            },
          },
        ],
      ],
    },
  };
};
