# Dynamic ESS
A node-red flow that uses VRM forecasting and algorithm to optimize when to sell, buy and hold the grid to zero. For use in systems that have hourly day ahead prices, such as is now available for consumers in the Netherlands by ANWB, Tibber and the likes.

Note:
- This is a proof of concept project. In the future this implementation in Node-RED will become obsolete as the functionality will move into VRM/Venus OS native.
- This flow uses control paths that may interfere with your normal GX device usage. It adjusts settings (setpoint) and will insert a schedule for charging in the ESS menu. If you don't want that, don't use this node. See below which dbus paths are being used.

If you use this and have questions, issues and/or suggestions, please ask them
in the [Node-RED space](https://community.victronenergy.com/smart-spaces/71/node-red.html) of
our community or file and issue on the
[GitHub](https://github.com/victronenergy/dynamic-ess/issues) site.

## Quick-start

After installing this node, import the _fetch-dynamic-ess_ example (ctrl-i). Once 
imported, double-click the _Dynamic ESS VRM_ node and fill out all required fields.
Note that, if you haven't already, also need to install the [node-red-dashboard](https://flows.nodered.org/node/node-red-dashboard).

<img src="https://github.com/victronenergy/dynamic-ess/raw/main/doc/img/import-example.png" width="70%" alt="Edit panel" />

In the rest of this document some more information may be found on getting the right
values for optimizing the configuration. In short:
- Access token - The VRM access token. See below on how to create one for your site.
- Site ID - Note that this may not be the same as your user ID. You can find your site id in the url on your dashboard. If for example your url for your dashboard is https://vrm.victronenergy.com/installation/654321/dashboard, your Site ID is 654321
- B\_max - Battery capacity (in kWh)
- tb\_max - Maximum Battery charge power (in kW)
- fb\_max  - Maximum Battery discharge power (in kW)
- tg\_max - Maximum Grid Export power (in kW)
- fg\_max - Maximum Grid Import power (in kW).
- Price offset - Fee paid for buying or selling energy to the grid (in €/kWh).
- Battery costs - Cost of charging or discharging battery (in €/kWh).
- VAT percentage - The VAT percentage
- Feed in possible - Can you sell back to the grid?
- Feed-in control - Allow control over the feed-in variable (turn it off automatically when the prices are negative)?

The default filled out values are typical values. If you think you are factors of, you might want to consult on the [community](https://community.victronenergy.com/index.html) and ask for advice on what to fill out.

<img src="https://github.com/victronenergy/dynamic-ess/assets/3098947/e943c799-b0f8-40fe-b7ff-a5d12e309888" width="70%" alt="Edit panel" />

Once everything is filled out, you can deploy the flow and check https://venus.local:1881/ui/ to see how the system will take its actions for the day.

## Flow screenshot

![Dynamic ESS](https://github.com/victronenergy/dynamic-ess/raw/main/doc/img/dynamic-ess-flow.png)

The _dynamic ess_ node is for users that have an energy storage system (ESS)
in combination with a solar system and want to set it automatically to the
optimal value. Where optimal means that it is set so you will pay the least
amount for your energy usage.  There are several factors determining the
optimal value, all being taken into account. These factors are:

- the VRM id
- the solar prediction
- your (dynamic) energy contract price
- your battery size
- the charge speed of your battery
- the discharge speed of your battery
- your predicted consumption
- the grid cost per kWh
- the battery cost per kWh
- the VAT percentage
- is feed-in possible
- allow control over the feed-in variable

If all of these values are known, VRM can make a calculated optimum setpoint available
via its application programming interface (API). The _dynamic ess_ node
utilizes that API to fetch it in a userfriendly way.  Where optimum means the
setting that should result in the lowest energy costs.

Some of the information is deducted from set parameters. Like the country determines
the energy price (as retrieved from ENTSOE) and the longitude and latitude determine
the solar forecast. It uses solcast and the Global Horizontal Irradiance (GHI) for
getting the predicted solar yield.

# Used dbus paths

When correctly deployed, these nodes do write (and read) from the dbus (using [node-red-contrib-victron](https://github.com/victronenergy/node-red-contrib-victron) nodes).
The following services and pahts are being written to:
- `com.victronenergy.settings /Settings/CGwacs/AcPowerSetPoint` - the obvious one, for setting the grid setpoint.
- `com.victronenergy.settings /Settings/CGwacs/OvervoltageFeedIn` - to enable or disable the "Grid feed-in".
- `com.victronenergy.settings /Settings/CGwacs/BatteryLife/Schedule/Charge/0/*`  - to put the battery in "idle" mode.

# Graphs

On each input, the flow generated fresh graphs, which are displayed on the Node-RED dashboard. Light gray background on the charts display the recorded values, while the transparent background shows the estimated/planned values. The darker gray part designates the current hour.

![Overview graph](./doc/img/overview-graph.png)  
![Schedule graph](./doc/img/schedule-graph.png)  
![Price graph](./doc/img/price-graph.png)  
![Costs graph](./doc/img/costs-graph.png)  
![Energy graph](./doc/img/energy-graph.png)

# Usage

As the information is being retrieved via the [VRM API](https://vrm-api-docs.victronenergy.com/#/),
a token is needed to be able to get the required information. This token will
then be used instead of your VRM credentials. See [create an access token](#create_an_access_token)
below on how to do that.

Furthermore you will need to fill out the longitude and latitude of your PV
system.

While it is probably possible to deduct the country based on the longitude and
latitude, it is a lot easier if you fill it out yourself. So you will need to
fill out the country as well. This information is used to retrieve the current
energy price from ENTSO-E. ENTSO-E is the European association for the
cooperation of transmission system operators (TSOs) for electricity. All EU countries
use this as source for determining their next day dynamic energy prices.

<img src="https://github.com/victronenergy/dynamic-ess/assets/3098947/e943c799-b0f8-40fe-b7ff-a5d12e309888" width="70%" alt="Edit panel" />

# Create an access token

In order to use the _dynamic ess_ node, you will need an VRM API access token.
Creating such a token requires a two-step action, taken on the VRM API. The process
is described below.

## Bearer token

First point your browser to:
https://vrm-api-docs.victronenergy.com/#/operations/auth/login

On the right of the screen there is an interactive box, where you can entery your VRM
credentials and push the `Send API Request` button.

![API bearer token](https://github.com/victronenergy/dynamic-ess/raw/main/doc/img/api-bearer-token.png)

Make sure to add the `"remember_me": true`, allowing some extra time to create the access
token.

If you use 2-factor authentication, you can add `"sms_token": "123456"`, where the number
is the token from your 2-factor authentication app.

The _Response_ should be something like:
```
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjRjMzczOTk5NDFmYWU0NDdjMWVmMmZmNzNmMzU5NTQ4In0.eyJ1aWQiOiIxMjI5MTAiLCJ0b2tlbl90eXBlIjoiZGVmYXVsdCIsImlzcyI6InZybWFwaS52aWN0cm9uZW5lcmd5LmNvbSIsImF1ZCI6Imh0dHBzOi8vdnJtYXBpLnZpY3Ryb25lbmVyZ3kuY29tLyIsImlhdCI6MTY3Njg4MjYzMSwiZXhwIjoxNjc2OTY5MDMxLCJqdGkiOiI0YzM3Mzk5OTQxZmFlNDQ3YzFlZjJmZjczZjM1OTU0OCJ9.TjrtftTjU0r4n9nCxE2l6XnxpR2_ltS8R_EBJW_MaY1bs0i1x-6wu6GVNT42sqYP8wUxUEdV2qezKPvFSuG3TJVTcK6VJ6k6nhS7fHtmQ66-wyi917HOK7uw37PuOGzdEi2SrR8vg_Qd3kF6yhki8zcphMgeNqOD2hXHSUjbb3WUTKyMMG6fu0e9VgdY35wXzHZSzdbbQlkR9e6TIqDFYGEFjL_NpXhG48fVdxjtPgZXGeOzyuRUwezveZNo1-Pr4FTOsEa3_-krxSmwvktwa0sk0EjBLArnb-z6FI2Mpg-Vhv9EdeL5jP1zL6dOdSmE1rseemf7mS45zBB-FTN0qA",
  "idUser": 122910,
  "verification_mode": "mobile",
  "verification_sent": false
}
```

The long string after the `token` word is the _Bearer token_. You will need
both the _token_ and the _idUser_ for creating the access token.

## Access token

Once you have a valid _Bearer_ token, you can create an access token. Point your browser to
https://vrm-api-docs.victronenergy.com/#/operations/users/idUser/accesstokens/create and
fill out the parameters. Give the access token a name in the body and hit the
`Send API request` button.

![Access token](https://github.com/victronenergy/dynamic-ess/raw/main/doc/img/api-access-token.png)

Store the access token in your password vault as you won't be able to retrieve it again. You
will also need to fill out this token in the _dynamic ess_ node.

When you are done you can point your browser to
https://vrm-api-docs.victronenergy.com/#/operations/auth/logout and `Send API
Request` for logging out and invalidating the Bearer token.

You can also [list](https://vrm-api-docs.victronenergy.com/#/operations/users/idUser/accesstokens/list)
and [revoke](https://vrm-api-docs.victronenergy.com/#/operations/users/idUser/accesstokens/revoke)
existing tokens via the VRM API.

