const plg = require('pluga-plg');
const expect = require('chai').expect;

const trigger = require('../../lib/triggers/cancelled_orders');

describe('Trigger: cancelled_orders', function () {
  it('Should return canceled orders', function (done) {

    const event = {
      meta: {
        baseURI: process.env.BASE_URI,
        lastReqAt: new Date() - (15 * 60 * 1000) // 15 minutes ago
      },
      auth: {
        oauth_token: process.env.OAUTH_TOKEN
      },
    };

    trigger.handle(plg, event).then(result => {
      console.log(JSON.stringify(result));
      expect(result).to.be.an('array');
      expect(result[0].status).to.eq('canceled');
      expect(result[0]).to.include.keys('entity_id', 'status', 'created_at');
      done();
    }).catch(done);
  });  
});
