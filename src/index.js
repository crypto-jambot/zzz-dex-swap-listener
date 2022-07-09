/*********************************************************************
 * Copyright (C) 2022 Joshua Sells joshuataylorsells@gmail.com
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 *
 *********************************************************************/

import 'dotenv/config';
import { web3 } from './setup/setup';
import axios from 'axios';
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json';
import { queryPairs, getPairContractsForEachPair } from './util/util';

const main = async () => {
    // Query BigQuery for pair to listen on.
    console.log('Fetching Pairs from BigQuery to listen for...');
    const arbitrageablePairs = await queryPairs();

    const pairContractsForEachPair = getPairContractsForEachPair(arbitrageablePairs);

    // For each set of contracts for a token pair
    for (let i = 0; i < pairContractsForEachPair.length; i++) {
        // For each contract in the specified token pair
        for (let j = 0; j < pairContractsForEachPair[i].length; j++) {
            if (pairContractsForEachPair[i][j].pairContract != null) {
                pairContractsForEachPair[i][j].pairContract.events.Swap({}, async () => {
                    axios
                        .post(`${process.env.BOT_ENDPOINT}`, {
                            pair: arbitrageablePairs[i],
                        })
                        .then((res) => {
                            console.log(`Status Code: ${res.status}`);
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                });
            }
        }
    }
    console.log('Listening for swaps...');
};

const runAll = async () => {
    // Query BigQuery for pair to listen on.
    console.log('Fetching Pairs from BigQuery to listen for...');
    const arbitrageablePairs = await queryPairs();

    const pairContractsForEachPair = getPairContractsForEachPair(arbitrageablePairs);

    console.log(`Running through ${arbitrageablePairs.length} pairs...`);

    const resultData = [];
    // For each set of contracts for a token pair
    for (let i = 0; i < pairContractsForEachPair.length; i++) {
        // For each contract in the specified token pair.
        // We break after the first run because the bot will check all exchanges for that specific pair.
        for (let j = 0; j < pairContractsForEachPair[i].length; j++) {
            if (pairContractsForEachPair[i][j].pairContract != null) {
                try {
                    const { data } = await axios.post(`${process.env.BOT_ENDPOINT}`, {
                        pair: arbitrageablePairs[i],
                    });
                    if (data != null) {
                        resultData.push(data);
                    }
                    break;
                } catch (err) {
                    console.error(err.message);
                }
            }
        }
        // Decide how many to run through
        if (i == 100) {
            break;
        }
    }

    console.log('Done checking arb opportunities.');
    const bestArb = resultData.reduce((previous, current) => {
        return current.netProfit > previous.netProfit ? current : previous;
    }, resultData[0]);

    console.log(bestArb);
};

main();
// runAll();
