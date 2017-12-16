const config = require('../config.js');
const redis = require("redis"),
    client = redis.createClient(config.redisPort,config.redisHost,{
    'auth_pass': config.redisKey,
    'return_buffers': true
  });

client.on("error", function (err) {
  console.log("Error " + err);
});

exports.getUserId = (user_id) =>{
  client.get(user_id, function(err, reply) {
      return reply
  });
}

exports.setUserId = (user_id, mongo_id) => {
  client.set(user_id, mongo_id, redis.print);
}
