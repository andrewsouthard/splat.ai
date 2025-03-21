import { StateCreator } from 'zustand';

interface BroadcastMiddlewareConfig {
    channelName: string;
    // Optional function to transform state before sending
    // Useful for filtering out non-serializable data
    serialize?: (state: any) => any;
    // Optional function to transform received data before applying to the store
    deserialize?: (data: any) => any;
}

export function createBroadcastMiddleware<State extends object>(config: BroadcastMiddlewareConfig) {
    const channel = new BroadcastChannel(config.channelName);
    const middlewareId = Math.random().toString(36).substring(2);
    const serialize = config.serialize || ((state) => state);
    const deserialize = config.deserialize || ((data) => data);

    return (store: StateCreator<State, [], []>): StateCreator<State, [], []> =>
        (set, get, storeApi) => {
            // Set up broadcast channel listener
            channel.onmessage = (event) => {
                const { id, state } = event.data;
                if (id !== middlewareId) {
                    set(deserialize(state));
                }
            };

            // Wrap the set function to broadcast changes
            const broadcastSet: typeof set = (...args) => {
                const newState = typeof args[0] === 'function'
                    ? args[0](get())
                    : args[0];

                channel.postMessage({
                    id: middlewareId,
                    state: serialize(newState)
                });

                return set(newState);
            };

            // Initialize store with wrapped set function
            const initializedStore = store(broadcastSet, get, storeApi);

            return initializedStore;
        };
}
