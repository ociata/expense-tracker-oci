if (process.env.NODE_ENV === 'production') {
  //export prod keys
  module.exports = require('./prod')
} else if (process.env.NODE_ENV === 'test') {
  //export test keys
  module.exports = require('./test')
} else {
  //export dev keys
  module.exports = require('./dev')
}