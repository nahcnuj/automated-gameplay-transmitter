#!/usr/bin/env bun

import { serve } from "bun";
import { readFileSync, writeFileSync } from "node:fs";
import { setInterval, setTimeout } from "node:timers/promises";
import index from "../index.html";
import type { LiveInfo } from "../src/contexts/ServiceMetaContext";
import { createReceiver } from "../src/games/cookieclicker";
import type { Comment } from "../src/lib/Comment";
import * as MarkovModel from "../src/lib/MarkovModel";

const startDate = Date.now();
let serviceMeta: LiveInfo = {};
let client: string | undefined;

const corpusFile = './var/corpus.txt';
const modelFile = './var/model.json';
const encoding = 'utf8';

const corpus = readFileSync(corpusFile, { encoding }).split('\n').map((text) => text.replaceAll('\\n', '\n'));
const model = ((path) => {
  const { model } = JSON.parse(readFileSync(path, { encoding }));
  // TODO verify
  return MarkovModel.create(model, corpus);
})(modelFile);

const comments: Comment[] = [];

const talkQueue: string[] = [];
const giftQueue: { userId: string; name?: string; icon: string }[] = [];
const adQueue: string[] = [];

let nextSpeech: {
  text: string,
  icon?: string,
} = {
  text: '',
};

let gameState: unknown;

