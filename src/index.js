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
import { queryPairs, getPairContractsForEachPair, querySinglePair, getPairContract, sendPairs } from './util/util';

const listen = async () => {
    console.log('Fetching Pairs from BigQuery to listen for...');
    const arbitrageablePairs = await queryPairs();

    const pairContractsForEachPair = getPairContractsForEachPair(arbitrageablePairs);

    for (let i = 0; i < pairContractsForEachPair.length; i++) {
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

const runOne = async (tokenAddress) => {
    console.log('Fetching Pair from BigQuery to listen for...');
    const arbitrageablePair = await querySinglePair(tokenAddress);
    await axios.post(`${process.env.BOT_ENDPOINT}`, arbitrageablePair[0]);
    console.log('Done.');
};

const runAllSync = async () => {
    console.log('Fetching Pairs from BigQuery to listen for...');
    const arbitrageablePairs = await queryPairs();

    const pairContractsForEachPair = getPairContractsForEachPair(arbitrageablePairs);

    console.log(`Running through ${arbitrageablePairs.length} pairs...`);

    const resultData = [];
    for (let i = 0; i < pairContractsForEachPair.length; i++) {
        for (let j = 0; j < pairContractsForEachPair[i].length; j++) {
            if (pairContractsForEachPair[i][j].pairContract != null) {
                try {
                    const { data } = await axios.post(`${process.env.BOT_ENDPOINT}`, arbitrageablePairs[i]);
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
        // if (i == 10) {
        //     break;
        // }
    }

    console.log('Done checking arb opportunities.');
    console.log(`${resultData.length} potential arbs found.`);

    resultData.sort((a, b) => {
        if (Big(a.estimatedNetProfit).lt(Big(b.estimatedNetProfit))) return 1;
        if (Big(a.estimatedNetProfit).gt(Big(b.estimatedNetProfit))) return -1;
        return 0;
    });

    if (resultData.length == 0) return;

    for (let i = 0; i < 40; i++) {
        console.table(resultData[i].data);
    }
};

const runAll = async () => {
    console.log('Fetching Pairs from BigQuery to listen for...');
    const arbitrageablePairs = await queryPairs();

    const pairContractsForEachPair = getPairContractsForEachPair(arbitrageablePairs);

    console.log(`Running through ${arbitrageablePairs.length} pairs...`);

    const resultData = await sendPairs(arbitrageablePairs, pairContractsForEachPair);

    console.log('Done checking arb opportunities.');
    console.log(`${resultData.length} potential arbs found.`);

    if (resultData.length == 0) return;

    resultData.sort((a, b) => {
        if (Big(a.estimatedNetProfit).lt(Big(b.estimatedNetProfit))) return 1;
        if (Big(a.estimatedNetProfit).gt(Big(b.estimatedNetProfit))) return -1;
        return 0;
    });

    for (let i = 0; i < 40; i++) {
        console.table(resultData[i].data);
    }
};

const main = async () => {
    switch (process.argv[2]) {
        case 'listen':
            listen();
            break;
        case 'runAllSync':
            runAllSync();
            break;
        case 'runAll':
            runAll();
            break;
        case 'runOne':
            runOne(process.argv[3]);
            break;
        default:
            listen();
    }
};

main();
