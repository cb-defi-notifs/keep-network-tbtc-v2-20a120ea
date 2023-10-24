import {
  DepositReceipt,
  TBTCContracts,
  validateDepositReceipt,
} from "../../lib/contracts"
import {
  BitcoinClient,
  BitcoinHashUtils,
  BitcoinNetwork,
  BitcoinTxOutpoint,
  BitcoinUtxo,
  extractBitcoinRawTxVectors,
  toBitcoinJsLibNetwork,
} from "../../lib/bitcoin"
import { payments, Stack, script, opcodes } from "bitcoinjs-lib"
import { Hex } from "../../lib/utils"

/**
 * Component representing an instance of the tBTC v2 deposit process.
 * Depositing is a complex process spanning both the Bitcoin and the target chain.
 * This component tries to abstract away that complexity.
 */
export class Deposit {
  /**
   * Bitcoin script corresponding to this deposit.
   */
  private readonly script: DepositScript
  /**
   * Handle to tBTC contracts.
   */
  private readonly tbtcContracts: TBTCContracts
  /**
   * Bitcoin client handle.
   */
  private readonly bitcoinClient: BitcoinClient
  /**
   * Bitcoin network the deposit is relevant for. Has an impact on the
   * generated deposit address.
   */
  public readonly bitcoinNetwork: BitcoinNetwork

  private constructor(
    receipt: DepositReceipt,
    tbtcContracts: TBTCContracts,
    bitcoinClient: BitcoinClient,
    bitcoinNetwork: BitcoinNetwork
  ) {
    this.script = DepositScript.fromReceipt(receipt)
    this.tbtcContracts = tbtcContracts
    this.bitcoinClient = bitcoinClient
    this.bitcoinNetwork = bitcoinNetwork
  }

  static async fromReceipt(
    receipt: DepositReceipt,
    tbtcContracts: TBTCContracts,
    bitcoinClient: BitcoinClient
  ): Promise<Deposit> {
    const bitcoinNetwork = await bitcoinClient.getNetwork()

    return new Deposit(receipt, tbtcContracts, bitcoinClient, bitcoinNetwork)
  }

  /**
   * @returns Receipt corresponding to this deposit.
   */
  getReceipt(): DepositReceipt {
    return this.script.receipt
  }

  /**
   * @returns Bitcoin address corresponding to this deposit.
   */
  async getBitcoinAddress(): Promise<string> {
    return this.script.deriveAddress(this.bitcoinNetwork)
  }

  /**
   * Detects Bitcoin funding transactions transferring BTC to this deposit.
   * @return Specific UTXOs targeting this deposit. Empty array in case
   *         there are no UTXOs referring this deposit.
   */
  // TODO: Cover with unit tests.
  async detectFunding(): Promise<BitcoinUtxo[]> {
    const utxos = await this.bitcoinClient.findAllUnspentTransactionOutputs(
      await this.getBitcoinAddress()
    )

    if (!utxos || utxos.length === 0) {
      return []
    }

    return utxos
  }

  /**
   * Initiates minting of the TBTC token, based on the Bitcoin funding
   * transaction outpoint targeting this deposit. By default, it detects and
   * uses the outpoint of the recent Bitcoin funding transaction and throws if
   * such a transaction does not exist. This behavior can be changed by pointing
   * a funding transaction explicitly, using the fundingOutpoint parameter.
   * @param fundingOutpoint Optional parameter. Can be used to point
   *        the funding transaction's outpoint manually.
   * @returns Target chain hash of the initiate minting transaction.
   * @throws Throws an error if there are no funding transactions while using
   *         the default funding detection mode.
   * @throws Throws an error if the provided funding outpoint does not
   *         actually refer to this deposit while using the manual funding
   *         provision mode.
   * @throws Throws an error if the funding outpoint was already used to
   *         initiate minting (both modes).
   */
  // TODO: Cover auto funding outpoint detection with unit tests.
  async initiateMinting(fundingOutpoint?: BitcoinTxOutpoint): Promise<string> {
    let resolvedFundingOutpoint: BitcoinTxOutpoint

    if (typeof fundingOutpoint !== "undefined") {
      resolvedFundingOutpoint = fundingOutpoint
    } else {
      const fundingUtxos = await this.detectFunding()

      if (fundingUtxos.length == 0) {
        throw new Error("Deposit not funded yet")
      }

      // Take the most recent one.
      resolvedFundingOutpoint = fundingUtxos[0]
    }

    const { transactionHash, outputIndex } = resolvedFundingOutpoint

    const depositFundingTx = extractBitcoinRawTxVectors(
      await this.bitcoinClient.getRawTransaction(transactionHash)
    )

    const { bridge, tbtcVault } = this.tbtcContracts

    return bridge.revealDeposit(
      depositFundingTx,
      outputIndex,
      this.getReceipt(),
      tbtcVault.getChainIdentifier()
    )
  }
}

