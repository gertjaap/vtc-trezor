var xpub = "";
var address = "";
var vertcoinNetwork =  {
  messagePrefix: 'Vertcoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x47,
  scriptHash: 0x05,
  wif: 0x80
};

$('#login').click(function() {
  TrezorConnect.getXPubKey([44 | 0x80000000, 71 | 0x80000000, 0 | 0x80000000], function (result) {
    if (result.success) {
        xpub = result.xpubkey;
        $('#login').hide();
        $('#address').show();
    } else {
        console.error('Error:', result.error); // error message
    }
  });
});

$('#getAddress').click(function() {
  var node = bitcoin.HDNode.fromBase58(xpub,vertcoinNetwork);
  console.log("Node", node);
  var derived = node.derive(0);
  console.log("Derived", derived);
  address = derived.getAddress();
  console.log("Address", address);
  $('#address').text(address);
  $('#spendDiv').show();
});

$('#spend').click(function() {

  var tx = new bitcoin.TransactionBuilder(vertcoinNetwork);
  tx.addInput('2de65802ccece97e759058c7dcb4f027ea34437c91f229454e54c961584a7435',1);

  tx.addOutput('VxdYNGYzkcuEpW6cjesdJJtNkkYLKS8By7', 49900000);

  var txRaw = tx.buildIncomplete();
  
  var redeemScript = buffer.Buffer.from("76a9147729097fc7b2f50daa9352429fc8ce8c512b4bd788ac", "hex");

  var signatureHash = txRaw.hashForSignature(0, redeemScript, bitcoin.Transaction.SIGHASH_ALL);

  console.log("Hex TX", signatureHash);



  TrezorConnect.signMessage([44 | 0x80000000, 71 | 0x80000000, 0 | 0x80000000,  0 | 0x80000000,  0 | 0x80000000], ui8arrtoascii(signatureHash), function(result) {
    if (result.success) {
      var signature = bitcoin.ECSignature.parseCompact(buffer.Buffer.from(result.signature,'base64'));
    
      var scriptSig = bitcoin.script.scriptHash.input.encode([
        signature.signature.toScriptSignature(bitcoin.Transaction.SIGHASH_ALL),
        bitcoin.address.fromBase58Check(result.address).hash
      ], redeemScript);
      tx.setInputScript(0, scriptSig);
      console.log("Signed TX:",tx.build().toHex());

    } else {
        console.error('Error:', result.error); // error message
    }
  });
});

function ui8arrtoascii(uintArr)
{
  var myString = '';
  for (var i=0; i<uintArr.byteLength; i++) {
            myString += String.fromCharCode(uintArr[i])
        }

        return myString;
}
