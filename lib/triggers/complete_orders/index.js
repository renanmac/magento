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

const timestampUTC = date => Date.parse(date) - 
                             (new Date(date).getTimezoneOffset() * 60 * 1000);

const getOrders = (plg, event, page = 1, acc = [], lastID = 0) => {

  return plg.axios({
    url: event.meta.baseURI + '/orders',
    method: 'get',
    headers: { Authorization: event.auth.oauth_token },
    params : {
      limit: 5,
      page: page,
      'filter[0][attribute]': 'status',
      'filter[0][in]': 'complete'
    }
  }).then(res => {
    const cur = Object.values(res.data);
    const last = cur.length - 1;
    const itens = cur.filter(item => item.entity_id !== lastID);
    if (cur.length === 5 && itens.length === 0 ){
      return getOrders(plg, event, page + 1, acc.concat(cur), cur[last].entity_id )
    }
    else{
      return acc.concat(itens);
    }

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
    const customer = res.data;
    return customer;
  } ).catch( err => {
    throw `Customer ${parseError(err)}`
  });
}

exports.handle = function (plg, event) {
  return getOrders(plg, event)
  .then(async orders => {
    const completeOrders = orders.filter( order => {
      const index = order.order_comments.length - 1;
      const updated_at = timestampUTC(order.order_comments[index].created_at);
      return order.order_comments[index].status === 'complete' && updated_at >= event.meta.lastReqAt;
    });

    for(const completeOrder of completeOrders){
      completeOrder.customer = await getCustomer(plg, event, completeOrder);
      completeOrder.address = completeOrder.addresses[0];
      delete completeOrder.addresses;
      delete completeOrder.customer_id;
    }
    return completeOrders;
  }).catch( err => err );
};