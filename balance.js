async function getBalance() {
  const response = await fetch("https://sepolia-rollup.arbitrum.io/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getBalance",
      params: ["0x6d54080Ee9b54150C67b5D74B1A4DBBcD391815c", "latest"],
      id: 1
    })
  });
  const data = await response.json();
  const hexBalance = data.result;
  const balanceWei = BigInt(hexBalance);
  const balanceEth = Number(balanceWei) / 1e18;
  console.log("Balance: " + balanceEth + " ETH");
}

getBalance();
