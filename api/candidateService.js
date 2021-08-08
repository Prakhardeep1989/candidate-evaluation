const TABLE_NAME = process.env.CANDIDATE_DATA_TABLE;
var util = require('../util'); 
var validator = require("email-validator");
const {Constant} = require('../util/Constant'); 

async function addCandidate(data) {
    if(data && data.email && validator.validate(data.email) && data.name){
        let candidate = await util.findByKey(TABLE_NAME, "email", data.email)
        if(candidate){
            return { message: "Email already used" }            
        }else{
            return await util.put({email: data.email, name: util.toTitleCase(data.name), type: Constant.CANDIDATE_TYPE}, TABLE_NAME);
        }        
    }else{
        return { message: "Invalid candidate params" }
    }   
}
async function updateCandidate(data) {
    if(data && data.email && validator.validate(data.email)){
        let oldCandidate = await util.findByKey(TABLE_NAME, "email", data.email)
        if(oldCandidate){
            oldCandidate.round1 = util.isValidScore(data.round1) ? Number(data.round1.toFixed(2)) : (oldCandidate.round1 ? oldCandidate.round1 : 0)
            oldCandidate.round2 = util.isValidScore(data.round2) ? Number(data.round2.toFixed(2)) : (oldCandidate.round2 ? oldCandidate.round2 : 0)
            oldCandidate.round3 = util.isValidScore(data.round3) ? Number(data.round3.toFixed(2)) : (oldCandidate.round3 ? oldCandidate.round3 : 0)
            oldCandidate.total = Number((oldCandidate.round1+oldCandidate.round2+oldCandidate.round3).toFixed(2))
            return await util.put(oldCandidate, TABLE_NAME);
        }else{
            return { message: "Candidate not found" }
        }        
    }else{
        return { message: "Invalid candidate params" }
    }    
}
async function deleteCandidate(data) {
    if(data && data.email && validator.validate(data.email)){
        return await util.deleteByEmail(data.email, data.name, TABLE_NAME);
    }else{
        return { message: "Invalid candidate email" }
    }
}
async function customFetch() {
    let resp = {}
    let params = {
        TableName: TABLE_NAME,
        IndexName: "type-total-index",
        KeyConditionExpression: "#columnName = :columnName",
        ExpressionAttributeNames: {
            "#columnName": "type"
        },
        ExpressionAttributeValues: {
            ":columnName": Constant.CANDIDATE_TYPE
        },
        Limit: 1,
        ScanIndexForward: false
    };
    let typeEntries = await util.findAll(params)
    if(typeEntries?.length){
        let highestScore = typeEntries[0]['total']
        console.log(highestScore)
        let toppers = await util.findByIndex(TABLE_NAME,"total-name-index","total",highestScore)
        resp.highestScore = highestScore
        resp.toppers = toppers
    }else{
        return { message: "No entries available in index" }
    }
    // logic to find average scores per round for all candidates
    let candidates = await util.scan({ TableName: TABLE_NAME} )
    let totalCandidates = candidates.length
    let round1Avg = 0, round2Avg = 0, round3Avg = 0;
    candidates.forEach(item => {
        round1Avg += item.round1
        round2Avg += item.round2
        round3Avg += item.round3
    })
    round1Avg = round1Avg/totalCandidates
    round2Avg = round2Avg/totalCandidates
    round3Avg = round3Avg/totalCandidates
    resp.round1Avg = Number(round1Avg.toFixed(2))
    resp.round2Avg = Number(round2Avg.toFixed(2))
    resp.round3Avg = Number(round3Avg.toFixed(2))
    return resp
}
    
module.exports = {
    addCandidate,
    updateCandidate,
    deleteCandidate,
    customFetch
}