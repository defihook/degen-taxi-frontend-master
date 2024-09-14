/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { NextSeo } from "next-seo";
import Switch from "@mui/material/Switch";
import Header from "../components/Header";
import MainControl from "../components/MainControl";
import Playground from "../components/Playground";
import { ArrowDown, ArrowUp, InfinityIcon, InfoIcon } from "../components/SvgIcons";
import Tooltip from "@mui/material/Tooltip";
import { FormControlLabel, FormGroup } from "@mui/material";
import { useSocket } from "../context/SocketProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { Game, Player, User } from "../types/socketio";
import { sleep } from "../context/utils";
import GameInfo from "../components/GameInfo";
import { errorAlert } from "../components/ToastGroup";

export default function HomePage(props: {
  startLoading: Function;
  closeLoading: Function;
  pageLoading: boolean;
}) {
  const [tab, setTab] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(1);
  const [autoEscape, setAutoEscape] = useState(2);
  const [isAutoEscape, setIsAutoEscape] = useState(false);
  const [autoShow, setAutoShow] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [playLoading, setPlayLoading] = useState(false);

  const [currentPlayers, setCurrentPlayers] = useState<Player[]>([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isWinShowButtonDisable, setIsWinShowButtonDisable] = useState(false);
  const [isWinShow, setIsWinShow] = useState(false);

  // Auto Bet
  const [roundsCnt, setRoundsCnt] = useState(-1);
  const [maxStake, setMaxStake] = useState(-1);
  const [onLoss, setOnLoss] = useState(0);
  const [onWin, setOnWin] = useState(0);
  const [stopOnLoss, setStopOnLoss] = useState(-1);
  const [stopOnProfit, setStopOnProfit] = useState(-1);

  const [isRoundsCnt, setIsRoundsCnt] = useState(false);
  const [isMaxStake, setIsMaxStake] = useState(false);
  const [isOnLoss, setIsOnLoss] = useState(false);
  const [isOnWin, setIsOnWin] = useState(false);
  const [isStopOnLoss, setIsStopOnLoss] = useState(false);
  const [isStopOnProfit, setIsStopOnProfit] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); //  after play: true

  const [rewardAmount, setRewardAmount] = useState(0);

  const [isConnected, setIsConnected] = useState(false);
  const [depositBalance, setDepositBalance] = useState(0);

  const [curGameId, setCurGameId] = useState<number | undefined>();
  const [score, setScore] = useState(1);

  const [escapedUsers, setEscapedUsers] = useState<Player[]>([]);

  const [forceRender, setForceRender] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [readyTo, setReadyTo] = useState(false);

  const { socket, gameData } = useSocket();
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const wallet = useWallet();

  useEffect(() => {
    if (rewardAmount !== 0) {
      setIsWinShow(true);
      setTimeout(() => {
        setIsWinShow(false);
      }, 3000);
    }
  }, [rewardAmount])

  useEffect(() => {
    if (socket) {
      socket.on("startGame", async (players: Player[], gameId: number) => {
        // console.log("game started at ... ", new Date().getTime());
        if (!gameId) return;
        // console.log('=====>>', gameId);
        setCurGameId(gameId);
        setCurrentPlayers(players);
        // setTimeout(() => {
        // }, 5000);
        await sleep(4980);
        // console.log("car leaved at ...", new Date().getTime());
        setIsGameStarted(true);
      });
      socket.on("connect", () => {
        console.log("connected to backend ==========> ", socket.id);
        socket.emit(
          "getCurrentGameStatus",
          (
            players: Player[],
            currentTaxiPosition: number,
            gameStarted: boolean
          ) => {
            console.log("start players: ", players)
            console.log("start currentTaxiPosition: ", currentTaxiPosition)
            setIsGameStarted(gameStarted)
          }
        );
      });
      socket.on("endGame", (end) => {
        setIsGameStarted(false);
        // console.log("game ended.. at ", end);
        // console.log("game end at ", new Date().getTime())
        setIsPlaying(false);
        setIsWinShowButtonDisable(true);
        setTimeout(() => {
          setIsWinShowButtonDisable(false);
          setCurrentPlayers([]);
        }, 3000);
      });
      socket.on("notifyJoinedPlayers", (players: Player[]) => {
        console.log(players, "== players");
        setCurrentPlayers(players);
        setEscapedUsers(players);
      });

      socket.on("sendBangHistory", (gameHistory: any[]) => {
        let history = gameHistory.reverse();
        if (history.length > 1) {
          setGameHistory(history.slice(0, history.length - 1))
        } else {
          setGameHistory([])
        }
      })

      socket.on("notifyPlayerWithdrawn", (players: Player[]) => {
        setCurrentPlayers(players);
        // console.log("notifyPlayerWithdrawn ", players);
      });

      socket.on("currentPositionUpdated", (currentPosition: number) => {
        setScore(currentPosition);
      })

      if (wallet.publicKey) {
        socket.emit("getUserByWallet", wallet.publicKey.toBase58(), async (res) => {
          if (res) {
            setDepositBalance(res.balance);
          }
        });
      }
    }
    setForceRender(!forceRender);
  }, [socket, wallet.publicKey, socket?.connected]);

  useEffect(() => {
    if (wallet.publicKey !== null) {
      handleRegister();
      console.log(wallet.publicKey.toBase58());
    }
  }, [wallet.connected, wallet.publicKey]);


  useEffect(() => {
    console.log(gameData, "-- game data")
    if (gameData) {
      setCurrentPlayers(gameData.players);
    }
  }, [gameData])

  useEffect(() => {
    if (isGameStarted) {
      setReadyTo(true);
    }
  }, [isGameStarted]);

  const handlePlay = async () => {
    if (stakeAmount < 0) {
      errorAlert("Invalid amount!")
      return;
    }
    if (stakeAmount > depositBalance) {
      errorAlert("Invalid amount!")
      return;
    }
    try {
      if (socket && wallet.publicKey && curGameId) {
        socket.emit("joinGame", curGameId, wallet.publicKey.toBase58(), stakeAmount, async (result) => {
          console.log("joinGame result >> ", result)
          if (result) {
            setDepositBalance(result.balance)
          }
        });
        setIsPlaying(true);
        console.log("GameId:", curGameId, "play!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleEscape = () => {
    try {
      if (socket && wallet.publicKey) {
        setIsPlaying(false);
        const pastBalance = depositBalance;
        setDepositBalance(pastBalance + stakeAmount * score);
        setRewardAmount(stakeAmount * score);
        socket.emit("withdrawInGame", wallet.publicKey.toBase58(), score, (res) => {
          console.log("I withdrew ", res);
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleRegister = () => {
    try {
      if (socket && wallet.publicKey) {
        // connectWallet
        socket.emit("connectWallet", wallet.publicKey.toBase58(), (res) => {
          console.log(res);
          if (res) {
            setDepositBalance(res.balance);
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleStake = (e: any) => {
    setStakeAmount(e.target.value);
  };
  const handleAutoEscape = (e: any) => {
    setAutoEscape(e.target.value);
  };
  const handleRoundsCnt = (e: any) => {
    setRoundsCnt(e.target.value);
  };
  const handleMaxStake = (e: any) => {
    setMaxStake(e.target.value);
  };
  const handleOnLoss = (e: any) => {
    setOnLoss(e.target.value);
  };
  const handleOnWin = (e: any) => {
    setOnWin(e.target.value);
  };
  const handleStopOnLoss = (e: any) => {
    setStopOnLoss(e.target.value);
  };
  const handleStopOnProfit = (e: any) => {
    setStopOnProfit(e.target.value);
  };

  return (
    <>

      <NextSeo
        title="Degen Taxi | Solana Bust Game"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et massa massa. Ut mollis posuere risus, convallis laoreet felis pulvinar condimentum. Nam ac lectus ex."
        openGraph={{
          url: "https://degentaxi.com",
          title: 'Degen Taxi | Solana Bust Game',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et massa massa. Ut mollis posuere risus, convallis laoreet felis pulvinar condimentum. Nam ac lectus ex.',
          images: [
            {
              url: "https://www.degentaxi.com/seo/og-cover.jpg",
              width: 700,
              height: 410,
              alt: 'Degen Taxi',
              type: 'image/jpg',
            }
          ],
          site_name: 'Degen Taxi',
        }}
      />
      <Header
        walletAddress={wallet.publicKey?.toBase58()}
        isConnected={isConnected}
        depositBalance={depositBalance}
        setDepositBalance={setDepositBalance}
        readyTo={readyTo}
        socket={socket}
      />
      <main>
        <div className="container">
          <div className="main-content">
            <div className="player-board">
              <div className="board-header">{currentPlayers.length} Bets</div>
              <div className="content">
                {currentPlayers.map((item, key) => (
                  <div className="bet-item" key={key}>
                    <div className="username">{`${item.wallet.slice(
                      0,
                      3
                    )}...${item.wallet.slice(-3)}`}</div>
                    <div className="payload">{item.bet_amount.toLocaleString()}</div>
                    <div className="bet-amount">
                      {item.withdraw_amount !== 0
                        ? (
                          (item.withdraw_amount)
                        ).toLocaleString() + " SOL"
                        : "--"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Playground
              started={isGameStarted}
              isPlaying={isPlaying}
              score={score}
              setScore={setScore}
              rewardAmount={rewardAmount}
              readyTo={readyTo}
              isWinShow={isWinShow}
              gameHistory={gameHistory}
            />
          </div>
          <div className="control-box">
            <div className="action-tab">
              <div className="state-group">
                <button
                  className={`tab ${!tab ? "active" : ""}`}
                  onClick={() => setTab(false)}
                >
                  Standard
                </button>
                <button
                  className={`tab ${tab ? "active" : ""}`}
                  disabled
                // onClick={() => setTab(true)}
                >
                  Advanced
                  <span className="coming-soon">Coming soon</span>
                </button>
              </div>
              <button className="btn-info" onClick={() => setShowInfo(true)}>
                <InfoIcon />
              </button>
            </div>
            {!tab && (
              <MainControl
                setStakeAmount={setStakeAmount}
                stakeAmount={stakeAmount}
                handleStake={handleStake}
                isGameStarted={isGameStarted}
                isPlaying={isPlaying}
                handlePlay={handlePlay}
                handleEscape={handleEscape}
                depositBalance={depositBalance}
                readyTo={readyTo}
                isWinShowButtonDisable={isWinShowButtonDisable}
              />
            )}
            {tab && (
              <div className="">
                <div className="auto-switch">
                  <div className="auto-control">
                    <div className="show-hide">
                      <button
                        onClick={() => setAutoShow(!autoShow)}
                        disabled={!isAuto}
                      >
                        {autoShow ? (
                          <>
                            <ArrowUp /> <span>HIDE</span>
                          </>
                        ) : (
                          <>
                            <ArrowDown /> <span>SHOW</span>
                          </>
                        )}
                      </button>
                    </div>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isAuto}
                            sx={{ color: "#ffff00" }}
                            onClick={() => setIsAuto(!isAuto)}
                          />
                        }
                        label="Auto"
                        labelPlacement="start"
                        sx={{ color: "#fff" }}
                      />
                    </FormGroup>
                  </div>
                  {autoShow && (
                    <div className="auto-body">
                      <div
                        className="auto-item"
                        onClick={() => setIsRoundsCnt(true)}
                      >
                        <p>No.Rounds</p>
                        {isRoundsCnt && (
                          <div className="infinity">
                            <InfinityIcon />
                          </div>
                        )}
                        <div className="item-input">
                          <input value={roundsCnt} onChange={handleRoundsCnt} />
                          <span>%</span>
                        </div>
                      </div>
                      <div
                        className="auto-item"
                        onClick={() => setIsMaxStake(true)}
                      >
                        <p>Max stake (SOL)</p>
                        {isMaxStake && (
                          <div className="infinity">
                            <InfinityIcon />
                          </div>
                        )}
                        <div className="item-input">
                          <input value={maxStake} onChange={handleMaxStake} />
                          <span>◎</span>
                        </div>
                      </div>
                      <div
                        className="auto-item"
                        onClick={() => setIsStopOnLoss(true)}
                      >
                        <p>Stop on loass</p>
                        {isStopOnLoss && (
                          <div className="infinity">
                            <InfinityIcon />
                          </div>
                        )}
                        <div className="item-input">
                          <input
                            value={stopOnLoss}
                            onChange={handleStopOnLoss}
                          />
                          <span>◎</span>
                        </div>
                      </div>
                      <div
                        className="auto-item"
                        onClick={() => setIsStopOnProfit(true)}
                      >
                        <p>Stop on profit (SOL)</p>
                        {isStopOnProfit && (
                          <div className="infinity">
                            <InfinityIcon />
                          </div>
                        )}
                        <div className="item-input">
                          <input
                            value={stopOnProfit}
                            onChange={handleStopOnProfit}
                          />
                          <span>◎</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="advanced-box">
                  <div className="auto-escape">
                    <div className="escape-input">
                      <h5>Auto escape</h5>
                      <div className="input-box">
                        <span>x</span>
                        <input
                          value={autoEscape}
                          onChange={handleAutoEscape}
                          type="number"
                          min={1}
                          disabled={!isAutoEscape}
                        />
                      </div>
                    </div>
                    <div className="escape-switch">
                      <button
                        className={`${isAutoEscape ? "active" : ""}`}
                        onClick={() => setIsAutoEscape(true)}
                      >
                        on
                      </button>
                      <button
                        className={`${!isAutoEscape ? "active" : ""}`}
                        onClick={() => setIsAutoEscape(false)}
                      >
                        off
                      </button>
                    </div>
                  </div>
                  <div className="advanced-control">
                    <MainControl
                      setStakeAmount={setStakeAmount}
                      stakeAmount={stakeAmount}
                      isPlaying={isPlaying}
                      isGameStarted={isGameStarted}
                      handleStake={handleStake}
                      handlePlay={handlePlay}
                      handleEscape={handleEscape}
                      depositBalance={depositBalance}
                      readyTo={readyTo}
                      isWinShowButtonDisable={isWinShowButtonDisable}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <GameInfo
        open={showInfo}
        setOpen={setShowInfo}
      />
    </>
  );
}
