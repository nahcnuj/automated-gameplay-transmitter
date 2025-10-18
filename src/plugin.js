const targets = [
  'localhost:7777',
];

const comments = [];

module.exports = {
  name: 'automated-gameplay-transmitter',
  uid: 'work.nahcnuj.automated-gameplay-transmitter',
  version: '0.0.4',
  author: 'Junichi Hayashi',
  url: 'https://github.com/nahcnuj/automated-gameplay-transmitter',
  permissions: ['comments', 'meta'],
  defaultState: {},
  async subscribe(type, data) {
    switch (type) {
      case 'comments':
        console.info('[DEBUG]', 'comments', data.comments);
        comments.push(...data.comments);
        for (const target of targets) {
          let retry = true;
          do {
            try {
              const res = await fetch(`http://${target}/`, {
                method: 'PUT',
                body: JSON.stringify(comments),
                headers: { 'Content-Type': 'application/json' },
              });
              if (!res.ok) throw new Error('Not found');
              console.info(`[DEBUG] put ${comments.length} comments to`, target);
              break;
            } catch (err) {
              console.info('[WARN] failed to put comments to', target, err);
            }

            if (retry) {
              try {
                const res = await fetch(`http://${target}/`, { method: 'POST' });
                if (!res.ok) throw new Error('Not found');
                console.info('[DEBUG] posted to', target);
              } catch (err) {
                retry = false;
                console.info('[WARN] failed to post to', target, err);
              }
            }
          } while (retry);
        }
        break;
      case 'meta':
        console.info('[DEBUG]', 'meta', data.data);
        for (const target of targets) {
          let retry = true;
          do {
            try {
              const res = await fetch(`http://${target}/api/meta`, {
                method: 'POST',
                body: JSON.stringify(data.data),
                headers: { 'Content-Type': 'application/json' },
              });
              if (!res.ok) throw new Error('Not found');
              console.info('[DEBUG] sent the live info to', target);
              break;
            } catch (err) {
              console.info('[WARN] failed to send the live info to', target, err);
            }

            if (retry) {
              try {
                const res = await fetch(`http://${target}/`, { method: 'POST' });
                if (!res.ok) throw new Error('Not found');
                console.info('[DEBUG] posted to', target);
              } catch (err) {
                retry = false;
                console.info('[WARN] failed to post to', target, err);
              }
            }
          } while (retry);
        }
        break;
      default:
        console.info('[INFO]', arguments);
    }
  },
}