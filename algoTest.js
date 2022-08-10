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
    const { paths, swaps } = getAllPossiblePaths(Constants.WETH_POLYGON, 4, adjacencyList);
    const endTime = new Date();

    console.log(`\nTime taken: ${(endTime - startTime) / 1000} seconds.`);
    console.log(`Number of Paths: ${paths.length}`);
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

const getAllPossiblePaths = (tokenAddress, searchDepth, adjacencyList) => {
    let paths = [];
    let swaps = [];

    let node = getNodeFromAddress(tokenAddress, adjacencyList);

    // const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    // const numEdges = adjacencyList.get(node).length;
    // bar.start(numEdges, 0);
    // let counter = 0;

    const dfsIterative = (root) => {
        let path = new Set();
        let swap = new Set();
        let stack = [];
        path.add(root);
        // if (exchanges != null) swap.add(exchanges);

        // Push all children of root into the stack
        for (const child of adjacencyList.get(root)) {
            stack.push(child);
        }

        while (stack.length != 0) {
            let node = stack.pop();
            const serializedNode = JSON.stringify({
                symbol: node.symbol,
                address: node.address,
                decimals: node.decimals,
            });
            console.log(serializedNode);
            const serializedExchanges = JSON.stringify(node.exchanges);

            path.add(serializedNode);
            swap.add(serializedExchanges);

            for (const child of adjacencyList.get(serializedNode)) {
                const serializedChild = JSON.stringify({
                    symbol: child.symbol,
                    address: child.address,
                    decimals: child.decimals,
                });
                const serializedChildExchanges = JSON.stringify(child.exchanges);

                if (child.address === tokenAddress) {
                    paths.push([...Array.from(path), serializedChild]);
                    swaps.push([...Array.from(swap), serializedChildExchanges]);
                }

                if (!path.has(serializedChild)) {
                    if (path.size < searchDepth) {
                        stack.push(child);
                    }
                }
            }
        }
    };

    dfsIterative(node);
    console.log(paths);
    // bar.stop();
    return { paths, swaps };
};

main();
