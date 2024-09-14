/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Car from "./CarAnimate/Car";

export default function Playground(props: {
  started: boolean;
  isPlaying: boolean;
  rewardAmount: number,
  readyTo: boolean,
  score: number,
  setScore: Function,
  isWinShow: boolean,
  gameHistory: any[];
}) {
  const { started, isPlaying, score, rewardAmount, readyTo, setScore, isWinShow, gameHistory } = props;
  const [reverseCount, setReverseCount] = useState(5);
  const [isCrashed, setIsCrashed] = useState(false);
  const [crashedAmount, setCrashedAmount] = useState(1);

  let rcs = 8;
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     cs = cs + 0.01;
  //     if (!started) {
  //       cs = 1;
  //     }
  //     setScore(cs);
  //   }, 10);
  //   return () => clearInterval(interval);
  // }, [started]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (rcs > 0.01) {
        rcs = rcs - 0.01;
      }
      if (started) {
        rcs = 8;
      }
      setReverseCount(rcs);
    }, 10);
    return () => clearInterval(interval);
  }, [started]);

  useEffect(() => {
    if (!started) {
      console.log("bang at =>", score)
      setCrashedAmount(score);
      setIsCrashed(true);
      setScore(1.00)
      setTimeout(() => {
        setIsCrashed(false);
      }, 3000);
    }
  }, [started])

  return (
    <div className="play-ground">
      <div className="game-history">
        {gameHistory.length !== 0 && gameHistory.map((item, key) => (
          <div key={key} className={`history-item ${item.bangAt > 2 ? "green" : "red"}`}>
            x {item.bangAt.toFixed(2)}
          </div>
        ))}
      </div>
      {
        readyTo ?
          <>
            <div className="current-score">
              {!isCrashed ?
                <>
                  <p>{started ? "Current Score" : "Starts In"}</p>
                  {started ? (
                    <h3>x{score.toFixed(2)}</h3>
                  ) : (
                    <h3>{reverseCount.toFixed(2)}s</h3>
                  )}
                </>
                :
                <h2>Crashed at <br /><span> x{crashedAmount.toFixed(2)}</span></h2>
              }
            </div>
            {isWinShow &&
              <div className="reward-box">
                <h2>You earn <span>{rewardAmount.toFixed(3)} SOL</span>
                </h2>
                <img src="/img/light-effect.png" className="img-reward" alt="" />
              </div>
            }
            {started && <Car started={started} />}
            {!started && isCrashed && (
              <div className={`car`}>
                <img src="/img/boom.png" className="img-boom fever-anim" alt="" />
              </div>
            )}
          </>
          :
          <h4 className="connecting">Connecting...</h4>
      }
      <div
        className={`street ${started ? "street-animate" : ""}`}
        style={{ backgroundImage: `url(/img/street.png)` }}
      >
        {/* <img src="/img/street.png" className="street-pattern" alt="" /> */}
      </div>
      <div
        className={`dark-sky ${started ? "dark-sky-animate" : ""}`}
        style={{ backgroundImage: `url(/img/dark-sky.png)` }}
      ></div>
    </div >
  );
}
