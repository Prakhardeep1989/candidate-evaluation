var util = require('../util');
var candidateService = require('./candidateService');

module.exports.handler = async (event, context, callback) => {
  try {
    const entity = event.pathParameters.entity.toUpperCase();
    const body = util.removeEmptyStringElements(JSON.parse(event.body));
    console.log(entity,body);
    var response = {
      statusCode: 200,
      headers: util.headers
    };
    switch (entity) {
      case "ADD-CANDIDATE":
        response.body = JSON.stringify(await candidateService.addCandidate(body));
        break;
      case "DELETE":
        response.body = JSON.stringify(await candidateService.deleteCandidate(body));
        break;
      case "ADD-MARKS":
        response.body = JSON.stringify(await candidateService.updateCandidate(body));
        break;
      case "CUSTOM":
        response.body = JSON.stringify(await candidateService.customFetch(body));
        break;
      default:
        response.body = JSON.stringify({ message: "Invalid Entity" });
        response.statusCode = 400;
    }
    console.log(response);
    callback(null, response);
  } catch (e) {
    console.log("ERROR:", e);
    callback(null, {
      statusCode: 500,
      headers: util.headers,
      body: JSON.stringify(e, util.jsonErrorReplacer)
    });
  }
};