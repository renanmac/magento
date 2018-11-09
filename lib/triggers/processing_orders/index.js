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
  const opts = { timezone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric'};
  return date.toLocaleString('pt-BR', opts)
}

const getOrders = (plg, event) => {

  return plg.axios({
    url: event.meta.baseURI + '/orders',
    method: 'get',
    headers: { Authorization: event.auth.oauth_token },
    params : {
      order: 'created_at',
      dir: 'DSC',
      limit: 100,
      'filter[0][attribute]': 'status',
      'filter[0][in]': 'processing'
    }
  }).then(res => res.data).catch(err => {
    throw `Orders: ${parseError(err)}`;
  });
};

exports.handle = function (plg, event) {
  return getOrders(plg, event)
  .then(orders => {
    return Object.values(orders).filter( order => {
      let index = order.order_comments.length -1;
      return order.order_comments[index].status === 'processing' && 
             order.order_comments[index].created_at >= formatDate(event.meta.lastReqAt)
    });
  }).catch( err => err );
};