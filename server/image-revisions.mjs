// Retouched image URLs also upgrade seats stored in existing rooms.
export const IMAGE_REVISIONS = {
  "/solo/assets/mp/doubleDate-2.webp": "/solo/assets/mp/people/aeaee7bf1279562a92.webp",
  "/solo/assets/mp/people/9f487001d4c7742800.webp": "/solo/assets/mp/people/63e186741cddf64948.webp",
  "/solo/assets/mp/people/3950b4590685a651b4.webp": "/solo/assets/mp/people/3e709134a57c7e59d5.webp",
  "/solo/assets/mp/people/e0caefeb2c6c12ee37.webp": "/solo/assets/mp/people/4fd3a9a652121579f2.webp",
  "/solo/assets/mp/people/f6f88a19b50532a7a2.webp": "/solo/assets/mp/people/86446fb35de886632f.webp",
  "/solo/assets/mp/people/7d33c2ee0db7412ea6.webp": "/solo/assets/mp/people/ff903afcfc4bc99c1a.webp",
  "/solo/assets/mp/people/f4775a7f94bd64f821.webp": "/solo/assets/mp/people/9a13fed2c50e82fcd7.webp",
  "/solo/assets/mp/people/04b7b021609cb53013.webp": "/solo/assets/mp/people/794fc7e133be4065e2.webp",
  "/solo/assets/mp/people/1a55553ea351b40d41.webp": "/solo/assets/mp/people/6bb9f8a4aca1f8d2dd.webp",
  "/solo/assets/mp/people/6d58a67091cc27e5d3.webp": "/solo/assets/mp/people/efd8a09fe82d54a2e9.webp",
  "/solo/assets/mp/people/289e18d28e2cfa8985.webp": "/solo/assets/mp/people/2e59c1acb096931bd9.webp",
  "/solo/assets/mp/people/fc15c83486b2969859.webp": "/solo/assets/mp/people/1d5f8385ad945c1270.webp",
  "/solo/assets/mp/people/3d1c13d1ad9de9e720.webp": "/solo/assets/mp/people/2c283eddc9ba19e653.webp"
};
export const revisedImage = image => IMAGE_REVISIONS[image] || image;
