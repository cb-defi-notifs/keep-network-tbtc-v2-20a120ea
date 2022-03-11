import { BytesLike } from "ethers"

/**
 * Represents a set of data used for given fraud scenario.
 */
export interface FraudTestData {
  signature: {
    v: number
    r: BytesLike
    s: BytesLike
  }
  preimage: BytesLike
  sighash: BytesLike
  witness: boolean
  deposits: {
    fundingTxHash: BytesLike
    fundingOutputIndex: number
  }[]
  spentMainUtxos: {
    fundingTxHash: BytesLike
    fundingOutputIndex: number
  }[]
}

// Uncompressed and unprefixed version of the public key:
// 03989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9
export const fraudWalletPublicKey =
  "0x989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9" +
  "d218b65e7d91c752f7b22eaceb771a9af3a6f3d3f010a5d471a1aeef7d7713af"

// Hash 160 of the public key:
// 03989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9
export const fraudWalletPublicKeyHash =
  "0x8db50eb52063ea9d98b3eac91489a90f738986f6"

// Test data comes from the (only) input of transaction:
// https://live.blockcypher.com/btc-testnet/tx/25725b6110fdd095282e61f714e72ec14ebdba7d2c29e93a89a9fb11504a5f10/
export const nonWitnessSignSingleInputTx: FraudTestData = {
  signature: {
    v: 28,
    r: "0x918157d51c1c74858b577d039f0a936aea6236c2510cf31828d1025e4dfd803d",
    s: "0x27905b4bd56fa9a2ee15c2bc4478bccb83dd8340db272ec5fad5b3b4faf32fcd",
  },
  preimage:
    "0x0100000001fb26e52365437fc4fce01864d1303e0e1ed2824ef83345ea6e8517" +
    "4060778acb000000005c14934b98637ca318a4d6e7ca6ffd1690b8e77df6377508" +
    "f9f0c90d000395237576a9148db50eb52063ea9d98b3eac91489a90f738986f687" +
    "63ac6776a914e257eccafbc07c381642ce6e7e55120fb077fbed8804e0250162b1" +
    "75ac68ffffffff01b8240000000000001600148db50eb52063ea9d98b3eac91489" +
    "a90f738986f60000000001000000",
  sighash: "0x5d09cd07392c7163335b67eacc999491a3794c15b88e2b59094be5c5b157064b",
  witness: false,
  deposits: [
    {
      fundingTxHash:
        "0xfb26e52365437fc4fce01864d1303e0e1ed2824ef83345ea6e85174060778acb",
      fundingOutputIndex: 0,
    },
  ],
  spentMainUtxos: [],
}

// Test data comes from the input at index 5 of transaction:
// https://live.blockcypher.com/btc-testnet/tx/798f9a00cb9a8fddad777cf2923d9370fb2df9b76fcf1cde827618cd7a60d34e/
export const nonWitnessSignMultipleInputsTx: FraudTestData = {
  signature: {
    v: 27,
    r: "0x70e406238e54819e9d3babb6d980f544e5545dbad00110ae8ef351887132a3ce",
    s: "0x6404df96341218d89cfbe5b8dab14edf58a7d336583373f4d1a06f64cad105f0",
  },
  preimage:
    "0x0100000006bdaf864f75dbe4490bc3acf451c291906cbb9c32c5a6b50cdc97b23f427" +
    "7890a0000000000ffffffff3c5a87fe0a5d77616623278cd25fa7b5f2602e43d4a1c17e" +
    "6a2b2fd964670def0000000000ffffffff3fd813441999ae54f62f6e5ace9b1ee2941ff" +
    "53432a3d8b4317f22c6072978c00000000000ffffffff0d43fe1d6e5e0a44838fbedb2e" +
    "b41a8f5c5f313470c3dfd7dad92bc50cc1f6170000000000ffffffffa5f90f326daa312" +
    "858eba12b225704ec668762cabffd83b2a0eeb0a0f12c77d10000000000ffffffff7a39" +
    "cc92883a8ec888c6d86a741b1bf8a51769230832e52d1395346bcab037e9000000005c1" +
    "4934b98637ca318a4d6e7ca6ffd1690b8e77df6377508f9f0c90d000395237576a9148d" +
    "b50eb52063ea9d98b3eac91489a90f738986f68763ac6776a914e257eccafbc07c38164" +
    "2ce6e7e55120fb077fbed8804e0250162b175ac68ffffffff011cd40000000000001600" +
    "148db50eb52063ea9d98b3eac91489a90f738986f60000000001000000",
  sighash: "0x3a3c771a0d6e2484e1f00dca91e724b9f60a986b0c1ac4cafb9ae69a7401a573",
  witness: false,
  deposits: [
    {
      fundingTxHash:
        "0xbdaf864f75dbe4490bc3acf451c291906cbb9c32c5a6b50cdc97b23f4277890a",
      fundingOutputIndex: 0,
    },
    {
      fundingTxHash:
        "0x3c5a87fe0a5d77616623278cd25fa7b5f2602e43d4a1c17e6a2b2fd964670def",
      fundingOutputIndex: 0,
    },
    {
      fundingTxHash:
        "0x3fd813441999ae54f62f6e5ace9b1ee2941ff53432a3d8b4317f22c6072978c0",
      fundingOutputIndex: 0,
    },
    {
      fundingTxHash:
        "0x0d43fe1d6e5e0a44838fbedb2eb41a8f5c5f313470c3dfd7dad92bc50cc1f617",
      fundingOutputIndex: 0,
    },
    {
      fundingTxHash:
        "0x7a39cc92883a8ec888c6d86a741b1bf8a51769230832e52d1395346bcab037e9",
      fundingOutputIndex: 0,
    },
  ],
  spentMainUtxos: [
    {
      fundingTxHash:
        "0xa5f90f326daa312858eba12b225704ec668762cabffd83b2a0eeb0a0f12c77d1",
      fundingOutputIndex: 0,
    },
  ],
}

