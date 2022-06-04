require("dotenv").config();
const { web3 } = require('./setup');
const { BigQuery } = require("@google-cloud/bigquery");
const axios = require('axios');
const IUniswapV2Pair = require("@uniswap/v2-core/build/IUniswapV2Pair.json");
const { queryPairs } = require('./util/util');
const { UNISWAP, SUSHISWAP } = require('./constants/constants');

const main = async () => {

    // Query BigQuery for pair to listen on.
    const bigQuery = new BigQuery();
    const queryString = `SELECT * FROM \`${process.env.BIGQUERY_PROJECT}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERRY_VIEW}\``;

    console.log("Fetching Pairs from BigQuery to listen for...")
    const arbitrageablePairs = await queryPairs(bigQuery, queryString);

    const pairContracts = arbitrageablePairs.map((pair) => {
        return {
            uPair: new web3.eth.Contract(IUniswapV2Pair.abi, pair.uPairAddress),
            sPair: new web3.eth.Contract(IUniswapV2Pair.abi, pair.sPairAddress)
        };
    });

    for (let i = 0; i < pairContracts.length; i++) {
        pairContracts[i].uPair.events.Swap({}, async () => {
            axios.post(`${process.env.BOT_ENDPOINT}`, {
                activeExchange: UNISWAP,
                pairInfo: arbitrageablePairs[i]
            }).then(res => {
                console.log(`Status Code: ${res.status}`);
            }).catch(error => {
                console.error(error);
            });
        });
        pairContracts[i].sPair.events.Swap({}, async () => {
            axios.post(`${process.env.BOT_ENDPOINT}`, {
                activeExchange: SUSHISWAP,
                pairInfo: arbitrageablePairs[i]
            }).then(res => {
                console.log(`Status Code: ${res.status}`);
            }).catch(error => {
                console.error(error);
            });
        });
    }
    console.log("Listening for swaps...");
}

main();