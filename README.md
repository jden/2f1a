# 2f1a
a demo alternate login flow, designed to be more humane

a user tries logging in with their username and phone number. the service sends them a text with a unique URL which they can use to validate their login and complete their authentication. as soon as the user taps the link in their text, the login attempt is validated.

## get the demo up and running

things you'll need:
- a twilio account and phone number
- a publically accessible place to run a node server. this could be an heroku account, an ngrok tunnel, etc

1. clone this repo
2. `$ npm install`
3. copy `env.sample` to `env`, edit config vars, and `$ source env` (or find another way of setting the appropriate env vars, for example heroku config)
5. `npm start` and visit the page in your browser

## login flow

![](http://g.gravizo.com/g?
  @startuml;
  ;
  actor user;
  participant phone;
  participant site;
  ;
  user->site: username and phone;
  phone->user: msg with unique url;
  note right of phone: phone could also be email or any out-of-band communications channel;
  user->phone: load unique url to confirm choice;
  site->user: login complete;
  ;
  @enduml;
)

## license
by jden <jason@denizac.org> sometime in 2014, ISC license.