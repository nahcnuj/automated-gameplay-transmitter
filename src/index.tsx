import { serve } from "bun";
import index from "./index.html"

let client: Omit<Bun.SocketAddress, 'port'> | undefined = undefined

const server = serve({
  routes: {
    "/*": index,

    "/": {
      POST: (req, server) => {
        console.log(server.requestIP(req));
        const ip = server.requestIP(req);
        if (!ip) {
          console.error('No IP address is available in the request.', req);
          return Response.redirect("https://live.nicovideo.jp/watch/user/14171889", 307);
        }
        const { address, family } = ip;
        client = { address, family };
        return new Response();
      },
      PUT: (req, server) => {
        const ip = server.requestIP(req);
        if (!ip || !client || ip.family !== client.family || ip.address !== client.address) {
          console.error(new Date(Date.now()).toISOString(), 'got', JSON.stringify(ip, null, 0), 'want', JSON.stringify(client, null, 0));
          return Response.redirect("https://live.nicovideo.jp/watch/user/14171889", 307);
        }
        return Response.json(req);
      },
    },
  },

  error(error) {
    console.error(error);
    return Response.redirect("https://live.nicovideo.jp/watch/user/14171889", 307);
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