// Test data comes from the (only) input of transaction:
// https://live.blockcypher.com/btc-testnet/tx/eccc55030fb7c3c7eda6d12d69014aa55bb6a942997e388c4aadb0930facb4cb/
export const witnessSignSingleInputTx: FraudTestData = {
  signature: {
    v: 27,
    r: "0xbe367625b075362d13a46a71e91e99b633ab476d6e76870c6daaa078991e41b5",
    s: "0x041e65394627554cf832d073c47760e96ca5f3a554c01cf7b1d96d79c200202a",
  },
  preimage:
    "0x01000000bb7f55b88160c46023b4f2f5356df30e6032f0cc4ebb896462a11be4a0" +
    "1b9a523bb13029ce7b1f559ef5e747fcac439f1455a2ec7c5f09b72290795e7066" +
    "5044cbb4ac0f93b0ad4a8c387e9942a9b65ba54a01692dd1a6edc7c3b70f0355cc" +
    "ec000000005c14934b98637ca318a4d6e7ca6ffd1690b8e77df6377508f9f0c90d" +
    "000395237576a9148db50eb52063ea9d98b3eac91489a90f738986f68763ac6776" +
    "a914e257eccafbc07c381642ce6e7e55120fb077fbed8804e0250162b175ac68f0" +
    "55000000000000fffffffff5ef547c0c70b4a4747f180b1cc244b99a3d2c12e71d" +
    "73d68ca9da53591139f10000000001000000",
  sighash: "0xb8994753efd78cc66075991d3a21beef96d4e8a5e9ff06bc692401203df02610",
  witness: true,
  deposits: [],
  spentMainUtxos: [],
}

// Test data comes from the input at index 4 of transaction:
// https://live.blockcypher.com/btc-testnet/tx/798f9a00cb9a8fddad777cf2923d9370fb2df9b76fcf1cde827618cd7a60d34e/
export const witnessSignMultipleInputTx: FraudTestData = {
  signature: {
    v: 28,
    r: "0x4e500227e3394f7878075b5a5fdea97a0710ec87351a62a5cc7b8853aba794b3",
    s: "0x3df12e35c70955af616db8bac4d80d3fa913a58fd5b771cd82c52a395ae81ce5",
  },
  preimage:
    "0x010000008906f824476e64e7c41517503fcc98d9cae70e76c3c507d90fd5c2434649" +
    "313794ab25a89d162fcb547d533cd20ba0fce1379a1d435825ec1484dcd8a0dd414fa5" +
    "f90f326daa312858eba12b225704ec668762cabffd83b2a0eeb0a0f12c77d100000000" +
    "1976a9148db50eb52063ea9d98b3eac91489a90f738986f688acd020000000000000ff" +
    "ffffffb72599001cf12b672a074ce9ff50fe8cb87432044fd6a5b85953ddc9abc458b9" +
    "0000000001000000",
  sighash: "d05adb53b09ac6b1cc0a0166558f8b90d2898c9a368d40a2a033e5e0c1af9b11",
  witness: true,
  deposits: [],
  spentMainUtxos: [],
}
