# Publishing batutas-sdk

The package is built and dry-run-clean. Publishing to the npm registry is a
manual step (it needs your npm credentials).

```bash
cd packages/batutas-sdk
npm login                 # one-time, opens browser / asks for OTP
npm run build             # produces dist/ (also runs automatically via prepublishOnly)
npm publish --dry-run     # final sanity check on the tarball
npm publish               # publishes batutas-sdk@<version> to the public registry
```

After publishing:
- Downloads are tracked automatically from the publish date (stats lag ~1 day).
- Daily chart: <https://www.npmjs.com/package/batutas-sdk>.
- The README badge `img.shields.io/npm/dm/batutas-sdk` renders the Downloads metric.

To release an update: `npm version patch && npm publish` (bumps version, builds, publishes).
