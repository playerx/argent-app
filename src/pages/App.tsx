import './App.scss'

function App() {
  return (
    <main className="App">
      <section className="wallet-address">
        <h5>Enter your wallet address:</h5>
        <form>
          <input type="text" placeholder="0x..." />
        </form>
      </section>

      <section className="info">
        <div>
          <h5>Wallet Balance</h5>
          <h2>0 ETH</h2>
        </div>
        <div>
          <h5>Number of guardians</h5>
          <h2>0</h2>
        </div>
        <div>
          <h5>ERC20 tokens</h5>
          <h2>BAT 0</h2>
          <h2>DAI 0</h2>
        </div>
      </section>
    </main>
  )
}

export default App
