const plg = require('pluga-plg');
const expect = require('chai').expect;

const trigger = require('../../lib/triggers/processing_orders');

describe('Trigger: processing_orders', function () {
  it('Should return a processing orders', function (done) {

    const event = {
      meta: {
        baseURI: process.env.BASE_URI,
        lastReqAt: new Date() - (15 * 60 * 1000) // 15 minutes ago
      },
      auth: {
        api_user: process.env.API_USER,
        api_key: process.env.API_KEY
      },
    };

    trigger.handle(plg, event).then(result => {
      expect(result).to.be.an('array');
      expect(result[0].status).to.eq('processing');
      expect(result[0]).to.include.keys('order_id', 'status', 'created_at', 'updated_at');
      done();
    }).catch(done);
  });  
});