const server = serve({
  idleTimeout: 60,

  routes: {
    "/*": index,

    "/": {
      POST: (req, server) => {
        const ip = server.requestIP(req);
        if (!ip) {
          console.error('[ERROR]', `No IP address is available in the request:`, JSON.stringify(req));
          return Response.json(undefined, { status: 404 });
        }

        // latest = Date.now();

        const { address, family } = ip;
        client = `${family}/${address}`;
        console.log('[INFO]', 'Connected from', client, 'at', new Date().toISOString());
        return new Response();
      },
      PUT: async (req, server) => {
        if (!client) {
          console.log('[INFO]', 'Waiting for the client IP...');
          return Response.json(undefined, { status: 404 });
        }
        const ip = server.requestIP(req);
        if (!ip) {
          console.log('[INFO]', `The request is invalid:`, JSON.stringify(req));
          return Response.json(undefined, { status: 404 });
        }

        const got = `${ip.family}/${ip.address}`;
        if (got !== client) {
          console.error('[ERROR]', `got ${got}, want ${client}`);
          return Response.json(undefined, { status: 404 });
        }

        const data: Comment[] = await req.json();

        const latestComment = comments.at(-1);
        const threshold = latestComment ? Date.parse(latestComment.data.timestamp) : startDate;
        const newComments = data.filter(({ data: { timestamp } }) => Date.parse(timestamp) > threshold);
        comments.push(...newComments);

        for (const { data } of newComments) {
          const comment = data.comment.normalize('NFC').trim();

          if (data.no || data.isOwner) {
            model.learn(`${comment}。`);
          }

          if (data.no || (data.userId === 'onecomme.system' && data.name === '生放送クルーズ')) {
            if (data.comment.match(/[?？]$/)) {
              talkQueue.push(`${data.comment}教えて！`);
            } else {
              const m = data.no ? model : model.toLearned(`${comment}。`);

              const reply = m.reply(data.comment.normalize('NFKC'));
              console.log('[DEBUG]', `reply: ${reply} << ${comment}`);
              if (!reply || data.comment.normalize('NFKC') === reply.normalize('NFKC')) {
                talkQueue.push(`「${data.comment}」ってなんですか？`);
              } else {
                talkQueue.push(reply.replace(/。*$/, '').trimEnd());
              }
            }
          }

          let isAd = false; // FIXME

          if (data.userId === 'onecomme.system') {
            if (data.comment === '「生放送クルーズさん」が引用を開始しました') {
              talkQueue.push(
                '生放送クルーズのみなさん、こんにちは',
                'AI Vチューバーの馬可無序です',
                'コメントを学習してお話ししています',
                'ぜひ上のリンクから遊びに来てね',
              );
            }

            if (data.comment.endsWith('広告しました')) {
              isAd = true;
              const name = data.comment.slice(data.comment.indexOf('】') + '】'.length, data.comment.lastIndexOf('さんが'));
              if (!adQueue.includes(name)) {
                console.log(`[AD] ${name}`);
                adQueue.push(name);
              }
            }

            if (data.comment === '配信終了1分前です') {
              talkQueue.push(
                'そろそろお別れのお時間が近づいてきました',
                'ご視聴、コメント、広告、ギフト、皆様ありがとうございました！',
                'AI Vチューバー、馬可無序がお送りしました',
                '次回の配信もお楽しみに！',
              );
            }
          }

          if (data.hasGift && !isAd) {
            const userId = data.userId;
            const name = (data.origin as any)?.message?.gift?.advertiserName;
            const icon = (({ comment }) => {
              const start = comment.indexOf('https://');
              return comment.substring(start, comment.indexOf('"', start));
            })(data);
            console.log(`[GIFT] ${name} ${icon}`);
            if (data.anonymity) {
              giftQueue.push({ userId, icon });
            } else if (!giftQueue.map(({ userId }) => userId).includes(userId)) {
              giftQueue.push({ userId, name, icon });
            }
          }
        };

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
    '/api/status': () => Response.json({ latest: startDate }),
    '/api/talk': {
      // returns a speech script giving to Open JTalk
      GET: async () => {
        const script = await (async () => {
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
              const text = `${gift.name ? `${gift.name}さん、` : ''}ギフトありがとうございます！\n`;
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

          const text = model.gen().replace(/。*$/, '').trimEnd();
          nextSpeech = { text };
          return text.normalize('NFC');
        })();

        return new Response(`${script}\n`);
      },
      POST: async (req) => {
        const text = await req.text();
        if (talkQueue.includes(text)) {
          return new Response();
        }
        console.debug(`Queued: ${text}`);
        talkQueue.push(text);
        return Response.json({ text });
      },
    },
    // for React app
    '/api/speech': () => Response.json(nextSpeech),
    '/api/meta': {
      GET: () => Response.json(serviceMeta),
      POST: async (req) => {
        serviceMeta = await req.json();
        return new Response();
      },
    },

    '/api/game': () => {
      // console.log('[DEBUG]', '/api/game', JSON.stringify(gameState));
      return Response.json(gameState);
    },

    '/img/nc433974.png': new Response(await Bun.file('./public/ext/nc433974.png').bytes()),
    // '/img/nc436438.png': new Response(await Bun.file('./public/ext/nc436438.png').bytes()),
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

createReceiver((state) => {
  gameState = state;

  switch (state.modal) {
    case 'ascending': {
      // TODO
      return {
        action: 'reincarnate',
      };
    }
    default: {
      const { ticks, store, statistics, ascendNumber } = state;

      console.debug('[DEBUG]', new Date().toISOString(), ticks);

      {
        const d = Number.parseFloat(statistics?.general.runStarted?.innerText.match(/^(\d+)日前$/)?.[1] ?? '');
        console.debug('[DEBUG]', d, '日前');
        if (d >= 7 && ascendNumber > 0) {
          console.debug('[DEBUG]', 'ascending...');
          return {
            action: 'ascend',
          };
        }
      }

      {
        console.debug('[DEBUG]', 'research', JSON.stringify(store.tech, null, 0));
        if (store.tech.filter(({ enabled }) => enabled).length > 0) {
          return {
            action: 'research',
          };
        }
      }

      {
        console.debug('[DEBUG]', 'switches', JSON.stringify(store.switches, null, 0));
        // TODO other switches
        if (store.switches.at(0)?.enabled) {
          return {
            action: 'toggleSwitch',
            name: 'エルダー宣誓',
          };
        }
      }

      {
        console.debug('[DEBUG]', 'upgrades', JSON.stringify(store.upgrades.filter(({ enabled }) => enabled), null, 0));
        // TODO
        const upgrades = store.upgrades.filter(({ enabled }) => enabled);
        if (upgrades.length > 0) {
          return {
            action: 'buyUpgrade',
          };
        }
      }

      {
        console.debug('[DEBUG]', 'products', JSON.stringify(store.products.items.filter(({ enabled }) => enabled), null, 0));
        const p = store.products.items.filter(({ enabled }) => enabled).at(-1);
        if (p) {
          return {
            action: 'buyProduct',
            name: p.name,
          };
        }
      }

      return {
        action: 'click',
      };
    }
  }
});

(async () => {
  for await (const _ of setInterval(3_600_000)) {
    console.debug('[DEBUG]', `Saving the model...`, new Date().toISOString());
    {
      const data = JSON.stringify({ model: model.json.model }, null, 0);
      writeFileSync(modelFile, data, { encoding });
    }
    {
      const data = model.json.corpus.map((text) => text.replaceAll('\n', '\\n')).join('\n').concat('\n');
      writeFileSync(corpusFile, data, { encoding });
    }
  }
})();