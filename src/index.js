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
import { queryPairs } from './util/util';

const main = async () => {
    // Query BigQuery for pair to listen on.
    console.log('Fetching Pairs from BigQuery to listen for...');
    const arbitrageablePairs = await queryPairs();

    const pairContractsForEachPair = arbitrageablePairs.map((pair) => {
        const pairContracts = [];
        for (const exchange of pair.exchanges) {
            pairContracts.push({
                name: exchange.name,
                pairContract:
                    exchange.pairAddress != null
                        ? new web3.eth.Contract(IUniswapV2Pair.abi, exchange.pairAddress)
                        : null,
            });
        }
        return pairContracts;
    });

    // For each set of contracts for an exachange
    for (let i = 0; i < pairContractsForEachPair.length; i++) {
        // For each contract in the specified exchange
        for (let j = 0; j < pairContractsForEachPair[i].length; j++) {
            if (pairContractsForEachPair[i][j].pairContract != null) {
                pairContractsForEachPair[i][j].pairContract.events.Swap({}, async () => {
                    axios
                        .post(`${process.env.BOT_ENDPOINT}`, {
                            activeExchange: pairContractsForEachPair[i][j].name.toUpperCase(),
                            pairInfo: arbitrageablePairs[i],
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

    const pairContractsForEachPair = arbitrageablePairs.map((pair) => {
        const pairContracts = [];
        for (const exchange of pair.exchanges) {
            pairContracts.push({
                name: exchange.name,
                pairContract:
                    exchange.pairAddress != null
                        ? new web3.eth.Contract(IUniswapV2Pair.abi, exchange.pairAddress)
                        : null,
            });
        }
        return pairContracts;
    });

    console.log(`Running through ${arbitrageablePairs.length} pairs...`);

    const resultData = [];
    // For each set of contracts for an exachange
    for (let i = 0; i < pairContractsForEachPair.length; i++) {
        // For each contract in the specified exchange, we break after the first run because the bot will check all exchanges.
        for (let j = 0; j < pairContractsForEachPair[i].length; j++) {
            if (pairContractsForEachPair[i][j].pairContract != null) {
                try {
                    const { data } = await axios.post(`${process.env.BOT_ENDPOINT}`, {
                        activeExchange: pairContractsForEachPair[i][j].name.toUpperCase(),
                        pairInfo: arbitrageablePairs[i],
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
        console.log(i);
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
