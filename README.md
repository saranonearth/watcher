# socket-watcher
Monitors Sealed and Proposed events of SocketDL and triggers a trip if inconsistency is identified⚡
<img width="963" alt="Screenshot 2023-10-30 at 1 15 43 AM" src="https://github.com/saranonearth/watcher/assets/44068102/db9db4ad-d67b-41d4-bdfb-92a2c57f01d7">

### Prerequisites
* Docker (https://www.docker.com/get-started/)
  
Watcher has dependency on MongoDB and Redis, you  
  ```sh
  docker-compose up --build
  ```

## ENV Variables
Use the .env.example as reference
```
#APP
APP_NAME=watcher
ENV=development  # development/production
HOST=127.0.0.1
PORT=9001
MONGO_URL=mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs

#RPCs
ARBITRUM_HTTP_RPC=
ARBITRUM_WSS_RPC=
OPTIMISM_HTTP_RPC=
OPTIMISM_WSS_RPC=

#PRIVATE KEYS
ARBITRUM_WALLET=
OPTIMISM_WALLET=
```
### How to run
```
yarn install
yarn run dev
```
### How to test
```
yarn run tests
```

### How to add more chains
1. Add the Socket Addresses in `./config/config.ts`
2. Populate NETWORK_CONFIG and CHAINID_DATA in ./constants/network.ts
A new chain should have a NetworkConfig entry
```ts
export const OPTIMISM = {
    chainId: 10,
    network: NETWORK.OPTIMISM,
    httpRpc: ENV.RPC.OptimismHttpRPC,
    wssRpc: ENV.RPC.OptimismWssRPC,
} as NetworkConfig;
```
3. Start the LogListners by adding a entry in `LogListenerLoader.ts`


### Architecture 
<img width="963" alt="Screenshot 2023-10-30 at 2 20 46 AM" src="https://github.com/saranonearth/watcher/assets/44068102/61933a14-3556-4fec-8dd3-aca4943c8284">

### Key Features
- Crazy scalable thanks to Job Queue architecture
- Highly resilient with exponential backoffs
- Clear Observability with Audit trails
- Idempoent 

### Components
1. **LogListener** - LogListenrs are entry point of data for watcher, these essentially websocket connection to subscribe to logs of respective chains.
2. **LogProcessor** - watcher monitors for Sealed and PacketProposed logs, once any of these are found, they are processed by the LogProcessor.
3. **JobQueue & Worker** - Every job to call tripProposal is pushed to a worker, where workers concurrenty process them with retires and exponential backoffs

### Some design considerations taken
- Audit trails for building a good reconcilation and self healing system, so watcher is powered by a event store that maintains trails of every event with respect to a log
- JobQueues, to max utilize concurrency and process massive loads of job



