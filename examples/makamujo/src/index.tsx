import { MarkovModel, type Comment, type NiconicoLiveInfo } from "automated-gameplay-transmitter";
import { serve, type BunRequest } from "bun";
import { setTimeout } from "node:timers/promises";
import index from "./index.html";


let latest = Date.now();
let serviceMeta: NiconicoLiveInfo;
let client: string | undefined;

const Model = MarkovModel.fromFile('./var/model.json');
if (!Model) {
  throw new Error('could not load the model');
}

const comments: Comment[] = [];

const talkQueue: string[] = [];
const giftQueue: { name: string; icon: string }[] = [];
const adQueue: string[] = [];

const talkedHistory: string[] = [];

let nextSpeech: {
  text: string,
  icon?: string,
} = {
  text: '',
};

const server = serve({
  idleTimeout: 60,

  routes: {
    "/*": index,

    "/": {
      POST: (req, server) => {
        const ip = server.requestIP(req);
        if (!ip) {
          console.log(`No IP address is available in the request:`, JSON.stringify(req));
          return Response.json(undefined, { status: 404 });
        }

        // latest = Date.now();

        const { address, family } = ip;
        client = `${family}/${address}`;
        console.log('Connected from', client, 'at', new Date().toUTCString());
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

        const data: Comment[] = await req.json();
        const latestComment = comments.at(-1);
        comments.push(...data.filter(({ data }) => !latestComment || Date.parse(data.timestamp) > Date.parse(latestComment.data.timestamp)));
        console.debug(`${comments.length} comments (includes system messages)`);

        data.filter(({ data }) => Date.parse(data.timestamp) > latest)
          .forEach(({ data }) => {
            const comment = data.comment.normalize('NFC');
            console.log(`comment: ${comment}`);

            if (data.no || data.isOwner) {
              Model.learn(comment.trim());
            }

            if (data.no || (data.userId === 'onecomme.system' && data.name === '生放送クルーズ')) {
              const reply = Model.reply(comment);
              if (reply) {
                console.log(`reply: ${reply} << ${comment}`);
                talkQueue.push(reply);
              }
            }

            if (data.userId === 'onecomme.system') {
              if (data.comment === '「生放送クルーズさん」が引用を開始しました') {
                talkQueue.push(
                  '生放送クルーズのみなさん、こんにちは。',
                  'AI Vチューバーの馬可無序です。',
                  'コメントを学習してお話ししています。',
                  'ぜひ上のリンクから遊びに来てね。',
                );
              }

              if (data.comment.endsWith('広告しました')) {
                const name = data.comment.slice(data.comment.indexOf('】') + '】'.length, data.comment.lastIndexOf('さんが'));
                if (!adQueue.includes(name)) {
                  console.log(`[AD] ${name}`);
                  adQueue.push(name);
                }
              }
            }

            if (data.hasGift) {
              const name = (data.origin as any)?.message?.gift?.advertiserName;
              if (name && !giftQueue.map(({ name }) => name).includes(name)) {
                const src = (({ comment }) => {
                  const start = comment.indexOf('https://');
                  return comment.substring(start, comment.indexOf('"', start));
                })(data);
                console.log(`[GIFT] ${name} ${src}`);
                giftQueue.push({ name, icon: src });
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

        console.log('cleared the comments');

        return new Response();
      }
    },

    '/api/comments': () => Response.json(comments),
    '/api/status': () => Response.json({ latest }),
    '/api/talk': {
      GET: async () => {
        const text = await (async () => {
          {
            const ad = adQueue.shift();
            if (ad) {
              const text = `${ad}さん、広告ありがとうございます！\n`;
              nextSpeech = { text };
              return text;
            }
          }

          {
            const gift = giftQueue.shift();
            if (gift) {
              const text = `${gift.name}さん、ギフトありがとうございます！\n`;
              nextSpeech = { text, icon: gift.icon };
              return text;
            }
          }

          {
            const text = talkQueue.shift();
            if (text) {
              nextSpeech = { text };
              return text;
            }
          }

          {
            const timestamp = comments.at(-1)?.data.timestamp;
            if (timestamp) {
              const quietMs = Date.now() - Date.parse(timestamp);
              // if (quietMs > 10_000_000) {
              //   // TODO 寝顔
              //   nextSpeech = { text: '💤' };
              //   await setTimeout(30_000);
              //   return '・・・';
              // }
              if (4_000_000 > quietMs && quietMs > 3_000_000) {
                // Dare to remain silent
                nextSpeech = { text: '・・・' };
                await setTimeout(5_000);
                return '・・・';
              }
            }
          }

          const text = Model.gen().replace(/。*$/, '');
          nextSpeech = { text };
          return text.normalize('NFC');
        })();

        talkedHistory.unshift(text);

        return new Response(`${text}\n`);
      },
      POST: async (req: BunRequest) => {
        const text = await req.text();
        if (talkQueue.includes(text)) {
          return new Response();
        }
        console.debug(`Queued: ${text}`);
        talkQueue.push(text);
        return Response.json({ text });
      },
    },
    '/api/told': () => {
      talkedHistory.splice(10);
      return Response.json(talkedHistory);
    },
    '/api/speech': () => Response.json(nextSpeech),
    '/api/meta': {
      GET: () => Response.json(serviceMeta),
      POST: async (req) => {
        serviceMeta = await req.json();
        return new Response();
      },
    },

    // '/img/nc433974.png': new Response(await Bun.file('./public/ext/nc433974.png').bytes()),
    // '/img/nc436438.png': new Response(await Bun.file('./public/ext/nc436438.png').bytes()),
  },

  error(error) {
    console.error(new Date(Date.now()).toISOString(), '[ERROR]', error);
    return Response.redirect("https://live.nicovideo.jp/watch/user/14171889", 307); // XXX
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
