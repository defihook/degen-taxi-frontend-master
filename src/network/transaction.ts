import { Program, web3 } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { IDL as GameIDL } from "./game";
import {
  Keypair,
  PublicKey,
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { GAME_PROGRAM_ID, VAULT_SEED } from "./types";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { RPC_URL } from "../../config";
import { errorAlert, successAlert } from "../components/ToastGroup";
import { SocketType } from "../context/SocketProvider";
export const solConnection = new web3.Connection(RPC_URL);

// Address of the deployed program.
let programId = new anchor.web3.PublicKey(GAME_PROGRAM_ID);

export const deposit = async (
  wallet: WalletContextState,
  amount: number,
  setLoading: Function,
  socket: SocketType,
  setDepositBalance: Function,
  showDemoAlert: Function
) => {
  let cloneWindow: any = window;
  if (!wallet.publicKey) return;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const userAddress = wallet.publicKey;
  const program = new anchor.Program(
    GameIDL as anchor.Idl,
    GAME_PROGRAM_ID,
    provider
  );
  try {
    setLoading(true);
    const tx = await createDepositTx(userAddress, amount, program);
    const { blockhash } = await solConnection.getLatestBlockhash("confirmed");
    tx.feePayer = userAddress;
    tx.recentBlockhash = blockhash;
    if (wallet.signTransaction) {
      const signedTx = await wallet.signTransaction(tx);
      const txId = await provider.connection.sendRawTransaction(
        signedTx.serialize(),
        {
          skipPreflight: true,
          maxRetries: 3,
          preflightCommitment: "confirmed",
        }
      );
      // await solConnection.confirmTransaction(txId, "finalized");

      socket.emit("depositAmount", txId, async (newBalance) => {
        console.log(">> new balance > ", newBalance);
        if (newBalance) {
          setDepositBalance(newBalance);
          successAlert("Transaction is confirmed!");
          setLoading(false);
        }
      });
    }
  } catch (error) {
    console.log(JSON.stringify(error));
    showDemoAlert(JSON.stringify(error));
    errorAlert(JSON.stringify(error));
    filterError(error);
    setLoading(false);
  }
};

export const withdraw = async (
  wallet: WalletContextState,
  amount: number,
  setLoading: Function,
  socket: SocketType,
  setDepositBalance: Function
) => {
  if (!wallet.publicKey) return;
  try {
    setLoading(true);
    socket.emit(
      "withdrawAmount",
      wallet.publicKey.toBase58(),
      amount,
      async (result: boolean, newBalance: number, message: string) => {
        console.log("new Balance", newBalance);
        console.log("withdraw error message: ", message);
        if (result) {
          setDepositBalance(newBalance);
          successAlert(
            message !== ""
              ? message
              : "Something went wrong! Reload website and try again."
          );
        } else {
          errorAlert(message);
        }
        setLoading(false);
      }
    );
  } catch (error) {
    console.log(error);
    filterError(error);
    setLoading(false);
  }
};

export const createInitializeTx = async (
  userAddress: PublicKey,
  program: anchor.Program
) => {
  const [solVault, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(VAULT_SEED)],
    GAME_PROGRAM_ID
  );

  let tx = new Transaction();
  console.log("==>initializing program");

  tx.add(
    program.instruction.initialize({
      accounts: {
        admin: userAddress,
        solVault,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createDepositTx = async (
  userAddress: PublicKey,
  amount: number,
  program: anchor.Program
) => {
  const [solVault, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(VAULT_SEED)],
    GAME_PROGRAM_ID
  );

  let tx = new Transaction();

  console.log("==> depositing ... ");

  tx.add(
    program.instruction.desposit(new anchor.BN(amount * LAMPORTS_PER_SOL), {
      accounts: {
        admin: userAddress,
        solVault,
        systemProgram: SystemProgram.programId,
      },
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const filterError = (error: any) => {
  if (error.message) {
    const errorCode = parseInt(
      error.message.split("custom program error: ")[1]
    );
    // "custom program error: "
    switch (errorCode) {
      case 6000:
        errorAlert("Invalid SOL Input Amount");
        break;
      case 6001:
        errorAlert("Insufficient Sol Balance in the Pool");
        break;
      case 6002:
        errorAlert("Insufficient SOL Balance in the Pool");
        break;
      case 6003:
        errorAlert("Sol Balance is Less Than Min Amount");
        break;
      case 6004:
        errorAlert("SOL Balance is Less Than Min Amount");
        break;
      case 6005:
        errorAlert("SOL Balance is More Than Max Amount");
        break;
      case 6006:
        errorAlert("SOL Balance is More Than Max Amount");
        break;
      case 4001:
        errorAlert("User Reject the Request");
        break;
      case 3007:
        errorAlert(
          "The given account is owned by a different program than expected"
        );
        break;
      default:
        break;
    }
  }
  if (error?.code === 4001) {
    errorAlert("User rejected the request.");
  }
  if (error?.code === -32603) {
    errorAlert("Something went wrong.");
  }
  if (error?.code === -32003) {
    errorAlert("Signature verification failed");
  }
};
