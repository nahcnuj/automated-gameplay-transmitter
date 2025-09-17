import { serve } from "bun";
import index from "./index.html";
import { fromFile } from "./lib/talk";

let latest = Date.now();
let client: string | undefined;

const talk = fromFile('model.json');

const comments: unknown[] = [];

const server = serve({
  routes: {
    "/*": index,

    "/": {
      POST: (req, server) => {
        const ip = server.requestIP(req);
        if (!ip) {
          console.log(`No IP address is available in the request:`, JSON.stringify(req));
          return Response.json(undefined, { status: 404 });
        }

        latest = Date.now();

        const { address, family } = ip;
        client = `${family}/${address}`;
        return new Response();
      },
      PUT: async (req, server) => {
        if (!client) {
          console.log('Waiting for the client IP...');
          return Response.json(undefined, { status: 404 });
        }
        const ip = server.requestIP(req);
        if (!ip) {
          console.log(`The request is invalid:`, JSON.stringify(req));
          return Response.json(undefined, { status: 404 });
        }

        const got = `${ip.family}/${ip.address}`;
        if (got !== client) {
          console.log(`got ${got}, want ${client}`);
          return Response.json(undefined, { status: 404 });
        }

        latest = Date.now();

        const data: any[] = await req.json();
        comments.push(...data);

        data.filter(({ data }) => data.no || (data.userId === 'onecomme.system' && data.name === '生放送クルーズ'))
          .map(({ data }) => (data.comment ?? '').split(/[\s、。！？]/g).map((s: string) => {
            talk?.add(s.trim());
          }));

        return new Response();
      },
      DELETE: (req, server) => {
        if (!client) {
          console.log('Waiting for the client IP...');
          return Response.json(undefined, { status: 404 });
        }
        const ip = server.requestIP(req);
        if (!ip) {
          console.log(`The request is invalid:`, JSON.stringify(req));
          return Response.json(undefined, { status: 404 });
        }

        const got = `${ip.family}/${ip.address}`;
        if (got !== client) {
          console.log(`got ${got}, want ${client}`);
          return Response.json(undefined, { status: 404 });
        }

        comments.splice(0);

        return new Response();
      }
    },

    '/api/comments': () => Response.json(comments),
    '/api/status': () => Response.json({ latest }),
    '/api/talk': () => {
      if (talk) {
        const text = talk.gen();
        console.log(text);
        return new Response(text);
      }
      return new Response('', { status: 500 })
    },
  },

  error(error) {
    console.error(new Date(Date.now()).toISOString(), '[ERROR]', error);
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
