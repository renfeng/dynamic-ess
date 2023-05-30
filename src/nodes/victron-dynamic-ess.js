module.exports = function (RED) {
  'use strict'

  const axios = require('axios')
  const curlirize = require('axios-curlirize')
  const path = require('path')
  const packageJson = require(path.join(__dirname, '../../', 'package.json'))

  function VictronDynamicEss (config) {
    RED.nodes.createNode(this, config)

    const node = this

    let FeedInPossible = config.feed_in_possible
    let UseGridSetpointMinMax = true

    node.on('input', function (msg) {
      const url = msg.url || 'https://vrm-dynamic-ess-api.victronenergy.com'

      if (!config.vrmtoken && !msg.vrmtoken) {
        node.status({ fill: 'red', shape: 'dot', text: 'No VRM token set' })
        return
      }

      if (msg.feed_in_possible) {
        FeedInPossible = msg.feed_in_possible
      }

      if (msg.use_gsmm) {
        UseGridSetpointMinMax = msg.use_gsmm
      }

      if (!config.site_id && !msg.site_id) {
        node.status({ fill: 'red', shape: 'dot', text: 'No VRM ID token set' })
        return
      }

      if (!config.long && !msg.long) {
        node.status({ fill: 'red', shape: 'dot', text: 'No longitude set' })
        return
      }

      if (!config.lat && !msg.lat) {
        node.status({ fill: 'red', shape: 'dot', text: 'No latitude token set' })
        return
      }
      msg.topic = 'VRM dynamic ess'
      msg.payload = null

      const msgsp = {
        topic: 'ideal setpoint',
        payload: null
      }

      const options = {
        site_id: (msg.site_id || config.site_id).toString(),
        b_max: (msg.b_max || config.b_max || 1).toString(),
        tb_max: (msg.tb_max || config.tb_max || 1).toString(),
        fb_max: (msg.fb_max || config.fb_max || 1).toString(),
        tg_max: (msg.tg_max || config.tg_max || 1).toString(),
        fg_max: (msg.fg_max || config.fg_max || 1).toString(),
        b_cost: (msg.b_cost || config.b_cost || 0).toString(),
        provider_fee: (msg.provider_fee || config.p_offset || 0).toString(),
        vat_percentage: (msg.vat_percentage || (1+(config.vat_percentage/100)) || 1).toString(),
        feed_in_possible: (msg.feed_in_possible || config.feed_in_possible || true).toString(),
        feed_in_control_on: (msg.feed_in_control_on || config.feed_in_control_on || true).toString(),
        long: (msg.long || config.long).toString(),
        lat: (msg.lat || config.lat).toString(),
        country: (msg.country || config.country || 'nl').toUpperCase()
      }
      const headers = {
        'X-Authorization': 'Token ' + config.vrmtoken,
        accept: 'application/json',
        'User-Agent': 'dynamic-ess/' + packageJson.version
      }

      if (config.verbose === true) {
        node.warn({
          url,
          options,
          headers
        })
      }

      node.status({ fill: 'yellow', shape: 'ring', text: 'Retrieving setpoint' })
      const d = new Date()
      const hour = d.getHours()
      axios.get(url, { params: options, headers }).then(function (response) {
        if (response.status === 200) {
          msg.payload = response.data
          if (msg.payload.schedule) {
            msgsp.payload = msg.payload.schedule[hour] * 1000
            msgsp.payload = Number(msgsp.payload.toFixed(0))
          }

          if (UseGridSetpointMinMax && msg.payload.output) {
            msgsp.payload = msg.payload.output.gsmm[hour] * 1000
          }

          msg.payload.options = options
          node.status({ fill: 'green', shape: 'dot', text: 'Ok' })
        } else {
          node.status({ fill: 'yellow', shape: 'dot', text: response.status })
        }

        let cheap = 0
        if (FeedInPossible && msg.payload.output.p[hour] < 0) {
          cheap = 1
        }

        node.send([msgsp, msg, { payload: cheap, price: msg.payload.output.p[hour] }])
      }).catch(function (error) {
        if (error.response && error.response.data && error.response.data.detail) {
            node.status({ fill: 'red', shape: 'dot', text: error.response.data.detail })
        } else {
          node.status({ fill: 'red', shape: 'dot', text: 'Error fetching VRM data' })
        }
        if (error.response) {
          node.send([null, null, null, { payload: error.response }])
        }
      })
    })

    node.on('close', function () {
    })

    if (config.verbose) {
      curlirize(axios)
    }
  }

  RED.nodes.registerType('victron-dynamic-ess', VictronDynamicEss)
}
