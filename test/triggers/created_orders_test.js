const plg = require('pluga-plg');
const expect = require('chai').expect;

const trigger = require('../../lib/triggers/created_orders');

describe('Trigger: Bar', function () {
  it('test your trigger handle here', function (done) {

    let event = {
      meta: {
        baseURI: process.env.BASE_URI,
        lastReqAt: new Date() - (15 * 60 * 1000) // 15 minutes ago
      },
      auth: {
        oauth_token: process.env.OAUTH_TOKEN
      },
    };

    trigger.handle(plg, event).then(result => {
      console.log(result.data);
      done();
    })
    .catch(err => console.log(err)); 
  });
});
