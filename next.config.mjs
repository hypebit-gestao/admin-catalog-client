/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "portimages.nyc3.digitaloceanspaces.com",
      "portimages.nyc3.cdn.digitaloceanspaces.com",
      "barber-ai.nyc3.digitaloceanspaces.com",
      "daisyui.com",
      "www.pallenz.co.nz",
      "assets.olaclick.app",
    ],
  },
};

export default nextConfig;
