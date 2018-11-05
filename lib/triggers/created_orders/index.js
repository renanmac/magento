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

const formatDate = timestamp => {
  const date = new Date(timestamp);
  const opts = { timezone: 'America/Sao_Paulo' };
  return date.toLocaleString('pt-BR', opts)
}

const getOrders = (plg, event) => {
  console.log(formatDate(event.meta.lastReqAt));
  const filter = `?filter[1][attribute]=created_at&filter[1][gt]='${formatDate(event.meta.lastReqAt)}'`;
  return plg.axios({
    url: event.meta.baseURI + '/orders' + filter,
    method: 'get',
    headers: { Authorization: event.auth.oauth_token },
  });
}

exports.handle = function (plg, event) {
    return getOrders(plg, event);
};