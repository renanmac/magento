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
  const filter = '?filter[0][attribute]=order_comments&filter[0][in]=1&filter[1][attribute]=status&filter[1][in]=canceled';

  return plg.axios({
    url: event.meta.baseURI + '/orders' + filter,
    method: 'get',
    headers: { Authorization: event.auth.oauth_token }
  }).then(res => console.log(res)).catch(err => {
    throw `Orders ${parseError(err)}`;
  });
};

exports.handle = function (plg, event) {
  return getOrders(plg, event)
  .then(orders => {
    return Object.values(orders);
  }).catch( err => {
    throw `Order: ${parseError(err)}`;
  });
};