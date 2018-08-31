module.exports = {
  verifyTokenValue: async function(googleClient, token) {
    var resultId = null

    // verify provided token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token
      });

      const payload = ticket.getPayload()
      
      // make sure id from token equals provided id
      resultId = payload['sub']
    } catch(err) {
      // unable to verify token, nothing to do actually
      console.log("processing google token", err)
    }

    return resultId
  }
}
