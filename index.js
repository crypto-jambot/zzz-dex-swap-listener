require('./server');
const { web3 } = require('./setup');
const { BigQuery } = require("@google-cloud/bigquery");
const settings = require('./config/settings.json');

const IUniswapV2Pair = require("@uniswap/v2-core/build/IUniswapV2Pair.json");
const { queryTokens } = require('./util/util');

const main = async () => {

    // Query BigQuery for tokens to enrich
    const bigQuery = new BigQuery();

    console.log("Fetching Pairs from BigQuery to listen for...")
    const arbitrageablePairs = await queryTokens(bigQuery);
    
    arbitrageablePairs.forEach((pair) => {
        pair.uPairContract = new web3.eth.Contract(IUniswapV2Pair.abi, pair.uPairAddress);
        pair.sPairContract = new web3.eth.Contract(IUniswapV2Pair.abi, pair.sPairAddress);
    });
    let counter = 0;

    for (const pair of arbitrageablePairs) {
        pair.uPairContract.events.Swap({}, async () => {
            counter++;
            console.log(`Swap initiated on Uniswap: ${counter}`);
            console.log(`Token0: ${pair.token0Symbol} Token1: ${pair.token1Symbol} PairAddress: ${pair.uPairAddress}`);
        });
        pair.sPairContract.events.Swap({}, async () => {
            counter++;
            console.log(`Swap initiated on Sushiswap: ${counter}`);
            console.log(`Token0: ${pair.token0Symbol} Token1: ${pair.token1Symbol} PairAddress: ${pair.sPairAddress}`);
        });
    }
    console.log("Listening for swaps...");
}

main();