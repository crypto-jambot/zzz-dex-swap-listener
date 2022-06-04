require("dotenv").config();
const { web3 } = require('./setup');
const { BigQuery } = require("@google-cloud/bigquery");
const axios = require('axios');
const IUniswapV2Pair = require("@uniswap/v2-core/build/IUniswapV2Pair.json");
const { queryPairs } = require('./util/util');

const main = async () => {

    // Query BigQuery for pair to listen on.
    const bigQuery = new BigQuery();
    const queryString = `SELECT * FROM \`${process.env.BIGQUERY_PROJECT}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERRY_VIEW}\``;

    console.log("Fetching Pairs from BigQuery to listen for...")
    const arbitrageablePairs = await queryPairs(bigQuery, queryString);

    const pairContracts = arbitrageablePairs.map((pair) => {
        const pairContracts = {};
        for (const [ key, value ] of Object.entries(pair.pairAddresses)) {
            pairContracts[key] = new web3.eth.Contract(IUniswapV2Pair.abi, value);
        }
        return pairContracts;
    });

    for (let i = 0; i < pairContracts.length; i++) {
        for (const key of Object.keys(pairContracts[i])) {
            pairContracts[i][key].events.Swap({}, async () => {
                axios.post(`${process.env.BOT_ENDPOINT}`, {
                    activeExchange: key.toUpperCase(),
                    pairInfo: arbitrageablePairs[i]
                }).then(res => {
                    console.log(`Status Code: ${res.status}`);
                }).catch(error => {
                    console.error(error);
                });
            });
        }
    }
    console.log("Listening for swaps...");
}

main();