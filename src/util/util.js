/*********************************************************************
 * Copyright (C) 2022 Joshua Sells joshuataylorsells@gmail.com
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 *
 *********************************************************************/

import 'dotenv/config';
import { web3 } from '../setup/setup';
import axios from 'axios';
import { BigQuery } from '@google-cloud/bigquery';
import settings from '../config/settings.json';
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json';

export const queryPairs = async () => {
    const queryString = `SELECT * FROM \`${process.env.BIGQUERY_PROJECT}.${settings.bqDataset}.${settings.bqTable}\``;
    return await query(queryString);
};

export const querySinglePair = async (tokenAddress) => {
    const queryString = `SELECT * FROM \`${process.env.BIGQUERY_PROJECT}.${settings.bqDataset}.${settings.bqTable}\` WHERE token0Address = '${tokenAddress}' OR token1Address = '${tokenAddress}'`;
    return await query(queryString);
};

export const queryGraphData = async () => {
    const queryString = `SELECT * FROM \`${process.env.BIGQUERY_PROJECT}.${settings.bqDataset}.graph\``;
    return await query(queryString);
};

const query = async (queryString) => {
    const bigQuery = new BigQuery();
    const options = {
        query: queryString,
        location: 'US',
    };
    const [job] = await bigQuery.createQueryJob(options);
    const [rows] = await job.getQueryResults();
    return rows;
};

export const getPairContractsForEachPair = (arbitrageablePairs) => {
    return arbitrageablePairs.map((pair) => {
        const pairContracts = [];
        for (const exchange of pair.exchanges) {
            pairContracts.push({
                name: exchange.name,
                pairContract: exchange.pairAddress != null ? new web3.eth.Contract(IUniswapV2Pair.abi, exchange.pairAddress) : null,
            });
        }
        return pairContracts;
    });
};

export const getPairContract = (address) => {
    return new web3.eth.Contract(IUniswapV2Pair.abi, address);
};

export const sendPairs = async (arbitrageablePairs, pairContractsForEachPair) => {
    let data = [];
    let tempData = [];
    for (let i = 0; i < pairContractsForEachPair.length; i++) {
        for (let j = 0; j < pairContractsForEachPair[i].length; j++) {
            if (pairContractsForEachPair[i][j].pairContract != null) {
                tempData.push(axios.post(`${process.env.BOT_ENDPOINT}`, arbitrageablePairs[i]));
            }
            break;
        }
        if (i != 0 && i % 100 == 0) {
            data = [...data, ...(await Promise.all(tempData))];
            tempData = [];
            console.log(`Processed ${i} pairs so far...`);
        }
    }

    return data
        .map((element) => {
            return element.data;
        })
        .filter((element) => {
            return element != '';
        });
};
