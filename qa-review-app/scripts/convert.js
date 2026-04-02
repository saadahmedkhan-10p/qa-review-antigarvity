const ffmpegStatic = require('ffmpeg-static');
const { execSync } = require('child_process');
const path = require('path');

const inputMedia = "C:\\Users\\saad.ahmed\\.gemini\\antigravity\\brain\\ca5c6203-7de3-4c9e-ad5b-c5053ba96ebe\\app_core_workflows_local_1774531968266.webp";
const outputMedia = "C:\\Users\\saad.ahmed\\.gemini\\antigravity\\brain\\ca5c6203-7de3-4c9e-ad5b-c5053ba96ebe\\app_core_workflows_local.mp4";

console.log("Converting to MP4... Please wait.");
try {
  execSync(`"${ffmpegStatic}" -i "${inputMedia}" -c:v libx264 -pix_fmt yuv420p "${outputMedia}"`, { stdio: 'inherit' });
  console.log("✅ Successfully converted WebP video to MP4!");
  console.log("Saved at:", outputMedia);
} catch (err) {
  console.error("Failed to convert:", err);
}
