const docClient = require('serverless-dynamodb-client').doc;

var self = module.exports = {
    headers: {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "*"
    },
    findByKey: function (tableName, keyColumnName, keyColumnValue) {
        return new Promise(function (resolve, reject) {
            var params = {
                TableName: tableName,
                KeyConditionExpression: "#" + keyColumnName + " = :" + keyColumnName,
                ExpressionAttributeNames: {
                    ["#" + keyColumnName]: keyColumnName
                },
                ExpressionAttributeValues: {
                    [":" + keyColumnName]: keyColumnValue
                }
            };
            docClient.query(params, (err, data) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(data.Items[0]);
            })
        });
    },
    put: async function (data, tableName) {
        let now = new Date().getTime();
        if (!data.createdTimestamp) { data.createdTimestamp = now; }
        data.updatedTimestamp = now;
        var params = { TableName: tableName, Item: data };
        return new Promise((resolve, reject) => {
            docClient.put(params, (err, data) => {
                if (err)
                    reject({ message: err.message });
                resolve(params.Item);
            })
        });
    },
    delete: async function (params) {
        console.log("Params", params);
        return new Promise((resolve, reject) => {
            docClient.delete(params, (err, data) => {
                if (err)
                    reject({ message: err.message });
                resolve({ message: "Deleted" })
            })
        });
    },
    deleteByEmail: async function (email, name, tableName) {
        console.log("Delete", email, "from table", tableName);
        return await self.delete({ Key: { email, name }, TableName: tableName })
    },
    findAllPaginated: async function (params, pagination) {
        pagination.limit = pagination.limit && pagination.limit <= 50 ? pagination.limit : 50;
        params.Limit = pagination.limit;
        params.ExclusiveStartKey = null;
        if (pagination.exclusiveStartKey && Object.keys(pagination.exclusiveStartKey).length > 0) {
            params.ExclusiveStartKey = pagination.exclusiveStartKey;
        }
        console.log("findAllPaginated", params);

        return new Promise(function (resolve, reject) {
            var results = [];
            let remainingLimit = params.Limit;
            var queryCallback = (err, data) => {
                if (err) {
                    console.log(err);
                    reject(err)
                }
                results = results.concat(data.Items);
                console.log("remainingLimit", remainingLimit, data.Items.length, results.length)
                remainingLimit = pagination.limit - results.length;
                if (remainingLimit >= 1 && typeof data.LastEvaluatedKey != 'undefined') {
                    params.ExclusiveStartKey = data.LastEvaluatedKey
                    params.Limit = pagination.limit - results.length;
                    console.log("params", params)
                    docClient.query(params, queryCallback);
                } else {
                    data.Items = results
                    resolve(data)
                }
            }
            docClient.query(params, queryCallback);
        });
    },
    findAll: async function (params, pagination) {
        console.log('findAll', params);
        if (pagination) {
            return await self.findAllPaginated(params, pagination);
        } else {
            return new Promise(function (resolve, reject) {
                var results = []
                var queryCallback = (err, data) => {
                    if (err) {
                        console.log(err);
                        reject(err)
                    }

                    results = results.concat(data.Items)
                    if (typeof data.LastEvaluatedKey != 'undefined') {
                        params.ExclusiveStartKey = data.LastEvaluatedKey
                        docClient.query(params, queryCallback)
                    } else {
                        resolve(results)
                    }
                }
                docClient.query(params, queryCallback)
            });
        }
    },
    scan: function (params) {
        console.log('scan', params);
        return new Promise(function (resolve, reject) {
            var results = []
            var queryCallback = (err, data) => {
                if (err) {
                    console.log(err);
                    reject(err)
                }

                results = results.concat(data.Items)
                if (typeof data.LastEvaluatedKey != 'undefined') {
                    params.ExclusiveStartKey = data.LastEvaluatedKey
                    docClient.scan(params, queryCallback)
                } else {
                    resolve(results)
                }
            }
            docClient.scan(params, queryCallback)
        })
    },
    toTitleCase: function(str){
        return str.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    },
    isValidScore: function(score){
        return (score && !isNaN(score) && score<=10 && score>=0) ? true : false        
    },
    findByIndex: async function (tableName, indexName, columnName, columnValue, pagination) {
        var params = {
            TableName: tableName,
            IndexName: indexName,
            KeyConditionExpression: "#columnName = :columnName",
            ExpressionAttributeNames: {
                "#columnName": columnName
            },
            ExpressionAttributeValues: {
                ":columnName": columnValue
            }
        };
        console.log(params);
        return await self.findAll(params, pagination);
    },
    removeEmptyStringElements: function (obj) {
        for (var prop in obj) {
            if (typeof obj[prop] === 'object')// dive deeper in
                self.removeEmptyStringElements(obj[prop]);
            else if (typeof obj[prop] === 'string' && obj[prop].trim() === '') // delete elements that are empty strings
                delete obj[prop];
        }
        return obj;
    },
    jsonErrorReplacer: function (key, value) {
        if (value instanceof Error)
            return { ...value, name: value.name, message: value.message, stack: value.stack }
        return value
    },
}