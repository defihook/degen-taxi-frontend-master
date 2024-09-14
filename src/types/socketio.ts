export interface User {
  id: number;
  address: string;
  name: string;
  pfp: string;
  created_at: Date;
  balance: number;
  status: boolean;
}
export interface Player {
  id: number;
  bet_amount: number;
  game_id: number;
  wallet: string;
  withdraw_amount: number;
  balance_change: number;
}
export interface Game {
  id: number;
  random: number;
  start_at: Date;
  end_at: Date;
  status: boolean;
}

export interface ServerToClientEvents {
  startGame: (players: Player[], gameId: number) => void;
  endGame: (random: number) => void;
  notifyJoinedPlayers: (players: Player[]) => void;
  // checkAccount: (user: User) => void
  sendBangHistory: (gameHistory: any[]) => void;
  notifyPlayerWithdrawn: (players: Player[]) => void;
  currentPositionUpdated: (currentPosition: number) => void;
}

export interface ClientToServerEvents {
  getCurrentGameStatus: (
    callback: (
      players: Player[],
      currentTaxiPosition: number,
      gameStarted: boolean
    ) => void
  ) => Promise<void>;
  joinGame: (
    gameId: number,
    wallet: string,
    betAmount: number,
    callback: (result: User | null) => void
  ) => Promise<void>;
  withdrawAmount: (
    wallet: string,
    withdrawAmount: number,
    callback: (result: boolean, newBalance: number, message: string) => void
  ) => Promise<void>;
  depositAmount: (
    txId: string,
    callback: (newBalance: number | null) => void
  ) => Promise<void>;
  connectWallet: (
    wallet: string,
    callback: (user: User | null) => void
  ) => void;
  getUserByWallet: (
    wallet: string,
    callback: (user: User | null) => void
  ) => void;
  withdrawInGame: (
    wallet: string,
    position: number,
    callback: (withdrawPoint: number) => void
  ) => Promise<void>;
  // getPreviousGameWinners: (
  //   gameId: string,
  //   callback: (winners: Winner[] | null, communityCards: Card[] | null) => void,
  // ) => Promise<void>
}

export interface InterServerEvents {
  // empty
}

export interface SocketData {
  // empty
}
