import type { NicoNamaComment } from "@onecomme.com/onesdk";
import { serve } from "bun";
import index from "./index.html";
import { reply } from "./lib/eliza";
import { fromFile } from "./lib/talk";

let latest = Date.now();
let client: string | undefined;

const Model = fromFile('model.json');
if (!Model) {
  throw new Error('could not load the model');
}

const comments: NicoNamaComment[] = [];

const replyQueue: string[] = [];

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

        const data: NicoNamaComment[] = await req.json();
        comments.push(...data);

        data.filter(({ data }) => data.no || (data.userId === 'onecomme.system' && data.name === '生放送クルーズ'))
          .filter(({ data }) => Date.parse(data.timestamp) > Model.modifiedOn())
          .map(({ data }) => data.comment.split(/\s+/g).map((s: string) => {
            Model.add(s.trim());
            replyQueue.push(reply(data.comment));
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
      const text = replyQueue.shift();
      if (text) {
        return new Response(text);
      }

      if (Model) {
        const text = Model.gen().replace(/。$/, '');
        console.log(`> ${text}`);
        return new Response(text);
      }

      return new Response('', { status: 500 })
    },
    '/api/speech': async () => new Response(
      await Bun.file('/tmp/speech.txt')
        .bytes()
        .catch((err) => {
          console.warn(err);
          return null;
        })
    ),

    '/img/nc433974.png': new Response(await Bun.file('./public/ext/nc433974.png').bytes()),
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
