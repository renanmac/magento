/**
 * Trigger handler
 *
 * @param {object} plg - Pluga developer platform toolbox.
 * @param {object} plg.axios - [axios](https://github.com/axios/axios)
 *
 * @param {object} event - Event bundle to handle.
 * @param {object} event.meta - Pluga event meta data.
 * @param {string} event.meta.baseURI - Environment base URI.
 * @param {number} event.meta.lastReqAt - Last task handle timestamp.
 * @param {object} event.auth - Your app.json auth fields.
 * @param {object} event.input - Your meta.json fields.
 *
 * @returns {Promise} Promise object represents an array of resources to handle.
 */
const soap = require('soap');

const parseArray = array => {
  if (!Array.isArray(array)) array = [array];
  return array.map(parseObject);
};

const parseObject = (obj) => {
  let ord = {};
  const object = Object.entries(obj);
  object.forEach( item => {
    ord[item[0]] = item[1].$value;
  });
  return ord;
};

const getOrdersInfo = (client, session, order) => {
  return client.salesOrderInfoAsync({sessionId: session, orderIncrementId: order.increment_id})
    .then(res => res[0].result)
    .catch(err => {throw err})
}

exports.handle = function (plg, event) {
  return new Promise((resolve, reject) => {
    soap.createClient(event.meta.baseURI, (err, client) => {
      if (err) throw err;
      const args = {username: event.auth.api_user, apiKey: event.auth.api_key};
      client.login(args, (err, result) => {
        if (err) throw err;
        const session = result.loginReturn.$value;
        const filter = {
          complex_filter: {
            complexObjectArray: [
              { 
                key: 'status',
                value: { key: 'eq', value: 'canceled' }
              } ,
              {
                key: 'updated_at',
                value: { key: 'from', value: (new Date(event.meta.lastReqAt)).toISOString() }
              }
            ]
          }
        };
        client.salesOrderListAsync({sessionId: session, filters: filter})
          .then( async data => {
            let orders = typeof data[0].result.item === 'undefined' ? [] : parseArray(data[0].result.item);
            for(let order of orders){
              let temp = await getOrdersInfo(client, session, order);
              order.shipping_address = parseObject(temp.shipping_address[0] || temp.shipping_address);
              order.billing_address = parseObject(temp.billing_address[0] || temp.billing_address);
              order.payment = parseObject(temp.payment[0] || temp.payment);
              order.items = parseArray(temp.items.item);
            }
          resolve(orders);
        });
      });
    });
  });
};