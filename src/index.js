/*********************************************************************
 * Copyright (C) 2022 Joshua Sells joshuataylorsells@gmail.com
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 *
 *********************************************************************/

import 'dotenv/config';
import axios from 'axios';
import Big from 'big.js';
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
                        .post(`${process.env.BOT_ENDPOINT}`, arbitrageablePairs[i])
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
                    const { data } = await axios.post(
                        `${process.env.BOT_ENDPOINT}`,
                        arbitrageablePairs[i]
                    );
                    if (data != '') {
                        resultData.push(data);
                    }
                    break;
                } catch (err) {
                    console.error(err.message);
                }
            }
        }
        console.log(i);
        // Decide how many to run through
        // if (i == 100) {
        //     break;
        // }
    }

    console.log('Done checking arb opportunities.');

    resultData.sort((a, b) => {
        let aFormattedGrossProfit = Big(a.grossProfit)
            .div(Big(10).pow(Number(a.pool1OutputToken.decimals)))
            .toFixed(10);
        let bFormattedGrossProfit = Big(b.grossProfit)
            .div(Big(10).pow(Number(b.pool1OutputToken.decimals)))
            .toFixed(10);

        if (Big(aFormattedGrossProfit).lt(Big(bFormattedGrossProfit))) return 1;
        if (Big(aFormattedGrossProfit).gt(Big(bFormattedGrossProfit))) return -1;
        return 0;
    });

    for (let i = 0; i < 50; i++) {
        console.log(resultData[i].instructions);
    }
};

main();
// runAll();
