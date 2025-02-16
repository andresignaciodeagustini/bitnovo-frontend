
declare global {
  type EthereumMethod = 
    | 'eth_requestAccounts'
    | 'eth_chainId'
    | 'eth_accounts'
    | 'eth_sendTransaction'
    | 'wallet_switchEthereumChain'
    | 'wallet_addEthereumChain';

  interface RequestArguments {
    method: EthereumMethod;
    params?: unknown[];
  }

  type EthereumEvents = 
    | 'accountsChanged'
    | 'chainChanged'
    | 'connect'
    | 'disconnect';

  interface EthereumProvider {
    request(args: RequestArguments): Promise<unknown>;
    on(eventName: EthereumEvents, handler: (params: unknown[]) => void): void;
    removeListener(eventName: EthereumEvents, handler: (params: unknown[]) => void): void;
    isMetaMask?: boolean;
    isConnected(): boolean;
  }

  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};