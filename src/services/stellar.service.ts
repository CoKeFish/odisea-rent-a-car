import {Asset, BASE_FEE, Horizon, Keypair, Operation, Transaction, TransactionBuilder, xdr} from "@stellar/stellar-sdk";
import {
    HORIZON_NETWORK_PASSPHRASE,
    HORIZON_URL,
    STELLAR_FRIENDBOT_URL,
    STELLAR_NETWORK,
} from "../utils/contants.ts";
import {IKeypair} from "../interfaces/keypair.ts";
import {AccountBalance} from "../interfaces/account.ts";
import {IAccountBalanceResponse} from "../interfaces/balance.ts";

export class StellarService {
    private server: Horizon.Server;
    private network: string;
    private horizonUrl: string;
    private friendBotUrl: string;
    private networkPassphrase: string;

    constructor() {
        this.network = STELLAR_NETWORK as string;
        this.horizonUrl = HORIZON_URL as string;
        this.friendBotUrl = STELLAR_FRIENDBOT_URL as string;
        this.networkPassphrase = HORIZON_NETWORK_PASSPHRASE as string;

        this.server = new Horizon.Server(this.horizonUrl, {
            allowHttp: true,
        });
    }

    private async getAccount(address: string): Promise<Horizon.AccountResponse> {
        try {
            return await this.server.loadAccount(address);
        } catch (error) {
            console.log(error);
            throw new Error("Account not found");
        }
    }

    async getAccountBalance(publicKey: string): Promise<AccountBalance[]> {
        const account = await this.getAccount(publicKey);

        return account.balances.map((b) => ({
            assetCode:
                b.asset_type === "native"
                    ? "XLM"
                    : (b as IAccountBalanceResponse).asset_code,

            amount: b.balance,
        }));
    }

    createAccount(): IKeypair {
        const pair = Keypair.random();
        return {
            publicKey: pair.publicKey(),
            secretKey: pair.secret(),
        };
    }

    async fundAccount(publicKey: string): Promise<boolean> {
        try {
            console.log(this.network);
            // Permitir testnet o entorno local
            if (this.network !== "TESTNET" && this.network !== "LOCAL") {
                throw new Error(
                    "Friendbot is only available on testnet or local network",
                );
            }

            const response = await fetch(`${this.friendBotUrl}?addr=${publicKey}`);

            if (!response.ok) {
                return false;
            }

            return true;
        } catch (error: unknown) {
            console.log(error);
            throw new Error(
                `Error when funding account with Friendbot: ${error as string}`,
            );
        }
    }


    private async loadAccount(address: string): Promise<Horizon.AccountResponse> {
        try {
            return await this.server.loadAccount(address);
        } catch (error) {
            console.error(error);
            throw new Error("Account not found");
        }
    }


    private transactioBuilder(sourceAccount: Horizon.AccountResponse) {
        return new TransactionBuilder(sourceAccount, {
            networkPassphrase: this.networkPassphrase,
            fee: BASE_FEE,
        });
    }

    private createPaymentOperation(
        receiverPubKey: string,
        asset: Asset,
        amount: string
    ): xdr.Operation<Operation> {
        return Operation.payment({
            amount: amount,
            asset: asset,
            destination: receiverPubKey,
        });
    }


    async createAsset(
        issuerSecret: string,
        distributorSecret: string,
        assetCode: string,
        amount: string
    ) {
        const issuerKeys = Keypair.fromSecret(issuerSecret);
        const distributorKeys = Keypair.fromSecret(distributorSecret);
        const newAsset = new Asset(assetCode, issuerKeys.publicKey());
        const assetLimit = Number(amount) * 100;

        try {
            const distributorAccount = await this.loadAccount(
                distributorKeys.publicKey()
            );

            const trustTransaction = new TransactionBuilder(distributorAccount, {
                fee: BASE_FEE,
                networkPassphrase: this.networkPassphrase,
            })
                .addOperation(Operation.changeTrust({
                    asset: newAsset,
                    source: distributorKeys.publicKey(),
                    limit: assetLimit.toString(),
                }))
                .setTimeout(30)
                .build();

            trustTransaction.sign(distributorKeys);
            await this.server.submitTransaction(trustTransaction);

            const issuerAccount = await this.loadAccount(issuerKeys.publicKey());

            const issueTransaction = new TransactionBuilder(issuerAccount, {
                fee: BASE_FEE,
                networkPassphrase: this.networkPassphrase,
            })
                .addOperation(
                    Operation.payment({
                        destination: distributorKeys.publicKey(),
                        asset: newAsset,
                        amount,
                    })
                )
                .setTimeout(30)
                .build();

            issueTransaction.sign(issuerKeys);
            const response = await this.server.submitTransaction(issueTransaction);

            return response;
        } catch (error) {
            console.error("Error creating asset:", error);
            throw error;
        }
    }


    async payment(
        senderPubKey: string,
        senderSecret: string,
        receiverPubKey: string,
        amount: string
    ): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
        const sourceAccount = await this.loadAccount(senderPubKey);
        const sourceKeypair = Keypair.fromSecret(senderSecret);

        const transactionBuilder = this.transactioBuilder(sourceAccount);
        const paymentOperation = this.createPaymentOperation(
            receiverPubKey,
            Asset.native(),
            amount
        );
        const transaction = transactionBuilder
            .addOperation(paymentOperation)
            .setTimeout(180)
            .build();

        transaction.sign(sourceKeypair);
        return await this.submitTransaction(transaction);


    }

    private async submitTransaction(transaction: Transaction): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
        try {
            const result = await this.server.submitTransaction(transaction);

            return result;
        } catch (error) {
            console.error(error);
            if (error.response?.data?.extras?.result_codes) {
                console.error(
                    "❌ Error en la transacción:",
                    error.response.data.extras.result_codes
                );
            } else {
                console.error("❌ Error general:", error);
            }
        }
    }


}

export const stellarService = new StellarService();