/**
 * Represents a Bitcoin script corresponding to a tBTC v2 deposit.
 * On a high-level, the script is used to derive the Bitcoin address that is
 * used to fund the deposit with BTC. On a low-level, the script is used to
 * produce a properly locked funding transaction output that can be unlocked
 * by the target wallet during the deposit sweep process.
 */
export class DepositScript {
  /**
   * Deposit receipt holding the most important information about the deposit
   * and allowing to build a unique deposit script (and address) on Bitcoin chain.
   */
  public readonly receipt: DepositReceipt
  /**
   * Flag indicating whether the generated Bitcoin deposit script (and address)
   * should be a witness P2WSH one. If false, legacy P2SH will be used instead.
   */
  public readonly witness: boolean

  private constructor(receipt: DepositReceipt, witness: boolean) {
    validateDepositReceipt(receipt)

    this.receipt = receipt
    this.witness = witness
  }

  static fromReceipt(
    receipt: DepositReceipt,
    witness: boolean = true
  ): DepositScript {
    return new DepositScript(receipt, witness)
  }

  /**
   * @returns Hashed deposit script as Buffer.
   */
  async getHash(): Promise<Buffer> {
    const script = await this.getPlainText()
    // If witness script hash should be produced, SHA256 should be used.
    // Legacy script hash needs HASH160.
    return this.witness
      ? BitcoinHashUtils.computeSha256(Hex.from(script)).toBuffer()
      : Buffer.from(BitcoinHashUtils.computeHash160(script), "hex")
  }

  /**
   * @returns Plain-text deposit script as an un-prefixed hex string.
   */
  async getPlainText(): Promise<string> {
    const chunks: Stack = []

    // All HEXes pushed to the script must be un-prefixed
    chunks.push(Buffer.from(this.receipt.depositor.identifierHex, "hex"))
    chunks.push(opcodes.OP_DROP)
    chunks.push(Buffer.from(this.receipt.blindingFactor, "hex"))
    chunks.push(opcodes.OP_DROP)
    chunks.push(opcodes.OP_DUP)
    chunks.push(opcodes.OP_HASH160)
    chunks.push(Buffer.from(this.receipt.walletPublicKeyHash, "hex"))
    chunks.push(opcodes.OP_EQUAL)
    chunks.push(opcodes.OP_IF)
    chunks.push(opcodes.OP_CHECKSIG)
    chunks.push(opcodes.OP_ELSE)
    chunks.push(opcodes.OP_DUP)
    chunks.push(opcodes.OP_HASH160)
    chunks.push(Buffer.from(this.receipt.refundPublicKeyHash, "hex"))
    chunks.push(opcodes.OP_EQUALVERIFY)
    chunks.push(Buffer.from(this.receipt.refundLocktime, "hex"))
    chunks.push(opcodes.OP_CHECKLOCKTIMEVERIFY)
    chunks.push(opcodes.OP_DROP)
    chunks.push(opcodes.OP_CHECKSIG)
    chunks.push(opcodes.OP_ENDIF)

    return script.compile(chunks).toString("hex")
  }

  /**
   * Derives a Bitcoin address for the given network for this deposit script.
   * @param bitcoinNetwork Bitcoin network the address should be derived for.
   * @returns Bitcoin address corresponding to this deposit script.
   */
  async deriveAddress(bitcoinNetwork: BitcoinNetwork): Promise<string> {
    const scriptHash = await this.getHash()

    const bitcoinJsLibNetwork = toBitcoinJsLibNetwork(bitcoinNetwork)

    if (this.witness) {
      // OP_0 <hash-length> <hash>
      const p2wshOutput = Buffer.concat([
        Buffer.from([opcodes.OP_0, 0x20]),
        scriptHash,
      ])

      return payments.p2wsh({
        output: p2wshOutput,
        network: bitcoinJsLibNetwork,
      }).address!
    } else {
      // OP_HASH160 <hash-length> <hash> OP_EQUAL
      const p2shOutput = Buffer.concat([
        Buffer.from([opcodes.OP_HASH160, 0x14]),
        scriptHash,
        Buffer.from([opcodes.OP_EQUAL]),
      ])

      return payments.p2sh({ output: p2shOutput, network: bitcoinJsLibNetwork })
        .address!
    }
  }
}
