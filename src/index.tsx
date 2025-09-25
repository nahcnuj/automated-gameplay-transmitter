import type { NicoNamaComment, ServiceMeta } from "@onecomme.com/onesdk";
import { serve } from "bun";
import index from "./index.html";
import { reply } from "./lib/eliza";
import { fromFile } from "./lib/TalkModel";

const splitInSentences = (text: string) => [...new Intl.Segmenter(new Intl.Locale('ja-JP'), { granularity: 'sentence' }).segment(text)].map(({ segment }) => segment);

let latest = Date.now();
let serviceMeta: ServiceMeta;
let client: string | undefined;

const Model = fromFile('model.json');
if (!Model) {
  throw new Error('could not load the model');
}

const comments: NicoNamaComment[] = [];

const talkQueue: string[] = [];
const giftQueue: string[] = [];
const adQueue: string[] = [];

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

        const data: NicoNamaComment[] = await req.json();
        comments.push(...data);

        data.filter(({ data }) => Date.parse(data.timestamp) > latest)
          .forEach(({ data }) => {
            if (data.no || (data.userId === 'onecomme.system' && data.name === '生放送クルーズ')) {
              splitInSentences(data.comment)
                .forEach((s: string) => {
                  Model.learn(s.trim());
                });
              talkQueue.push(reply(data.comment));
            }

            if (data.userId === 'onecomme.system') {
              if (data.comment === 'まもなく生放送クルーズが到着します') {
                talkQueue.push(
                  '生放送クルーズのみなさん、こんにちは。',
                  'AI Vチューバーの馬可無序（まか・むじょ）です。',
                  'コメントを学習してお話ししています。',
                  'ぜひ上のリンクから遊びに来てね。',
                );
              }

              if (data.comment.endsWith('広告しました')) {
                const name = data.comment.slice(data.comment.indexOf('】') + '】'.length, data.comment.lastIndexOf('さんが'));
                if (!adQueue.includes(name)) {
                  adQueue.push(name);
                }
              }
            }

            if (data.hasGift) {
              const name = (data.origin as any)?.message?.gift?.advertiserName;
              if (name && !giftQueue.includes(name)) {
                giftQueue.push(name);
              }
            }
          });

        latest = Date.now();

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
      {
        const ad = adQueue.shift();
        if (ad) {
          console.log(`[AD] ${ad}`);
          return new Response(`${ad}さん、広告ありがとうございます！\n`);
        }
      }

      {
        const gift = giftQueue.shift();
        if (gift) {
          console.log(`[GIFT] ${gift}`);
          return new Response(`${gift}さん、ギフトありがとうございます\n`);
        }
      }

      {
        const text = talkQueue.shift();
        if (text) {
          console.log(`[REPLY] ${text}`);
          return new Response(`${text}\n`);
        }
      }

      if (Model) {
        const text = Model.gen().replace(/。$/, '');
        console.log(`> ${text}`);
        return new Response(`${text}\n`);
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
    '/api/meta': {
      GET: () => Response.json(serviceMeta),
      POST: async (req) => {
        serviceMeta = await req.json();
        return new Response();
      },
    },

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
