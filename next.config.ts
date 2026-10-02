import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep type and lint checks enabled; deployments must build cleanly.
  async headers() {
    return [{source:'/auth/complete',headers:[
      {key:'Referrer-Policy',value:'no-referrer'},
      {key:'Cache-Control',value:'private, no-store, max-age=0'},
      {key:'X-Robots-Tag',value:'noindex, nofollow'},
    ]}];
  },
};

export default nextConfig;
