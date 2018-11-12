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

const parseError = (err) => {
  return err.response.data.messages.error.map(e => e.message).join(', ');
};

const formatDate = timestamp => {
  const date = new Date(timestamp);
  const opts = { timezone: 'America/Sao_Paulo' };
  return date.toLocaleString('pt-BR', opts)
}

const getOrders = (plg, event) => {

  return plg.axios({
    url: event.meta.baseURI + '/orders',
    method: 'get',
    headers: { Authorization: event.auth.oauth_token },
    params: {
      'filter[0][attribute]':'created_at',
      'filter[0][gt]':formatDate(event.meta.lastReqAt),
      'filter[1][attribute]':'status',
      'filter[1][in]': 'pending'
    }
  }).then(res => res.data).catch(err => {
      throw `Orders ${parseError(err)}`;
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
  .then(async (res) => {
    const orders = Object.values(res);
    for (const order of orders){
      order.customer = await getCustomer(plg, event, order);
      order.address = order.addresses[0];
      delete order.addresses;
      delete order.customer_id;
    }
    return orders;
  }).catch( err => err );
};
