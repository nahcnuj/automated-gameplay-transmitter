const target = 'localhost:7777';

module.exports = {
  name: 'automated-gameplay-transmitter',
  uid: 'work.nahcnuj.automated-gameplay-transmitter',
  version: '0.0.1',
  author: 'Junichi Hayashi',
  url: 'https://github.com/nahcnuj/automated-gameplay-transmitter',
  permissions: ['comments','meta'],
  defaultState: {},
  async subscribe(type, data) {
    switch (type) {
      case 'comments':
        console.info('comments', data.comments);
        await fetch(`http://${target}/`, {
          method: 'PUT',
          body: JSON.stringify(data.comments),
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => {
          console.info('[WARN]', err);
        });
        break;
      case 'meta':
        await fetch(`http://${target}/`, { method: 'POST' }).catch((err) => {
          console.info('[WARN]', err);
        });
        console.info('meta', data.data);
        await fetch(`http://${target}/api/meta`, {
          method: 'POST',
          body: JSON.stringify(data.data),
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => {
          console.info('[WARN]', err);
        });
        break;
      default:
        console.info(arguments);
    }
  },
}