import fs from 'fs';
import { queryGraphData } from './src/util/util';
import cliProgress from 'cli-progress';
import * as Constants from './src/constants/constants';

const main = async () => {
    console.log('Fetching Data from BigQuery to process...');

    // Get data and prepare data structure
    const data = await queryGraphData();
    const adjacencyList = buildGraph(data);

    console.log('Starting the algorithm.\n');

    // Execute Depth First Search Algorithm.
    const startTime = new Date();
    const numPaths = getAllPossiblePaths(Constants.WMATIC_POLYGON, 4, adjacencyList, 'WMATIC_POLYGON_PATHS.jsonl');
    const endTime = new Date();

    console.log(`\nTime taken: ${(endTime - startTime) / 1000} seconds.`);
    console.log(`Number of Paths: ${numPaths}`);
};

const addNode = (adjacencyList, node) => {
    adjacencyList.set(node, []);
};

const addEdge = (adjacencyList, start, end) => {
    adjacencyList.get(start).push(end);
};

const buildGraph = (data) => {
    const adjacencyList = new Map();
    data.forEach((row) => {
        addNode(adjacencyList, JSON.stringify(row.node));
        for (const edge of row.edges) {
            addEdge(adjacencyList, JSON.stringify(row.node), edge);
        }
    });
    return adjacencyList;
};

const getNodeFromAddress = (tokenAddress, adjacencyList) => {
    return Array.from(adjacencyList.keys()).filter((key) => {
        return JSON.parse(key).address == tokenAddress;
    })[0];
};

const getAllPossiblePaths = (tokenAddress, searchDepth, adjacencyList, filename) => {
    let node = getNodeFromAddress(tokenAddress, adjacencyList);
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    const numEdges = adjacencyList.get(node).length;
    bar.start(numEdges, 0);
    let counter = 0;
    let numPaths = 0;

    const dfs = (node, path = new Set(), swaps = new Set(), exchanges = null) => {
        path.add(node);
        if (exchanges != null) swaps.add(exchanges);

        for (const edge of adjacencyList.get(node)) {
            const serializedEdge = JSON.stringify({
                symbol: edge.symbol,
                address: edge.address,
                decimals: edge.decimals,
            });
            const serializedExchanges = JSON.stringify({
                options: edge.exchanges,
                ordered: !edge.isToken0,
            });

            if (edge.address === tokenAddress) {
                numPaths++;
                fs.appendFileSync(
                    `src/output/${filename}`,
                    JSON.stringify({
                        tokenPath: [...Array.from(path).map((e) => JSON.parse(e)), JSON.parse(serializedEdge)],
                        exchangePath: [...Array.from(swaps).map((e) => JSON.parse(e)), JSON.parse(serializedExchanges)],
                        // exchangePath: [
                        //     ...Array.from(swaps).map((e) => {
                        //         return {
                        //             options: JSON.parse(e),
                        //             ordered: !edge.isToken0,
                        //         };
                        //     }),
                        //     {
                        //         options: JSON.parse(serializedExchanges),
                        //         ordered: !edge.isToken0,
                        //     },
                        // ],
                    }) + '\n'
                );
            }

            if (!path.has(serializedEdge)) {
                if (path.size < searchDepth) {
                    dfs(serializedEdge, path, swaps, serializedExchanges);
                    path.delete(serializedEdge);
                    swaps.delete(serializedExchanges);
                }
            }
            if (path.size == 1) {
                counter++;
                bar.update(counter);
            }
        }
    };

    dfs(node);
    bar.stop();
    return numPaths;
};

main();
