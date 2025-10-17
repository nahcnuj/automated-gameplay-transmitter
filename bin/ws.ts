const targets = [
  'localhost:7777',
];

module.exports = {
  name: 'automated-gameplay-transmitter',
  uid: 'work.nahcnuj.automated-gameplay-transmitter',
  version: '0.0.2',
  author: 'Junichi Hayashi',
  url: 'https://github.com/nahcnuj/automated-gameplay-transmitter',
  permissions: ['comments', 'meta'],
  defaultState: {},
  async subscribe(type, data) {
    switch (type) {
      case 'comments':
        console.info('[DEBUG]', 'comments', data.comments);
        for (const target of targets) {
          try {
            await fetch(`http://${target}/`, {
              method: 'PUT',
              body: JSON.stringify(data.comments),
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (err) {
            console.info('[WARN] failed to put comments to', target, err);
          }
        }
        break;
      case 'meta':
        console.info('[DEBUG]', 'meta', data.data);
        for (const target of targets) {
          let retry = true;
          do {
            try {
              await fetch(`http://${target}/api/meta`, {
                method: 'POST',
                body: JSON.stringify(data.data),
                headers: { 'Content-Type': 'application/json' },
              });
              retry = false;
            } catch (err) {
              console.info('[WARN] failed to send the live info to', target, err);
            }

            if (retry) {
              try {
                await fetch(`http://${target}/`, { method: 'POST' });
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