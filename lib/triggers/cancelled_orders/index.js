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

const parseError = err => err.response.data.messages.error.map(e => e.message).join(', ');

const getOrders = (plg, event, page = 1, acc = [], lastID = 0) => {

  return plg.axios({
    url: event.meta.baseURI + '/orders',
    method: 'get',
    headers: { Authorization: event.auth.oauth_token },
    params : {
      order: 'created_at',
      dir: 'DSC',
      limit: 100,
      page: page,
      'filter[0][attribute]': 'status',
      'filter[0][in]': 'canceled'
    }
  }).then(res => {
    const cur = Object.values(res.data);
    const last = cur.length - 1;
    if (lastID == 0 && cur.length < 100){
      return cur;
    }
    const itens = lastID === 0 ? [] : cur.filter(item => item.entity_id > lastID);
    return cur.length === 100 && itens.length === 0 ? 
                    getOrders(plg, event, page + 1, acc.concat(cur), cur[last].entity_id ) : acc.concat(itens);
  }).catch(err => {
    throw `Orders: ${parseError(err)}`;
  });
};

const getCustomer = (plg, event, order) => {
  return plg.axios({
    url: event.meta.baseURI + '/customers/' + order.customer_id,
    method: 'get',
    headers: { Authorization: event.auth.oauth_token } 
  }).then( res => {
    const customer = res.data
    return customer;
  } ).catch( err => {
    throw `Customer ${parseError(err)}`
  });
}

exports.handle = function (plg, event) {
  return getOrders(plg, event)
  .then(async orders => {
    const cancelledOrders = orders.filter( order => {
      const index = order.order_comments.length - 1;
      const updated_at = Date.parse(order.order_comments[index].created_at + ' UTC');
      return order.order_comments[index].status === 'canceled' && updated_at >= event.meta.lastReqAt;
    });

    for(const cancelledOrder of cancelledOrders){
      cancelledOrder.customer = await getCustomer(plg, event, cancelledOrder);
      cancelledOrder.address = cancelledOrder.addresses[0];
      delete cancelledOrder.addresses;
      delete cancelledOrder.customer_id;
    }
    return cancelledOrders;
  }).catch( err => err );
};