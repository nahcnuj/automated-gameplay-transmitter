const targets = [
  'localhost:7777',
];

const comments = [];

module.exports = {
  name: 'automated-gameplay-transmitter',
  uid: 'work.nahcnuj.automated-gameplay-transmitter',
  version: '0.2.0',
  author: 'Junichi Hayashi',
  url: 'https://github.com/nahcnuj/automated-gameplay-transmitter',
  permissions: ['comments', 'meta'],
  defaultState: {},
  async subscribe(type, data) {
    switch (type) {
      case 'comments':
        const comments = data.comments;
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
              break;
            } catch (err) {
              console.warn('failed to put comments to', target, err);
            }

            if (retry) {
              try {
                const res = await fetch(`http://${target}/`, { method: 'POST' });
                if (!res.ok) throw new Error('Not found');
              } catch (err) {
                retry = false;
                console.warn('failed to post to', target, err);
              }
            }
          } while (retry);
        }
        break;
      case 'meta':
        for (const target of targets) {
          let retry = true;
          do {
            try {
              const res = await fetch(`http://${target}/api/meta`, {
                method: 'POST',
                body: JSON.stringify({ data }),
                headers: { 'Content-Type': 'application/json' },
              });
              if (!res.ok) throw new Error('Not found');
              break;
            } catch (err) {
              console.warn('failed to send the live info to', target, err);
            }

            if (retry) {
              try {
                const res = await fetch(`http://${target}/`, { method: 'POST' });
                if (!res.ok) throw new Error('Not found');
              } catch (err) {
                retry = false;
                console.warn('failed to post to', target, err);
              }
            }
          } while (retry);
        }
        break;
      default:
        console.debug(JSON.stringify([type, data], null, 2));
    }
  },
}
