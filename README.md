# How to start locally
- npm i
- create folder 'candidate_app_db' on your local machine at the mentioned dbPath: '/home/prakhardeepb/personal-ws'
- serverless dynamodb install
- serverless offline start

# API details

1- http://localhost:3000/api/add-candidate
Description: Insert a candidate into database
Type: POST
RequestBody: {
    "name": "Prakhardeep Bhatnagar",
    "email": "coolprakhar@gmail.com"
}

2- http://localhost:3000/api/add-marks
Description: Assign score for a candidate based on the test
Type: POST
RequestBody: {
    "email": "coolprakhar@gmail.com",    
    "round1": 8.893,
    "round2": 7.66,
    "round3": 6
}

3- http://localhost:3000/api/custom
Type: POST
Description: Api to get highest scoring candidate and average scores per round for all candidates

4- http://localhost:3000/api/delete
Description: Delete a candidate from database
Type: POST
RequestBody: {
    "name": "Prakhardeep Bhatnagar",
    "email": "coolprakhar@gmail.com"
}